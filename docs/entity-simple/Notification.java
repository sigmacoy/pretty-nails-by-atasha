package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * User notifications - DEPRECATED (removed for simplicity).
 * Use real-time SSE only, no persistence needed. Kept for reference only.
 */
@Deprecated
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_user_id", columnList = "user_id"),
        @Index(name = "idx_notification_type", columnList = "type"),
        @Index(name = "idx_notification_read", columnList = "read"),
        @Index(name = "idx_notification_created_at", columnList = "created_at"),
        @Index(name = "idx_notification_user_read", columnList = "user_id, read")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id; // UUID primary key

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId; // Recipient user

    @Column(name = "type", nullable = false, length = 50)
    private String type; // Type: "BOOKING_CONFIRMED", "PAYMENT_VERIFIED", "REMINDER"

    @Column(name = "title", nullable = false, length = 200)
    private String title; // Notification title

    @Column(name = "message", columnDefinition = "TEXT")
    private String message; // Full message

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data", columnDefinition = "JSONB")
    private Map<String, Object> data; // Extra data (booking_id, etc.)

    @Column(name = "action_url", length = 500)
    private String actionUrl; // Deep link for tap action

    @Column(name = "priority")
    private Integer priority = 2; // 1=low, 2=normal, 3=high

    @Column(name = "read", nullable = false)
    private Boolean read = false; // Whether user has read it

    @Column(name = "read_at")
    private LocalDateTime readAt; // When read

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When sent
}