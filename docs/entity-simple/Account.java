package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * OAuth2 account linking (Google, Facebook, etc.).
 * One user can have multiple linked accounts.
 */
@Entity
@Table(name = "accounts", uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_account_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "user_id", nullable = false)
    private String userId; // FK to users table - which user owns this OAuth account

    @Column(name = "type", nullable = false, length = 50)
    private String type; // OAuth2 type: "oauth2" (only type we support)

    @Column(name = "provider", nullable = false, length = 50)
    private String provider; // OAuth provider: "google", "facebook", "github"

    @Column(name = "provider_account_id", nullable = false, length = 255)
    private String providerAccountId; // Unique ID from the provider (e.g., Google's sub claim)

    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken; // Short-lived token for API calls to provider

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken; // Long-lived token to get new access tokens

    @Column(name = "expires_at")
    private Integer expiresAt; // Unix timestamp when access_token expires (seconds since epoch)

    @Column(name = "scope", length = 255)
    private String scope; // Granted OAuth scopes (e.g., "openid email profile")

    @Column(name = "id_token", columnDefinition = "TEXT")
    private String idToken; // OpenID Connect ID token (JWT with user info)

    @Column(name = "session_state", length = 255)
    private String sessionState; // OAuth2 session state for logout coordination

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user; // Navigation to owning user

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // When this account link was created

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last time tokens were refreshed
}