package com.recruitiq.repository;

import com.recruitiq.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    @Query("SELECT c FROM Candidate c LEFT JOIN c.scoreRecord sr WHERE c.job.id = :jobId ORDER BY COALESCE(sr.totalScore, 0) DESC")
    List<Candidate> findByJobIdOrderByScoreRecordTotalScoreDesc(@Param("jobId") Long jobId);

    @Query("SELECT DISTINCT c FROM Candidate c " +
            "LEFT JOIN FETCH c.user u " +
            "LEFT JOIN FETCH c.scoreRecord sr " +
            "LEFT JOIN FETCH c.parsedProfile p " +
            "WHERE c.job.id = :jobId")
    List<Candidate> findByJobIdWithUserAndDetails(@Param("jobId") Long jobId);

    List<Candidate> findByJobId(Long jobId);


    @Query("SELECT c FROM Candidate c " +
            "LEFT JOIN c.scoreRecord s " +
            "LEFT JOIN c.parsedProfile p " +
            "WHERE c.job.id = :jobId " +
            "AND (:minScore IS NULL OR s.totalScore >= :minScore) " +
            "AND (:minExperience IS NULL OR p.yearsExperience >= :minExperience) " +
            "AND (:education IS NULL OR p.educationLevel = :education)")
    List<Candidate> findCandidatesWithFilters(
            @Param("jobId") Long jobId,
            @Param("minScore") Double minScore,
            @Param("minExperience") Double minExperience,
            @Param("education") String education);

    List<Candidate> findByUserEmailOrderByUploadedAtDesc(String email);
    boolean existsByJobIdAndUserEmail(Long jobId, String email);

    @Query("SELECT c FROM Candidate c LEFT JOIN FETCH c.job WHERE c.id = :id")
    java.util.Optional<Candidate> findByIdWithJob(@Param("id") Long id);

    List<Candidate> findByJobIdIn(List<Long> jobIds);
}
