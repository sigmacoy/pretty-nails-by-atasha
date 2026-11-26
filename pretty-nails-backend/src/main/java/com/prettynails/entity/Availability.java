package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.GenerationTime;

import java.time.LocalDateTime;

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
    private String id;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    @Column(name = "start_time", nullable = false, length = 5)
    private String startTime = "08:00"; // HH:mm

    @Column(name = "end_time", nullable = false, length = 5)
    private String endTime = "22:00"; // HH:mm

    @Column(name = "max_slots", nullable = false)
    private Integer maxSlots = 4;

    @Column(name = "note", length = 1000)
    private String note; // Reason for blocking

    @CreationTimestamp
    @Generated(value = GenerationTime.INSERT)
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Generated(value = GenerationTime.ALWAYS)
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}