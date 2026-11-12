package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW

    @Column(name = "appointment_date", nullable = false)
    private LocalDateTime appointmentDate;

    @Column(name = "start_time", nullable = false, length = 5) // HH:mm format
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 5) // HH:mm format
    private String endTime;

    @Column(name = "total_price", nullable = false)
    private Integer totalPrice; // in centavos

    @Column(name = "downpayment", nullable = false)
    private Integer downpayment = 10000; // 100 PHP in centavos

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes; // Customer notes/inspiration

    @Column(name = "inspiration_img", length = 500)
    private String inspirationImg; // URL to uploaded image

    @Column(name = "redeem_loyalty_reward")
    @Builder.Default
    private Boolean redeemLoyaltyReward = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingService> services;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private Payment payment;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LoyaltyStamp> loyaltyStamps;
}