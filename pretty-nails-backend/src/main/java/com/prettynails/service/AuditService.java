package com.prettynails.service;

import com.prettynails.entity.AuditLog;
import com.prettynails.entity.User;
import com.prettynails.repository.AuditLogRepository;
import com.prettynails.repository.AuditLogSpecification;
import com.prettynails.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for audit logging administrative actions and important system events.
 * Automatically extracts user information from Spring Security context.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Logs an administrative action.
     *
     * @param action the action performed (e.g., "CREATE_USER", "UPDATE_SERVICE", "DELETE_BOOKING")
     * @param entityType the type of entity affected (e.g., "User", "Service", "Booking")
     * @param entityId the ID of the affected entity
     * @param description human-readable description of the action
     * @param metadata additional structured data about the action
     */
    @Transactional
    public void logAction(String action, String entityType, String entityId,
                          String description, Map<String, Object> metadata) {
        logAction(action, entityType, entityId, description, metadata, null, null);
    }

    /**
     * Logs an administrative action with request context.
     */
    @Transactional
    public void logAction(String action, String entityType, String entityId,
                          String description, Map<String, Object> metadata,
                          HttpServletRequest request) {
        String ipAddress = request != null ? getClientIp(request) : null;
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        logAction(action, entityType, entityId, description, metadata, ipAddress, userAgent);
    }

    /**
     * Logs an administrative action with full context.
     */
    @Transactional
    public void logAction(String action, String entityType, String entityId,
                          String description, Map<String, Object> metadata,
                          String ipAddress, String userAgent) {
        try {
            Optional<CurrentUser> currentUser = getCurrentUser();

            AuditLog auditLog = AuditLog.builder()
                    .userId(currentUser.map(CurrentUser::id).orElse(null))
                    .userEmail(currentUser.map(CurrentUser::email).orElse(null))
                    .userRole(currentUser.map(CurrentUser::role).orElse(null))
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .metadata(metadata)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            // Never let audit logging failures affect the main operation
            log.error("Failed to save audit log for action: {}", action, e);
        }
    }

    /**
     * Logs a simple action with minimal parameters.
     */
    @Transactional
    public void logSimpleAction(String action, String entityType, String entityId, String description) {
        logAction(action, entityType, entityId, description, Map.of());
    }

    /**
     * Retrieves audit logs with filtering and pagination.
     */
    public Page<AuditLog> getAuditLogs(String userId, String action, String entityType,
                                        LocalDateTime startDate, LocalDateTime endDate,
                                        Pageable pageable) {
        return auditLogRepository.findAll(
                AuditLogSpecification.auditLogs(userId, action, entityType, startDate, endDate),
                pageable
        );
    }

    /**
     * Gets audit logs for a specific entity.
     */
    public Page<AuditLog> getEntityAuditLogs(String entityType, String entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pageable);
    }

    /**
     * Gets audit logs for a specific entity (non-paginated).
     */
    public List<AuditLog> getEntityAuditLogs(String entityType, String entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    /**
     * Gets audit logs for a specific user.
     */
    public Page<AuditLog> getUserAuditLogs(String userId, Pageable pageable) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Gets recent audit logs.
     */
    public Page<AuditLog> getRecentAuditLogs(LocalDateTime since, Pageable pageable) {
        return auditLogRepository.findAll(
                AuditLogSpecification.auditLogs(null, null, null, since, null),
                pageable
        );
    }

    /**
     * Extracts current user information from security context.
     */
    private Optional<CurrentUser> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof CustomUserDetails customUserDetails) {
            User user = customUserDetails.getUser();
            return Optional.of(new CurrentUser(user.getId(), user.getEmail(), user.getRole()));
        }

        if (principal instanceof User user) {
            return Optional.of(new CurrentUser(user.getId(), user.getEmail(), user.getRole()));
        }

        return Optional.empty();
    }

    /**
     * Extracts client IP address from request, handling proxies.
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private record CurrentUser(String id, String email, String role) {}
}