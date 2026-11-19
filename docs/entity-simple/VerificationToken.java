package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * One-time verification tokens for email verification and password reset.
 * Each token is single-use and expires.
 */
@Entity
@Table(name = "verification_tokens", uniqueConstraints = @UniqueConstraint(columnNames = {"identifier", "token"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "identifier", nullable = false, length = 255)
    private String identifier; // Email address or phone number being verified

    @Column(name = "token", nullable = false, unique = true, length = 255)
    private String token; // Random secure token sent to user

    @Column(name = "type", nullable = false, length = 20)
    private String type; // "EMAIL_VERIFICATION" or "PASSWORD_RESET"

    @Column(name = "expires", nullable = false)
    private LocalDateTime expires; // Token expiration (typically 24 hours)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When token was generated
}