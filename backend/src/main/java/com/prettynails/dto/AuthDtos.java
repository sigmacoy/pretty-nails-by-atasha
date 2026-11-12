package com.prettynails.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

public class AuthDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @Size(max = 100)
        private String name;

        @NotBlank
        @Email
        private String email;

        private String phone;

        @NotBlank
        @Size(min = 6)
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String type = "Bearer";
        private UserDto user;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private String id;
        private String name;
        private String email;
        private String role;
        private String nickname;
        private String phone;
        private String image;
        private java.time.LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        @Size(max = 100, message = "Name must not exceed 100 characters")
        private String name;

        @Size(max = 20, message = "Phone must not exceed 20 characters")
        private String phone;

        @Size(max = 100, message = "Nickname must not exceed 100 characters")
        private String nickname;

        @Size(max = 500, message = "Image URL must not exceed 500 characters")
        private String image;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "New password must be at least 6 characters")
        private String newPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageResponse {
        private String message;
    }
}