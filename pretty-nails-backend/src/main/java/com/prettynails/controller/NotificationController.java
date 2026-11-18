package com.prettynails.controller;

import com.prettynails.dto.NotificationDtos.*;
import com.prettynails.entity.User;
import com.prettynails.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Controller for real-time notifications using Server-Sent Events (SSE).
 * Provides endpoints for subscribing to notification streams and retrieving notification history.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // In-memory sink registry for active SSE connections
    // In production, use Redis or a message broker for distributed deployments
    private final Map<String, Sinks.Many<NotificationEvent>> userSinks = new ConcurrentHashMap<>();

    /**
     * Subscribe to real-time notification stream via SSE.
     * Returns a stream of Server-Sent Events for the authenticated user.
     *
     * @return Flux of ServerSentEvent<NotificationEvent>
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<NotificationEvent>> streamNotifications() {
        User currentUser = getCurrentUser();
        String userId = currentUser.getId();

        // Create or get sink for this user
        Sinks.Many<NotificationEvent> sink = userSinks.computeIfAbsent(userId,
                k -> Sinks.many().multicast().onBackpressureBuffer());

        // Send initial connection event
        NotificationEvent connectedEvent = NotificationEvent.builder()
                .type("CONNECTED")
                .title("Connected")
                .message("Real-time notification stream established")
                .timestamp(LocalDateTime.now())
                .build();

        // Create flux from sink with heartbeat
        Flux<ServerSentEvent<NotificationEvent>> eventFlux = sink.asFlux()
                .map(event -> ServerSentEvent.builder(event)
                        .event(event.getType())
                        .id(event.getId())
                        .build())
                .onErrorResume(e -> Flux.empty());

        // Add heartbeat to keep connection alive
        Flux<ServerSentEvent<NotificationEvent>> heartbeat = Flux.interval(Duration.ofSeconds(30))
                .map(tick -> ServerSentEvent.builder(new NotificationEvent())
                        .event("HEARTBEAT")
                        .build());

        return Flux.merge(eventFlux, heartbeat)
                .doOnSubscribe(sub -> {
                    // Send connection confirmation
                    sink.tryEmitNext(connectedEvent);
                })
                .doOnCancel(() -> {
                    // Clean up on disconnect
                    userSinks.remove(userId);
                });
    }

    /**
     * Get notification history for the current user.
     */
    @GetMapping("/history")
    public ResponseEntity<NotificationHistoryResponse> getNotificationHistory(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User currentUser = getCurrentUser();
        NotificationHistoryResponse history = notificationService.getNotificationHistory(
                currentUser.getId(), type, unreadOnly, page, size);
        return ResponseEntity.ok(history);
    }

    /**
     * Mark a notification as read.
     */
    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String notificationId) {
        User currentUser = getCurrentUser();
        notificationService.markAsRead(currentUser.getId(), notificationId);
        return ResponseEntity.ok().build();
    }

    /**
     * Mark all notifications as read.
     */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        User currentUser = getCurrentUser();
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Get unread notification count.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        User currentUser = getCurrentUser();
        long count = notificationService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(count);
    }

    /**
     * Send a notification to a specific user (admin/staff only).
     */
    @PostMapping("/send")
    public ResponseEntity<Void> sendNotification(@RequestBody SendNotificationRequest request) {
        notificationService.sendToUser(request.getUserId(), request.getEvent());
        return ResponseEntity.ok().build();
    }

    /**
     * Broadcast a notification to all users (admin only).
     */
    @PostMapping("/broadcast")
    public ResponseEntity<Void> broadcastNotification(@RequestBody BroadcastNotificationRequest request) {
        notificationService.broadcast(request.getEvent());
        return ResponseEntity.ok().build();
    }

    /**
     * Extracts current user from security context.
     */
    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("No authenticated user");
        }
        return (User) authentication.getPrincipal();
    }
}