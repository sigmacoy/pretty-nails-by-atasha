package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Single stamp earned on a loyalty card.
 * Tracks which booking earned the stamp for audit trail.
 */
@Entity
@Table(name = "loyalty_stamps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyStamp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "card_id", nullable = false)
    private String cardId; // FK to loyalty_cards

    @Column(name = "booking_id")
    private String bookingId; // FK to bookings (which booking earned this stamp)

    @Column(name = "earned_at", nullable = false)
    private LocalDateTime earnedAt; // When stamp was earned

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", referencedColumnName = "id", insertable = false, updatable = false)
    private LoyaltyCard card; // Parent loyalty card

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Booking booking; // Booking that earned the stamp

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Record creation

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last update
}