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
public class CandidateListResponse {
    private Long id;
    private String originalFilename;
    private String fullName;
    private Double totalScore;

    // Chuyển tất cả thành String
    private String recommendation;    // Ví dụ: "STRONG_MATCH"
    private String decisionStatus;    // Ví dụ: "SHORTLISTED"
    private String processingStatus;  // Ví dụ: "COMPLETED"
    private String uploadedByName;
    private String uploadedByEmail;
    private String uploadedByRole;

    private LocalDateTime uploadedAt;
}