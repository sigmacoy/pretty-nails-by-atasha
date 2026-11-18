package com.prettynails.util;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Centralized time provider for the studio timezone (Asia/Manila).
 * All current-time calculations should use this instead of LocalDateTime.now()
 * to ensure consistency across server deployments regardless of JVM timezone.
 */
@Component
public class TimeProvider {

    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");

    /**
     * Current date-time in Manila timezone.
     */
    public ZonedDateTime now() {
        return ZonedDateTime.now(MANILA_ZONE);
    }

    /**
     * Current date in Manila timezone.
     */
    public LocalDate today() {
        return now().toLocalDate();
    }

    /**
     * Current date-time as LocalDateTime in Manila timezone (no zone info).
     */
    public LocalDateTime localNow() {
        return now().toLocalDateTime();
    }

    /**
     * Start of today in Manila timezone (00:00:00).
     */
    public LocalDateTime startOfToday() {
        return today().atStartOfDay();
    }

    /**
     * End of today in Manila timezone (23:59:59.999999999).
     */
    public LocalDateTime endOfToday() {
        return today().atTime(23, 59, 59, 999_999_999);
    }

    /**
     * Checks if the given appointment date-time is at least 24 hours in the future
     * relative to Manila time.
     */
    public boolean isAtLeast24HoursInFuture(LocalDateTime appointmentDateTime) {
        return now().plusHours(24).isBefore(appointmentDateTime.atZone(MANILA_ZONE));
    }

    /**
     * Converts a LocalDate to start-of-day LocalDateTime in Manila timezone.
     */
    public LocalDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay();
    }

    /**
     * Converts a LocalDate to end-of-day LocalDateTime in Manila timezone.
     */
    public LocalDateTime endOfDay(LocalDate date) {
        return date.atTime(23, 59, 59, 999_999_999);
    }

    /**
     * Start of the given month in Manila timezone (first day, 00:00:00).
     */
    public LocalDateTime startOfMonth(java.time.YearMonth yearMonth) {
        return yearMonth.atDay(1).atStartOfDay();
    }

    /**
     * End of the given month in Manila timezone (last day, 23:59:59.999999999).
     */
    public LocalDateTime endOfMonth(java.time.YearMonth yearMonth) {
        return yearMonth.atEndOfMonth().atTime(23, 59, 59, 999_999_999);
    }
}