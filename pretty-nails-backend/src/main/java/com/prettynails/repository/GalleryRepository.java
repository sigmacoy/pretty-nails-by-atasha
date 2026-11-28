package com.prettynails.repository;

import com.prettynails.entity.Gallery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GalleryRepository extends JpaRepository<Gallery, String> {

    @Query("SELECT g FROM Gallery g WHERE g.isActive = true " +
            "AND (:search IS NULL OR LOWER(g.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(g.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (:category IS NULL OR g.category = :category) " +
            "ORDER BY g.createdAt DESC")
    List<Gallery> searchActive(String search, String category);

    @Query("SELECT g FROM Gallery g WHERE g.isActive = true " +
            "AND (:search IS NULL OR LOWER(g.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(g.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (:category IS NULL OR g.category = :category) " +
            "ORDER BY g.createdAt DESC")
    Page<Gallery> searchActive(String search, String category, Pageable pageable);
}