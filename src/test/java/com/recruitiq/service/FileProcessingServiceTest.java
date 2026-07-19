package com.recruitiq.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileProcessingServiceTest {

    private final FileProcessingService fileProcessingService = new FileProcessingService();

    @TempDir
    Path tempDir;

    @Test
    void validateFile_shouldAcceptPdfAndDocx() {
        MockMultipartFile pdf = new MockMultipartFile("file", "cv.pdf", "application/pdf", "pdf-content".getBytes());
        MockMultipartFile docx = new MockMultipartFile("file", "cv.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx-content".getBytes());

        assertDoesNotThrow(() -> fileProcessingService.validateFile(pdf));
        assertDoesNotThrow(() -> fileProcessingService.validateFile(docx));
    }

    @Test
    void validateFile_shouldRejectUnsupportedType() {
        MockMultipartFile file = new MockMultipartFile("file", "cv.txt", "text/plain", "text".getBytes());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> fileProcessingService.validateFile(file));
        assertTrue(exception.getMessage().contains("Only PDF and DOCX"));
    }

    @Test
    void saveUploadedFile_shouldPersistFileAndReturnPath() throws Exception {
        Path original = tempDir.resolve("uploads");
        Files.createDirectories(original);

        ReflectionTestUtils.setField(fileProcessingService, "uploadDir", original.toString());

        MockMultipartFile file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "pdf-content".getBytes());
        String savedPath = fileProcessingService.saveUploadedFile(file, 7L);

        assertTrue(Files.exists(Path.of(savedPath)));
        assertTrue(savedPath.contains("7"));
    }
}
