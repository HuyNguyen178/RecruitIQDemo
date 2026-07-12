package com.recruitiq.repository;

import com.recruitiq.model.Shortlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShortlistRepository extends JpaRepository<Shortlist, Long> {
    Optional<Shortlist> findByCandidateId(Long candidateId);
}
