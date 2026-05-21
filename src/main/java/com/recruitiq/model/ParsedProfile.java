package com.recruitiq.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "parsed_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Column(name = "profile_json", columnDefinition = "TEXT")
    private String profileJson;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "skills_array", columnDefinition = "TEXT")
    private String skillsArray;

    @Column(name = "years_experience")
    private Double yearsExperience;

    @Enumerated(EnumType.STRING)
    @Column(name = "education_level")
    private Job.EducationLevel educationLevel;

    @Column(name = "parsed_at")
    @CreationTimestamp
    private LocalDateTime parsedAt;
}
