package com.prettynails.service;

import com.prettynails.dto.NotificationDtos.*;
import com.prettynails.entity.Notification;
import com.prettynails.repository.NotificationRepository;
import com.prettynails.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing real-time notifications.
 * Handles notification persistence, delivery via SSE, and history retrieval.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TimeProvider timeProvider;

    // In-memory sink registry for active SSE connections
    // In production, use Redis or a message broker for distributed deployments
    private final Map<String, org.reactivestreams.Publisher<NotificationEvent>> userSinks = new ConcurrentHashMap<>();

    private final Map<String, reactor.core.publisher.Sinks.Many<NotificationEvent>> userSinkMap = new ConcurrentHashMap<>();

    /**
     * Sends a notification to a specific user.
     * Persists to database and pushes to SSE stream if connected.
     */
    @Transactional
    public void sendToUser(String userId, NotificationEvent event) {
        // Ensure event has ID and timestamp
        if (event.getId() == null) {
            event.setId(UUID.randomUUID().toString());
        }
        if (event.getTimestamp() == null) {
            event.setTimestamp(timeProvider.localNow());
        }

        // Persist to database
        Notification notification = Notification.builder()
                .id(event.getId())
                .userId(userId)
                .type(event.getType())
                .title(event.getTitle())
                .message(event.getMessage())
                .data(event.getData())
                .actionUrl(event.getActionUrl())
                .priority(event.getPriority() != null ? event.getPriority() : 2)
                .read(false)
                .createdAt(event.getTimestamp())
                .build();
        notificationRepository.save(notification);

        // Push to SSE if user is connected
        pushToSse(userId, event);

        log.debug("Sent notification {} to user {}", event.getId(), userId);
    }

    /**
     * Broadcasts a notification to all connected users.
     */
    public void broadcast(NotificationEvent event) {
        if (event.getId() == null) {
            event.setId(UUID.randomUUID().toString());
        }
        if (event.getTimestamp() == null) {
            event.setTimestamp(timeProvider.localNow());
        }

        // Get all user IDs with active connections
        userSinkMap.forEach((userId, sink) -> {
            pushToSse(userId, event);
        });

        log.debug("Broadcast notification {} to {} users", event.getId(), userSinkMap.size());
    }

    /**
     * Pushes a notification event to the user's SSE sink.
     */
    private void pushToSse(String userId, NotificationEvent event) {
        reactor.core.publisher.Sinks.Many<NotificationEvent> sink = userSinkMap.get(userId);
        if (sink != null) {
            sink.tryEmitNext(event);
        }
    }

    /**
     * Registers a sink for a user's SSE connection.
     */
    public void registerSink(String userId, reactor.core.publisher.Sinks.Many<NotificationEvent> sink) {
        userSinkMap.put(userId, sink);
    }

    /**
     * Removes a user's sink on disconnect.
     */
    public void removeSink(String userId) {
        userSinkMap.remove(userId);
    }

    /**
     * Gets notification history for a user with filtering and pagination.
     */
    public NotificationHistoryResponse getNotificationHistory(String userId, String type,
                                                               Boolean unreadOnly, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notificationPage;

        if (unreadOnly != null && unreadOnly) {
            if (type != null) {
                notificationPage = notificationRepository.findByUserIdAndTypeAndReadFalseOrderByCreatedAtDesc(userId, type, pageable);
            } else {
                notificationPage = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId, pageable);
            }
        } else {
            if (type != null) {
                notificationPage = notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type, pageable);
            } else {
                notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
            }
        }

        List<NotificationDto> notifications = notificationPage.getContent().stream()
                .map(this::mapToDto)
                .toList();

        return NotificationHistoryResponse.builder()
                .notifications(notifications)
                .page(notificationPage.getNumber())
                .size(notificationPage.getSize())
                .totalElements(notificationPage.getTotalElements())
                .totalPages(notificationPage.getTotalPages())
                .first(notificationPage.isFirst())
                .last(notificationPage.isLast())
                .build();
    }

    /**
     * Marks a notification as read.
     */
    @Transactional
    public void markAsRead(String userId, String notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        notification.setReadAt(timeProvider.localNow());
        notificationRepository.save(notification);
    }

    /**
     * Marks all notifications as read for a user.
     */
    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        for (Notification notification : unread) {
            notification.setRead(true);
            notification.setReadAt(timeProvider.localNow());
        }
        notificationRepository.saveAll(unread);
    }

    /**
     * Gets unread notification count for a user.
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .timestamp(notification.getCreatedAt())
                .read(Boolean.TRUE.equals(notification.getRead()))
                .data(notification.getData())
                .actionUrl(notification.getActionUrl())
                .build();
    }
}