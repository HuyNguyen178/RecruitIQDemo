package com.recruitiq.repository;

import com.recruitiq.model.Shortlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShortlistRepository extends JpaRepository<Shortlist, Long> {

    List<Shortlist> findByJobIdAndDecisionStatus(Long jobId, Shortlist.DecisionStatus decisionStatus);

    Optional<Shortlist> findByCandidateId(Long candidateId);

    List<Shortlist> findByJobId(Long jobId);
}
