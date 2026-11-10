package com.prettynails.repository;

import com.prettynails.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service, String> {

    Optional<Service> findByName(String name);

    List<Service> findByCategory(String category);

    List<Service> findByIsActiveTrueOrderByCreatedAtDesc();

    List<Service> findByIsActiveTrueAndCategoryOrderByCreatedAtDesc(String category);

    @Query("SELECT s FROM Service s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Service> searchByName(@Param("search") String search);

    @Query("SELECT s FROM Service s WHERE s.category IN ('GEL', 'EXTENSION', 'PEDICURE') AND s.isActive = true")
    List<Service> findNailSetServices();
}