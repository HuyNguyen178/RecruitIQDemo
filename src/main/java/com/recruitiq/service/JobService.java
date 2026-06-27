package com.recruitiq.service;

import com.recruitiq.dto.JobRequest;
import com.recruitiq.dto.JobResponse;
import com.recruitiq.mapper.JobMapper;
import com.recruitiq.model.City;
import com.recruitiq.model.Job;
import com.recruitiq.model.User;
import com.recruitiq.repository.CityRepository;
import com.recruitiq.repository.CandidateRepository;
import com.recruitiq.repository.JobRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final CityRepository cityRepository;
    private final CandidateRepository candidateRepository;
    private final JobMapper jobMapper;

    @Transactional
    public JobResponse createJob(JobRequest request, User createdBy) {
        // Validation handled by @Valid annotation in controller and DTO annotations
        City city = resolveCity(request.getCityId());
        Job job = jobMapper.toEntity(request, createdBy, city);
        Job savedJob = jobRepository.save(job);
        return jobMapper.toResponse(savedJob);
    }

    @Transactional
    public JobResponse updateJob(Long jobId, JobRequest request) {
        // Validation handled by @Valid annotation in controller and DTO annotations
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found: " + jobId));
        City city = resolveCity(request.getCityId());
        Job.JobStatus oldStatus = job.getStatus();
        jobMapper.updateEntityFromRequest(request, job, city);
        
        // If status is set/reopened to OPEN, set deadline to tomorrow if it was CLOSED, null, or in the past
        if (job.getStatus() == Job.JobStatus.OPEN) {
            if (oldStatus == Job.JobStatus.CLOSED || job.getDeadline() == null || job.getDeadline().isBefore(LocalDate.now())) {
                job.setDeadline(LocalDate.now().plusDays(1));
            }
        }
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
        return jobRepository.findByIdWithCreatedBy(jobId)
                .map(jobMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Job not found with id: " + jobId));
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getJobsByUser(User user) {
        List<Job> jobs;
        if (user.getRole() == User.Role.ADMIN) {
            jobs = jobRepository.findAllWithCreatedByOrderByCreatedAtDesc();
        } else {
            jobs = jobRepository.findByCreatedByWithCreatedByOrderByCreatedAtDesc(user);
        }

        return jobs.stream()
                .map(jobMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Closes all OPEN jobs whose deadline is before today (deadline day is still open).
     */
    @Transactional
    public int closeExpiredJobs() {
        LocalDate today = LocalDate.now();
        List<Job> expiredJobs = jobRepository.findByStatusAndDeadlineBefore(Job.JobStatus.OPEN, today);
        if (expiredJobs.isEmpty()) {
            return 0;
        }
        expiredJobs.forEach(job -> job.setStatus(Job.JobStatus.CLOSED));
        jobRepository.saveAll(expiredJobs);
        log.info("Auto-closed {} job(s) past deadline", expiredJobs.size());
        return expiredJobs.size();
    }

    @Transactional
    public void closeJobIfExpired(Job job) {
        if (job.getStatus() == Job.JobStatus.OPEN
                && job.getDeadline() != null
                && job.getDeadline().isBefore(LocalDate.now())) {
            job.setStatus(Job.JobStatus.CLOSED);
            jobRepository.save(job);
            log.info("Auto-closed job id={} (deadline={})", job.getId(), job.getDeadline());
        }
    }

    public boolean isOpenForApplications(Job job) {
        if (job.getStatus() != Job.JobStatus.OPEN) {
            return false;
        }
        if (job.getDeadline() == null) {
            return true;
        }
        return !job.getDeadline().isBefore(LocalDate.now());
    }

    @Transactional
    public List<JobResponse> getAllJobsForCandidate() {
        return jobRepository.findByStatusOrderByCreatedAtDesc(Job.JobStatus.OPEN)
                .stream()
                .map(jobMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Candidates may view a closed job only if they already submitted an application (e.g. from My Applications).
     */
    @Transactional
    public JobResponse getJobByIdForCandidate(Long jobId, String candidateEmail) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found with id: " + jobId));
        closeJobIfExpired(job);

        boolean hasApplied = candidateEmail != null
                && candidateRepository.existsByJobIdAndUserEmail(jobId, candidateEmail);

        if (!isOpenForApplications(job) && !hasApplied) {
            throw new EntityNotFoundException("Job not found or no longer accepting applications");
        }
        return jobMapper.toResponse(job);
    }

    private City resolveCity(Long cityId) {
        if (cityId == null) {
            throw new IllegalArgumentException("Please select a valid city.");
        }
        return cityRepository.findByIdAndActiveTrue(cityId)
                .orElseThrow(() -> new IllegalArgumentException("Selected city does not exist or is inactive."));
    }
}
