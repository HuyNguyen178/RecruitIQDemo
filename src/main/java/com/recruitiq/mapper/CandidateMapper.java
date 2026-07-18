package com.recruitiq.mapper;

import com.recruitiq.dto.CandidateListResponse;
import com.recruitiq.dto.CandidateResponse;
import com.recruitiq.model.Candidate;
import org.springframework.stereotype.Component;

@Component
public class CandidateMapper {

    public CandidateResponse toResponse(Candidate candidate) {
        if (candidate == null) return null;

        CandidateResponse.CandidateResponseBuilder builder = CandidateResponse.builder()
                .id(candidate.getId())
                .originalFilename(candidate.getOriginalFilename())
                .processingStatus(candidate.getProcessingStatus().name())
                .uploadedAt(candidate.getUploadedAt())
                .errorMessage(candidate.getErrorMessage());

        if (candidate.getJob() != null) {
            builder.jobId(candidate.getJob().getId())
                   .jobTitle(candidate.getJob().getTitle());
        }

        // 1. Ánh xạ từ ParsedProfile
        if (candidate.getParsedProfile() != null) {
            builder.fullName(candidate.getParsedProfile().getFullName())
                    .email(candidate.getParsedProfile().getEmail())
                    .phone(candidate.getParsedProfile().getPhone())
                    .yearsExperience(candidate.getParsedProfile().getYearsExperience())
                    .skills(candidate.getParsedProfile().getSkillsArray())
                    .profileJson(candidate.getParsedProfile().getProfileJson());
        }

        // 2. Ánh xạ từ ScoreRecord
        if (candidate.getScoreRecord() != null) {
            builder.totalScore(candidate.getScoreRecord().getTotalScore())
                    .skillsScore(candidate.getScoreRecord().getSkillsScore())
                    .experienceScore(candidate.getScoreRecord().getExperienceScore())
                    .educationScore(candidate.getScoreRecord().getEducationScore())
                    .certScore(candidate.getScoreRecord().getCertScore())
                    .softSkillsScore(candidate.getScoreRecord().getSoftSkillsScore())
                    .reasoningJson(candidate.getScoreRecord().getReasoningJson());
        }

        // 3. Ánh xạ từ AiSummary
        if (candidate.getAiSummary() != null) {
            builder.recommendation(candidate.getAiSummary().getRecommendation() != null
                            ? candidate.getAiSummary().getRecommendation().name() : null)
                    .summaryText(candidate.getAiSummary().getSummaryText());
        }

        // 4. Ánh xạ từ Shortlist
        if (candidate.getShortlist() != null) {
            builder.decisionStatus(candidate.getShortlist().getDecisionStatus().name())
                    .hrNotes(candidate.getShortlist().getHrNotes());
        } else {
            builder.decisionStatus("PENDING");
        }

        if (candidate.getUser() != null) {
            builder.uploadedByName(candidate.getUser().getName() != null
                    ? candidate.getUser().getName() : candidate.getUser().getEmail());
            builder.uploadedByEmail(candidate.getUser().getEmail());
            builder.uploadedByRole(candidate.getUser().getRole() != null
                    ? candidate.getUser().getRole().name() : null);
        } else {
            builder.uploadedByName("Uploaded by HR");
        }

        return builder.build();
    }


    public CandidateListResponse toListResponse(Candidate candidate) {
        return CandidateListResponse.builder()
                .id(candidate.getId())
                .originalFilename(candidate.getOriginalFilename())
                .uploadedAt(candidate.getUploadedAt())
                .processingStatus(candidate.getProcessingStatus().name()) // Enum to String

                .fullName(candidate.getParsedProfile() != null
                        ? candidate.getParsedProfile().getFullName() : "N/A")

                .totalScore(candidate.getScoreRecord() != null
                        ? candidate.getScoreRecord().getTotalScore() : 0.0)

                .recommendation(candidate.getAiSummary() != null && candidate.getAiSummary().getRecommendation() != null
                        ? candidate.getAiSummary().getRecommendation().name() : null)

                .decisionStatus(candidate.getShortlist() != null
                        ? candidate.getShortlist().getDecisionStatus().name() : "PENDING")
                .uploadedByName(candidate.getUser() != null
                        ? (candidate.getUser().getName() != null
                            ? candidate.getUser().getName() : candidate.getUser().getEmail())
                        : "Uploaded by HR")
                .uploadedByEmail(candidate.getUser() != null
                        ? candidate.getUser().getEmail() : null)
                .uploadedByRole(candidate.getUser() != null
                        ? (candidate.getUser().getRole() != null ? candidate.getUser().getRole().name() : null) : null)
                .build();
    }
}