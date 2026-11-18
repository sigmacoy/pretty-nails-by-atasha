package com.prettynails.controller;

import com.prettynails.dto.AuthDtos.*;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadRequestException("User not authenticated");
        }
        if (authentication.getPrincipal() instanceof User user) {
            return user;
        }
        throw new BadRequestException("User not authenticated");
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserDto getCurrentUserEndpoint() {
        User user = getCurrentUser();
        return authService.getCurrentUser(user);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = getCurrentUser();
        UserDto updated = authService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        User user = getCurrentUser();
        authService.changePassword(user.getId(), request);
        return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
    }

    // ===== Email Verification =====

    @PostMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        MessageResponse response = authService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        MessageResponse response = authService.resendVerificationEmail(request);
        return ResponseEntity.ok(response);
    }

    // ===== Password Reset =====

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        MessageResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        MessageResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }
}

