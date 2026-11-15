package com.prettynails.repository;

import com.prettynails.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service, String> {

    Optional<Service> findByName(String name);

    List<Service> findByIsActiveTrueOrderByCreatedAtDesc();

    List<Service> findByIsActiveTrueAndCategoryOrderByCreatedAtDesc(String category);
}