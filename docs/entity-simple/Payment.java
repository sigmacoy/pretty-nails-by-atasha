package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Payment for a booking.
 * One payment per booking (downpayment + balance).
 */
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
    private String id; // UUID primary key

    @Column(name = "booking_id", nullable = false, unique = true)
    private String bookingId; // FK to bookings (one-to-one)

    @Column(name = "user_id", nullable = false)
    private String userId; // FK to users (denormalized for queries)

    @Column(name = "amount", nullable = false)
    private Integer amount; // Amount paid in centavos

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, PAID, REFUNDED, FORFEITED

    @Column(name = "method", nullable = false, length = 20)
    private String method; // Payment method: "GCASH", "CASH"

    @Column(name = "reference", length = 100)
    private String reference; // GCash reference number or cash receipt number

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt; // When admin verified the payment

    @Column(name = "verified_by", length = 36)
    private String verifiedBy; // Admin user ID who verified

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When payment record was created

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last status change

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Booking booking; // Associated booking

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user; // Customer who paid
}