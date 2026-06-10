package com.recruitiq.dto;

import com.recruitiq.model.Job;
import com.recruitiq.validation.ValidSalary;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @Size(max = 255, message = "Department must be at most 255 characters")
    private String department;

    @NotNull(message = "City is required")
    private Long cityId;

    @NotBlank(message = "Job description is required")
    private String jdText;

    private String requiredSkills;

    @Min(value = 0, message = "Minimum experience years cannot be negative")
    @Max(value = 60, message = "Minimum experience years cannot exceed 60")
    private Integer minExperienceYears;

    @NotNull(message = "Required education level is required")
    private Job.EducationLevel requiredEducation;

    @NotNull(message = "Application deadline is required")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate deadline;

    private String logoUrl;

    @ValidSalary
    private String salary;
}
