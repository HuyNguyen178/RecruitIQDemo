package com.recruitiq.repository;

import com.recruitiq.model.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {

    List<City> findByActiveTrueOrderByNameAsc();

    Optional<City> findByIdAndActiveTrue(Long id);
}
