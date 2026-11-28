package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "services", indexes = {
        @Index(name = "idx_services_active_cat_created", columnList = "is_active, category, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    @Builder.Default
    private String name = "";

    @Column(name = "category", nullable = false, length = 20)
    @Builder.Default
    private String category = "";

    @Column(name = "description", length = 2000)
    @Builder.Default
    private String description = "";

    @Column(name = "base_price", nullable = false)
    @Builder.Default
    private Integer basePrice = 0;

    @Column(name = "duration", nullable = false)
    @Builder.Default
    private Integer duration = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ServiceVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "service")
    @Builder.Default
    private List<BookingService> bookings = new ArrayList<>();
}