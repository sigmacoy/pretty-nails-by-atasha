package com.prettynails.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prettynails.dto.AuthDtos.*;
import com.prettynails.entity.User;
import com.prettynails.IntegrationTestBase;
import com.prettynails.repository.UserRepository;
import com.prettynails.security.JwtUtil;
import com.prettynails.service.AuthService;
import com.prettynails.service.EmailService;
import com.prettynails.util.TimeProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.yml")
@Transactional
class AuthControllerIntegrationTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TimeProvider timeProvider;

    @MockBean
    private AuthService authService;

    @MockBean
    private EmailService emailService;

    private User testUser;
    private String validToken;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password(passwordEncoder.encode("password123"))
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        testUser = userRepository.save(testUser);

        // Generate valid JWT token
        validToken = jwtUtil.generateToken(testUser);

        lenient().doNothing().when(emailService).sendEmailVerification(anyString(), anyString(), anyString());
        lenient().doNothing().when(emailService).sendPasswordReset(anyString(), anyString(), anyString());
    }

    @Test
    void register_whenValidRequest_shouldReturnAuthResponse() throws Exception {
        // Given
        RegisterRequest request = RegisterRequest.builder()
                .name("New User")
                .email("newuser@example.com")
                .phone("0987654321")
                .password("password123")
                .build();

        AuthResponse mockResponse = AuthResponse.builder()
                .token("jwt-token")
                .user(UserDto.builder()
                        .id("user-123")
                        .name("New User")
                        .email("newuser@example.com")
                        .role("CUSTOMER")
                        .build())
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        // When/Then
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.user.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.user.name").value("New User"));

        verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    void register_whenEmailExists_shouldReturnBadRequest() throws Exception {
        // Given
        RegisterRequest request = RegisterRequest.builder()
                .name("New User")
                .email("test@example.com") // Existing email
                .phone("0987654321")
                .password("password123")
                .build();

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new com.prettynails.exception.BadRequestException("Email already registered"));

        // When/Then
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void login_whenValidCredentials_shouldReturnAuthResponse() throws Exception {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        AuthResponse mockResponse = AuthResponse.builder()
                .token("jwt-token")
                .user(UserDto.builder()
                        .id(testUser.getId())
                        .name("Test User")
                        .email("test@example.com")
                        .role("CUSTOMER")
                        .build())
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(mockResponse);

        // When/Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"));

        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    void getCurrentUser_whenAuthenticated_shouldReturnUserDto() throws Exception {
        // Given
        UserDto userDto = UserDto.builder()
                .id(testUser.getId())
                .name("Test User")
                .email("test@example.com")
                .role("CUSTOMER")
                .nickname("Test")
                .phone("1234567890")
                .image("https://example.com/avatar.jpg")
                .build();

        when(authService.getCurrentUser(any(User.class))).thenReturn(userDto);

        // When/Then
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testUser.getId()))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.name").value("Test User"));

        verify(authService).getCurrentUser(any(User.class));
    }

    @Test
    void getCurrentUser_whenNotAuthenticated_shouldReturnUnauthorized() throws Exception {
        // When/Then
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfile_whenAuthenticated_shouldReturnUpdatedUserDto() throws Exception {
        // Given
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name("Updated Name")
                .phone("+639999999999")
                .nickname("Updated")
                .image("https://example.com/new.jpg")
                .build();

        UserDto updatedDto = UserDto.builder()
                .id(testUser.getId())
                .name("Updated Name")
                .email("test@example.com")
                .role("CUSTOMER")
                .nickname("Updated")
                .phone("+639999999999")
                .image("https://example.com/new.jpg")
                .build();

        when(authService.updateProfile(anyString(), any(UpdateProfileRequest.class)))
                .thenReturn(updatedDto);

        // When/Then
        mockMvc.perform(put("/api/auth/profile")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.phone").value("+639999999999"))
                .andExpect(jsonPath("$.nickname").value("Updated"))
                .andExpect(jsonPath("$.image").value("https://example.com/new.jpg"));

        verify(authService).updateProfile(eq(testUser.getId()), any(UpdateProfileRequest.class));
    }

    @Test
    void changePassword_whenAuthenticatedAndValid_shouldReturnOk() throws Exception {
        // Given
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("newPassword456")
                .build();

        doNothing().when(authService).changePassword(anyString(), any(ChangePasswordRequest.class));

        // When/Then
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        verify(authService).changePassword(eq(testUser.getId()), any(ChangePasswordRequest.class));
    }

    @Test
    void verifyEmail_whenValidToken_shouldReturnSuccess() throws Exception {
        // Given
        VerifyEmailRequest request = VerifyEmailRequest.builder()
                .token("valid-token-123")
                .build();

        MessageResponse response = new MessageResponse("Email verified successfully");
        when(authService.verifyEmail(any(VerifyEmailRequest.class))).thenReturn(response);

        // When/Then
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verified successfully"));

        verify(authService).verifyEmail(any(VerifyEmailRequest.class));
    }

    @Test
    void resendVerification_whenValidEmail_shouldReturnSuccess() throws Exception {
        // Given
        ResendVerificationRequest request = ResendVerificationRequest.builder()
                .email("test@example.com")
                .build();

        MessageResponse response = new MessageResponse("Verification email sent");
        when(authService.resendVerificationEmail(any(ResendVerificationRequest.class))).thenReturn(response);

        // When/Then
        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Verification email sent"));

        verify(authService).resendVerificationEmail(any(ResendVerificationRequest.class));
    }

    @Test
    void forgotPassword_whenValidEmail_shouldReturnSuccess() throws Exception {
        // Given
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("test@example.com")
                .build();

        MessageResponse response = new MessageResponse("Password reset email sent");
        when(authService.forgotPassword(any(ForgotPasswordRequest.class))).thenReturn(response);

        // When/Then
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset email sent"));

        verify(authService).forgotPassword(any(ForgotPasswordRequest.class));
    }

    @Test
    void resetPassword_whenValidToken_shouldReturnSuccess() throws Exception {
        // Given
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("valid-reset-token")
                .newPassword("newPassword456")
                .build();

        MessageResponse response = new MessageResponse("Password reset successfully");
        when(authService.resetPassword(any(ResetPasswordRequest.class))).thenReturn(response);

        // When/Then
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully"));

        verify(authService).resetPassword(any(ResetPasswordRequest.class));
    }
}