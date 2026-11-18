package com.prettynails.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prettynails.dto.AuthDtos.*;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.UserRepository;
import com.prettynails.security.JwtUtil;
import com.prettynails.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final LoyaltyCardRepository loyaltyCardRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final TimeProvider timeProvider;
    private final EmailService emailService;
    private final PasswordPolicyService passwordPolicyService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;
    private static final int VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
    private static final int RESET_TOKEN_EXPIRY_HOURS = 1;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmailIgnoreCase(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already registered");
        }

        // Validate password strength
        var passwordValidation = passwordPolicyService.validate(request.getPassword(), request.getEmail(), request.getName());
        if (!passwordValidation.isSuccess()) {
            throw new BadRequestException(passwordValidation.getMessage());
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        String passwordHistoryJson;
        try {
            passwordHistoryJson = new ObjectMapper().writeValueAsString(List.of(encodedPassword));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize password history", e);
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone())
                .password(encodedPassword)
                .role("CUSTOMER")
                .passwordChangedAt(timeProvider.localNow())
                .passwordHistory(passwordHistoryJson)
                .build();

        user = userRepository.save(user);

        // Create loyalty card
        com.prettynails.entity.LoyaltyCard loyaltyCard = com.prettynails.entity.LoyaltyCard.builder()
                .userId(user.getId())
                .stampCount(0)
                .expiresAt(timeProvider.localNow().plusYears(1))
                .build();
        loyaltyCardRepository.save(loyaltyCard);

        // Generate email verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(verificationToken);
        user.setEmailVerificationTokenExpiresAt(timeProvider.localNow().plusHours(VERIFICATION_TOKEN_EXPIRY_HOURS));
        userRepository.save(user);

        // Send verification email
        emailService.sendEmailVerification(user.getEmail(), user.getName(), verificationToken);

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        // Check if account is locked
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(timeProvider.localNow())) {
            throw new BadRequestException("Account temporarily locked due to too many failed attempts. Try again later.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );

            // Reset failed attempts on successful login
            if (user.getFailedLoginAttempts() != null && user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                user.setLockedUntil(null);
                userRepository.save(user);
            }

        } catch (Exception e) {
            // Increment failed attempts
            int attempts = (user.getFailedLoginAttempts() != null) ? user.getFailedLoginAttempts() + 1 : 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(timeProvider.localNow().plusMinutes(LOCKOUT_DURATION_MINUTES));
            }

            userRepository.save(user);
            throw new BadRequestException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
    }

    @Transactional
    public MessageResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmailVerificationToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification token"));

        if (user.getEmailVerificationTokenExpiresAt() == null ||
                user.getEmailVerificationTokenExpiresAt().isBefore(timeProvider.localNow())) {
            throw new BadRequestException("Verification token has expired");
        }

        if (user.getEmailVerified() != null) {
            throw new BadRequestException("Email already verified");
        }

        user.setEmailVerified(timeProvider.localNow());
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiresAt(null);
        userRepository.save(user);

        return new MessageResponse("Email verified successfully");
    }

    @Transactional
    public MessageResponse resendVerificationEmail(ResendVerificationRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        if (user.getEmailVerified() != null) {
            throw new BadRequestException("Email already verified");
        }

        String verificationToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(verificationToken);
        user.setEmailVerificationTokenExpiresAt(timeProvider.localNow().plusHours(VERIFICATION_TOKEN_EXPIRY_HOURS));
        userRepository.save(user);

        emailService.sendEmailVerification(user.getEmail(), user.getName(), verificationToken);

        return new MessageResponse("Verification email sent");
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetTokenExpiresAt(timeProvider.localNow().plusHours(RESET_TOKEN_EXPIRY_HOURS));
        userRepository.save(user);

        emailService.sendPasswordReset(user.getEmail(), user.getName(), resetToken);

        return new MessageResponse("Password reset email sent");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByPasswordResetToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (user.getPasswordResetTokenExpiresAt() == null ||
                user.getPasswordResetTokenExpiresAt().isBefore(timeProvider.localNow())) {
            throw new BadRequestException("Reset token has expired");
        }

        // Validate password strength
        var passwordValidation = passwordPolicyService.validate(request.getNewPassword(), user.getEmail(), user.getName());
        if (!passwordValidation.isSuccess()) {
            throw new BadRequestException(passwordValidation.getMessage());
        }

        // Check password history
        List<String> passwordHistory = parsePasswordHistory(user.getPasswordHistory());
        if (passwordPolicyService.isPasswordReused(request.getNewPassword(), passwordHistory, passwordEncoder)) {
            throw new BadRequestException("Password was recently used. Please choose a different password.");
        }

        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPassword(encodedPassword);
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        user.setPasswordChangedAt(timeProvider.localNow());
        user.setPasswordHistory(updatePasswordHistory(passwordHistory, encodedPassword));

        userRepository.save(user);

        return new MessageResponse("Password reset successfully");
    }

    public UserDto getCurrentUser(User user) {
        return mapToUserDto(user);
    }

    @Transactional
    public UserDto updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getName() != null) {
            String trimmedName = request.getName().trim();
            if (trimmedName.isEmpty()) {
                throw new BadRequestException("Name cannot be empty");
            }
            user.setName(trimmedName);
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname().trim());
        }

        if (request.getImage() != null) {
            user.setImage(request.getImage().trim());
        }

        user = userRepository.save(user);
        return mapToUserDto(user);
    }

    @Transactional
    public UserDto updateProfile(User user, UpdateProfileRequest request) {
        return updateProfile(user.getId(), request);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getCurrentPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        // Validate password strength
        var passwordValidation = passwordPolicyService.validate(request.getNewPassword(), user.getEmail(), user.getName());
        if (!passwordValidation.isSuccess()) {
            throw new BadRequestException(passwordValidation.getMessage());
        }

        // Check password history
        List<String> passwordHistory = parsePasswordHistory(user.getPasswordHistory());
        if (passwordPolicyService.isPasswordReused(request.getNewPassword(), passwordHistory, passwordEncoder)) {
            throw new BadRequestException("Password was recently used. Please choose a different password.");
        }

        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPassword(encodedPassword);
        user.setPasswordChangedAt(timeProvider.localNow());
        user.setPasswordHistory(updatePasswordHistory(passwordHistory, encodedPassword));
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        changePassword(user.getId(), request);
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .nickname(user.getNickname())
                .phone(user.getPhone())
                .image(user.getImage())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Parses password history from JSON string to List of hashes.
     * Most recent hash is first in the list.
     */
    private List<String> parsePasswordHistory(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return new ObjectMapper().readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * Updates password history by adding new hash at the beginning
     * and keeping only the most recent historySize entries.
     */
    private String updatePasswordHistory(List<String> history, String newHash) {
        List<String> updated = new ArrayList<>(history);
        updated.add(0, newHash);
        // Keep only the most recent historySize entries
        int maxSize = passwordPolicyService.getHistorySize();
        if (updated.size() > maxSize) {
            updated = updated.subList(0, maxSize);
        }
        try {
            return new ObjectMapper().writeValueAsString(updated);
        } catch (Exception e) {
            return "[]";
        }
    }
}