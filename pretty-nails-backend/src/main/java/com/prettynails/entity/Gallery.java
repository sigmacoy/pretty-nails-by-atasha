package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "gallery", indexes = {
        @Index(name = "idx_gallery_active_cat_created", columnList = "is_active, category, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gallery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "title", nullable = false, length = 200)
    @Builder.Default
    private String title = "";

    @Column(name = "description", length = 2000)
    @Builder.Default
    private String description = "";

    @Column(name = "image_url", nullable = false, length = 500)
    @Builder.Default
    private String imageUrl = "";

    @Column(name = "category", length = 20)
    @Builder.Default
    private String category = "";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}