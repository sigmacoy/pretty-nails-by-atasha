package com.prettynails.dto;

import com.prettynails.dto.AuthDtos.UserDto;
import lombok.*;

import java.util.List;

public class LoyaltyDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltyCardDto {
        private Integer stampCount;
        private String lastStampAt;
        private String expiresAt;
        private Boolean isExpired;
        private List<LoyaltyStampDto> stamps;
        private Boolean isAdmin;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltyStampDto {
        private String earnedAt;
        private String source;
        private Integer amount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StampRequest {
        private String qrCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StampResponse {
        private Boolean success;
        private Integer stampCount;
        private Integer stampsEarned;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminLoyaltyCardDto {
        private String id;
        private String userId;
        private Integer stampCount;
        private String lastStampAt;
        private String expiresAt;
        private String createdAt;
        private String updatedAt;
        private UserDto user;
        private List<LoyaltyStampDto> stamps;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltyActionRequest {
        private String cardId;
        private String action;
        private Integer amount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltySettingsDto {
        private Integer stampsRequired;
        private Integer stampExpiryMonths;
        private Boolean stampPerService;
        private Integer stampPerAmount;
    }
}