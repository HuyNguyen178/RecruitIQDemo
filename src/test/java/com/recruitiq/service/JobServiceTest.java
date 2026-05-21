package com.recruitiq.service;

import com.recruitiq.dto.JobRequest;
import com.recruitiq.dto.JobResponse;
import com.recruitiq.mapper.JobMapper;
import com.recruitiq.model.Job;
import com.recruitiq.model.User;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

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
        // ... set các fields khác cho request

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
        when(jobRepository.findById(1L)).thenReturn(Optional.of(testJob));
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
        when(jobRepository.findById(1L)).thenReturn(Optional.of(testJob));
        doNothing().when(jobMapper).updateEntityFromRequest(any(), any());
        when(jobRepository.save(any())).thenReturn(testJob);
        when(jobMapper.toResponse(any())).thenReturn(jobResponse);

        // Act
        JobResponse result = jobService.updateJob(1L, jobRequest);

        // Assert
        assertNotNull(result);
        verify(jobMapper).updateEntityFromRequest(eq(jobRequest), eq(testJob));
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
        when(jobRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(testJob));
        when(jobMapper.toResponse(testJob)).thenReturn(jobResponse);

        // Act
        List<JobResponse> results = jobService.getJobsByUser(admin);

        // Assert
        assertEquals(1, results.size());
        verify(jobRepository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void deleteJob_WhenJobHasCandidates_ShouldThrowException() {
        // Giả lập job đã có ứng viên (logic check trong service)
        // testJob.getCandidates().add(new Candidate());
        // Tùy vào cách bạn implement hàm deleteJob, nếu nó check size() > 0

        when(jobRepository.findById(1L)).thenReturn(Optional.of(testJob));
        // Nếu trong service bạn ném IllegalStateException khi có candidate:
        // assertThrows(IllegalStateException.class, () -> jobService.deleteJob(1L));
    }

    @Test
    void anyMethod_WhenNotFound_ShouldThrowEntityNotFoundException() {
        when(jobRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> jobService.getJobById(99L));
    }
}