package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Admin notes about a customer (preferences, allergies, VIP status, etc.).
 * Written by admins, visible to admins only.
 */
@Entity
@Table(name = "customer_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerNote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "user_id", nullable = false)
    private String userId; // FK to users (the customer this note is about)

    @Column(name = "admin_id", nullable = false)
    private String adminId; // FK to users (admin who wrote the note)

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content; // Note content

    @Column(name = "nickname", length = 100)
    private String nickname; // Customer's nickname at time of note (for context)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When note was written

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last edit

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user; // Customer

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User admin; // Admin author
}