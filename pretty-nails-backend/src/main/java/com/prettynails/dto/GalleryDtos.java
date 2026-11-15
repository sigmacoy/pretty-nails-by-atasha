package com.prettynails.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

public class GalleryDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GalleryRequest {
        @NotBlank
        @Size(max = 200)
        private String title;

        private String description;

        @NotBlank
        @Size(max = 500)
        private String imageUrl;

        private String category;

        private Boolean isActive = true;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GalleryDto {
        private String id;
        private String title;
        private String description;
        private String imageUrl;
        private String category;
        private Boolean isActive;
        private String createdAt;
        private String updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminGalleryPageResponse {
        private List<GalleryDto> content;
        private Integer number;
        private Integer size;
        private Long totalElements;
        private Integer totalPages;
        private Boolean first;
        private Boolean last;
    }
}