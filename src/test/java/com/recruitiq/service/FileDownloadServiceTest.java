package com.recruitiq.service;

import com.recruitiq.dto.FileDownloadDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileDownloadServiceTest {

    @TempDir
    Path tempDir;

    private final FileDownloadService fileDownloadService = new FileDownloadService();

    @Test
    void buildFileDownloadResponse_shouldReturnNotFoundWhenDtoIsNull() {
        ResponseEntity<Resource> response = fileDownloadService.buildFileDownloadResponse(null);

        assertTrue(response.getStatusCode().is4xxClientError());
    }

    @Test
    void buildFileDownloadResponse_shouldReturnFileWhenItExists() throws Exception {
        Path file = tempDir.resolve("sample.pdf");
        Files.writeString(file, "pdf-content");

        ResponseEntity<Resource> response = fileDownloadService.buildFileDownloadResponse(
                FileDownloadDto.builder().filePath(file.toString()).fileName("sample.pdf").build());

        assertEquals(200, response.getStatusCodeValue());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().getContentDisposition().toString().contains("sample.pdf"));
    }
}
