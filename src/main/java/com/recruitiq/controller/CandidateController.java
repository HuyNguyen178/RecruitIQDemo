package com.recruitiq.controller;

import com.recruitiq.dto.*;
import com.recruitiq.model.User;
import com.recruitiq.service.CandidateService;
import com.recruitiq.service.ExportService;
import com.recruitiq.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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

@Slf4j
@RestController
@RequestMapping("/api/candidates")
@PreAuthorize("hasRole('HR_OFFICER') or hasRole('ADMIN')")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;
    private final UserService userService;
    private final ExportService exportService;

    // 1. Upload CVs
    @PostMapping(value = "/{jobId}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<CandidateResponse>> handleFileUpload(
            @PathVariable Long jobId,
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = getCurrentUser(userDetails);
        List<CandidateResponse> uploadedCandidates = candidateService.uploadCvFiles(jobId, files, currentUser);

        return new ResponseEntity<>(uploadedCandidates, HttpStatus.CREATED);
    }

    // 2. Lấy danh sách ứng viên của 1 Job
    @GetMapping("/job/{jobId}")
    public ResponseEntity<CandidateListWrapper> getCandidatesByJob( // Trả về Wrapper
                                                                    @PathVariable Long jobId,
                                                                    @RequestParam(required = false, defaultValue = "0") Double minScore,
                                                                    @RequestParam(required = false, defaultValue = "0") Double minExperience,
                                                                    @RequestParam(required = false) String education) {

        // 1. Lấy danh sách DTO từng ứng viên từ Service
        List<CandidateListResponse> candidates = candidateService.getCandidatesByJobWithFilters(
                jobId, minScore, minExperience, education);

        // 2. Tính toán metadata
        long shortlistedCount = candidates.stream()
                .filter(c -> "SHORTLISTED".equals(c.getDecisionStatus()))
                .count();

        // 3. Đóng gói vào Wrapper
        CandidateListWrapper response = CandidateListWrapper.builder()
                .candidates(candidates)
                .shortlistedCount(shortlistedCount)
                .totalCount(candidates.size())
                .build();

        return ResponseEntity.ok(response);
    }

    // 3. Xem chi tiết 1 ứng viên
    @GetMapping("/{id}")
    @PreAuthorize("@candidateService.isOwner(#id, principal.username)")
    public ResponseEntity<CandidateResponse> getCandidateDetail(@PathVariable Long id) {
        CandidateResponse response = candidateService.getCandidateDetail(id);
        return ResponseEntity.ok(response);
    }

    // 4. Cập nhật quyết định (Shortlist/Reject)
    @PatchMapping("/{id}/decision")
    public ResponseEntity<CandidateResponse> updateDecision(
            @PathVariable Long id,
            @RequestBody DecisionRequest decisionRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        // 1. Lấy thông tin user hiện tại từ Security Context
        User currentUser = getCurrentUser(userDetails);

        // 2. Gọi service xử lý logic nghiệp vụ và nhận về DTO đã cập nhật
        CandidateResponse updatedCandidate = candidateService.updateDecision(id, decisionRequest, currentUser);

        // 3. Trả về 200 OK kèm theo dữ liệu mới nhất
        return ResponseEntity.ok(updatedCandidate);
    }

    // 5. Download file CV gốc
    @GetMapping("/{id}/download-cv")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long id) {
        // 1. Lấy thông tin file qua DTO
        FileDownloadDto downloadDto = candidateService.getDownloadInfo(id);

        if (downloadDto.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        Path path = Paths.get(downloadDto.getFilePath());
        Resource resource = new FileSystemResource(path);

        if (!resource.exists()) {
            log.error("File not found: {}", downloadDto.getFilePath());
            return ResponseEntity.notFound().build();
        }

        // 2. Xác định Content Type tự động và Encode tên file
        String contentType;
        try {
            contentType = Files.probeContentType(path);
            if (contentType == null) contentType = "application/octet-stream";
        } catch (IOException e) {
            contentType = "application/octet-stream";
        }

        // Encode tên file để tránh lỗi tiếng Việt/ký tự đặc biệt trên trình duyệt
        String encodedFileName = UriUtils.encode(downloadDto.getFileName(), StandardCharsets.UTF_8);

        // 3. Trả về Resource
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                .body(resource);
    }

    // 6. Export Excel/PDF
    @GetMapping("/job/{jobId}/export")
    public ResponseEntity<byte[]> exportCandidates(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "excel") String format) {

        try {
            byte[] data;
            String filename = "candidates-job-" + jobId;
            MediaType contentType;

            if ("pdf".equalsIgnoreCase(format)) {
                data = exportService.exportToPdf(jobId);
                contentType = MediaType.APPLICATION_PDF;
                filename += ".pdf";
            } else {
                data = exportService.exportToExcel(jobId);
                contentType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                filename += ".xlsx";
            }

            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(data);

        } catch (Exception e) {
            log.error("Export failed for job {}: {}", jobId, e.getMessage());
            // Trong REST, nếu lỗi ta trả về JSON thông báo lỗi thay vì trắng trang
            return ResponseEntity.internalServerError().build();
        }
    }

    // 7. Xóa ứng viên
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidate(@PathVariable Long id) {
        candidateService.deleteCandidate(id);

        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser(UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}