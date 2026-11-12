package com.prettynails.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

public class AvailabilityDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityRequest {
        @NotNull
        private LocalDateTime date;

        private Boolean isAvailable = true;

        @Builder.Default
        private String startTime = "08:00";

        @Builder.Default
        private String endTime = "22:00";

        @Min(1)
        @Max(8)
        @Builder.Default
        private Integer maxSlots = 4;

        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityDto {
        private String id;
        private LocalDateTime date;
        private Boolean isAvailable;
        private String startTime;
        private String endTime;
        private Integer maxSlots;
        private String note;
        private String createdAt;
        private String updatedAt;
    }
}