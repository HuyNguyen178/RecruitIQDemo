package com.recruitiq.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.recruitiq.ai.PromptConstants;
import com.recruitiq.model.Candidate;
import com.recruitiq.model.ScoreRecord;
import com.recruitiq.repository.ScoreRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoreService {

    private final LlmApiClient llmApiClient;
    private final ScoreRecordRepository scoreRecordRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public ScoreRecord scoreCandidate(Candidate candidate) {
        log.info("Scoring candidate: {}", candidate.getId());

        if (candidate.getParsedProfile() == null) {
            throw new RuntimeException("No parsed profile for candidate: " + candidate.getId());
        }

        String jdText = candidate.getJob().getJdText();
        if (jdText == null || jdText.isBlank()) {
            jdText = "No job description provided. Job title: " + candidate.getJob().getTitle();
        }

        String profileJson = candidate.getParsedProfile().getProfileJson();
        if (profileJson == null) {
            profileJson = "{}";
        }

        String userPrompt = PromptConstants.SCORE_USER_PROMPT_TEMPLATE
                .replace("{jd_text}", jdText)
                .replace("{parsed_profile_json}", profileJson);

        String response = llmApiClient.callApi(PromptConstants.SCORE_SYSTEM_PROMPT, userPrompt);

        try {
            String cleanedResponse = extractJson(response);
            JsonNode scoreNode = objectMapper.readTree(cleanedResponse);

            ScoreRecord scoreRecord = ScoreRecord.builder()
                    .candidate(candidate)
                    .job(candidate.getJob())
                    .totalScore(getDoubleValue(scoreNode, "total_score"))
                    .skillsScore(getDoubleValue(scoreNode, "skills_score"))
                    .experienceScore(getDoubleValue(scoreNode, "experience_score"))
                    .educationScore(getDoubleValue(scoreNode, "education_score"))
                    .certScore(getDoubleValue(scoreNode, "cert_score"))
                    .softSkillsScore(getDoubleValue(scoreNode, "soft_skills_score"))
                    .reasoningJson(getReasoningJson(scoreNode))
                    .build();

            return scoreRecordRepository.save(scoreRecord);

        } catch (Exception e) {
            log.error("Failed to parse score response for candidate {}: {}", candidate.getId(), e.getMessage());
            throw new RuntimeException("Failed to score candidate: " + e.getMessage(), e);
        }
    }

    private String extractJson(String response) {
        if (response == null) return "{}";

        response = response.trim();

        if (response.contains("```json")) {
            int start = response.indexOf("```json") + 7;
            int end = response.lastIndexOf("```");
            if (end > start) {
                response = response.substring(start, end).trim();
            }
        } else if (response.contains("```")) {
            int start = response.indexOf("```") + 3;
            int end = response.lastIndexOf("```");
            if (end > start) {
                response = response.substring(start, end).trim();
            }
        }

        int start = response.indexOf('{');
        int end = response.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }

        return response;
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

    private String getReasoningJson(JsonNode scoreNode) {
        JsonNode reasoningNode = scoreNode.get("reasoning");
        if (reasoningNode == null) return null;
        return reasoningNode.toString();
    }
}
