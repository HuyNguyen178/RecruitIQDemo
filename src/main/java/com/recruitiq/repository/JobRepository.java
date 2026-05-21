package com.recruitiq.repository;

import com.recruitiq.model.Job;
import com.recruitiq.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByCreatedByOrderByCreatedAtDesc(User createdBy);

    List<Job> findAllByOrderByCreatedAtDesc();

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.candidates WHERE j.id = :id")
    java.util.Optional<Job> findByIdWithCandidates(@Param("id") Long id);

    List<Job> findByStatusOrderByCreatedAtDesc(Job.JobStatus status);
}
