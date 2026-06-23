package com.recruitiq.mapper;

import com.recruitiq.dto.JobRequest;
import com.recruitiq.dto.JobResponse;
import com.recruitiq.model.City;
import com.recruitiq.model.Job;
import com.recruitiq.model.User;
import org.springframework.stereotype.Component;

@Component
public class JobMapper {

    public JobResponse toResponse(Job job) {
        String cityName = job.getCity() != null ? job.getCity().getName() : null;
        String location = job.getLocation() != null ? job.getLocation() : cityName;

        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .department(job.getDepartment())
                .location(location)
                .cityId(job.getCity() != null ? job.getCity().getId() : null)
                .cityName(cityName)
                .jdText(job.getJdText())
                .requiredSkills(job.getRequiredSkills())
                .minExperienceYears(job.getMinExperienceYears())
                .requiredEducation(job.getRequiredEducation() != null ? job.getRequiredEducation().name() : null)
                .deadline(job.getDeadline())
                .logoUrl(job.getLogoUrl())
                .salary(job.getSalary())
                .createdByName(job.getCreatedBy() != null ? job.getCreatedBy().getName() : null)
                .createdByEmail(job.getCreatedBy() != null ? job.getCreatedBy().getEmail() : null)
                .candidateCount(job.getCandidates().size())
                .status(job.getStatus().name())
                .createdAt(job.getCreatedAt())
                .build();
    }

    public Job toEntity(JobRequest request, User user, City city) {
        if (request == null) {
            return null;
        }

        return Job.builder()
                .title(request.getTitle())
                .department(request.getDepartment())
                .city(city)
                .location(city.getName())
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

    public void updateEntityFromRequest(JobRequest request, Job job, City city) {
        if (request == null || job == null) {
            return;
        }

        job.setTitle(request.getTitle());
        job.setDepartment(request.getDepartment());
        job.setCity(city);
        job.setLocation(city.getName());
        job.setJdText(request.getJdText());
        job.setRequiredSkills(request.getRequiredSkills());
        job.setMinExperienceYears(request.getMinExperienceYears());
        job.setRequiredEducation(request.getRequiredEducation());
        job.setDeadline(request.getDeadline());
        job.setLogoUrl(request.getLogoUrl());
        job.setSalary(request.getSalary());
        job.setStatus(request.getStatus());
    }
}
