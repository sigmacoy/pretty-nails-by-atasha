package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Nail service offered by the salon.
 * Variants (SMALL/MEDIUM/LONG) are stored as JSON in variantsJson for simplicity.
 */
@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name; // Service name: "Gel Manicure", "Nail Extension", etc.

    @Column(name = "category", nullable = false, length = 20)
    private String category; // Category: "GEL", "EXTENSION", "PEDICURE", "ADDON"

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Detailed description for customers

    @Column(name = "base_price", nullable = false)
    private Integer basePrice; // Base price in centavos (PHP * 100), e.g., 50000 = 500 PHP

    @Column(name = "duration", nullable = false)
    private Integer duration; // Duration in minutes (used for slot calculation)

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // Whether service is currently offered

    @Column(name = "variants_json", columnDefinition = "JSONB")
    private String variantsJson; // JSON array of variants: [{"name":"SMALL","price":50000},{"name":"MEDIUM","price":60000}]

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When service was added

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last modification

    // Relationships
    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingService> bookings; // Bookings that include this service
}