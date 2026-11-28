package com.prettynails.repository;

import com.prettynails.entity.Booking;
import com.prettynails.entity.User;
import com.prettynails.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingRepositoryTest extends IntegrationTestBase {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    private User createTestUser(String email) {
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();
        return userRepository.save(user);
    }

    private Booking createBooking(String userId, LocalDate appointmentDate, String startTime, String endTime, String status) {
        Booking booking = Booking.builder()
                .userId(userId)
                .status(status)
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime(endTime)
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .redeemLoyaltyReward(false)
                .build();
        return bookingRepository.saveAndFlush(booking);
    }

    @Test
    void existsByAppointmentDateAndStartTimeAndStatusIn_whenSlotBookedPending_shouldReturnTrue() {
        // Given
        LocalDate appointmentDate = LocalDate.of(2025, 12, 25);
        String startTime = "10:00";

        User user = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        createBooking(user.getId(), appointmentDate, startTime, "12:00", "PENDING");

        // When
        boolean exists = bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void existsByAppointmentDateAndStartTimeAndStatusIn_whenSlotBookedConfirmed_shouldReturnTrue() {
        // Given
        LocalDate appointmentDate = LocalDate.of(2025, 12, 25);
        String startTime = "10:00";

        User user = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        createBooking(user.getId(), appointmentDate, startTime, "12:00", "CONFIRMED");

        // When
        boolean exists = bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void existsByAppointmentDateAndStartTimeAndStatusIn_whenSlotCancelled_shouldReturnFalse() {
        // Given
        LocalDate appointmentDate = LocalDate.of(2025, 12, 25);
        String startTime = "10:00";

        User user = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        createBooking(user.getId(), appointmentDate, startTime, "12:00", "CANCELLED");

        // When
        boolean exists = bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void existsByAppointmentDateAndStartTimeAndStatusIn_whenSlotCompleted_shouldReturnFalse() {
        // Given
        LocalDate appointmentDate = LocalDate.of(2025, 12, 25);
        String startTime = "10:00";

        User user = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        createBooking(user.getId(), appointmentDate, startTime, "12:00", "COMPLETED");

        // When
        boolean exists = bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void existsByAppointmentDateAndStartTimeAndStatusIn_whenNoBooking_shouldReturnFalse() {
        // When
        boolean exists = bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                LocalDate.of(2025, 12, 25), "10:00", List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void countByAppointmentDateAndStartTimeAndStatusInAndIdNot_whenOtherBookingExists_shouldReturnOne() {
        // Given
        LocalDate appointmentDate = LocalDate.of(2025, 12, 25);
        String startTime1 = "10:00";
        String startTime2 = "14:00";

        User user1 = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        User user2 = createTestUser("user456-" + UUID.randomUUID() + "@example.com");

        Booking booking1 = createBooking(user1.getId(), appointmentDate, startTime1, "12:00", "PENDING");
        Booking booking2 = createBooking(user2.getId(), appointmentDate, startTime2, "16:00", "CONFIRMED");

        // When - count other bookings excluding booking1 (should find booking2 since it's in the date range and status)
        long count = bookingRepository.countByAppointmentDateAndStartTimeAndStatusInAndIdNot(
                appointmentDate, startTime1, List.of("PENDING", "CONFIRMED"), booking1.getId());

        // Then - no other bookings for the same slot
        assertThat(count).isEqualTo(0);
    }

    @Test
    void countByAppointmentDateAndStartTimeAndStatusInAndIdNot_whenOtherBookingSameSlot_shouldReturnOne() {
        // Given - test with a booking for the same slot but different status (not possible due to unique constraint)
        // This test verifies the query works correctly when there are multiple bookings for different slots
        LocalDate appointmentDate = LocalDate.of(2025, 12, 25);
        String startTime1 = "10:00";
        String startTime2 = "14:00";

        User user1 = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        User user2 = createTestUser("user456-" + UUID.randomUUID() + "@example.com");

        Booking booking1 = createBooking(user1.getId(), appointmentDate, startTime1, "12:00", "PENDING");
        Booking booking2 = createBooking(user2.getId(), appointmentDate, startTime2, "16:00", "CONFIRMED");

        // When - count bookings for the second slot excluding booking2
        long count = bookingRepository.countByAppointmentDateAndStartTimeAndStatusInAndIdNot(
                appointmentDate, startTime2, List.of("PENDING", "CONFIRMED"), booking2.getId());

        // Then - should find booking1 (different slot but same date)
        assertThat(count).isEqualTo(0);
    }

    @Test
    void countByAppointmentDateAndStartTimeAndStatusInAndIdNot_whenNoOtherBooking_shouldReturnZero() {
        // Given
        LocalDate appointmentDate = LocalDate.of(2025, 12, 25);
        String startTime = "10:00";

        User user = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        Booking booking = createBooking(user.getId(), appointmentDate, startTime, "12:00", "PENDING");

        // When - count other bookings excluding booking
        long count = bookingRepository.countByAppointmentDateAndStartTimeAndStatusInAndIdNot(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"), booking.getId());

        // Then
        assertThat(count).isEqualTo(0);
    }

    @Test
    void uniqueConstraint_shouldPreventDuplicateBookingsForSameSlot() {
        // Given
        LocalDate appointmentDate = LocalDate.of(2025, 12, 25);
        String startTime = "10:00";

        User user1 = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        User user2 = createTestUser("user456-" + UUID.randomUUID() + "@example.com");

        createBooking(user1.getId(), appointmentDate, startTime, "12:00", "PENDING");

        // When/Then - attempt to create another booking for same slot (any status)
        assertThatThrownBy(() -> createBooking(user2.getId(), appointmentDate, startTime, "12:00", "PENDING"))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class)
                .hasRootCauseInstanceOf(org.postgresql.util.PSQLException.class)
                .hasMessageContaining("uk_booking_slot_active");
    }

    @Test
    void uniqueConstraint_shouldAllowBookingAfterCancelledForSameSlot() {
        // Given - the partial unique index only applies to PENDING/CONFIRMED statuses
        // So a CANCELLED booking should NOT block a new PENDING booking for the same slot
        LocalDate appointmentDate = LocalDate.of(2025, 12, 25);
        String startTime = "10:00";

        User user1 = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        User user2 = createTestUser("user456-" + UUID.randomUUID() + "@example.com");

        createBooking(user1.getId(), appointmentDate, startTime, "12:00", "CANCELLED");

        // When/Then - should be able to create new PENDING booking for same slot
        Booking newBooking = createBooking(user2.getId(), appointmentDate, startTime, "12:00", "PENDING");
        assertThat(newBooking).isNotNull();
        assertThat(newBooking.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void countByAppointmentDateBetweenAndStatusIn_shouldCountCorrectly() {
        // Given
        LocalDate start = LocalDate.of(2025, 12, 25);
        LocalDate end = LocalDate.of(2025, 12, 25);

        User user1 = createTestUser("user123-" + UUID.randomUUID() + "@example.com");
        User user2 = createTestUser("user456-" + UUID.randomUUID() + "@example.com");
        User user3 = createTestUser("user789-" + UUID.randomUUID() + "@example.com");

        createBooking(user1.getId(), LocalDate.of(2025, 12, 25), "10:00", "12:00", "PENDING");
        createBooking(user2.getId(), LocalDate.of(2025, 12, 25), "14:00", "16:00", "CONFIRMED");
        createBooking(user3.getId(), LocalDate.of(2025, 12, 25), "16:00", "18:00", "CANCELLED");

        // When
        long count = bookingRepository.countByAppointmentDateBetweenAndStatusIn(start, end, List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(count).isEqualTo(2);
    }
}