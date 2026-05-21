package com.recruitiq.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "score_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "skills_score")
    private Double skillsScore;

    @Column(name = "experience_score")
    private Double experienceScore;

    @Column(name = "education_score")
    private Double educationScore;

    @Column(name = "cert_score")
    private Double certScore;

    @Column(name = "soft_skills_score")
    private Double softSkillsScore;

    @Column(name = "reasoning_json", columnDefinition = "TEXT")
    private String reasoningJson;

    @CreationTimestamp
    @Column(name = "scored_at")
    private LocalDateTime scoredAt;
}
