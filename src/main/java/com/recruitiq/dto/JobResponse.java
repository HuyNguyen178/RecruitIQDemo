package com.recruitiq.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobResponse {
    private Long id;
    private String title;
    private String department;
    private String location;
    private String jdText;
    private String requiredSkills;
    private Integer minExperienceYears;
    private String requiredEducation;
    private LocalDate deadline;
    private String status;
    private String createdByName;
    private LocalDateTime createdAt;
    private int candidateCount;
    private String logoUrl;
    private String salary;
}
