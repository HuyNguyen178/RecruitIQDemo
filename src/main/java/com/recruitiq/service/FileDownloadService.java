package com.recruitiq.service;

import com.recruitiq.dto.FileDownloadDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
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

    private final RestTemplate restTemplate;

    public FileDownloadService() {
        this(new RestTemplate());
    }

    public FileDownloadService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Builds a secure file download response with proper content type detection and filename encoding.
     *
     * @param downloadDto File metadata (path and filename)
     * @return ResponseEntity with file resource or 404 if file not found
     */
    public ResponseEntity<Resource> buildFileDownloadResponse(FileDownloadDto downloadDto) {
        if (downloadDto == null || downloadDto.getFilePath() == null || downloadDto.getFilePath().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        String filePath = downloadDto.getFilePath();
        if (isRemoteUrl(filePath)) {
            return buildRemoteFileResponse(filePath, downloadDto.getFileName());
        }

        Path path = Paths.get(filePath);
        Resource resource = new FileSystemResource(path);

        if (!resource.exists()) {
            log.warn("File not found on disk: {}", filePath);
            return ResponseEntity.notFound().build();
        }

        String contentType = detectContentType(path);
        String encodedFileName = UriUtils.encode(downloadDto.getFileName(), StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                .body(resource);
    }

    private ResponseEntity<Resource> buildRemoteFileResponse(String filePath, String fileName) {
        try {
            byte[] content = restTemplate.getForObject(filePath, byte[].class);
            if (content == null || content.length == 0) {
                return ResponseEntity.notFound().build();
            }

            String contentType = detectContentType(fileName);
            String encodedFileName = UriUtils.encode(fileName, StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                    .body(new ByteArrayResource(content));
        } catch (RestClientException e) {
            log.warn("Failed to download remote file {}: {}", filePath, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    private boolean isRemoteUrl(String filePath) {
        return filePath.startsWith("http://") || filePath.startsWith("https://");
    }

    private String detectContentType(Path path) {
        try {
            String contentType = Files.probeContentType(path);
            return contentType != null ? contentType : "application/octet-stream";
        } catch (IOException e) {
            log.debug("Could not detect content type for {}: {}", path, e.getMessage());
            return "application/octet-stream";
        }
    }

    private String detectContentType(String fileName) {
        String lowerFileName = fileName == null ? "" : fileName.toLowerCase();
        if (lowerFileName.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF_VALUE;
        }
        if (lowerFileName.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        return MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }
}
