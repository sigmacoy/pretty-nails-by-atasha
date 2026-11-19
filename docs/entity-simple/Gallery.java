package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Gallery/portfolio image showing nail art work.
 * Displayed to customers for inspiration.
 */
@Entity
@Table(name = "gallery")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gallery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "title", nullable = false, length = 200)
    private String title; // Image title: "French Tip Gel", "Floral Nail Art"

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Optional description

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl; // Full URL to image (stored in S3/cloudinary)

    @Column(name = "category", length = 20)
    private String category; // Category: "GEL", "EXTENSION", "PEDICURE", "NAIL_ART"

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // Whether to show in gallery

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When uploaded

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last modification
}