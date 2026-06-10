package com.recruitiq.controller;

import com.recruitiq.model.Candidate;
import com.recruitiq.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    private final CandidateRepository candidateRepository;

    @GetMapping("/jobs/{jobId}/candidates/status")
    public ResponseEntity<List<Map<String, Object>>> getCandidateStatuses(@PathVariable Long jobId) {
        List<Candidate> candidates = candidateRepository.findByJobIdWithUserAndDetails(jobId);

        List<Map<String, Object>> statuses = candidates.stream()
                .map(candidate -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", candidate.getId());
                    m.put("status", candidate.getProcessingStatus().name());
                    m.put("filename", candidate.getOriginalFilename() != null ? candidate.getOriginalFilename() : "");
                    m.put("score", candidate.getScoreRecord() != null && candidate.getScoreRecord().getTotalScore() != null
                            ? candidate.getScoreRecord().getTotalScore() : 0);
                    m.put("name", candidate.getParsedProfile() != null && candidate.getParsedProfile().getFullName() != null
                            ? candidate.getParsedProfile().getFullName() : candidate.getOriginalFilename());
                    m.put("uploadedByName", candidate.getUser() != null
                            ? (candidate.getUser().getName() != null ? candidate.getUser().getName() : candidate.getUser().getEmail())
                            : "HR / Manual upload");
                    m.put("uploadedByEmail", candidate.getUser() != null
                            ? candidate.getUser().getEmail() : null);
                    m.put("uploadedByRole", candidate.getUser() != null
                            ? candidate.getUser().getRole() != null ? candidate.getUser().getRole().name() : null : null);
                    m.put("hasError", candidate.getProcessingStatus() == Candidate.ProcessingStatus.ERROR);
                    m.put("errorMessage", candidate.getErrorMessage() != null ? candidate.getErrorMessage() : "");
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(statuses);
    }

    @GetMapping("/jobs/{jobId}/stats")
    public ResponseEntity<Map<String, Object>> getJobStats(@PathVariable Long jobId) {
        List<Candidate> candidates = candidateRepository.findByJobId(jobId);

        long total = candidates.size();
        long completed = candidates.stream()
                .filter(c -> c.getProcessingStatus() == Candidate.ProcessingStatus.COMPLETED)
                .count();
        long processing = candidates.stream()
                .filter(c -> c.getProcessingStatus() != Candidate.ProcessingStatus.COMPLETED
                        && c.getProcessingStatus() != Candidate.ProcessingStatus.ERROR)
                .count();
        long errors = candidates.stream()
                .filter(c -> c.getProcessingStatus() == Candidate.ProcessingStatus.ERROR)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("completed", completed);
        stats.put("processing", processing);
        stats.put("errors", errors);
        return ResponseEntity.ok(stats);
    }
}
