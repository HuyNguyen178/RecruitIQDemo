package com.recruitiq.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImageStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void storeImageFileFallsBackToLocalStorageWhenCloudinaryIsUnavailable() throws Exception {
        ImageStorageService service = new ImageStorageService(null);
        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(service, "publicBaseUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(service, "uploadBasePath", "/uploads");
        ReflectionTestUtils.setField(service, "configuredCloudName", "");
        ReflectionTestUtils.setField(service, "configuredApiKey", "");
        ReflectionTestUtils.setField(service, "configuredApiSecret", "");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                "fake-image-data".getBytes(StandardCharsets.UTF_8)
        );

        String publicUrl = service.storeImageFile(file);

        assertThat(publicUrl).startsWith("http://localhost:8080/uploads/images/");
        assertThat(Files.exists(tempDir.resolve("images"))).isTrue();
    }

    @Test
    void storeImageFileReturnsCloudinaryPublicUrl() throws Exception {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);

        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/v123/avatar.png");
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(uploadResult);

        ImageStorageService service = new ImageStorageService(cloudinary);
        ReflectionTestUtils.setField(service, "configuredCloudName", "demo");
        ReflectionTestUtils.setField(service, "configuredApiKey", "demo");
        ReflectionTestUtils.setField(service, "configuredApiSecret", "demo");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                "fake-image-data".getBytes(StandardCharsets.UTF_8)
        );

        String publicUrl = service.storeImageFile(file);

        assertThat(publicUrl).isEqualTo("https://res.cloudinary.com/demo/image/upload/v123/avatar.png");
        verify(uploader).upload(any(byte[].class), anyMap());
    }
}
