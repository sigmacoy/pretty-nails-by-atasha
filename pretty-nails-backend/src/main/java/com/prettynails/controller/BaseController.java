package com.prettynails.controller;

import com.prettynails.entity.User;
import com.prettynails.security.CustomUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class BaseController {

    /**
     * Extracts the current authenticated user from the security context.
     *
     * @return the authenticated User entity
     * @throws AccessDeniedException if no authenticated user is found
     */
    protected User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("No authenticated user");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getUser();
        }
        if (principal instanceof User user) {
            return user;
        }
        throw new AccessDeniedException("Unexpected principal type: " + principal.getClass().getName());
    }
}