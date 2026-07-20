package com.recruitiq.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.uploader.Uploader;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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

    @Test
    void saveUploadedFile_shouldUploadToCloudinaryWhenConfigured() throws Exception {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of("secure_url", "https://res.cloudinary.com/demo/raw/upload/test.pdf"));

        FileProcessingService cloudinaryService = new FileProcessingService(cloudinary);
        ReflectionTestUtils.setField(cloudinaryService, "configuredCloudName", "demo");
        ReflectionTestUtils.setField(cloudinaryService, "configuredApiKey", "test-key");
        ReflectionTestUtils.setField(cloudinaryService, "configuredApiSecret", "test-secret");

        MockMultipartFile file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "pdf-content".getBytes());
        String savedUrl = cloudinaryService.saveUploadedFile(file, 7L);

        assertEquals("https://res.cloudinary.com/demo/raw/upload/test.pdf", savedUrl);
    }

    @Test
    void springContext_shouldInjectCloudinaryBeanIntoService() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.registerBean(Cloudinary.class, () -> new Cloudinary(Map.of(
                    "cloud_name", "demo",
                    "api_key", "test-key",
                    "api_secret", "test-secret"
            )));
            context.registerBean(FileProcessingService.class);
            context.refresh();

            FileProcessingService service = context.getBean(FileProcessingService.class);
            assertNotNull(ReflectionTestUtils.getField(service, "cloudinary"));
        }
    }
}
