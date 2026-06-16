package com.recruitiq.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recruitiq.model.Candidate;
import com.recruitiq.model.Job;
import com.recruitiq.model.ParsedProfile;
import com.recruitiq.model.User;
import com.recruitiq.repository.ParsedProfileRepository;
import com.recruitiq.service.ai.LlmApiClient;
import com.recruitiq.service.ai.ParseService;
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
class ParseServiceTest {

    @Mock
    private LlmApiClient llmApiClient;

    @Mock
    private ParsedProfileRepository parsedProfileRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ParseService parseService;

    private Candidate testCandidate;
    private static final String MOCK_PARSE_RESPONSE = """
            {
              "full_name": "Alice Johnson",
              "email": "alice@example.com",
              "phone": "+1-555-1234",
              "location": "San Francisco, CA",
              "skills": ["Java", "Spring Boot", "PostgreSQL", "Docker"],
              "years_experience": 4.5,
              "education_level": "BACHELOR",
              "education_history": [
                {"degree": "BS Computer Science", "institution": "UC Berkeley", "year": "2019", "field": "Computer Science"}
              ],
              "work_experience": [
                {"title": "Software Engineer", "company": "TechCorp", "start_date": "2019", "end_date": "Present", "description": "Java development"}
              ],
              "certifications": ["AWS Certified Developer"],
              "languages": ["English", "Spanish"],
              "summary": "Experienced Java developer with 4.5 years of backend experience."
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
                .jdText("We need a Java developer with Spring Boot experience")
                .createdBy(user)
                .build();

        testCandidate = Candidate.builder()
                .id(1L)
                .job(job)
                .originalFilename("alice_johnson_cv.pdf")
                .rawText("Alice Johnson\nalice@example.com\n+1-555-1234\n\nExperience:\n4.5 years Java development")
                .processingStatus(Candidate.ProcessingStatus.PARSING)
                .build();
    }

    @Test
    void parseCandidate_ShouldReturnParsedProfile() {
        when(llmApiClient.callApi(anyString(), anyString())).thenReturn(MOCK_PARSE_RESPONSE);
        when(parsedProfileRepository.save(any(ParsedProfile.class))).thenAnswer(inv -> {
            ParsedProfile profile = inv.getArgument(0);
            profile = ParsedProfile.builder()
                    .id(1L)
                    .candidate(testCandidate)
                    .fullName(profile.getFullName())
                    .email(profile.getEmail())
                    .skillsArray(profile.getSkillsArray())
                    .yearsExperience(profile.getYearsExperience())
                    .educationLevel(profile.getEducationLevel())
                    .profileJson(profile.getProfileJson())
                    .build();
            return profile;
        });

        ParsedProfile result = parseService.parseCandidate(testCandidate);

        assertNotNull(result);
        assertEquals("Alice Johnson", result.getFullName());
        assertEquals("alice@example.com", result.getEmail());
        assertEquals(4.5, result.getYearsExperience());
        assertEquals(Job.EducationLevel.BACHELOR, result.getEducationLevel());
        assertTrue(result.getSkillsArray().contains("Java"));
        assertTrue(result.getSkillsArray().contains("Spring Boot"));

        verify(llmApiClient, times(1)).callApi(anyString(), anyString());
        verify(parsedProfileRepository, times(1)).save(any(ParsedProfile.class));
    }

    @Test
    void parseCandidate_WithMarkdownWrappedJson_ShouldExtractCorrectly() {
        String wrappedResponse = "```json\n" + MOCK_PARSE_RESPONSE + "\n```";

        when(llmApiClient.callApi(anyString(), anyString())).thenReturn(wrappedResponse);
        when(parsedProfileRepository.save(any(ParsedProfile.class))).thenAnswer(inv -> {
            ParsedProfile profile = inv.getArgument(0);
            ParsedProfile saved = new ParsedProfile();
            saved.setId(1L);
            saved.setFullName(profile.getFullName());
            saved.setEmail(profile.getEmail());
            return saved;
        });

        ParsedProfile result = parseService.parseCandidate(testCandidate);

        assertNotNull(result);
        assertEquals("Alice Johnson", result.getFullName());
    }

    @Test
    void parseCandidate_WhenNoRawText_ShouldThrowException() {
        testCandidate.setRawText(null);

        assertThrows(RuntimeException.class, () ->
                parseService.parseCandidate(testCandidate));

        verify(llmApiClient, never()).callApi(anyString(), anyString());
    }

    @Test
    void parseCandidate_WhenBlankRawText_ShouldThrowException() {
        testCandidate.setRawText("   ");

        assertThrows(RuntimeException.class, () ->
                parseService.parseCandidate(testCandidate));
    }

    @Test
    void parseCandidate_WhenLlmFails_ShouldThrowRuntimeException() {
        when(llmApiClient.callApi(anyString(), anyString()))
                .thenThrow(new RuntimeException("API timeout"));

        assertThrows(RuntimeException.class, () ->
                parseService.parseCandidate(testCandidate));
    }

    @Test
    void parseCandidate_ShouldTruncateLongRawText() {
        String longText = "x".repeat(20000);
        testCandidate.setRawText(longText);

        when(llmApiClient.callApi(anyString(), anyString())).thenReturn(MOCK_PARSE_RESPONSE);
        when(parsedProfileRepository.save(any(ParsedProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        parseService.parseCandidate(testCandidate);

        verify(llmApiClient).callApi(anyString(), argThat(prompt ->
                prompt.contains("[... truncated ...]")));
    }
}
