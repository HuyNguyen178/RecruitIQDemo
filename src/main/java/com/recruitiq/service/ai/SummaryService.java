package com.recruitiq.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.recruitiq.ai.PromptConstants;
import com.recruitiq.model.AiSummary;
import com.recruitiq.model.Candidate;
import com.recruitiq.repository.AiSummaryRepository;
import com.recruitiq.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SummaryService {

    private final LlmApiClient llmApiClient;
    private final AiSummaryRepository aiSummaryRepository;
    private final CandidateRepository candidateRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiSummary summarizeCandidate(Candidate candidate) {
        log.info("Summarizing candidate: {}", candidate.getId());

        if (candidate.getParsedProfile() == null) {
            throw new RuntimeException("No parsed profile for candidate: " + candidate.getId());
        }

        String jdText = candidate.getJob().getJdText();
        if (jdText == null || jdText.isBlank()) {
            jdText = "Job title: " + candidate.getJob().getTitle();
        }

        String profileJson = candidate.getParsedProfile().getProfileJson();
        if (profileJson == null) {
            profileJson = "{}";
        }

        // Include score in the profile JSON for recommendation accuracy
        if (candidate.getScoreRecord() != null) {
            profileJson = profileJson + "\n\nScore: " + candidate.getScoreRecord().getTotalScore();
        }

        double totalScore = candidate.getScoreRecord() != null
                ? candidate.getScoreRecord().getTotalScore() != null
                    ? candidate.getScoreRecord().getTotalScore()
                    : 0.0
                : 0.0;

        String userPrompt = PromptConstants.SUMMARY_USER_PROMPT_TEMPLATE
                .replace("{jd_text}", jdText)
                .replace("{parsed_profile_json}", profileJson)
                .replace("{total_score}", String.valueOf(totalScore));

        String response = llmApiClient.callApi(PromptConstants.SUMMARY_SYSTEM_PROMPT, userPrompt);

        try {
            String cleanedResponse = extractJson(response);
            JsonNode summaryNode = objectMapper.readTree(cleanedResponse);

            String summaryText = buildSummaryText(summaryNode);
            AiSummary.Recommendation recommendation = parseRecommendation(summaryNode, totalScore);

            AiSummary summary = AiSummary.builder()
                    .candidate(candidate)
                    .summaryText(summaryText)
                    .recommendation(recommendation)
                    .build();

            AiSummary saved = aiSummaryRepository.save(summary);

            // Ensure the bidirectional association is set and persisted so other
            // transactions/read operations can observe the relationship.
            try {
                candidate.setAiSummary(saved);
                candidateRepository.save(candidate);
            } catch (Exception e) {
                log.warn("Failed to set aiSummary on candidate {}: {}", candidate.getId(), e.getMessage());
            }

            return saved;

        } catch (Exception e) {
            log.error("Failed to parse summary response for candidate {}: {}", candidate.getId(), e.getMessage());
            throw new RuntimeException("Failed to summarize candidate: " + e.getMessage(), e);
        }
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
            // Fall back to deterministic mapping from totalScore if the model did not include a recommendation
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
            // If parsing fails, fall back to score-based mapping
            if (totalScore >= 80.0) return AiSummary.Recommendation.STRONG_MATCH;
            if (totalScore >= 60.0) return AiSummary.Recommendation.POTENTIAL_MATCH;
            return AiSummary.Recommendation.NOT_RECOMMENDED;
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
}
