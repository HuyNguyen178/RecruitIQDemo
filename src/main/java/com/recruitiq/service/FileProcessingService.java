package com.recruitiq.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class FileProcessingService {

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".pdf", ".docx");

    private static final Pattern CLOUDINARY_PUBLIC_ID_PATTERN = Pattern.compile("^(?:v\\d+/)?(.+?)(?:\\.[^.]+)?$");

    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:}")
    private String configuredCloudName;

    @Value("${cloudinary.api-key:}")
    private String configuredApiKey;

    @Value("${cloudinary.api-secret:}")
    private String configuredApiSecret;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    public FileProcessingService() {
        this(null);
    }

    public FileProcessingService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getInputStream().readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    public String extractTextFromDocx(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream();
             XWPFDocument document = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    public String extractTextFromFile(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename().toLowerCase()
                : "";

        if (contentType != null && contentType.contains("pdf") || originalFilename.endsWith(".pdf")) {
            return extractTextFromPdf(file);
        } else if ((contentType != null && contentType.contains("wordprocessingml")) || originalFilename.endsWith(".docx")) {
            return extractTextFromDocx(file);
        } else {
            throw new IllegalArgumentException("Unsupported file type: " + contentType);
        }
    }

    public String saveUploadedFile(MultipartFile file, Long jobId) throws IOException {
        validateFile(file);

        if (shouldUseCloudinary()) {
            try {
                Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "recruitiq/cvs",
                                "resource_type", "raw"
                        )
                );

                String publicUrl = (String) uploadResult.get("secure_url");
                if (publicUrl == null || publicUrl.isBlank()) {
                    throw new IllegalStateException("Cloudinary did not return a public URL");
                }

                log.info("Uploaded CV {} to Cloudinary", file.getOriginalFilename());
                return publicUrl;
            } catch (RuntimeException e) {
                log.warn("Cloudinary upload failed, falling back to local storage: {}", e.getMessage());
                return storeFileLocally(file, jobId);
            }
        }

        return storeFileLocally(file, jobId);
    }

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename().toLowerCase()
                : "";

        boolean validContentType = contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType);
        boolean validExtension = ALLOWED_EXTENSIONS.stream().anyMatch(originalFilename::endsWith);

        if (!validContentType && !validExtension) {
            throw new IllegalArgumentException("Only PDF and DOCX files are allowed. Got: " + contentType);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    private boolean shouldUseCloudinary() {
        return cloudinary != null
                && StringUtils.hasText(configuredCloudName)
                && StringUtils.hasText(configuredApiKey)
                && StringUtils.hasText(configuredApiSecret);
    }

    private String storeFileLocally(MultipartFile file, Long jobId) throws IOException {
        Path jobDir = Paths.get(uploadDir, String.valueOf(jobId));
        Files.createDirectories(jobDir);

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID() + extension;
        Path targetPath = jobDir.resolve(uniqueFilename);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        log.info("Saved file {} to {}", originalFilename, targetPath);

        return targetPath.toString();
    }

    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }

        if (isCloudinaryUrl(filePath)) {
            deleteFromCloudinary(filePath);
            return;
        }

        try {
            Path path = Paths.get(filePath);
            boolean deleted = Files.deleteIfExists(path);
            if (deleted) {
                log.info("Successfully deleted file: {}", filePath);
            } else {
                log.warn("File does not exist, could not delete: {}", filePath);
            }
        } catch (IOException e) {
            log.error("Failed to delete file at {}: {}", filePath, e.getMessage());
        }
    }

    private boolean isCloudinaryUrl(String filePath) {
        return filePath.startsWith("http://") || filePath.startsWith("https://");
    }

    private void deleteFromCloudinary(String filePath) {
        if (cloudinary == null) {
            log.warn("Cloudinary client is not available, skipping delete for {}", filePath);
            return;
        }

        try {
            String publicId = extractPublicId(filePath);
            if (publicId == null || publicId.isBlank()) {
                log.warn("Could not determine Cloudinary public ID from {}", filePath);
                return;
            }

            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw"));
            log.info("Deleted CV from Cloudinary: {}", filePath);
        } catch (Exception e) {
            log.error("Failed to delete CV from Cloudinary {}: {}", filePath, e.getMessage());
        }
    }

    private String extractPublicId(String filePath) {
        try {
            String path = URI.create(filePath).getPath();
            String uploadPath = path.substring(path.indexOf("/upload/") + "/upload/".length());
            Matcher matcher = CLOUDINARY_PUBLIC_ID_PATTERN.matcher(uploadPath);
            if (matcher.find()) {
                return matcher.group(1);
            }
        } catch (Exception e) {
            log.warn("Unable to extract Cloudinary public ID from {}: {}", filePath, e.getMessage());
        }

        return null;
    }
}
