package com.prettynails.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "accounts", indexes = {
        @Index(name = "idx_accounts_user_id", columnList = "user_id")
}, uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_account_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"refreshToken", "accessToken", "idToken"})
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", nullable = false)
    @Builder.Default
    private String userId = "";

    @Column(name = "type", nullable = false, length = 50)
    @Builder.Default
    private String type = "";

    @Column(name = "provider", nullable = false, length = 50)
    @Builder.Default
    private String provider = "";

    @Column(name = "provider_account_id", nullable = false, length = 255)
    @Builder.Default
    private String providerAccountId = "";

    @Column(name = "refresh_token", length = 4000)
    @Builder.Default
    @JsonIgnore
    private String refreshToken = "";

    @Column(name = "access_token", length = 4000)
    @Builder.Default
    @JsonIgnore
    private String accessToken = "";

    @Column(name = "expires_at")
    private Integer expiresAt;

    @Column(name = "token_type", length = 50)
    @Builder.Default
    private String tokenType = "";

    @Column(name = "scope", length = 255)
    @Builder.Default
    private String scope = "";

    @Column(name = "id_token", length = 4000)
    @Builder.Default
    @JsonIgnore
    private String idToken = "";

    @Column(name = "session_state", length = 255)
    @Builder.Default
    private String sessionState = "";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    @JsonIgnore
    private User user;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}