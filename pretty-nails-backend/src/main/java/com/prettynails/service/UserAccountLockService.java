package com.prettynails.service;

import com.prettynails.entity.User;
import com.prettynails.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for checking user account lock status using Manila timezone.
 * Centralizes the lock check logic to ensure consistent timezone handling.
 */
@Service
@RequiredArgsConstructor
public class UserAccountLockService {

    private final TimeProvider timeProvider;

    /**
     * Checks if the user's account is not locked based on Manila timezone.
     *
     * @param user the user to check
     * @return true if account is not locked, false if locked
     */
    public boolean isAccountNonLocked(User user) {
        LocalDateTime lockedUntil = user.getLockedUntil();
        if (lockedUntil != null && lockedUntil.isAfter(timeProvider.localNow())) {
            return false;
        }
        return true;
    }

    /**
     * Checks if the user's account is currently locked based on Manila timezone.
     *
     * @param user the user to check
     * @return true if account is locked, false if not locked
     */
    public boolean isAccountLocked(User user) {
        return !isAccountNonLocked(user);
    }
}