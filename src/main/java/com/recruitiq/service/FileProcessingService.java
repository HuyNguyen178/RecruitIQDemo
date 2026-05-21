package com.recruitiq.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileProcessingService {

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".pdf", ".docx");

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

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

    public void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
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

    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
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

    public String storeFile(MultipartFile file) {
        try {
            validateFile(file);

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String fileName = UUID.randomUUID().toString() + getExtension(file.getOriginalFilename());
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return filePath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Error when save CV", e);
        }
    }
}
