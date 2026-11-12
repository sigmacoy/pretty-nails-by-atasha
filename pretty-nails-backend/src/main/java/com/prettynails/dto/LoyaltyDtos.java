package com.prettynails.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class LoyaltyDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltyCardDto {
        private String id;
        private String userId;
        private Integer stampCount;
        private LocalDateTime lastStampAt;
        private LocalDateTime expiresAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltyStampDto {
        private String id;
        private String cardId;
        private String bookingId;
        private LocalDateTime earnedAt;
        private String source;
        private Integer amount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StampRequest {
        @NotBlank
        private String qrCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StampResponse {
        private Boolean success;
        private Integer stampCount;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminLoyaltyCardDto {
        private String id;
        private String userId;
        private String userName;
        private String userEmail;
        private Integer stampCount;
        private LocalDateTime lastStampAt;
        private LocalDateTime expiresAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltyActionRequest {
        @NotBlank
        private String userId;

        @NotNull
        private Action action;

        @PositiveOrZero
        private Integer amount;

        public enum Action {
            ADD_STAMP,
            REMOVE_STAMP,
            RESET,
            EXTEND
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltyActionResponse {
        private Boolean success;
        private AdminLoyaltyCardDto loyaltyCard;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminLoyaltyPageResponse {
        private List<AdminLoyaltyCardDto> content;
        private Integer pageNumber;
        private Integer pageSize;
        private Long totalElements;
        private Integer totalPages;
        private Boolean first;
        private Boolean last;
    }
}