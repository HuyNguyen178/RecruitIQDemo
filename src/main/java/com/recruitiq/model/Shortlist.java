package com.recruitiq.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "shortlists")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shortlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_status", nullable = false)
    @Builder.Default
    private DecisionStatus decisionStatus = DecisionStatus.PENDING;

    @Column(name = "hr_notes", columnDefinition = "TEXT")
    private String hrNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private User decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    public enum DecisionStatus {
        PENDING, SHORTLISTED, ON_HOLD, REJECTED
    }
}
