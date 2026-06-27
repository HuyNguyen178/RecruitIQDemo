package com.recruitiq.controller;

import com.recruitiq.model.User;
import com.recruitiq.service.CandidateService;
import com.recruitiq.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hr/dashboard")
@PreAuthorize("hasRole('HR_OFFICER') or hasRole('ADMIN')")
@RequiredArgsConstructor
public class HRDashboardController {
    private final CandidateService candidateService;
    private final UserService userService;

    @GetMapping("/overview")
    public ResponseEntity<?> getHROverview(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));
        return ResponseEntity.ok(candidateService.getHRDashboardStats(currentUser));
    }
}
