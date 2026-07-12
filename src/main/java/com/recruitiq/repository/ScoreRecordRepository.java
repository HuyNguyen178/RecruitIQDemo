package com.recruitiq.repository;

import com.recruitiq.model.ScoreRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScoreRecordRepository extends JpaRepository<ScoreRecord, Long> {
}
