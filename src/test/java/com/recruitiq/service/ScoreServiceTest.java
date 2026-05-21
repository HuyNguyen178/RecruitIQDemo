package com.recruitiq.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recruitiq.model.*;
import com.recruitiq.repository.ScoreRecordRepository;
import com.recruitiq.service.ai.LlmApiClient;
import com.recruitiq.service.ai.ScoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

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

    private Candidate testCandidate;

    private static final String MOCK_SCORE_RESPONSE = """
            {
              "total_score": 82.5,
              "skills_score": 90.0,
              "experience_score": 80.0,
              "education_score": 85.0,
              "cert_score": 70.0,
              "soft_skills_score": 75.0,
              "reasoning": {
                "skills": "Strong Java and Spring Boot skills aligned with JD requirements.",
                "experience": "4.5 years exceeds the 3-year requirement.",
                "education": "Bachelor in CS matches the required education level.",
                "certifications": "AWS certification is relevant.",
                "soft_skills": "Clear communication demonstrated in work history.",
                "overall": "Strong candidate who meets or exceeds most requirements."
              }
            }
            """;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .id(1L)
                .name("HR Officer")
                .email("hr@test.com")
                .role(User.Role.HR_OFFICER)
                .build();

        Job job = Job.builder()
                .id(1L)
                .title("Backend Engineer")
                .jdText("We need a Java developer with 3+ years Spring Boot experience and Bachelor's degree.")
                .requiredSkills("Java, Spring Boot, PostgreSQL")
                .minExperienceYears(3)
                .requiredEducation(Job.EducationLevel.BACHELOR)
                .createdBy(user)
                .build();

        ParsedProfile parsedProfile = ParsedProfile.builder()
                .id(1L)
                .fullName("Alice Johnson")
                .email("alice@example.com")
                .skillsArray("Java, Spring Boot, PostgreSQL, Docker")
                .yearsExperience(4.5)
                .educationLevel(Job.EducationLevel.BACHELOR)
                .profileJson("{\"full_name\": \"Alice Johnson\", \"skills\": [\"Java\", \"Spring Boot\"]}")
                .build();

        testCandidate = Candidate.builder()
                .id(1L)
                .job(job)
                .originalFilename("alice_cv.pdf")
                .processingStatus(Candidate.ProcessingStatus.SCORING)
                .parsedProfile(parsedProfile)
                .build();

        parsedProfile.setCandidate(testCandidate);
    }

    @Test
    void scoreCandidate_ShouldReturnScoreRecord() {
        when(llmApiClient.callApi(anyString(), anyString())).thenReturn(MOCK_SCORE_RESPONSE);
        when(scoreRecordRepository.save(any(ScoreRecord.class))).thenAnswer(inv -> {
            ScoreRecord record = inv.getArgument(0);
            record = ScoreRecord.builder()
                    .id(1L)
                    .candidate(testCandidate)
                    .job(testCandidate.getJob())
                    .totalScore(record.getTotalScore())
                    .skillsScore(record.getSkillsScore())
                    .experienceScore(record.getExperienceScore())
                    .educationScore(record.getEducationScore())
                    .certScore(record.getCertScore())
                    .softSkillsScore(record.getSoftSkillsScore())
                    .reasoningJson(record.getReasoningJson())
                    .build();
            return record;
        });

        ScoreRecord result = scoreService.scoreCandidate(testCandidate);

        assertNotNull(result);
        assertEquals(82.5, result.getTotalScore());
        assertEquals(90.0, result.getSkillsScore());
        assertEquals(80.0, result.getExperienceScore());
        assertEquals(85.0, result.getEducationScore());
        assertEquals(70.0, result.getCertScore());
        assertEquals(75.0, result.getSoftSkillsScore());
        assertNotNull(result.getReasoningJson());

        verify(llmApiClient, times(1)).callApi(anyString(), anyString());
        verify(scoreRecordRepository, times(1)).save(any(ScoreRecord.class));
    }

    @Test
    void scoreCandidate_WhenNoParsedProfile_ShouldThrowException() {
        testCandidate.setParsedProfile(null);

        assertThrows(RuntimeException.class, () ->
                scoreService.scoreCandidate(testCandidate));

        verify(llmApiClient, never()).callApi(anyString(), anyString());
    }

    @Test
    void scoreCandidate_WhenLlmFails_ShouldThrowRuntimeException() {
        when(llmApiClient.callApi(anyString(), anyString()))
                .thenThrow(new RuntimeException("LLM API timeout"));

        assertThrows(RuntimeException.class, () ->
                scoreService.scoreCandidate(testCandidate));
    }

    @Test
    void scoreCandidate_WithMarkdownWrappedJson_ShouldParseCorrectly() {
        String wrappedResponse = "```json\n" + MOCK_SCORE_RESPONSE + "\n```";

        when(llmApiClient.callApi(anyString(), anyString())).thenReturn(wrappedResponse);
        when(scoreRecordRepository.save(any(ScoreRecord.class))).thenAnswer(inv -> {
            ScoreRecord record = inv.getArgument(0);
            ScoreRecord saved = new ScoreRecord();
            saved.setTotalScore(record.getTotalScore());
            saved.setSkillsScore(record.getSkillsScore());
            return saved;
        });

        ScoreRecord result = scoreService.scoreCandidate(testCandidate);

        assertNotNull(result);
        assertEquals(82.5, result.getTotalScore());
    }

    @Test
    void scoreCandidate_PromptShouldIncludeJobDescription() {
        when(llmApiClient.callApi(anyString(), anyString())).thenReturn(MOCK_SCORE_RESPONSE);
        when(scoreRecordRepository.save(any(ScoreRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        scoreService.scoreCandidate(testCandidate);

        verify(llmApiClient).callApi(anyString(), argThat(prompt ->
                prompt.contains("Backend Engineer") || prompt.contains("Java developer")));
    }

    @Test
    void scoreCandidate_WhenJobHasNoDescription_ShouldUseJobTitle() {
        testCandidate.getJob().setJdText(null);

        when(llmApiClient.callApi(anyString(), anyString())).thenReturn(MOCK_SCORE_RESPONSE);
        when(scoreRecordRepository.save(any(ScoreRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        ScoreRecord result = scoreService.scoreCandidate(testCandidate);

        assertNotNull(result);
        verify(llmApiClient).callApi(anyString(), argThat(prompt ->
                prompt.contains("Backend Engineer")));
    }
}
