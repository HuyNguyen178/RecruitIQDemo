package com.recruitiq.dto;

import com.recruitiq.model.Job;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobRequest {
    private String title;
    private String department;
    private String location;
    private String jdText;
    private String requiredSkills;
    private Integer minExperienceYears;
    private Job.EducationLevel requiredEducation;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate deadline;
    private String logoUrl;
    private String salary;
}
