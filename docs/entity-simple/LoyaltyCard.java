package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Customer loyalty card - earn stamps, get free service.
 * One card per customer. 10 stamps = 1 free basic service.
 */
@Entity
@Table(name = "loyalty_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "user_id", nullable = false, unique = true)
    private String userId; // FK to users (one card per user)

    @Column(name = "stamp_count", nullable = false)
    private Integer stampCount = 0; // Current stamps earned (0-10)

    @Column(name = "last_stamp_at")
    private LocalDateTime lastStampAt; // When last stamp was earned

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt; // Card expires 12 months after last stamp

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When card was issued

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last stamp added

    // Relationships
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user; // Card owner

    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LoyaltyStamp> stamps; // History of stamps earned
}