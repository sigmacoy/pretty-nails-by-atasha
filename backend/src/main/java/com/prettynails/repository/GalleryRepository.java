package com.prettynails.repository;

import com.prettynails.entity.Gallery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GalleryRepository extends JpaRepository<Gallery, String> {

    List<Gallery> findByIsActiveTrueOrderByCreatedAtDesc();

    @Query("SELECT g FROM Gallery g WHERE g.isActive = true AND " +
           "(LOWER(g.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(g.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:category IS NULL OR :category = 'All' OR g.category = :category) " +
           "ORDER BY g.createdAt DESC")
    List<Gallery> searchActive(@Param("search") String search, @Param("category") String category);

    List<Gallery> findByIsActiveTrueAndCategoryOrderByCreatedAtDesc(String category);

    List<Gallery> findAllByOrderByCreatedAtDesc();
}