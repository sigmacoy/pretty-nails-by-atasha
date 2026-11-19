package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Customer appointment booking.
 * One booking = one time slot with one or more services.
 */
@Entity
@Table(name = "bookings", uniqueConstraints = @UniqueConstraint(name = "uk_booking_slot_active", columnNames = {"appointment_date", "start_time"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "user_id", nullable = false)
    private String userId; // FK to users - customer who made the booking

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW

    @Column(name = "appointment_date", nullable = false)
    private LocalDateTime appointmentDate; // Date of appointment (time component ignored)

    @Column(name = "start_time", nullable = false, length = 5)
    private String startTime; // Start time HH:mm format (e.g., "14:30")

    @Column(name = "end_time", nullable = false, length = 5)
    private String endTime; // End time HH:mm format (e.g., "15:30")

    @Column(name = "total_price", nullable = false)
    private Integer totalPrice; // Total in centavos (sum of all services)

    @Column(name = "downpayment", nullable = false)
    private Integer downpayment = 10000; // Required downpayment in centavos (default 100 PHP)

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes; // Customer notes / nail inspiration description

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When booking was created

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last status change

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user; // Customer who booked

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingService> services; // Services included in this booking

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private Payment payment; // Payment for this booking

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LoyaltyStamp> loyaltyStamps; // Stamps earned from this booking
}