package com.recruitiq.service.ai;

import com.recruitiq.model.Candidate;
import com.recruitiq.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiProcessingService {

    private final CandidateRepository candidateRepository;
    private final ParseService parseService;
    private final ScoreService scoreService;
    private final SummaryService summaryService;

    // Save status in its own transaction so it always commits, even if outer logic fails
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveStatus(Candidate candidate) {
        candidateRepository.save(candidate);
    }

    public void processCandidate(Long candidateId) {
        Candidate candidate = candidateRepository.findByIdWithJob(candidateId).orElse(null);
        if (candidate == null) {
            log.error("Candidate {} no longer exists in DB", candidateId);
            return;
        }

        try {
            log.info("Phase 1: Parsing CV...");
            candidate.setProcessingStatus(Candidate.ProcessingStatus.PARSING);
            saveStatus(candidate);
            candidate.setParsedProfile(parseService.parseCandidate(candidate));

            log.info("Phase 2: Scoring...");
            candidate.setProcessingStatus(Candidate.ProcessingStatus.SCORING);
            saveStatus(candidate);
            candidate.setScoreRecord(scoreService.scoreCandidate(candidate));

            log.info("Phase 3: Summarizing...");
            candidate.setProcessingStatus(Candidate.ProcessingStatus.SUMMARIZING);
            saveStatus(candidate);
            summaryService.summarizeCandidate(candidate);

            candidate.setProcessingStatus(Candidate.ProcessingStatus.COMPLETED);
            saveStatus(candidate);
            log.info("Successfully processed Candidate: {}", candidate.getParsedProfile().getFullName());

        } catch (Exception e) {
            log.error("AI Workflow failed for candidate {}: {}", candidateId, e.getMessage());
            candidate.setProcessingStatus(Candidate.ProcessingStatus.ERROR);
            candidate.setErrorMessage(toFriendlyError(e));
            saveStatus(candidate); // REQUIRES_NEW ensures this always commits
        }
    }

    /**
     * Converts technical exceptions into user-friendly messages.
     * End users should never see Java stack traces or API error codes.
     */
    private String toFriendlyError(Exception e) {
        String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        if (msg.contains("429") || msg.contains("rate limit") || msg.contains("quota")) {
            return "AI service is currently overloaded. Please try again in a few minutes.";
        }
        if (msg.contains("401") || msg.contains("403") || msg.contains("authentication") || msg.contains("api key")) {
            return "AI service configuration error. Please contact your system administrator.";
        }
        if (msg.contains("timeout") || msg.contains("timed out") || msg.contains("connection")) {
            return "Could not connect to the AI service. Please check your internet connection and try again.";
        }
        if (msg.contains("parse") || msg.contains("json") || msg.contains("unexpected token")) {
            return "The CV file could not be read properly. Please ensure the file is a valid PDF or Word document.";
        }
        if (msg.contains("500") || msg.contains("server error") || msg.contains("internal")) {
            return "The AI service encountered an internal error. Please try again later.";
        }
        if (msg.contains("no candidates") || msg.contains("empty response")) {
            return "The AI service returned an empty response. Please try uploading the CV again.";
        }
        return "An unexpected error occurred while processing this CV. Please try again or contact support.";
    }

    @Async("taskExecutor")
    public void processCandidateAsync(Long candidateId) {
        this.processCandidate(candidateId);
    }
}