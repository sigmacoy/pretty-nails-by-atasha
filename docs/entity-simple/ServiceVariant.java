package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Service variant (size/length options) - DEPRECATED.
 * Variants are now stored as JSON in Service.variantsJson for simplicity.
 * This entity is kept for migration reference only.
 */
@Deprecated
@Entity
@Table(name = "service_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "service_id", nullable = false)
    private String serviceId; // FK to services

    @Column(name = "name", nullable = false, length = 20)
    private String name; // Variant name: "SMALL", "MEDIUM", "LONG"

    @Column(name = "price", nullable = false)
    private Integer price; // Price in centavos for this variant

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Service service; // Parent service

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}