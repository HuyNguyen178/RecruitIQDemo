package com.recruitiq.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.recruitiq.ai.PromptConstants;
import com.recruitiq.model.Candidate;
import com.recruitiq.model.Job;
import com.recruitiq.model.ParsedProfile;
import com.recruitiq.repository.ParsedProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParseService {

    private final LlmApiClient llmApiClient;
    private final ParsedProfileRepository parsedProfileRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public ParsedProfile parseCandidate(Candidate candidate) {
        log.info("Parsing candidate: {}", candidate.getId());

        String rawText = candidate.getRawText();
        if (rawText == null || rawText.isBlank()) {
            throw new RuntimeException("No raw text to parse for candidate: " + candidate.getId());
        }

        String userPrompt = PromptConstants.PARSE_USER_PROMPT_TEMPLATE
                .replace("{raw_cv_text}", rawText);

        String response = llmApiClient.callApi(PromptConstants.PARSE_SYSTEM_PROMPT, userPrompt);

        try {
            String cleanedResponse = extractJson(response);
            JsonNode profileNode = objectMapper.readTree(cleanedResponse);

            ParsedProfile profile = ParsedProfile.builder()
                    .candidate(candidate)
                    .profileJson(cleanedResponse)
                    .fullName(getTextValue(profileNode, "full_name"))
                    .email(getTextValue(profileNode, "email"))
                    .phone(getTextValue(profileNode, "phone"))
                    .skillsArray(extractSkillsArray(profileNode))
                    .yearsExperience(getDoubleValue(profileNode, "years_experience"))
                    .educationLevel(parseEducationLevel(profileNode))
                    .build();

            return parsedProfileRepository.save(profile);

        } catch (Exception e) {
            log.error("Failed to parse LLM response for candidate {}: {}", candidate.getId(), e.getMessage());
            throw new RuntimeException("Failed to parse CV profile: " + e.getMessage(), e);
        }
    }

    private String extractJson(String response) {
        if (response == null) return "{}";

        response = response.trim();

        // Extract JSON from markdown code blocks if present
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

        // Find first { and last }
        int start = response.indexOf('{');
        int end = response.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }

        return response;
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

    private Job.EducationLevel parseEducationLevel(JsonNode profileNode) {
        String level = getTextValue(profileNode, "education_level");
        if (level == null) return null;

        try {
            return Job.EducationLevel.valueOf(level.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            // Try to map common variations
            String upper = level.toUpperCase();
            if (upper.contains("PHD") || upper.contains("DOCTOR")) return Job.EducationLevel.PHD;
            if (upper.contains("MASTER")) return Job.EducationLevel.MASTER;
            if (upper.contains("BACHELOR") || upper.contains("BS") || upper.contains("BA")) return Job.EducationLevel.BACHELOR;
            if (upper.contains("HIGH") || upper.contains("SECONDARY")) return Job.EducationLevel.HIGH_SCHOOL;
            return null;
        }
    }
}
