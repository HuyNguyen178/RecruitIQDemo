package com.recruitiq.service;

import com.recruitiq.dto.*;
import com.recruitiq.mapper.CandidateMapper;
import com.recruitiq.model.*;
import com.recruitiq.repository.CandidateRepository;
import com.recruitiq.repository.JobRepository;
import com.recruitiq.repository.ShortlistRepository;
import com.recruitiq.repository.UserRepository;
import com.recruitiq.service.ai.AiProcessingService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final ShortlistRepository shortlistRepository;
    private final FileProcessingService fileProcessingService;
    private final AiProcessingService aiProcessingService;
    private final CandidateMapper candidateMapper;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<CandidateResponse> uploadCvFiles(Long jobId, List<MultipartFile> files, User uploadedBy) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found with id: " + jobId));

        List<Candidate> candidates = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            try {
                fileProcessingService.validateFile(file);

                String filePath = fileProcessingService.saveUploadedFile(file, jobId);
                String rawText = fileProcessingService.extractTextFromFile(file);

                Candidate.CandidateBuilder candidateBuilder = Candidate.builder()
                        .job(job)
                        .originalFilename(file.getOriginalFilename())
                        .filePath(filePath)
                        .rawText(rawText)
                        .processingStatus(Candidate.ProcessingStatus.PENDING);

                if (uploadedBy != null) {
                    candidateBuilder.user(uploadedBy);
                }

                Candidate candidate = candidateBuilder.build();

                candidate = candidateRepository.save(candidate);

                // Khởi tạo bản ghi Shortlist mặc định cho mỗi ứng viên
                Shortlist shortlist = Shortlist.builder()
                        .candidate(candidate)
                        .job(job)
                        .decisionStatus(Shortlist.DecisionStatus.PENDING)
                        .build();
                shortlistRepository.save(shortlist);

                candidates.add(candidate);
                log.info("Uploaded CV: {} for job: {}", file.getOriginalFilename(), jobId);

            } catch (Exception e) {
                log.error("Failed to process file {}: {}", file.getOriginalFilename(), e.getMessage());

                // Lưu bản ghi lỗi để người dùng biết file nào upload thất bại
                Candidate.CandidateBuilder errorBuilder = Candidate.builder()
                        .job(job)
                        .originalFilename(file.getOriginalFilename())
                        .processingStatus(Candidate.ProcessingStatus.ERROR)
                        .errorMessage(e.getMessage());

                if (uploadedBy != null) {
                    errorBuilder.user(uploadedBy);
                }

                candidates.add(candidateRepository.save(errorBuilder.build()));
            }
        }

        // Kích hoạt xử lý AI bất đồng bộ
        candidates.stream()
                .filter(c -> c.getProcessingStatus() == Candidate.ProcessingStatus.PENDING)
                .forEach(c -> aiProcessingService.processCandidate(c.getId()));

        return candidates.stream()
                .map(candidateMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CandidateResponse getCandidateDetail(Long id) {
        return candidateRepository.findById(id)
                .map(candidateMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Candidate not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<CandidateResponse> getCandidatesByJob(Long jobId) {
        // Dựa vào query method bạn đã viết ở Repository
        return candidateRepository.findByJobIdOrderByScoreRecordTotalScoreDesc(jobId)
                .stream()
                .map(candidateMapper::toResponse)
                .toList();
    }

    @Transactional
    public CandidateResponse updateDecision(Long candidateId, DecisionRequest request, User user) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new EntityNotFoundException("Candidate not found: " + candidateId));

        Shortlist shortlist = shortlistRepository.findByCandidateId(candidateId)
                .orElseGet(() -> Shortlist.builder()
                        .candidate(candidate)
                        .job(candidate.getJob())
                        .build());

        shortlist.setDecisionStatus(request.getDecisionStatus());
        shortlist.setHrNotes(request.getHrNotes());
        shortlist.setDecidedBy(user);
        shortlist.setDecidedAt(LocalDateTime.now());

        shortlistRepository.save(shortlist);

        // Refresh để lấy dữ liệu shortlist mới nhất khi map sang Response
        return candidateMapper.toResponse(candidate);
    }

    @Transactional
    public void deleteCandidate(Long id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Candidate not found: " + id));

        if (candidate.getFilePath() != null) {
            fileProcessingService.deleteFile(candidate.getFilePath());
        }

        candidateRepository.delete(candidate);
    }

    @Transactional
    public List<CandidateListResponse> getCandidatesByJobWithFilters(
            Long jobId, Double minScore, Double minExperience, String education) {

        // 1. Gọi Repository để lấy dữ liệu đã được lọc từ SQL
        List<Candidate> candidates = candidateRepository.findCandidatesWithFilters(
                jobId, minScore, minExperience, education);

        // 2. Chuyển đổi
        return candidates.stream()
                .map(candidateMapper::toListResponse)
                .collect(Collectors.toList());
    }

    public FileDownloadDto getDownloadInfo(Long id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Candidate not found: " + id));

        return FileDownloadDto.builder()
                .filePath(candidate.getFilePath())
                .fileName(candidate.getOriginalFilename())
                .build();
    }

    @Transactional
    public CandidateResponse selfApply(Long jobId, MultipartFile file, String email) {
        // 1. Validate file
        fileProcessingService.validateFile(file);

        // 2. Kiểm tra xem ứng viên đã nộp hồ sơ cho công việc này chưa
        if (candidateRepository.existsByJobIdAndUserEmail(jobId, email)) {
            throw new IllegalArgumentException("You have already submitted a CV for this job. Please withdraw the old one in your Application History if you want to submit a new one!");
        }

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found"));

        // 2. Lấy User từ email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // 3. Lưu file vật lý và trích xuất văn bản
        String filePath = fileProcessingService.storeFile(file);
        String rawText;
        try {
            rawText = fileProcessingService.extractTextFromFile(file);
        } catch (Exception e) {
            throw new RuntimeException("Error extracting text from CV file: " + e.getMessage(), e);
        }

        // 4. Tạo Candidate (Gắn thêm user_id và rawText vào)
        Candidate candidate = Candidate.builder()
                .job(job)
                .user(user)
                .originalFilename(file.getOriginalFilename())
                .filePath(filePath)
                .rawText(rawText)
                .processingStatus(Candidate.ProcessingStatus.PENDING)
                .build();

        Candidate saved = candidateRepository.save(candidate);

        // Khởi tạo bản ghi Shortlist mặc định cho mỗi ứng viên tự nộp hồ sơ
        Shortlist shortlist = Shortlist.builder()
                .candidate(saved)
                .job(job)
                .decisionStatus(Shortlist.DecisionStatus.PENDING)
                .build();
        shortlistRepository.save(shortlist);

        return candidateMapper.toResponse(saved);
    }

    public void processAsync(Long candidateId) {
        aiProcessingService.processCandidateAsync(candidateId);
    }

    //Dashboard
    @Transactional(readOnly = true)
    public List<CandidateResponse> getMyApplications(String email) {
        return candidateRepository.findByUserEmailOrderByUploadedAtDesc(email)
                .stream()
                .map(candidateMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCandidateStats(String email) {
        List<Candidate> myApps = candidateRepository.findByUserEmailOrderByUploadedAtDesc(email);

        long totalApplied = myApps.size();
        long shortlisted = myApps.stream()
                .filter(c -> c.getShortlist() != null &&
                        "SHORTLISTED".equals(c.getShortlist().getDecisionStatus().name()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalApplied", totalApplied);
        stats.put("shortlistedCount", shortlisted);
        stats.put("recentApplications", myApps.stream().limit(5)
                .map(candidateMapper::toResponse).collect(Collectors.toList()));

        return stats;
    }

    // --- CHO DASHBOARD HR OFFICER ---
    @Transactional(readOnly = true)
    public Map<String, Object> getHRDashboardStats() {
        long totalCandidates = candidateRepository.count();
        long pendingAiManual = candidateRepository.findAll().stream()
                .filter(c -> "PENDING".equals(c.getProcessingStatus().name()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalResumes", totalCandidates);
        stats.put("pendingProcessing", pendingAiManual);

        List<CandidateResponse> topTalents = candidateRepository.findAll().stream()
                .filter(c -> c.getScoreRecord() != null)
                .sorted((c1, c2) -> Double.compare(c2.getScoreRecord().getTotalScore(), c1.getScoreRecord().getTotalScore()))
                .limit(5)
                .map(candidateMapper::toResponse)
                .collect(Collectors.toList());

        stats.put("topTalents", topTalents);
        return stats;
    }

    // --- CHO DASHBOARD ADMIN ---
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminGlobalStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalJobs", jobRepository.count());
        stats.put("totalCandidates", candidateRepository.count());

        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long newCVsThisWeek = candidateRepository.findAll().stream()
                .filter(c -> c.getUploadedAt().isAfter(sevenDaysAgo))
                .count();
        stats.put("newCVsThisWeek", newCVsThisWeek);

        return stats;
    }

    @Transactional(readOnly = true)
    public boolean isOwner(Long candidateId, String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        // Admin and HR_OFFICER have full access
        if (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.HR_OFFICER) {
            return true;
        }

        // Candidates can only access their own profiles
        Candidate candidate = candidateRepository.findById(candidateId).orElse(null);
        if (candidate == null) return false;

        return candidate.getUser() != null && candidate.getUser().getEmail().equals(email);
    }
}