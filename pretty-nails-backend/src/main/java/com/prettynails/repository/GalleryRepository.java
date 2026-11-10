package com.prettynails.repository;

import com.prettynails.entity.Gallery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GalleryRepository extends JpaRepository<Gallery, String> {

    @Query("SELECT g FROM Gallery g WHERE g.isActive = true " +
            "AND (:search IS NULL OR LOWER(g.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(g.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:category IS NULL OR g.category = :category) " +
            "ORDER BY g.createdAt DESC")
    List<Gallery> searchActive(String search, String category);
}