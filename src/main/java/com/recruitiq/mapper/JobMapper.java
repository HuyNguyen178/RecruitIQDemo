package com.recruitiq.mapper;

import com.recruitiq.dto.JobRequest;
import com.recruitiq.dto.JobResponse;
import com.recruitiq.model.Job;
import com.recruitiq.model.User;
import org.springframework.stereotype.Component;

@Component
public class JobMapper {
    public JobResponse toResponse(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .department(job.getDepartment())
                .location(job.getLocation())
                .jdText(job.getJdText())
                .requiredSkills(job.getRequiredSkills())
                .minExperienceYears(job.getMinExperienceYears())
                .requiredEducation(job.getRequiredEducation() != null ? job.getRequiredEducation().name() : null)
                .deadline(job.getDeadline())
                .logoUrl(job.getLogoUrl())
                .salary(job.getSalary())
                .createdByName(job.getCreatedBy().getName())
                .candidateCount(job.getCandidates().size())
                .status(job.getStatus().name())
                .createdAt(job.getCreatedAt())
                .build();
    }

    public Job toEntity(JobRequest request, User user) {
        if (request == null) return null;

        return Job.builder()
                .title(request.getTitle())
                .department(request.getDepartment())
                .location(request.getLocation())
                .jdText(request.getJdText())
                .requiredSkills(request.getRequiredSkills())
                .minExperienceYears(request.getMinExperienceYears())
                .requiredEducation(request.getRequiredEducation())
                .deadline(request.getDeadline())
                .logoUrl(request.getLogoUrl())
                .salary(request.getSalary())
                .status(Job.JobStatus.OPEN)
                .createdBy(user)
                .build();
    }
    public void updateEntityFromRequest(JobRequest request, Job job) {
        if (request == null || job == null) return;

        job.setTitle(request.getTitle());
        job.setDepartment(request.getDepartment());
        job.setLocation(request.getLocation());
        job.setJdText(request.getJdText());
        job.setRequiredSkills(request.getRequiredSkills());
        job.setMinExperienceYears(request.getMinExperienceYears());
        job.setRequiredEducation(request.getRequiredEducation());
        job.setDeadline(request.getDeadline());
        job.setLogoUrl(request.getLogoUrl());
        job.setSalary(request.getSalary());
    }
}