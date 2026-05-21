package com.recruitiq.controller;

import com.recruitiq.dto.JobRequest;
import com.recruitiq.dto.JobResponse;
import com.recruitiq.model.User;
import com.recruitiq.service.JobService;
import com.recruitiq.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/jobs")
@PreAuthorize("hasRole('HR_OFFICER') or hasRole('ADMIN')")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<JobResponse>> listJobs(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userDetails.getUsername()));
        List<JobResponse> jobs = jobService.getJobsByUser(currentUser);

        return ResponseEntity.ok(jobs);
    }

    @PostMapping
    public ResponseEntity<?> createJob(@RequestBody @Valid JobRequest jobRequest,
                                       @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        JobResponse response = jobService.createJob(jobRequest, currentUser);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getJobDetail(@PathVariable Long id) {
        JobResponse response = jobService.getJobById(id);
        return ResponseEntity.ok(response);
    }


    @PutMapping("/{id}")
    public ResponseEntity<JobResponse> updateJob(@PathVariable Long id,
                                                 @RequestBody @Valid JobRequest jobRequest) {
        JobResponse updatedJob = jobService.updateJob(id, jobRequest);

        return ResponseEntity.ok(updatedJob);
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<JobResponse> closeJob(@PathVariable Long id) {
        JobResponse response = jobService.closeJob(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }
}
