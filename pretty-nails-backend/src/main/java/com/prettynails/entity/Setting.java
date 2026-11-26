package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.GenerationTime;

import java.time.LocalDateTime;

@Entity
@Table(name = "settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Setting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "\"key\"", nullable = false, unique = true, length = 100)
    private String key;

    @Column(name = "\"value\"", nullable = false, length = 4000)
    private String value;

    @Column(name = "description", length = 2000)
    private String description;

    @CreationTimestamp
    @Generated(value = GenerationTime.INSERT)
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Generated(value = GenerationTime.ALWAYS)
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}