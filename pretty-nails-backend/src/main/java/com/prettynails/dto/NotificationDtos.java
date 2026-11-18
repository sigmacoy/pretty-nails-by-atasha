package com.prettynails.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class NotificationDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationEvent {
        private String id;
        private String type;
        private String title;
        private String message;
        private LocalDateTime timestamp;
        private Map<String, Object> data;
        private String actionUrl;
        private Integer priority; // 1=low, 2=normal, 3=high
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationDto {
        private String id;
        private String userId;
        private String type;
        private String title;
        private String message;
        private LocalDateTime timestamp;
        private boolean read;
        private Map<String, Object> data;
        private String actionUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationHistoryResponse {
        private List<NotificationDto> notifications;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean first;
        private boolean last;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendNotificationRequest {
        private String userId;
        private NotificationEvent event;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BroadcastNotificationRequest {
        private NotificationEvent event;
    }
}