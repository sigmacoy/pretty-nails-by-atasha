package com.prettynails.service;

import com.prettynails.dto.AuthDtos.*;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.UserRepository;
import com.prettynails.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoyaltyCardRepository loyaltyCardRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("password123")
                .build();

        loginRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        testUser = User.builder()
                .id("user-123")
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void register_whenEmailNotExists_shouldCreateUserAndReturnAuthResponse() {
        when(userRepository.findByEmailIgnoreCase(registerRequest.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(loyaltyCardRepository.save(any())).thenReturn(null);
        when(jwtUtil.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
        verify(userRepository).save(any(User.class));
        verify(loyaltyCardRepository).save(any());
    }

    @Test
    void register_whenEmailExists_shouldThrowBadRequestException() {
        when(userRepository.findByEmailIgnoreCase(registerRequest.getEmail())).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email already registered");
    }

    @Test
    void login_whenCredentialsValid_shouldReturnAuthResponse() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmailIgnoreCase(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateToken(testUser)).thenReturn("jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void login_whenUserNotFound_shouldThrowResourceNotFoundException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmailIgnoreCase(loginRequest.getEmail())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with email");
    }

    @Test
    void getCurrentUser_shouldReturnUserDto() {
        UserDto userDto = authService.getCurrentUser(testUser);

        assertThat(userDto).isNotNull();
        assertThat(userDto.getId()).isEqualTo("user-123");
        assertThat(userDto.getName()).isEqualTo("Test User");
        assertThat(userDto.getEmail()).isEqualTo("test@example.com");
        assertThat(userDto.getRole()).isEqualTo("CUSTOMER");
    }

    @Test
    void updateProfile_whenUserExists_shouldUpdateFieldsAndReturnUserDto() {
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name("Updated Name")
                .phone("+639123456789")
                .nickname("New Nick")
                .image("https://example.com/avatar.png")
                .build();

        UserDto result = authService.updateProfile("user-123", request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Updated Name");
        assertThat(result.getPhone()).isEqualTo("+639123456789");
        assertThat(result.getNickname()).isEqualTo("New Nick");
        assertThat(result.getImage()).isEqualTo("https://example.com/avatar.png");
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfile_whenUserNotFound_shouldThrowResourceNotFoundException() {
        when(userRepository.findById("unknown-id")).thenReturn(Optional.empty());

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name("New Name")
                .build();

        assertThatThrownBy(() -> authService.updateProfile("unknown-id", request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with id");
    }

    @Test
    void updateProfile_whenEmptyNameProvided_shouldThrowBadRequestException() {
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name("   ")
                .build();

        assertThatThrownBy(() -> authService.updateProfile("user-123", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Name cannot be empty");
    }

    @Test
    void updateProfile_whenPartialFieldsProvided_shouldOnlyUpdateNonNullFields() {
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .nickname("Just Nick")
                .build();

        UserDto result = authService.updateProfile("user-123", request);

        assertThat(result.getName()).isEqualTo("Test User"); // original name unchanged
        assertThat(result.getPhone()).isEqualTo("1234567890"); // original phone unchanged
        assertThat(result.getNickname()).isEqualTo("Just Nick"); // updated
    }

    @Test
    void changePassword_whenCurrentPasswordMatches_shouldEncodeNewPasswordAndSave() {
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword123", testUser.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("newPassword456")).thenReturn("encoded-new-password");

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword123")
                .newPassword("newPassword456")
                .build();

        authService.changePassword("user-123", request);

        assertThat(testUser.getPassword()).isEqualTo("encoded-new-password");
        verify(userRepository).save(testUser);
    }

    @Test
    void changePassword_whenCurrentPasswordIncorrect_shouldThrowBadRequestException() {
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", testUser.getPassword())).thenReturn(false);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrongPassword")
                .newPassword("newPassword456")
                .build();

        assertThatThrownBy(() -> authService.changePassword("user-123", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Current password is incorrect");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changePassword_whenUserNotFound_shouldThrowResourceNotFoundException() {
        when(userRepository.findById("unknown-id")).thenReturn(Optional.empty());

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("newPassword456")
                .build();

        assertThatThrownBy(() -> authService.changePassword("unknown-id", request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with id");
    }

    @Test
    void changePassword_whenNewPasswordTooShort_shouldThrowBadRequestException() {
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword123", testUser.getPassword())).thenReturn(true);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword123")
                .newPassword("12345")
                .build();

        assertThatThrownBy(() -> authService.changePassword("user-123", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("New password must be at least 6 characters");
    }
}