package com.recruitiq.service;

import com.recruitiq.dto.FileDownloadDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Service for handling secure file downloads (e.g., CVs).
 * Centralizes file access logic to prevent duplication and ensure consistent security.
 */
@Slf4j
@Service
public class FileDownloadService {

    /**
     * Builds a secure file download response with proper content type detection and filename encoding.
     *
     * @param downloadDto File metadata (path and filename)
     * @return ResponseEntity with file resource or 404 if file not found
     */
    public ResponseEntity<Resource> buildFileDownloadResponse(FileDownloadDto downloadDto) {
        // Validate that file path exists
        if (downloadDto == null || downloadDto.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        Path path = Paths.get(downloadDto.getFilePath());
        Resource resource = new FileSystemResource(path);

        // Check if file actually exists on disk
        if (!resource.exists()) {
            log.warn("File not found on disk: {}", downloadDto.getFilePath());
            return ResponseEntity.notFound().build();
        }

        // Detect content type (PDF, Word, etc.)
        String contentType = detectContentType(path);

        // Encode filename to handle special characters and Vietnamese diacritics
        String encodedFileName = UriUtils.encode(downloadDto.getFileName(), StandardCharsets.UTF_8);

        // Build response with proper headers
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                .body(resource);
    }

    /**
     * Safely detects MIME type of file.
     * Falls back to octet-stream if detection fails.
     */
    private String detectContentType(Path path) {
        try {
            String contentType = Files.probeContentType(path);
            return contentType != null ? contentType : "application/octet-stream";
        } catch (IOException e) {
            log.debug("Could not detect content type for {}: {}", path, e.getMessage());
            return "application/octet-stream";
        }
    }
}
