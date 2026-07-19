package com.recruitiq.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recruitiq.ai.PromptConstants;
import com.recruitiq.model.Candidate;
import com.recruitiq.model.Job;
import com.recruitiq.model.ParsedProfile;
import com.recruitiq.model.ScoreRecord;
import com.recruitiq.repository.ScoreRecordRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScoreServiceTest {

    @Mock
    private LlmApiClient llmApiClient;

    @Mock
    private ScoreRecordRepository scoreRecordRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ScoreService scoreService;

    @Test
    void scoreCandidate_shouldPersistMappedScoreRecord() {
        Candidate candidate = buildCandidate("Build REST APIs and support services", "{\"name\":\"Alice\"}");

        when(llmApiClient.callApi(anyString(), anyString())).thenReturn("""
                {
                  "overall_score": 9.2,
                  "skills_score": 8.5,
                  "experience_score": 7.3,
                  "education_score": 6.1,
                  "certification_score": 5.4,
                  "soft_skills_score": 4.8,
                  "reasoning": {"summary": "Strong fit"}
                }
                """);
        when(scoreRecordRepository.save(any(ScoreRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ScoreRecord result = scoreService.scoreCandidate(candidate);

        assertNotNull(result);
        assertSame(candidate, result.getCandidate());
        assertSame(candidate.getJob(), result.getJob());
        assertEquals(9.2, result.getTotalScore());
        assertEquals(8.5, result.getSkillsScore());
        assertEquals(7.3, result.getExperienceScore());
        assertEquals(6.1, result.getEducationScore());
        assertEquals(5.4, result.getCertScore());
        assertEquals(4.8, result.getSoftSkillsScore());
        assertEquals("{\"summary\":\"Strong fit\"}", result.getReasoningJson());

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(llmApiClient).callApi(eq(PromptConstants.SCORE_SYSTEM_PROMPT), promptCaptor.capture());

        String prompt = promptCaptor.getValue();
        assertTrue(prompt.contains("Job Title: Java Developer"));
        assertTrue(prompt.contains("Department: Engineering"));
        assertTrue(prompt.contains("Required Skills: Java, Spring Boot"));
        assertTrue(prompt.contains("Minimum Experience Years: 3"));
        assertTrue(prompt.contains("Required Education: BACHELOR"));
        assertTrue(prompt.contains("Build REST APIs and support services"));
        assertTrue(prompt.contains("\"name\":\"Alice\""));
    }

    @Test
    void scoreCandidate_shouldUseDefaultJobDescriptionWhenJdTextIsBlank() {
        Candidate candidate = buildCandidate("   ", "{\"name\":\"Bob\"}");

        when(llmApiClient.callApi(anyString(), anyString())).thenReturn("{\"overall_score\": 7.0, \"reasoning\": {}}" );
        when(scoreRecordRepository.save(any(ScoreRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        scoreService.scoreCandidate(candidate);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(llmApiClient).callApi(eq(PromptConstants.SCORE_SYSTEM_PROMPT), promptCaptor.capture());

        String prompt = promptCaptor.getValue();
        assertTrue(prompt.contains("No job description provided. Job title: Java Developer"));
    }

    @Test
    void scoreCandidate_shouldUseEmptyProfileJsonWhenParsedProfileHasNullJson() {
        Candidate candidate = buildCandidate("Work on backend services", null);

        when(llmApiClient.callApi(anyString(), anyString())).thenReturn("{\"overall_score\": 6.0, \"reasoning\": {}}" );
        when(scoreRecordRepository.save(any(ScoreRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        scoreService.scoreCandidate(candidate);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(llmApiClient).callApi(eq(PromptConstants.SCORE_SYSTEM_PROMPT), promptCaptor.capture());

        String prompt = promptCaptor.getValue();
        assertTrue(prompt.contains("{}"));
    }

    @Test
    void scoreCandidate_shouldThrowWhenParsedProfileIsMissing() {
        Candidate candidate = Candidate.builder()
                .id(101L)
                .job(Job.builder().id(2L).title("QA Engineer").build())
                .build();

        RuntimeException exception = assertThrows(RuntimeException.class, () -> scoreService.scoreCandidate(candidate));

        assertTrue(exception.getMessage().contains("No parsed profile"));
        verifyNoInteractions(llmApiClient);
        verifyNoInteractions(scoreRecordRepository);
    }

    @Test
    void scoreCandidate_shouldUseFallbackScoreFieldsWhenPrimaryFieldsAreAbsent() {
        Candidate candidate = buildCandidate("Handle release work", "{\"name\":\"Carol\"}");

        when(llmApiClient.callApi(anyString(), anyString())).thenReturn("""
                {
                  "overall_score": 8.0,
                  "skills_score": 7.0,
                  "experience_score": 6.0,
                  "education_score": 5.0,
                  "cert_score": 4.0,
                  "soft_skills_score": 3.0,
                  "reasoning": {"note": "Fallback"}
                }
                """);
        when(scoreRecordRepository.save(any(ScoreRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ScoreRecord result = scoreService.scoreCandidate(candidate);

        assertEquals(8.0, result.getTotalScore());
        assertEquals(7.0, result.getSkillsScore());
        assertEquals(6.0, result.getExperienceScore());
        assertEquals(5.0, result.getEducationScore());
        assertEquals(4.0, result.getCertScore());
        assertEquals(3.0, result.getSoftSkillsScore());
        assertEquals("{\"note\":\"Fallback\"}", result.getReasoningJson());
    }

    private Candidate buildCandidate(String jdText, String profileJson) {
        Job job = Job.builder()
                .id(10L)
                .title("Java Developer")
                .department("Engineering")
                .location("Ho Chi Minh")
                .requiredSkills("Java, Spring Boot")
                .minExperienceYears(3)
                .requiredEducation(Job.EducationLevel.BACHELOR)
                .jdText(jdText)
                .build();

        ParsedProfile parsedProfile = ParsedProfile.builder()
                .profileJson(profileJson)
                .build();

        return Candidate.builder()
                .id(66L)
                .job(job)
                .parsedProfile(parsedProfile)
                .build();
    }
}
