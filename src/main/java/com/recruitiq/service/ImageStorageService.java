package com.recruitiq.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Logger logger = LoggerFactory.getLogger(ImageStorageService.class);

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/gif",
            "image/webp"
    );

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".png", ".jpg", ".jpeg", ".gif", ".webp");

    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:}")
    private String configuredCloudName;

    @Value("${cloudinary.api-key:}")
    private String configuredApiKey;

    @Value("${cloudinary.api-secret:}")
    private String configuredApiSecret;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.public-base-url:http://localhost:8080}")
    private String publicBaseUrl;

    @Value("${app.upload-base-path:/uploads}")
    private String uploadBasePath;

    public ImageStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String storeImageFile(MultipartFile file) {
        validateImageFile(file);

        if (shouldUseCloudinary()) {
            try {
                Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap("folder", "recruitiq", "resource_type", "image")
                );

                String publicUrl = (String) uploadResult.get("secure_url");
                if (publicUrl == null || publicUrl.isBlank()) {
                    throw new IllegalStateException("Cloudinary did not return a public URL");
                }

                logger.info("Uploaded image {} to Cloudinary", file.getOriginalFilename());
                return publicUrl;
            } catch (IOException e) {
                throw new RuntimeException("Unable to upload image file to Cloudinary", e);
            } catch (RuntimeException e) {
                logger.warn("Cloudinary upload failed, falling back to local storage: {}", e.getMessage());
                return storeImageLocally(file);
            }
        }

        logger.info("Cloudinary is not configured, storing image locally instead.");
        return storeImageLocally(file);
    }

    private boolean shouldUseCloudinary() {
        return cloudinary != null
                && StringUtils.hasText(configuredCloudName)
                && StringUtils.hasText(configuredApiKey)
                && StringUtils.hasText(configuredApiSecret);
    }

    private String storeImageLocally(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir, "images");
            Files.createDirectories(uploadPath);

            String extension = getExtension(file.getOriginalFilename());
            String uniqueFilename = UUID.randomUUID() + extension;
            Path targetPath = uploadPath.resolve(uniqueFilename);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            String normalizedBaseUrl = publicBaseUrl == null || publicBaseUrl.isBlank()
                    ? "http://localhost:8080"
                    : publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1) : publicBaseUrl;
            String normalizedBasePath = uploadBasePath == null || uploadBasePath.isBlank()
                    ? "/uploads"
                    : uploadBasePath.startsWith("/") ? uploadBasePath : "/" + uploadBasePath;
            String imageUrl = normalizedBaseUrl + normalizedBasePath + "/images/" + uniqueFilename;

            logger.info("Stored image {} locally at {}", file.getOriginalFilename(), targetPath);
            return imageUrl;
        } catch (IOException e) {
            throw new RuntimeException("Unable to store image file locally", e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename() == null
                ? ""
                : file.getOriginalFilename().toLowerCase();

        boolean validContentType = contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType);
        boolean validExtension = ALLOWED_EXTENSIONS.stream().anyMatch(originalFilename::endsWith);

        if (!validContentType && !validExtension) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
    }
}
