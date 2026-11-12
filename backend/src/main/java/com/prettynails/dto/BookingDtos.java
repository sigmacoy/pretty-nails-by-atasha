package com.prettynails.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

public class BookingDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingServiceRequest {
        @NotBlank
        private String serviceId;

        private String variantId;

        @Min(1)
        private Integer quantity = 1;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingRequest {
        @NotBlank
        private String appointmentDate;

        @NotBlank
        private String startTime;

        private String endTime;

        @NotNull
        @Min(0)
        private Integer totalPrice;

        @Min(0)
        private Integer downpayment = 10000;

        private String notes;

        private String inspirationImage;

        private String paymentReference;

        private Boolean redeemLoyaltyReward;

        @NotNull
        @Size(min = 1)
        private List<BookingServiceRequest> services;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingResponse {
        private String bookingId;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingServiceDto {
        private String id;
        private String bookingId;
        private String serviceId;
        private String variantId;
        private Integer quantity;
        private Integer price;
        private ServiceDto service;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceDto {
        private String id;
        private String name;
        private String category;
        private String description;
        private Integer basePrice;
        private Integer duration;
        private Boolean isActive;
        private List<ServiceVariantDto> variants;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceVariantDto {
        private String id;
        private String serviceId;
        private String name;
        private Integer price;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDto {
        private String id;
        private String bookingId;
        private String userId;
        private Integer amount;
        private String status;
        private String method;
        private String reference;
        private String verifiedAt;
        private String verifiedBy;
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
    public static class BookingDto {
        private String id;
        private String userId;
        private String status;
        private String appointmentDate;
        private String startTime;
        private String endTime;
        private Integer totalPrice;
        private Integer downpayment;
        private String notes;
        private String inspirationImg;
        private String createdAt;
        private String updatedAt;
        private List<BookingServiceDto> services;
        private PaymentDto payment;
        private List<LoyaltyStampDto> loyaltyStamps;
        private Boolean redeemLoyaltyReward;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingStatusRequest {
        @NotBlank
        private String status;
    }
}