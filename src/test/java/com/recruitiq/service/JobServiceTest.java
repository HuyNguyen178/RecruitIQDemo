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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    @Test
    void createJob_shouldSaveAndReturnResponse() {
        JobRequest request = new JobRequest();
        request.setTitle("Developer");
        request.setCityId(1L);
        User createdBy = User.builder().id(10L).build();
        City city = City.builder().id(1L).name("Hanoi").active(true).build();
        Job job = Job.builder().id(99L).title("Developer").build();
        JobResponse response = JobResponse.builder().id(99L).title("Developer").build();

        when(cityRepository.findByIdAndActiveTrue(anyLong())).thenReturn(Optional.of(city));
        when(jobMapper.toEntity(any(JobRequest.class), any(User.class), any(City.class))).thenReturn(job);
        when(jobRepository.save(any(Job.class))).thenReturn(job);
        when(jobMapper.toResponse(any(Job.class))).thenReturn(response);

        JobResponse result = jobService.createJob(request, createdBy);

        assertEquals(99L, result.getId());
    }

    @Test
    void closeJob_shouldThrowWhenJobMissing() {
        when(jobRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> jobService.closeJob(123L));
    }

    @Test
    void closeExpiredJobs_shouldCloseMatchingJobs() {
        Job job = Job.builder().id(1L).status(Job.JobStatus.OPEN).deadline(LocalDate.now().minusDays(1)).build();
        when(jobRepository.findByStatusAndDeadlineBefore(any(), any())).thenReturn(List.of(job));

        int result = jobService.closeExpiredJobs();

        assertEquals(1, result);
        assertEquals(Job.JobStatus.CLOSED, job.getStatus());
        verify(jobRepository).saveAll(any());
    }
}
