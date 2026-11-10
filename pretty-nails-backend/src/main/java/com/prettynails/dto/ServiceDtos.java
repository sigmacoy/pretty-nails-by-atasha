package com.prettynails.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

public class ServiceDtos {

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
    public static class ServiceVariantRequest {
        @NotBlank
        private String name;

        @NotNull
        @Min(0)
        private Integer price;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceRequest {
        @NotBlank
        @Size(max = 100)
        private String name;

        @NotBlank
        @Size(max = 20)
        private String category;

        private String description;

        @NotNull
        @Min(0)
        private Integer basePrice;

        @NotNull
        @Min(1)
        private Integer duration;

        private Boolean isActive;

        private List<ServiceVariantRequest> variants;
    }
}