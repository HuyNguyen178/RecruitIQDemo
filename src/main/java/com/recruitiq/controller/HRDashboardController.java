package com.recruitiq.controller;

import com.recruitiq.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hr/dashboard")
@PreAuthorize("hasRole('HR_OFFICER')")
@RequiredArgsConstructor
public class HRDashboardController {
    private final CandidateService candidateService;

    @GetMapping("/overview")
    public ResponseEntity<?> getHROverview() {
        return ResponseEntity.ok(candidateService.getHRDashboardStats());
    }
}
