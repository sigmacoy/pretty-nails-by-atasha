package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Audit log for admin actions - DEPRECATED (removed for simplicity).
 * Use application logs instead. Kept for reference only.
 */
@Deprecated
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_log_user_id", columnList = "user_id"),
        @Index(name = "idx_audit_log_action", columnList = "action"),
        @Index(name = "idx_audit_log_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_audit_log_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "user_id", length = 36)
    private String userId; // Admin who performed action

    @Column(name = "user_email", length = 255)
    private String userEmail; // Admin email (denormalized)

    @Column(name = "user_role", length = 20)
    private String userRole; // Admin role at time of action

    @Column(name = "action", nullable = false, length = 50)
    private String action; // Action: "CREATE", "UPDATE", "DELETE", "VERIFY_PAYMENT"

    @Column(name = "entity_type", length = 50)
    private String entityType; // Entity affected: "Booking", "User", "Service"

    @Column(name = "entity_id", length = 36)
    private String entityId; // ID of affected entity

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Human-readable description

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "JSONB")
    private Map<String, Object> metadata; // Extra context (old/new values)

    @Column(name = "ip_address", length = 45)
    private String ipAddress; // Admin's IP address

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent; // Admin's browser user agent

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When action occurred
}