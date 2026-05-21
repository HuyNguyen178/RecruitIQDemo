package com.recruitiq.service;

import com.recruitiq.dto.JobRequest;
import com.recruitiq.dto.JobResponse;
import com.recruitiq.mapper.JobMapper;
import com.recruitiq.model.Job;
import com.recruitiq.model.User;
import com.recruitiq.repository.CandidateRepository;
import com.recruitiq.repository.JobRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobMapper jobMapper;


    @Transactional
    public JobResponse createJob(JobRequest request, User createdBy) {
        Job job = jobMapper.toEntity(request, createdBy);
        Job savedJob = jobRepository.save(job);
        return jobMapper.toResponse(savedJob);
    }

    @Transactional
    public JobResponse updateJob(Long jobId, JobRequest request) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found: " + jobId));
        jobMapper.updateEntityFromRequest(request, job);
        return jobMapper.toResponse(jobRepository.save(job));
    }

    @Transactional
    public JobResponse closeJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found with id: " + jobId));

        job.setStatus(Job.JobStatus.CLOSED);

        Job closedJob = jobRepository.save(job);

        return jobMapper.toResponse(closedJob);
    }

    @Transactional
    public void deleteJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found: " + jobId));

        if (!job.getCandidates().isEmpty()) {
            throw new IllegalStateException("Cannot delete job because it already has candidates. Please close it instead.");
        }

        jobRepository.delete(job);
    }

    @Transactional(readOnly = true)
    public JobResponse getJobById(Long jobId) {
        return jobRepository.findById(jobId)
                .map(jobMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Job not found with id: " + jobId));
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getJobsByUser(User user) {
        List<Job> jobs;
        if (user.getRole() == User.Role.ADMIN) {
            jobs = jobRepository.findAllByOrderByCreatedAtDesc();
        } else {
            jobs = jobRepository.findByCreatedByOrderByCreatedAtDesc(user);
        }

        return jobs.stream()
                .map(jobMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getAllJobsForCandidate() {
        return jobRepository.findByStatusOrderByCreatedAtDesc(Job.JobStatus.OPEN)
                .stream()
                .map(jobMapper::toResponse)
                .collect(Collectors.toList());
    }
}
