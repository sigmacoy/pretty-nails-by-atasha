package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_stamps", indexes = {
        @Index(name = "idx_loyalty_stamps_card_id", columnList = "card_id"),
        @Index(name = "idx_loyalty_stamps_booking_id", columnList = "booking_id"),
        @Index(name = "idx_loyalty_stamps_earned_at", columnList = "earned_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyStamp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "card_id", nullable = false)
    private String cardId;

    @Column(name = "booking_id")
    private String bookingId;

    @Column(name = "earned_at", nullable = false)
    private LocalDateTime earnedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private StampSource source;

    @Column(name = "amount")
    private Integer amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", referencedColumnName = "id", insertable = false, updatable = false)
    private LoyaltyCard card;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Booking booking;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum StampSource {
        SERVICE,
        AMOUNT,
        REWARD_REDEMPTION
    }
}