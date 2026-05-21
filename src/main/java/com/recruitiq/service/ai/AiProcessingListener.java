package com.recruitiq.service.ai;

import com.recruitiq.event.CandidateUploadedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiProcessingListener {

    private final AiProcessingService aiProcessingService;

    @Async("taskExecutor") // Runs in a background thread pool
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT) // Waits for DB Commit
    public void handleAiProcessing(CandidateUploadedEvent event) {
        log.info("Transaction committed. Starting AI for Candidate ID: {}", event.getCandidateId());
        aiProcessingService.processCandidate(event.getCandidateId());
    }
}