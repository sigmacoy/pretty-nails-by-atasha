package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "booking_id", nullable = false, unique = true)
    private String bookingId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "amount", nullable = false)
    private Integer amount; // in centavos

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, PAID, REFUNDED, FORFEITED

    @Column(name = "method", nullable = false, length = 20)
    private String method; // GCASH

    @Column(name = "reference", length = 100)
    private String reference; // GCash reference number

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verified_by", length = 255)
    private String verifiedBy; // Admin user ID

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;
}