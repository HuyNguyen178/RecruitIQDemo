package com.recruitiq.service.ai;

import com.recruitiq.model.Candidate;
import com.recruitiq.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiProcessingService {

    private final CandidateRepository candidateRepository;
    private final ParseService parseService;
    private final ScoreService scoreService;
    private final SummaryService summaryService;

    @Transactional
    public void processCandidate(Long candidateId) {
        Candidate candidate = candidateRepository.findByIdWithJob(candidateId).orElse(null);
        if (candidate == null) {
            log.error("Candidate {} no longer exists in DB", candidateId);
            return;
        }

        try {
            log.info("Phase 1: Parsing CV...");
            candidate.setProcessingStatus(Candidate.ProcessingStatus.PARSING);
            candidateRepository.save(candidate);
            candidate.setParsedProfile(parseService.parseCandidate(candidate));

            log.info("Phase 2: Scoring...");
            candidate.setProcessingStatus(Candidate.ProcessingStatus.SCORING);
            candidateRepository.save(candidate);
            candidate.setScoreRecord(scoreService.scoreCandidate(candidate));

            log.info("Phase 3: Summarizing...");
            candidate.setProcessingStatus(Candidate.ProcessingStatus.SUMMARIZING);
            candidateRepository.save(candidate);
            summaryService.summarizeCandidate(candidate);

            candidate.setProcessingStatus(Candidate.ProcessingStatus.COMPLETED);
            candidateRepository.save(candidate);
            log.info("Successfully processed Candidate: {}", candidate.getParsedProfile().getFullName());

        } catch (Exception e) {
            log.error("AI Workflow failed: {}", e.getMessage());
            candidate.setProcessingStatus(Candidate.ProcessingStatus.ERROR);
            candidate.setErrorMessage(e.getMessage());
            candidateRepository.save(candidate);
        }
    }

    @Async("taskExecutor")
    public void processCandidateAsync(Long candidateId) {
        this.processCandidate(candidateId);
    }
}