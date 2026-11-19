package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Junction entity linking Booking to Service (many-to-many with extra fields).
 * Stores the price at time of booking for historical accuracy.
 */
@Entity
@Table(name = "booking_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingService {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "booking_id", nullable = false)
    private String bookingId; // FK to bookings

    @Column(name = "service_id", nullable = false)
    private String serviceId; // FK to services

    @Column(name = "variant_name", length = 20)
    private String variantName; // Selected variant: "SMALL", "MEDIUM", "LONG" (null if no variants)

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1; // How many of this service (usually 1)

    @Column(name = "price", nullable = false)
    private Integer price; // Price in centavos at time of booking (may differ from current service price)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Booking booking; // Parent booking

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Service service; // Service details

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When added to booking

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last modification
}