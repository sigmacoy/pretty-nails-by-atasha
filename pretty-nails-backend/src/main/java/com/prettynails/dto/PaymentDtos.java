package com.prettynails.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

public class PaymentDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDto {
        private String id;
        private String bookingId;
        private String userId;
        private Integer amount; // in centavos
        private String status; // PENDING, PAID, FAILED, REFUNDED
        private String method; // GCASH, CASH
        private String reference;
        private String verifiedAt;
        private String verifiedBy;
        private String createdAt;
        private String updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentRequest {
        @NotBlank
        private String bookingId;

        @NotNull
        @Min(1)
        private Integer amount; // in centavos

        private String method = "GCASH";
        private String reference;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentResponse {
        private String id;
        private String bookingId;
        private String status;
        private String message;
    }
}