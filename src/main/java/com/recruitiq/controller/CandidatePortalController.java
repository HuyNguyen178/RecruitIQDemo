package com.recruitiq.controller;

import com.recruitiq.dto.CandidateResponse;
import com.recruitiq.dto.FileDownloadDto;
import com.recruitiq.dto.JobResponse;
import com.recruitiq.service.CandidateService;
import com.recruitiq.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/portal")
@RequiredArgsConstructor
public class CandidatePortalController {

    private final JobService jobService;
    private final CandidateService candidateService;

    @GetMapping("/jobs")
    public ResponseEntity<List<JobResponse>> getJobs() {
        return ResponseEntity.ok(jobService.getAllJobsForCandidate());
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<JobResponse> getJobDetailForCandidate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(jobService.getJobByIdForCandidate(id, email));
    }

    // 2. Nộp CV trực tiếp
    @PostMapping(value = "/apply/{jobId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CandidateResponse> apply(@PathVariable Long jobId,
                                                   @RequestParam("file") MultipartFile file,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        // userDetails.getUsername() chính là Email từ JWT Token
        CandidateResponse response = candidateService.selfApply(jobId, file, userDetails.getUsername());
        candidateService.processAsync(response.getId());
        return ResponseEntity.ok(response);
    }

    // 3. Xem lịch sử và trạng thái CV
    @GetMapping("/my-applications")
    public ResponseEntity<List<CandidateResponse>> getMyApplications(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(candidateService.getMyApplications(userDetails.getUsername()));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getMyDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(candidateService.getCandidateStats(userDetails.getUsername()));
    }

    @PreAuthorize("@candidateService.isOwner(#id, principal.username)")
    @GetMapping("/my-applications/{id}/download-cv")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long id) {
        FileDownloadDto downloadDto = candidateService.getDownloadInfo(id);

        if (downloadDto.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        Path path = Paths.get(downloadDto.getFilePath());
        Resource resource = new FileSystemResource(path);

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType;
        try {
            contentType = Files.probeContentType(path);
            if (contentType == null) contentType = "application/octet-stream";
        } catch (IOException e) {
            contentType = "application/octet-stream";
        }

        String encodedFileName = UriUtils.encode(downloadDto.getFileName(), StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                .body(resource);
    }

    // 4. Rút hồ sơ / Gỡ CV của ứng viên
    @PreAuthorize("@candidateService.isOwner(#id, principal.username)")
    @DeleteMapping("/my-applications/{id}")
    public ResponseEntity<Void> withdrawApplication(@PathVariable Long id) {
        candidateService.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }
}
