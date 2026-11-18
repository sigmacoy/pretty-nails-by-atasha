package com.prettynails.config;

import com.prettynails.entity.User;
import com.prettynails.security.CustomUserDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Implementation of AuditorAware for JPA auditing.
 * Extracts the current authenticated user's ID from Spring Security context.
 */
@Component
@Slf4j
public class AuditorAwareImpl implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof CustomUserDetails customUserDetails) {
            return Optional.ofNullable(customUserDetails.getUser().getId());
        }

        if (principal instanceof User user) {
            return Optional.ofNullable(user.getId());
        }

        // For anonymous or other authentication types
        if ("anonymousUser".equals(principal)) {
            return Optional.empty();
        }

        log.debug("Unable to extract auditor from principal: {}", principal.getClass().getName());
        return Optional.empty();
    }
}