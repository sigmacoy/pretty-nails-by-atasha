package com.prettynails.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class UploadDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadResponse {
        private String url;
        private String filename;
        private Long size;
    }
}
