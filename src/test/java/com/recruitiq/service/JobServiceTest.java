package com.recruitiq.service;

import com.recruitiq.dto.JobRequest;
import com.recruitiq.dto.JobResponse;
import com.recruitiq.mapper.JobMapper;
import com.recruitiq.model.City;
import com.recruitiq.model.Job;
import com.recruitiq.model.User;
import com.recruitiq.repository.CandidateRepository;
import com.recruitiq.repository.CityRepository;
import com.recruitiq.repository.JobRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CityRepository cityRepository;

    @Mock
    private CandidateRepository candidateRepository;

    @Mock
    private JobMapper jobMapper;

    @InjectMocks
    private JobService jobService;

    private User testUser;
    private JobRequest jobRequest;
    private Job testJob;
    private JobResponse jobResponse;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("hr@test.com")
                .role(User.Role.HR_OFFICER)
                .build();

        jobRequest = new JobRequest();
        jobRequest.setTitle("Software Engineer");
        jobRequest.setDepartment("Engineering");
        jobRequest.setCityId(1L);
        jobRequest.setJdText("Job description");
        jobRequest.setRequiredEducation(Job.EducationLevel.BACHELOR);
        jobRequest.setDeadline(LocalDate.now().plusDays(30));
        jobRequest.setMinExperienceYears(1);

        testJob = Job.builder()
                .id(1L)
                .title("Software Engineer")
                .status(Job.JobStatus.OPEN)
                .createdBy(testUser)
                .build();

        jobResponse = JobResponse.builder()
                .id(1L)
                .title("Software Engineer")
                .status("OPEN")
                .build();
    }

    @Test
    void createJob_ShouldReturnJobResponse() {
        // Arrange
        City city = City.builder().id(1L).name("Hanoi").active(true).build();
        when(cityRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(city));
        when(jobMapper.toEntity(any(), any(), any())).thenReturn(testJob);
        when(jobRepository.save(any(Job.class))).thenReturn(testJob);
        when(jobMapper.toResponse(any(Job.class))).thenReturn(jobResponse);

        // Act
        JobResponse result = jobService.createJob(jobRequest, testUser);

        // Assert
        assertNotNull(result);
        assertEquals("Software Engineer", result.getTitle());
        verify(jobRepository).save(any(Job.class));
        verify(jobMapper).toResponse(any(Job.class));
    }

    @Test
    void getJobResponseById_WhenFound_ShouldReturnResponse() {
        // Arrange
        when(jobRepository.findByIdWithCreatedBy(1L)).thenReturn(Optional.of(testJob));
        when(jobMapper.toResponse(testJob)).thenReturn(jobResponse);

        // Act
        JobResponse result = jobService.getJobById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void updateJob_ShouldUpdateAndReturnResponse() {
        // Arrange
        City city = City.builder().id(1L).name("Hanoi").active(true).build();
        when(cityRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(city));
        when(jobRepository.findById(1L)).thenReturn(Optional.of(testJob));
        doNothing().when(jobMapper).updateEntityFromRequest(any(), any(), any());
        when(jobRepository.save(any())).thenReturn(testJob);
        when(jobMapper.toResponse(any())).thenReturn(jobResponse);

        // Act
        JobResponse result = jobService.updateJob(1L, jobRequest);

        // Assert
        assertNotNull(result);
        verify(jobMapper).updateEntityFromRequest(eq(jobRequest), eq(testJob), any());
        verify(jobRepository).save(testJob);
    }

    @Test
    void closeJob_ShouldChangeStatusAndReturnResponse() {
        // Arrange
        when(jobRepository.findById(1L)).thenReturn(Optional.of(testJob));
        when(jobRepository.save(any())).thenReturn(testJob);
        when(jobMapper.toResponse(any())).thenReturn(jobResponse);

        // Act
        JobResponse result = jobService.closeJob(1L);

        // Assert
        assertNotNull(result);
        assertEquals(Job.JobStatus.CLOSED, testJob.getStatus()); // Kiểm tra entity đã đổi status chưa
        verify(jobRepository).save(testJob);
    }

    @Test
    void getJobsByUser_AdminShouldSeeAll() {
        // Arrange
        User admin = User.builder().role(User.Role.ADMIN).build();
        when(jobRepository.findAllWithCreatedByOrderByCreatedAtDesc()).thenReturn(List.of(testJob));
        when(jobMapper.toResponse(testJob)).thenReturn(jobResponse);

        // Act
        List<JobResponse> results = jobService.getJobsByUser(admin);

        // Assert
        assertEquals(1, results.size());
        verify(jobRepository).findAllWithCreatedByOrderByCreatedAtDesc();
    }

    @Test
    void deleteJob_WhenJobHasCandidates_ShouldThrowException() {
        testJob.setCandidates(List.of(new com.recruitiq.model.Candidate()));
        when(jobRepository.findById(1L)).thenReturn(Optional.of(testJob));
        
        assertThrows(IllegalStateException.class, () -> jobService.deleteJob(1L));
    }

    @Test
    void anyMethod_WhenNotFound_ShouldThrowEntityNotFoundException() {
        when(jobRepository.findByIdWithCreatedBy(99L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> jobService.getJobById(99L));
    }

    @Test
    void closeExpiredJobs_ShouldCloseOpenJobsPastDeadline() {
        Job expiredJob = Job.builder()
                .id(2L)
                .title("Expired Role")
                .status(Job.JobStatus.OPEN)
                .deadline(LocalDate.now().minusDays(1))
                .build();

        when(jobRepository.findByStatusAndDeadlineBefore(eq(Job.JobStatus.OPEN), any(LocalDate.class)))
                .thenReturn(List.of(expiredJob));
        when(jobRepository.saveAll(any())).thenReturn(List.of(expiredJob));

        int closed = jobService.closeExpiredJobs();

        assertEquals(1, closed);
        assertEquals(Job.JobStatus.CLOSED, expiredJob.getStatus());
        verify(jobRepository).saveAll(any());
    }

    @Test
    void getJobByIdForCandidate_WhenPastDeadlineAndNoApplication_ShouldThrowNotFound() {
        Job expiredJob = Job.builder()
                .id(1L)
                .title("Expired Role")
                .status(Job.JobStatus.OPEN)
                .deadline(LocalDate.now().minusDays(1))
                .build();

        when(jobRepository.findById(1L)).thenReturn(Optional.of(expiredJob));
        when(jobRepository.save(expiredJob)).thenReturn(expiredJob);

        assertThrows(EntityNotFoundException.class, () -> jobService.getJobByIdForCandidate(1L, null));
        assertEquals(Job.JobStatus.CLOSED, expiredJob.getStatus());
    }

    @Test
    void getJobByIdForCandidate_WhenClosedButCandidateApplied_ShouldReturnJob() {
        Job closedJob = Job.builder()
                .id(1L)
                .title("Closed Role")
                .status(Job.JobStatus.CLOSED)
                .deadline(LocalDate.now().minusDays(1))
                .build();

        when(jobRepository.findById(1L)).thenReturn(Optional.of(closedJob));
        when(candidateRepository.existsByJobIdAndUserEmail(1L, "candidate@test.com")).thenReturn(true);
        when(jobMapper.toResponse(closedJob)).thenReturn(jobResponse);

        JobResponse result = jobService.getJobByIdForCandidate(1L, "candidate@test.com");

        assertNotNull(result);
        verify(jobMapper).toResponse(closedJob);
    }
}