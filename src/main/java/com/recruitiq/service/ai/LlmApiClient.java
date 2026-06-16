package com.recruitiq.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class LlmApiClient {

    private final RestTemplate restTemplate;

    @Value("${llm.api.key}")
    private String apiKey;

    @Value("${llm.api.url}")
    private String apiUrl;

    @Value("${llm.api.model}")
    private String model;

    @SuppressWarnings("unchecked")
    public String callApi(String systemPrompt, String userPrompt) {
        if (!StringUtils.hasText(apiKey)) {
            log.warn("Gemini API key is not configured. Returning mock response.");
            return getMockResponse(userPrompt);
        }

        List<String> modelsToTry = List.of(model, "gemini-2.5-flash");
        RuntimeException lastError = null;

        for (String currentModel : modelsToTry) {
            if (!StringUtils.hasText(currentModel)) {
                continue;
            }

            try {
                log.info("Calling Gemini API with model: {}", currentModel);
                return callGemini(currentModel, systemPrompt, userPrompt);
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.UNAUTHORIZED || e.getStatusCode() == HttpStatus.FORBIDDEN) {
                    log.error("Gemini API key is invalid or forbidden for model {} ({}). Please check your API key.", currentModel, e.getStatusCode());
                    throw new RuntimeException("Gemini API authentication failed (" + e.getStatusCode() + "): API key is invalid or forbidden. Please update llm.api.key in application.properties.", e);
                }
                log.warn("Gemini API request failed for model {} ({}). Trying next model if available.", currentModel, e.getStatusCode());
                lastError = new RuntimeException("Gemini API call failed: " + e.getMessage(), e);
            } catch (HttpServerErrorException e) {
                if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                    log.warn("Too many requests to Gemini API. Waiting before retry...");
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
                log.warn("Gemini API server error for model {} ({}). Trying next model if available.", currentModel, e.getStatusCode());
                lastError = new RuntimeException("Gemini API call failed: " + e.getMessage(), e);
            } catch (Exception e) {
                log.warn("Gemini API call failed for model {}. Trying next model if available.", currentModel, e);
                lastError = new RuntimeException("Gemini API call failed: " + e.getMessage(), e);
            }
        }

        if (lastError != null) {
            log.error("All Gemini model attempts failed. Last error: {}", lastError.getMessage());
            throw lastError;
        }
        return getMockResponse(userPrompt);
    }

    @SuppressWarnings("unchecked")
    private String callGemini(String currentModel, String systemPrompt, String userPrompt) {
        Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of(
                        "parts", Map.of("text", systemPrompt)
                ),
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", userPrompt)))
                ),
                "generationConfig", Map.of(
                        "response_mime_type", "application/json"
                )
        );

        String finalUrl = apiUrl.replace("{model}", currentModel);
        log.debug("Calling Gemini API with model: {}", currentModel);

        // Prepare headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        Map<String, Object> response = restTemplate.postForObject(
                finalUrl + "?key=" + apiKey,
                entity,
                Map.class
        );

        if (response == null) {
            throw new RuntimeException("Empty response from Gemini API");
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new RuntimeException("No candidates in Gemini API response");
        }

        Map<String, Object> firstCandidate = candidates.get(0);
        Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
        List<Map<String, String>> parts = (List<Map<String, String>>) content.get("parts");

        String text = parts.get(0).get("text");
        log.debug("Gemini API response received, length: {}", text != null ? text.length() : 0);
        return text;
    }

    private String getMockResponse(String prompt) {
        if (prompt.contains("raw_cv_text") || prompt.contains("CV Text:")) {
            return """
                    {
                      "full_name": "John Doe",
                      "email": "john.doe@example.com",
                      "phone": "+1-555-0100",
                      "location": "New York, NY",
                      "skills": ["Java", "Spring Boot", "SQL", "REST APIs", "Git"],
                      "years_experience": 5.0,
                      "education_level": "BACHELOR",
                      "education_history": [
                        {"degree": "Bachelor of Science", "institution": "State University", "year": "2018", "field": "Computer Science"}
                      ],
                      "work_experience": [
                        {"title": "Software Engineer", "company": "Tech Corp", "start_date": "2018", "end_date": "Present", "description": "Developed Java applications"}
                      ],
                      "certifications": [],
                      "languages": ["English"],
                      "summary": "Experienced software engineer with 5 years of Java development experience."
                    }
                    """;
        } else if (prompt.contains("Score the following candidate")) {
            return """
                    {
                      "total_score": 72.0,
                      "skills_score": 75.0,
                      "experience_score": 70.0,
                      "education_score": 80.0,
                      "cert_score": 60.0,
                      "soft_skills_score": 70.0,
                      "reasoning": {
                        "skills": "Candidate has strong Java and Spring Boot skills matching the JD.",
                        "experience": "5 years experience meets the minimum requirement.",
                        "education": "Bachelor's degree in Computer Science is a good match.",
                        "certifications": "No certifications listed.",
                        "soft_skills": "Work experience indicates collaboration and communication skills.",
                        "overall": "Solid candidate who meets most requirements."
                      }
                    }
                    """;
        } else {
            return """
                    {
                      "summary": "This candidate demonstrates solid technical skills and relevant experience for the role. Their background in Java development aligns well with the requirements. The candidate shows potential for growth in this position.",
                      "strengths": ["Strong Java skills", "Relevant experience", "Good educational background"],
                      "gaps": ["Limited certifications"],
                      "recommendation": "POTENTIAL_MATCH",
                      "recommendation_reason": "Candidate meets core requirements with minor gaps in certifications."
                    }
                    """;
        }
    }
}
