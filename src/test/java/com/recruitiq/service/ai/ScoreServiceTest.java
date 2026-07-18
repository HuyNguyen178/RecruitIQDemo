package com.recruitiq.service.ai;

import com.recruitiq.ai.PromptConstants;
import com.recruitiq.model.Candidate;
import com.recruitiq.model.Job;
import com.recruitiq.model.ParsedProfile;
import com.recruitiq.model.ScoreRecord;
import com.recruitiq.repository.ScoreRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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
    void scoreCandidate_shouldIncludeRichJobContextInPrompt() {
        Job job = Job.builder()
                .id(10L)
                .title("Java Developer")
                .department("Engineering")
                .location("Ho Chi Minh")
                .requiredSkills("Java, Spring Boot")
                .minExperienceYears(3)
                .requiredEducation(Job.EducationLevel.BACHELOR)
                .jdText("Build REST APIs and support services")
                .build();

        ParsedProfile parsedProfile = ParsedProfile.builder()
                .profileJson("{\"name\":\"Alice\"}")
                .build();

        Candidate candidate = Candidate.builder()
                .id(66L)
                .job(job)
                .parsedProfile(parsedProfile)
                .build();

        when(llmApiClient.callApi(anyString(), anyString())).thenReturn("{\"reasoning\": {}, \"overall_score\": 0.0}");
        when(scoreRecordRepository.save(any(ScoreRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        scoreService.scoreCandidate(candidate);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(llmApiClient).callApi(eq(PromptConstants.SCORE_SYSTEM_PROMPT), promptCaptor.capture());

        String prompt = promptCaptor.getValue();
        assertTrue(prompt.contains("Job Title: Java Developer"));
        assertTrue(prompt.contains("Department: Engineering"));
        assertTrue(prompt.contains("Required Skills: Java, Spring Boot"));
        assertTrue(prompt.contains("Minimum Experience Years: 3"));
        assertTrue(prompt.contains("Required Education: BACHELOR"));
        assertTrue(prompt.contains("Build REST APIs and support services"));
    }
}
