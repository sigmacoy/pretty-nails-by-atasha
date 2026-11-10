package com.prettynails.dto;

import com.prettynails.dto.AuthDtos.UserDto;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

public class AdminDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceRequest {
        @NotBlank
        private String name;

        @NotBlank
        private String category;

        private String description;

        @NotNull
        @Positive
        private Integer basePrice;

        @NotNull
        @Positive
        private Integer duration;

        private Boolean isActive = true;

        private List<ServiceVariantRequest> variants;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceVariantRequest {
        @NotBlank
        private String name;

        @NotNull
        @Positive
        private Integer price;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerNoteRequest {
        @NotBlank
        private String content;

        private String nickname;
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
        private String createdAt;
        private String updatedAt;
        private UserDto admin;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminStatsDto {
        private Long totalCustomers;
        private Long todayBookings;
        private Long pendingBookings;
        private Long monthlyRevenue;
        private Long monthlyCustomers;
        private Long stampsThisMonth;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminReportsDto {
        private Long monthlyRevenue;
        private Long monthlyCustomers;
        private Long monthlyBookings;
        private Long monthlyStamps;
        private List<MonthlyRevenueDto> revenueByMonth;
        private List<TopServiceDto> topServices;
        private List<BookingByDayDto> bookingsByDay;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenueDto {
        private String month;
        private Long revenue;
        private Long bookings;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopServiceDto {
        private String name;
        private Long count;
        private Long revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingByDayDto {
        private String day;
        private Long count;
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
        private String nickname;
        private String image;
        private Long bookingCount;
        private Integer stampCount;
        private String lastStampAt;
        private String expiresAt;
        private Boolean isExpired;
        private List<CustomerNoteDto> recentNotes;
        private String createdAt;
    }
}