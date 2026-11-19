package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Salon availability for a specific date.
 * Controls how many booking slots are available per day.
 */
@Entity
@Table(name = "availabilities", uniqueConstraints = @UniqueConstraint(columnNames = {"date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Availability {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "date", nullable = false)
    private LocalDateTime date; // Date (time component ignored, represents the day)

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true; // true = accepting bookings, false = closed/fully booked

    @Column(name = "start_time", nullable = false, length = 5)
    private String startTime = "08:00"; // Opening time HH:mm

    @Column(name = "end_time", nullable = false, length = 5)
    private String endTime = "22:00"; // Closing time HH:mm

    @Column(name = "max_slots", nullable = false)
    private Integer maxSlots = 4; // Maximum concurrent bookings per time slot

    @Column(name = "note", columnDefinition = "TEXT")
    private String note; // Reason if closed: "Holiday", "Maintenance", "Fully Booked"

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When availability was set

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last modification
}