package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Application settings - key/value store for configurable values.
 * Admin can update these without code changes.
 */
@Entity
@Table(name = "settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Setting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "key", nullable = false, unique = true, length = 100)
    private String key; // Setting key: "downpayment_amount", "max_slots_per_day", "loyalty_stamps_required"

    @Column(name = "value", nullable = false, columnDefinition = "TEXT")
    private String value; // Setting value as string (parsed by application)

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Human-readable description

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When setting was created

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last modification
}