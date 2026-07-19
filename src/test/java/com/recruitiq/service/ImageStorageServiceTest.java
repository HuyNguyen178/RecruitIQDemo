package com.recruitiq.service;

import com.cloudinary.Cloudinary;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class ImageStorageServiceTest {

    @Mock
    private Cloudinary cloudinary;

    @InjectMocks
    private ImageStorageService imageStorageService;

    @Test
    void storeImageFile_shouldRejectInvalidImageType() {
        MockMultipartFile file = new MockMultipartFile("file", "image.txt", "text/plain", "data".getBytes());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> imageStorageService.storeImageFile(file));
        assertTrue(exception.getMessage().contains("Only image files"));
    }

    @Test
    void storeImageFile_shouldUseLocalStorageWhenCloudinaryIsNotConfigured() {
        ReflectionTestUtils.setField(imageStorageService, "configuredCloudName", "");
        ReflectionTestUtils.setField(imageStorageService, "configuredApiKey", "");
        ReflectionTestUtils.setField(imageStorageService, "configuredApiSecret", "");
        ReflectionTestUtils.setField(imageStorageService, "uploadDir", "./uploads");
        ReflectionTestUtils.setField(imageStorageService, "publicBaseUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(imageStorageService, "uploadBasePath", "/uploads");

        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "image-data".getBytes());
        String result = imageStorageService.storeImageFile(file);

        assertTrue(result.contains("/uploads/images/"));
    }
}
