package com.prettynails.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZonedDateTime;

/**
 * Centralized time provider for the studio timezone (Asia/Manila).
 * All current-time calculations should use this instead of LocalDateTime.now()
 * to ensure consistency across server deployments regardless of JVM timezone.
 */
public interface TimeProvider {

    /**
     * Current date-time in Manila timezone.
     */
    ZonedDateTime now();

    /**
     * Current date in Manila timezone.
     */
    LocalDate today();

    /**
     * Current date-time as LocalDateTime in Manila timezone (no zone info).
     */
    LocalDateTime localNow();

    /**
     * Start of today in Manila timezone (00:00:00).
     */
    LocalDateTime startOfToday();

    /**
     * End of today in Manila timezone (23:59:59.999999999).
     */
    LocalDateTime endOfToday();

    /**
     * Checks if the given appointment date-time is at least 24 hours in the future
     * relative to Manila time.
     */
    boolean isAtLeast24HoursInFuture(LocalDateTime appointmentDateTime);

    /**
     * Converts a LocalDate to start-of-day LocalDateTime in Manila timezone.
     */
    LocalDateTime startOfDay(LocalDate date);

    /**
     * Converts a LocalDate to end-of-day LocalDateTime in Manila timezone.
     */
    LocalDateTime endOfDay(LocalDate date);

    /**
     * Start of the given month in Manila timezone (first day, 00:00:00).
     */
    LocalDateTime startOfMonth(YearMonth yearMonth);

    /**
     * End of the given month in Manila timezone (last day, 23:59:59.999999999).
     */
    LocalDateTime endOfMonth(YearMonth yearMonth);
}