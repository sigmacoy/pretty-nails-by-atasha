package com.prettynails.security;

import com.prettynails.entity.User;
import com.prettynails.service.UserAccountLockService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Wrapper for User entity that delegates account lock checks to UserAccountLockService
 * to ensure Manila timezone is used for lock timestamp comparisons.
 */
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;
    private final UserAccountLockService userAccountLockService;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return userAccountLockService.isAccountNonLocked(user);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.getEmailVerified() != null;
    }

    /**
     * Returns the underlying User entity.
     */
    public User getUser() {
        return user;
    }
}