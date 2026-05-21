package com.recruitiq.repository;

import com.recruitiq.model.ParsedProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParsedProfileRepository extends JpaRepository<ParsedProfile, Long> {

    Optional<ParsedProfile> findByCandidateId(Long candidateId);
}
