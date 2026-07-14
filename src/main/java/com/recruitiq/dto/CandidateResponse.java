package com.recruitiq.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateResponse {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private String originalFilename;
    private String processingStatus;
    private LocalDateTime uploadedAt;
    private String errorMessage;

    // Từ ParsedProfile
    private String fullName;
    private String email;
    private String phone;
    private Double yearsExperience;
    private String skills;

    // Từ ScoreRecord
    private Double totalScore;
    private Double skillsScore;
    private Double experienceScore;
    private Double educationScore;
    private Double certScore;
    private Double softSkillsScore;
    private String reasoningJson;

    // Từ AiSummary
    private String recommendation; // STRONG_MATCH, POTENTIAL_MATCH...
    private String summaryText;

    // Từ Shortlist
    private String decisionStatus; // PENDING, SHORTLISTED, REJECTED...
    private String hrNotes;

    // User who submitted or created the CV
    private String uploadedByName;
    private String uploadedByEmail;
    private String uploadedByRole;
}