package com.recruitiq.service;

import com.recruitiq.dto.CandidateResponse;
import com.recruitiq.dto.JobResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExportServiceTest {

    @Mock
    private JobService jobService;

    @Mock
    private CandidateService candidateService;

    @InjectMocks
    private ExportService exportService;

    @Test
    void exportToPdf_shouldCreatePdfBytes() throws IOException {
        JobResponse job = JobResponse.builder().id(1L).title("Developer").department("Engineering").build();
        CandidateResponse candidate = CandidateResponse.builder()
                .id(10L)
                .fullName("Alice")
                .originalFilename("alice.pdf")
                .totalScore(88.0)
                .recommendation("STRONG_MATCH")
                .decisionStatus("SHORTLISTED")
                .uploadedAt(LocalDateTime.of(2024, 1, 2, 3, 4))
                .build();

        when(jobService.getJobById(1L)).thenReturn(job);
        when(candidateService.getCandidatesByJob(1L)).thenReturn(List.of(candidate));

        byte[] result = exportService.exportToPdf(1L);

        assertNotNull(result);
        assertEquals(true, result.length > 0);
    }

    @Test
    void exportToExcel_shouldCreateExcelBytes() throws IOException {
        JobResponse job = JobResponse.builder().id(1L).title("Developer").department("Engineering").status("OPEN").build();
        CandidateResponse candidate = CandidateResponse.builder()
                .id(10L)
                .fullName("Alice")
                .email("alice@example.com")
                .totalScore(77.0)
                .recommendation("POTENTIAL_MATCH")
                .decisionStatus("PENDING")
                .hrNotes("")
                .processingStatus("COMPLETED")
                .uploadedAt(LocalDateTime.of(2024, 1, 2, 3, 4))
                .build();

        when(jobService.getJobById(1L)).thenReturn(job);
        when(candidateService.getCandidatesByJob(1L)).thenReturn(List.of(candidate));

        byte[] result = exportService.exportToExcel(1L);

        assertNotNull(result);
        assertEquals(true, result.length > 0);
    }
}
