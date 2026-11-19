package com.prettynails.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Core user entity - customers and admins.
 * Implements UserDetails for Spring Security authentication.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private String id; // UUID primary key

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email; // Unique login identifier & notification target

    @Column(name = "email_verified")
    private LocalDateTime emailVerified; // Timestamp when email was verified (null = unverified)

    @Column(name = "password", length = 255)
    private String password; // BCrypt hashed password (null for OAuth-only users)

    @Column(name = "name", length = 100)
    private String name; // Full legal name

    @Column(name = "nickname", length = 100)
    private String nickname; // Display name for UI (defaults to name)

    @Column(name = "image", length = 500)
    private String image; // Profile picture URL (from OAuth or upload)

    @Column(name = "role", nullable = false, length = 20)
    private String role = "CUSTOMER"; // "CUSTOMER" or "ADMIN"

    @Column(name = "phone", length = 20)
    private String phone; // Contact phone number (optional)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Account creation timestamp

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Last profile update timestamp

    // Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Account> accounts; // Linked OAuth accounts (Google, Facebook)

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Session> sessions; // Active login sessions

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Booking> bookings; // All bookings made by this user

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private LoyaltyCard loyaltyCard; // Customer's loyalty card (one per user)

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomerNote> notes; // Notes written by this customer

    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomerNote> adminNotes; // Notes written by this admin about customers

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payment> payments; // All payments made by this user

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // Delegated to CustomUserDetailsService which uses UserAccountLockService
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return emailVerified != null; // Only verified emails can login
    }
}