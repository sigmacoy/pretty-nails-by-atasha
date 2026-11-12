package com.prettynails.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class AdminDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminStatsDto {
        private Long totalCustomers;
        private Long totalBookings;
        private Long totalRevenue; // in centavos
        private Long pendingBookings;
        private Long completedThisMonth;
        private Long loyaltyActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminReportsDto {
        private String period;
        private Long revenue; // in centavos
        private Long bookingsCount;
        private List<TopServiceDto> topServices;
        private LoyaltyStatsDto loyaltyStats;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopServiceDto {
        private String serviceName;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltyStatsDto {
        private Long issued;
        private Long redeemed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoyaltySettingsDto {
        @Min(1)
        private Integer stampsPerService;

        @Min(1)
        private Integer stampsPerAmount;

        @Min(1)
        private Integer amountThreshold; // in centavos

        private String freeServiceReward;

        @Min(1)
        private Integer cardExpiryMonths;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerListDto {
        private String id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private LocalDateTime createdAt;
        private Long bookingCount;
        private Integer loyaltyStamps;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerNoteRequest {
        @NotBlank
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerNoteDto {
        private String id;
        private String userId;
        private String adminId;
        private String content;
        private String nickname;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerPageResponse {
        private List<CustomerListDto> content;
        private Integer pageNumber;
        private Integer pageSize;
        private Long totalElements;
        private Integer totalPages;
        private Boolean first;
        private Boolean last;
    }
}