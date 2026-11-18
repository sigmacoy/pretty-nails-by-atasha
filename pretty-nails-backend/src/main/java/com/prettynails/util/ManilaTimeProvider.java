package com.prettynails.util;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Manila timezone implementation of TimeProvider.
 * All current-time calculations use Asia/Manila timezone (UTC+8).
 */
@Component
public class ManilaTimeProvider implements TimeProvider {

    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");

    @Override
    public ZonedDateTime now() {
        return ZonedDateTime.now(MANILA_ZONE);
    }

    @Override
    public LocalDate today() {
        return now().toLocalDate();
    }

    @Override
    public LocalDateTime localNow() {
        return now().toLocalDateTime();
    }

    @Override
    public LocalDateTime startOfToday() {
        return today().atStartOfDay();
    }

    @Override
    public LocalDateTime endOfToday() {
        return today().atTime(23, 59, 59, 999_999_999);
    }

    @Override
    public boolean isAtLeast24HoursInFuture(LocalDateTime appointmentDateTime) {
        return now().plusHours(24).isBefore(appointmentDateTime.atZone(MANILA_ZONE));
    }

    @Override
    public LocalDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay();
    }

    @Override
    public LocalDateTime endOfDay(LocalDate date) {
        return date.atTime(23, 59, 59, 999_999_999);
    }

    @Override
    public LocalDateTime startOfMonth(YearMonth yearMonth) {
        return yearMonth.atDay(1).atStartOfDay();
    }

    @Override
    public LocalDateTime endOfMonth(YearMonth yearMonth) {
        return yearMonth.atEndOfMonth().atTime(23, 59, 59, 999_999_999);
    }
}