package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

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
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "provider", nullable = false, length = 50)
    private String provider;

    @Column(name = "provider_account_id", nullable = false, length = 255)
    private String providerAccountId;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "expires_at")
    private Integer expiresAt;

    @Column(name = "token_type", length = 50)
    private String tokenType;

    @Column(name = "scope", length = 255)
    private String scope;

    @Column(name = "id_token", columnDefinition = "TEXT")
    private String idToken;

    @Column(name = "session_state", length = 255)
    private String sessionState;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}