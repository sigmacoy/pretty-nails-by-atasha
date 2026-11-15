package com.prettynails.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prettynails.dto.AuthDtos.*;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.GlobalExceptionHandler;
import com.prettynails.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private User testUser;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        testUser = User.builder()
                .id("user-123")
                .name("Maria Santos")
                .email("maria@example.com")
                .role("CUSTOMER")
                .nickname("Mia")
                .phone("+639123456789")
                .image("https://example.com/avatar.jpg")
                .createdAt(LocalDateTime.now())
                .build();

        SecurityContextHolder.clearContext();
    }

    private void authenticateUser() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, null, testUser.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void getCurrentUser_whenAuthenticated_shouldReturnUserDto() throws Exception {
        authenticateUser();

        UserDto userDto = UserDto.builder()
                .id("user-123")
                .name("Maria Santos")
                .email("maria@example.com")
                .role("CUSTOMER")
                .nickname("Mia")
                .phone("+639123456789")
                .image("https://example.com/avatar.jpg")
                .build();

        when(authService.getCurrentUser(any(User.class))).thenReturn(userDto);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-123"))
                .andExpect(jsonPath("$.email").value("maria@example.com"))
                .andExpect(jsonPath("$.name").value("Maria Santos"))
                .andExpect(jsonPath("$.nickname").value("Mia"));
    }

    @Test
    void getCurrentUser_whenNotAuthenticated_shouldReturnBadRequest() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User not authenticated"));
    }

    @Test
    void updateProfile_whenAuthenticated_shouldReturnUpdatedUserDto() throws Exception {
        authenticateUser();

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name("Maria Updated")
                .phone("+639999999999")
                .nickname("Mia2")
                .image("https://example.com/new.jpg")
                .build();

        UserDto updatedDto = UserDto.builder()
                .id("user-123")
                .name("Maria Updated")
                .email("maria@example.com")
                .role("CUSTOMER")
                .nickname("Mia2")
                .phone("+639999999999")
                .image("https://example.com/new.jpg")
                .build();

        when(authService.updateProfile(eq("user-123"), any(UpdateProfileRequest.class)))
                .thenReturn(updatedDto);

        mockMvc.perform(put("/api/auth/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Maria Updated"))
                .andExpect(jsonPath("$.phone").value("+639999999999"))
                .andExpect(jsonPath("$.nickname").value("Mia2"))
                .andExpect(jsonPath("$.image").value("https://example.com/new.jpg"));

        verify(authService).updateProfile(eq("user-123"), any(UpdateProfileRequest.class));
    }

    @Test
    void updateProfile_whenNotAuthenticated_shouldReturnBadRequest() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name("Maria Updated")
                .build();

        mockMvc.perform(put("/api/auth/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User not authenticated"));

        verify(authService, never()).updateProfile(anyString(), any());
    }

    @Test
    void changePassword_whenAuthenticatedAndValid_shouldReturnOk() throws Exception {
        authenticateUser();

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword123")
                .newPassword("newPassword456")
                .build();

        doNothing().when(authService).changePassword(eq("user-123"), any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        verify(authService).changePassword(eq("user-123"), any(ChangePasswordRequest.class));
    }

    @Test
    void changePassword_whenWrongPassword_shouldReturnBadRequest() throws Exception {
        authenticateUser();

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrongPassword")
                .newPassword("newPassword456")
                .build();

        doThrow(new BadRequestException("Current password is incorrect"))
                .when(authService).changePassword(eq("user-123"), any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
    }

    @Test
    void changePassword_whenNotAuthenticated_shouldReturnBadRequest() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword123")
                .newPassword("newPassword456")
                .build();

        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User not authenticated"));

        verify(authService, never()).changePassword(anyString(), any());
    }
}
