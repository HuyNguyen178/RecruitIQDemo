package com.recruitiq.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.recruitiq.ai.PromptConstants;
import com.recruitiq.model.AiSummary;
import com.recruitiq.model.Candidate;
import com.recruitiq.model.ParsedProfile;
import com.recruitiq.model.ScoreRecord;
import com.recruitiq.repository.AiSummaryRepository;
import com.recruitiq.repository.CandidateRepository;
import com.recruitiq.repository.ParsedProfileRepository;
import com.recruitiq.repository.ScoreRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiProcessingService {

    private final CandidateRepository candidateRepository;
    private final LlmApiClient llmApiClient;
    private final ParsedProfileRepository parsedProfileRepository;
    private final ScoreRecordRepository scoreRecordRepository;
    private final AiSummaryRepository aiSummaryRepository;
    private final ObjectMapper objectMapper;

    // Save status in its own transaction so it always commits, even if outer logic fails
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveStatus(Candidate candidate) {
        candidateRepository.save(candidate);
    }

    public void processCandidate(Long candidateId) {
        Candidate candidate = candidateRepository.findByIdWithJob(candidateId).orElse(null);
        if (candidate == null) {
            log.error("Candidate {} no longer exists in DB", candidateId);
            return;
        }

        try {
            log.info("Starting unified AI processing for candidate {}", candidateId);
            candidate.setProcessingStatus(Candidate.ProcessingStatus.PARSING);
            saveStatus(candidate);

            String response = llmApiClient.callApi(
                    PromptConstants.AI_PROCESSING_SYSTEM_PROMPT,
                    buildUserPrompt(candidate)
            );

            JsonNode root = objectMapper.readTree(extractJson(response));

            candidate.setProcessingStatus(Candidate.ProcessingStatus.SCORING);
            saveStatus(candidate);
            ParsedProfile parsedProfile = buildParsedProfile(root.path("profile"), candidate);
            if (parsedProfile != null) {
                parsedProfile = parsedProfileRepository.save(parsedProfile);
                candidate.setParsedProfile(parsedProfile);
            }

            candidate.setProcessingStatus(Candidate.ProcessingStatus.SUMMARIZING);
            saveStatus(candidate);
            ScoreRecord scoreRecord = buildScoreRecord(root.path("score"), candidate);
            if (scoreRecord != null) {
                scoreRecord = scoreRecordRepository.save(scoreRecord);
                candidate.setScoreRecord(scoreRecord);
            }

            AiSummary aiSummary = buildAiSummary(root.path("summary"), candidate, scoreRecord);
            if (aiSummary != null) {
                aiSummary = aiSummaryRepository.save(aiSummary);
                candidate.setAiSummary(aiSummary);
            }

            candidate.setProcessingStatus(Candidate.ProcessingStatus.COMPLETED);
            saveStatus(candidate);
            log.info("Successfully processed Candidate: {}", candidate.getParsedProfile() != null ? candidate.getParsedProfile().getFullName() : candidateId);

        } catch (Exception e) {
            log.error("AI Workflow failed for candidate {}: {}", candidateId, e.getMessage());
            candidate.setProcessingStatus(Candidate.ProcessingStatus.ERROR);
            candidate.setErrorMessage(toFriendlyError(e));
            saveStatus(candidate);
        }
    }

    private String buildUserPrompt(Candidate candidate) {
        String rawText = candidate.getRawText() != null ? candidate.getRawText() : "";
        if (rawText.length() > 15000) {
            rawText = rawText.substring(0, 15000) + "\n[... truncated ...]";
        }

        String jdText = candidate.getJob() != null && candidate.getJob().getJdText() != null && !candidate.getJob().getJdText().isBlank()
                ? candidate.getJob().getJdText()
                : "Job title: " + (candidate.getJob() != null ? candidate.getJob().getTitle() : "N/A");

        return PromptConstants.AI_PROCESSING_USER_PROMPT_TEMPLATE
                .replace("{raw_cv_text}", rawText)
                .replace("{jd_text}", jdText);
    }

    private ParsedProfile buildParsedProfile(JsonNode profileNode, Candidate candidate) {
        if (profileNode == null || profileNode.isNull() || profileNode.isEmpty()) {
            return null;
        }

        return ParsedProfile.builder()
                .candidate(candidate)
                .profileJson(profileNode.toString())
                .fullName(getTextValue(profileNode, "full_name"))
                .email(getTextValue(profileNode, "email"))
                .phone(getTextValue(profileNode, "phone"))
                .skillsArray(extractSkillsArray(profileNode))
                .yearsExperience(getDoubleValue(profileNode, "years_experience"))
                .educationLevel(parseEducationLevel(profileNode))
                .build();
    }

    private ScoreRecord buildScoreRecord(JsonNode scoreNode, Candidate candidate) {
        if (scoreNode == null || scoreNode.isNull() || scoreNode.isEmpty()) {
            return null;
        }

        return ScoreRecord.builder()
                .candidate(candidate)
                .job(candidate.getJob())
                .totalScore(getDoubleValue(scoreNode, "overall_score", "total_score"))
                .skillsScore(getDoubleValue(scoreNode, "skills_score", "skills_score"))
                .experienceScore(getDoubleValue(scoreNode, "experience_score", "experience_score"))
                .educationScore(getDoubleValue(scoreNode, "education_score", "education_score"))
                .certScore(getDoubleValue(scoreNode, "certification_score", "cert_score"))
                .softSkillsScore(getDoubleValue(scoreNode, "soft_skills_score", "soft_skills_score"))
                .reasoningJson(getReasoningJson(scoreNode))
                .build();
    }

    private AiSummary buildAiSummary(JsonNode summaryNode, Candidate candidate, ScoreRecord scoreRecord) {
        if (summaryNode == null || summaryNode.isNull() || summaryNode.isEmpty()) {
            return null;
        }

        String summaryText = buildSummaryText(summaryNode);
        AiSummary.Recommendation recommendation = parseRecommendation(summaryNode, scoreRecord != null && scoreRecord.getTotalScore() != null ? scoreRecord.getTotalScore() : 0.0);

        return AiSummary.builder()
                .candidate(candidate)
                .summaryText(summaryText)
                .recommendation(recommendation)
                .build();
    }

    private String buildSummaryText(JsonNode summaryNode) {
        StringBuilder sb = new StringBuilder();
        JsonNode summaryField = summaryNode.get("summary");
        if (summaryField != null && !summaryField.isNull()) {
            sb.append(summaryField.asText());
        }

        JsonNode strengthsNode = summaryNode.get("strengths");
        if (strengthsNode != null && strengthsNode.isArray() && !strengthsNode.isEmpty()) {
            sb.append("\n\nKey Strengths:\n");
            for (JsonNode strength : strengthsNode) {
                sb.append("• ").append(strength.asText()).append("\n");
            }
        }

        JsonNode gapsNode = summaryNode.get("gaps");
        if (gapsNode != null && gapsNode.isArray() && !gapsNode.isEmpty()) {
            sb.append("\nAreas for Development:\n");
            for (JsonNode gap : gapsNode) {
                sb.append("• ").append(gap.asText()).append("\n");
            }
        }

        JsonNode reasonNode = summaryNode.get("recommendation_reason");
        if (reasonNode != null && !reasonNode.isNull()) {
            sb.append("\nRecommendation: ").append(reasonNode.asText());
        }
        return sb.toString();
    }

    private AiSummary.Recommendation parseRecommendation(JsonNode summaryNode, double totalScore) {
        JsonNode recNode = summaryNode.get("recommendation");
        if (recNode == null || recNode.isNull()) {
            if (totalScore >= 80.0) return AiSummary.Recommendation.STRONG_MATCH;
            if (totalScore >= 60.0) return AiSummary.Recommendation.POTENTIAL_MATCH;
            return AiSummary.Recommendation.NOT_RECOMMENDED;
        }

        String rec = recNode.asText().toUpperCase().replace(" ", "_");
        try {
            return AiSummary.Recommendation.valueOf(rec);
        } catch (IllegalArgumentException e) {
            if (rec.contains("STRONG")) return AiSummary.Recommendation.STRONG_MATCH;
            if (rec.contains("NOT") || rec.contains("NO")) return AiSummary.Recommendation.NOT_RECOMMENDED;
            if (totalScore >= 80.0) return AiSummary.Recommendation.STRONG_MATCH;
            if (totalScore >= 60.0) return AiSummary.Recommendation.POTENTIAL_MATCH;
            return AiSummary.Recommendation.NOT_RECOMMENDED;
        }
    }

    private String extractJson(String response) {
        if (response == null) return "{}";
        String cleaned = response.trim();
        if (cleaned.contains("```json")) {
            int start = cleaned.indexOf("```json") + 7;
            int end = cleaned.lastIndexOf("```");
            if (end > start) {
                cleaned = cleaned.substring(start, end).trim();
            }
        } else if (cleaned.contains("```")) {
            int start = cleaned.indexOf("```") + 3;
            int end = cleaned.lastIndexOf("```");
            if (end > start) {
                cleaned = cleaned.substring(start, end).trim();
            }
        }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return cleaned.substring(start, end + 1);
        }
        return cleaned;
    }

    private String getTextValue(JsonNode node, String field) {
        JsonNode fieldNode = node.get(field);
        if (fieldNode == null || fieldNode.isNull()) return null;
        return fieldNode.asText();
    }

    private Double getDoubleValue(JsonNode node, String field) {
        JsonNode fieldNode = node.get(field);
        if (fieldNode == null || fieldNode.isNull()) return null;
        try {
            return fieldNode.asDouble();
        } catch (Exception e) {
            return null;
        }
    }

    private Double getDoubleValue(JsonNode node, String primaryField, String fallbackField) {
        JsonNode fieldNode = node.get(primaryField);
        if (fieldNode == null || fieldNode.isNull()) {
            fieldNode = node.get(fallbackField);
        }
        if (fieldNode == null || fieldNode.isNull()) return null;
        try {
            return fieldNode.asDouble();
        } catch (Exception e) {
            return null;
        }
    }

    private String extractSkillsArray(JsonNode profileNode) {
        JsonNode skillsNode = profileNode.get("skills");
        if (skillsNode == null || !skillsNode.isArray() || skillsNode.isEmpty()) {
            return "";
        }

        List<String> skills = new ArrayList<>();
        for (JsonNode skill : skillsNode) {
            skills.add(skill.asText());
        }
        return String.join(", ", skills);
    }

    private com.recruitiq.model.Job.EducationLevel parseEducationLevel(JsonNode profileNode) {
        String level = getTextValue(profileNode, "education_level");
        if (level == null) return null;
        try {
            return com.recruitiq.model.Job.EducationLevel.valueOf(level.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            String upper = level.toUpperCase();
            if (upper.contains("PHD") || upper.contains("DOCTOR")) return com.recruitiq.model.Job.EducationLevel.PHD;
            if (upper.contains("MASTER")) return com.recruitiq.model.Job.EducationLevel.MASTER;
            if (upper.contains("BACHELOR") || upper.contains("BS") || upper.contains("BA")) return com.recruitiq.model.Job.EducationLevel.BACHELOR;
            if (upper.contains("HIGH") || upper.contains("SECONDARY")) return com.recruitiq.model.Job.EducationLevel.HIGH_SCHOOL;
            return null;
        }
    }

    private String getReasoningJson(JsonNode scoreNode) {
        JsonNode reasoningNode = scoreNode.get("reasoning");
        if (reasoningNode == null) return null;
        return reasoningNode.toString();
    }

    /**
     * Converts technical exceptions into user-friendly messages.
     * End users should never see Java stack traces or API error codes.
     */
    private String toFriendlyError(Exception e) {
        String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        if (msg.contains("429") || msg.contains("rate limit") || msg.contains("quota")) {
            return "AI service is currently overloaded. Please try again in a few minutes.";
        }
        if (msg.contains("401") || msg.contains("403") || msg.contains("authentication") || msg.contains("api key")) {
            return "AI service configuration error. Please contact your system administrator.";
        }
        if (msg.contains("timeout") || msg.contains("timed out") || msg.contains("connection")) {
            return "Could not connect to the AI service. Please check your internet connection and try again.";
        }
        if (msg.contains("parse") || msg.contains("json") || msg.contains("unexpected token")) {
            return "The CV file could not be read properly. Please ensure the file is a valid PDF or Word document.";
        }
        if (msg.contains("500") || msg.contains("server error") || msg.contains("internal")) {
            return "The AI service encountered an internal error. Please try again later.";
        }
        if (msg.contains("no candidates") || msg.contains("empty response")) {
            return "The AI service returned an empty response. Please try uploading the CV again.";
        }
        return "An unexpected error occurred while processing this CV. Please try again or contact support.";
    }

    @Async("taskExecutor")
    public void processCandidateAsync(Long candidateId) {
        this.processCandidate(candidateId);
    }
}