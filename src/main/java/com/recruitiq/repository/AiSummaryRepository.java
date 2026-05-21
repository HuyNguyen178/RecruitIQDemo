package com.recruitiq.repository;

import com.recruitiq.model.AiSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiSummaryRepository extends JpaRepository<AiSummary, Long> {

    Optional<AiSummary> findByCandidateId(Long candidateId);
}
