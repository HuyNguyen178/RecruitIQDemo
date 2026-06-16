package com.recruitiq.repository;

import com.recruitiq.model.Job;
import com.recruitiq.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    @Query("SELECT j FROM Job j JOIN FETCH j.createdBy LEFT JOIN FETCH j.city WHERE j.id = :id")
    java.util.Optional<Job> findByIdWithCreatedBy(@Param("id") Long id);

    @Query("SELECT DISTINCT j FROM Job j JOIN FETCH j.createdBy LEFT JOIN FETCH j.city ORDER BY j.createdAt DESC")
    List<Job> findAllWithCreatedByOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT j FROM Job j JOIN FETCH j.createdBy LEFT JOIN FETCH j.city WHERE j.createdBy = :user ORDER BY j.createdAt DESC")
    List<Job> findByCreatedByWithCreatedByOrderByCreatedAtDesc(@Param("user") User user);

    List<Job> findByStatusOrderByCreatedAtDesc(Job.JobStatus status);

    List<Job> findByStatusAndDeadlineBefore(Job.JobStatus status, LocalDate date);
}
