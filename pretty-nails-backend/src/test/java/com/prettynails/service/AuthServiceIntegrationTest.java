package com.prettynails.service;

import com.prettynails.dto.AuthDtos.*;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.IntegrationTestBase;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.UserRepository;
import com.prettynails.security.JwtUtil;
import com.prettynails.util.TimeProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceIntegrationTest extends IntegrationTestBase {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoyaltyCardRepository loyaltyCardRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TimeProvider timeProvider;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private Authentication authentication;

    @MockBean
    private EmailService emailService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("Password123!")
                .build();

        loginRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("Password123!")
                .build();

        lenient().doNothing().when(emailService).sendEmailVerification(anyString(), anyString(), anyString());
        lenient().doNothing().when(emailService).sendPasswordReset(anyString(), anyString(), anyString());
    }

    @Test
    void register_whenEmailNotExists_shouldCreateUserAndReturnAuthResponse() {
        // When
        AuthResponse response = authService.register(registerRequest);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isNotNull();
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
        assertThat(response.getUser().getName()).isEqualTo("Test User");
        assertThat(response.getUser().getRole()).isEqualTo("CUSTOMER");

        // Verify user saved with encoded password
        User savedUser = userRepository.findByEmailIgnoreCase("test@example.com").orElseThrow();
        assertThat(savedUser.getPassword()).isNotEqualTo("Password123!");
        assertThat(passwordEncoder.matches("Password123!", savedUser.getPassword())).isTrue();

        // Verify loyalty card created
        var loyaltyCard = loyaltyCardRepository.findByUserId(savedUser.getId()).orElseThrow();
        assertThat(loyaltyCard.getStampCount()).isEqualTo(0);
        assertThat(loyaltyCard.getExpiresAt()).isAfter(timeProvider.localNow());

        // Verify verification token generated
        assertThat(savedUser.getEmailVerificationToken()).isNotNull();
        assertThat(savedUser.getEmailVerificationTokenExpiresAt()).isAfter(timeProvider.localNow());

        // Verify email sent
        verify(emailService).sendEmailVerification(eq("test@example.com"), eq("Test User"), anyString());
    }

    @Test
    void register_whenEmailExists_shouldThrowBadRequestException() {
        // Given - create existing user
        User existingUser = User.builder()
                .name("Existing User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();
        userRepository.save(existingUser);

        // When/Then
        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email already registered");
    }

    @Test
    void login_whenCredentialsValid_shouldReturnAuthResponse() {
        // Given - create user with known password
        String encodedPassword = passwordEncoder.encode("password123");
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password(encodedPassword)
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(user);

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isNotNull();
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void login_whenAccountLocked_shouldThrowBadRequestException() {
        // Given - create user with locked account
        String encodedPassword = passwordEncoder.encode("password123");
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password(encodedPassword)
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .lockedUntil(timeProvider.localNow().plusMinutes(10))
                .failedLoginAttempts(5)
                .build();
        user = userRepository.save(user);

        // When/Then
        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Account temporarily locked");
    }

    @Test
    void login_whenFailedAttemptsReachMax_shouldLockAccount() {
        // Given - create user
        String encodedPassword = passwordEncoder.encode("password123");
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password(encodedPassword)
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        // Simulate 5 failed attempts
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new RuntimeException("Bad credentials"));

        // When/Then - 5 failed attempts should lock account
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessage("Invalid email or password");
        }

        // Verify account is locked
        User lockedUser = userRepository.findByEmailIgnoreCase("test@example.com").orElseThrow();
        assertThat(lockedUser.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(lockedUser.getLockedUntil()).isNotNull();
        assertThat(lockedUser.getLockedUntil()).isAfter(timeProvider.localNow());
    }

    @Test
    void login_whenSuccessfulAfterFailedAttempts_shouldResetFailedAttempts() {
        // Given - create user with some failed attempts (but NOT locked)
        String encodedPassword = passwordEncoder.encode("Password123!");
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password(encodedPassword)
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .failedLoginAttempts(3)
                .lockedUntil(null) // Not locked, just has failed attempts
                .build();
        user = userRepository.save(user);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(user);

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertThat(response).isNotNull();

        // Verify failed attempts reset
        User resetUser = userRepository.findByEmailIgnoreCase("test@example.com").orElseThrow();
        assertThat(resetUser.getFailedLoginAttempts()).isEqualTo(0);
        assertThat(resetUser.getLockedUntil()).isNull();
    }

    @Test
    void verifyEmail_whenValidToken_shouldVerifyEmail() {
        // Given - create user with verification token
        String token = "verification-token-123";
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerificationToken(token)
                .emailVerificationTokenExpiresAt(timeProvider.localNow().plusHours(24))
                .build();
        user = userRepository.save(user);

        // When
        MessageResponse response = authService.verifyEmail(new VerifyEmailRequest(token));

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMessage()).isEqualTo("Email verified successfully");

        // Verify email verified
        User verifiedUser = userRepository.findByEmailIgnoreCase("test@example.com").orElseThrow();
        assertThat(verifiedUser.getEmailVerified()).isNotNull();
        assertThat(verifiedUser.getEmailVerificationToken()).isNull();
        assertThat(verifiedUser.getEmailVerificationTokenExpiresAt()).isNull();
    }

    @Test
    void verifyEmail_whenTokenExpired_shouldThrowBadRequestException() {
        // Given - create user with expired token
        String token = "expired-token-123";
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerificationToken(token)
                .emailVerificationTokenExpiresAt(timeProvider.localNow().minusHours(1))
                .build();
        user = userRepository.save(user);

        // When/Then
        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest(token)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Verification token has expired");
    }

    @Test
    void verifyEmail_whenAlreadyVerified_shouldThrowBadRequestException() {
        // Given - create user already verified
        String token = "verification-token-123";
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(timeProvider.localNow().minusDays(1))
                .emailVerificationToken(token)
                .emailVerificationTokenExpiresAt(timeProvider.localNow().plusHours(24))
                .build();
        user = userRepository.save(user);

        // When/Then
        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest(token)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email already verified");
    }

    @Test
    void resendVerificationEmail_whenNotVerified_shouldSendNewToken() {
        // Given - create user without verification
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();
        user = userRepository.save(user);

        // When
        MessageResponse response = authService.resendVerificationEmail(
                new ResendVerificationRequest("test@example.com"));

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMessage()).isEqualTo("Verification email sent");

        // Verify new token generated
        User updatedUser = userRepository.findByEmailIgnoreCase("test@example.com").orElseThrow();
        assertThat(updatedUser.getEmailVerificationToken()).isNotNull();
        assertThat(updatedUser.getEmailVerificationTokenExpiresAt()).isAfter(timeProvider.localNow());

        // Verify email sent
        verify(emailService).sendEmailVerification(eq("test@example.com"), eq("Test User"), anyString());
    }

    @Test
    void forgotPassword_whenEmailExists_shouldSendResetEmail() {
        // Given - create user
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        // When
        MessageResponse response = authService.forgotPassword(
                new ForgotPasswordRequest("test@example.com"));

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMessage()).isEqualTo("Password reset email sent");

        // Verify reset token generated
        User updatedUser = userRepository.findByEmailIgnoreCase("test@example.com").orElseThrow();
        assertThat(updatedUser.getPasswordResetToken()).isNotNull();
        assertThat(updatedUser.getPasswordResetTokenExpiresAt()).isAfter(timeProvider.localNow());

        // Verify email sent
        verify(emailService).sendPasswordReset(eq("test@example.com"), eq("Test User"), anyString());
    }

    @Test
    void resetPassword_whenValidToken_shouldResetPassword() {
        // Given - create user with reset token
        String token = "reset-token-123";
        String oldPassword = passwordEncoder.encode("OldPassword123!");
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password(oldPassword)
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .passwordResetToken(token)
                .passwordResetTokenExpiresAt(timeProvider.localNow().plusHours(1))
                .build();
        user = userRepository.save(user);

        // When
        MessageResponse response = authService.resetPassword(
                new ResetPasswordRequest(token, "NewPassword456!"));

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMessage()).isEqualTo("Password reset successfully");

        // Verify password changed
        User updatedUser = userRepository.findByEmailIgnoreCase("test@example.com").orElseThrow();
        assertThat(passwordEncoder.matches("NewPassword456!", updatedUser.getPassword())).isTrue();
        assertThat(updatedUser.getPasswordResetToken()).isNull();
        assertThat(updatedUser.getPasswordResetTokenExpiresAt()).isNull();
    }

    @Test
    void resetPassword_whenTokenExpired_shouldThrowBadRequestException() {
        // Given - create user with expired reset token
        String token = "expired-reset-token";
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .passwordResetToken(token)
                .passwordResetTokenExpiresAt(timeProvider.localNow().minusHours(1))
                .build();
        user = userRepository.save(user);

        // When/Then
        assertThatThrownBy(() -> authService.resetPassword(
                new ResetPasswordRequest(token, "newPassword456")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Reset token has expired");
    }

    @Test
    void resetPassword_whenNewPasswordTooShort_shouldThrowBadRequestException() {
        // Given - create user with reset token
        String token = "reset-token-123";
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .passwordResetToken(token)
                .passwordResetTokenExpiresAt(timeProvider.localNow().plusHours(1))
                .build();
        user = userRepository.save(user);

        // When/Then
        assertThatThrownBy(() -> authService.resetPassword(
                new ResetPasswordRequest(token, "12345")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Password must be at least 8 characters long");
    }

    @Test
    void changePassword_whenCurrentPasswordMatches_shouldEncodeNewPasswordAndSave() {
        // Given - create user
        String encodedPassword = passwordEncoder.encode("OldPassword123!");
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password(encodedPassword)
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        // When
        authService.changePassword(user.getId(),
                new ChangePasswordRequest("OldPassword123!", "NewPassword456!"));

        // Then
        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("NewPassword456!", updatedUser.getPassword())).isTrue();
    }

    @Test
    void changePassword_whenCurrentPasswordIncorrect_shouldThrowBadRequestException() {
        // Given - create user
        String encodedPassword = passwordEncoder.encode("OldPassword123!");
        User user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password(encodedPassword)
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        User savedUser = userRepository.save(user);

        // When/Then
        assertThatThrownBy(() -> authService.changePassword(savedUser.getId(),
                new ChangePasswordRequest("wrongPassword", "NewPassword456!")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Current password is incorrect");
    }
}