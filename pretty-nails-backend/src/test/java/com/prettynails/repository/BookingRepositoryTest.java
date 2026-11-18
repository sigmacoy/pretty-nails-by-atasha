package com.prettynails.repository;

import com.prettynails.entity.Booking;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Testcontainers
@TestPropertySource(locations = "classpath:application-test.yml")
class BookingRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.testcontainers.jdbc.ContainerDatabaseDriver");
    }

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void existsByAppointmentDateAndStartTimeAndStatusIn_whenSlotBookedPending_shouldReturnTrue() {
        // Given
        LocalDateTime appointmentDate = LocalDateTime.of(2025, 12, 25, 0, 0);
        String startTime = "10:00";

        Booking booking = Booking.builder()
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .redeemLoyaltyReward(false)
                .build();

        entityManager.persistAndFlush(booking);

        // When
        boolean exists = bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void existsByAppointmentDateAndStartTimeAndStatusIn_whenSlotBookedConfirmed_shouldReturnTrue() {
        // Given
        LocalDateTime appointmentDate = LocalDateTime.of(2025, 12, 25, 0, 0);
        String startTime = "10:00";

        Booking booking = Booking.builder()
                .userId("user-123")
                .status("CONFIRMED")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .redeemLoyaltyReward(false)
                .build();

        entityManager.persistAndFlush(booking);

        // When
        boolean exists = bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void existsByAppointmentDateAndStartTimeAndStatusIn_whenSlotCancelled_shouldReturnFalse() {
        // Given
        LocalDateTime appointmentDate = LocalDateTime.of(2025, 12, 25, 0, 0);
        String startTime = "10:00";

        Booking booking = Booking.builder()
                .userId("user-123")
                .status("CANCELLED")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .redeemLoyaltyReward(false)
                .build();

        entityManager.persistAndFlush(booking);

        // When
        boolean exists = bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void existsByAppointmentDateAndStartTimeAndStatusIn_whenSlotCompleted_shouldReturnFalse() {
        // Given
        LocalDateTime appointmentDate = LocalDateTime.of(2025, 12, 25, 0, 0);
        String startTime = "10:00";

        Booking booking = Booking.builder()
                .userId("user-123")
                .status("COMPLETED")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .redeemLoyaltyReward(false)
                .build();

        entityManager.persistAndFlush(booking);

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
                LocalDateTime.of(2025, 12, 25, 0, 0), "10:00", List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void countByAppointmentDateAndStartTimeAndStatusInAndIdNot_whenOtherBookingExists_shouldReturnOne() {
        // Given
        LocalDateTime appointmentDate = LocalDateTime.of(2025, 12, 25, 0, 0);
        String startTime = "10:00";

        Booking booking1 = Booking.builder()
                .id("booking-1")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking 1")
                .inspirationImg("http://example.com/image.jpg")
                .redeemLoyaltyReward(false)
                .build();

        Booking booking2 = Booking.builder()
                .id("booking-2")
                .userId("user-456")
                .status("CONFIRMED")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(60000)
                .downpayment(10000)
                .notes("Test booking 2")
                .inspirationImg("http://example.com/image2.jpg")
                .redeemLoyaltyReward(false)
                .build();

        entityManager.persistAndFlush(booking1);
        entityManager.persistAndFlush(booking2);

        // When - count other bookings excluding booking-1
        long count = bookingRepository.countByAppointmentDateAndStartTimeAndStatusInAndIdNot(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"), "booking-1");

        // Then
        assertThat(count).isEqualTo(1);
    }

    @Test
    void countByAppointmentDateAndStartTimeAndStatusInAndIdNot_whenNoOtherBooking_shouldReturnZero() {
        // Given
        LocalDateTime appointmentDate = LocalDateTime.of(2025, 12, 25, 0, 0);
        String startTime = "10:00";

        Booking booking = Booking.builder()
                .id("booking-1")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .redeemLoyaltyReward(false)
                .build();

        entityManager.persistAndFlush(booking);

        // When - count other bookings excluding booking-1
        long count = bookingRepository.countByAppointmentDateAndStartTimeAndStatusInAndIdNot(
                appointmentDate, startTime, List.of("PENDING", "CONFIRMED"), "booking-1");

        // Then
        assertThat(count).isEqualTo(0);
    }

    @Test
    void partialUniqueConstraint_shouldPreventDuplicatePendingBookings() {
        // Given
        LocalDateTime appointmentDate = LocalDateTime.of(2025, 12, 25, 0, 0);
        String startTime = "10:00";

        Booking booking1 = Booking.builder()
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking 1")
                .inspirationImg("http://example.com/image.jpg")
                .redeemLoyaltyReward(false)
                .build();

        entityManager.persistAndFlush(booking1);

        // When/Then - attempt to create another PENDING booking for same slot
        Booking booking2 = Booking.builder()
                .userId("user-456")
                .status("PENDING")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(60000)
                .downpayment(10000)
                .notes("Test booking 2")
                .inspirationImg("http://example.com/image2.jpg")
                .redeemLoyaltyReward(false)
                .build();

        assertThatThrownBy(() -> entityManager.persistAndFlush(booking2))
                .hasCauseInstanceOf(jakarta.persistence.PersistenceException.class)
                .hasRootCauseInstanceOf(org.postgresql.util.PSQLException.class)
                .hasMessageContaining("uk_booking_slot_active");
    }

    @Test
    void partialUniqueConstraint_shouldAllowCancelledBookingInSameSlot() {
        // Given
        LocalDateTime appointmentDate = LocalDateTime.of(2025, 12, 25, 0, 0);
        String startTime = "10:00";

        Booking booking1 = Booking.builder()
                .userId("user-123")
                .status("CANCELLED")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking 1")
                .inspirationImg("http://example.com/image.jpg")
                .redeemLoyaltyReward(false)
                .build();

        entityManager.persistAndFlush(booking1);

        // When - create a PENDING booking for same slot (should succeed)
        Booking booking2 = Booking.builder()
                .userId("user-456")
                .status("PENDING")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime("12:00")
                .totalPrice(60000)
                .downpayment(10000)
                .notes("Test booking 2")
                .inspirationImg("http://example.com/image2.jpg")
                .redeemLoyaltyReward(false)
                .build();

        entityManager.persistAndFlush(booking2);

        // Then
        assertThat(booking2.getId()).isNotNull();
    }

    @Test
    void countByAppointmentDateBetweenAndStatusIn_shouldCountCorrectly() {
        // Given
        LocalDateTime start = LocalDateTime.of(2025, 12, 25, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 12, 25, 23, 59, 59);

        Booking booking1 = Booking.builder()
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(LocalDateTime.of(2025, 12, 25, 0, 0))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .build();

        Booking booking2 = Booking.builder()
                .userId("user-456")
                .status("CONFIRMED")
                .appointmentDate(LocalDateTime.of(2025, 12, 25, 0, 0))
                .startTime("14:00")
                .endTime("16:00")
                .totalPrice(60000)
                .downpayment(10000)
                .build();

        Booking booking3 = Booking.builder()
                .userId("user-789")
                .status("CANCELLED")
                .appointmentDate(LocalDateTime.of(2025, 12, 25, 0, 0))
                .startTime("16:00")
                .endTime("18:00")
                .totalPrice(70000)
                .downpayment(10000)
                .build();

        entityManager.persistAndFlush(booking1);
        entityManager.persistAndFlush(booking2);
        entityManager.persistAndFlush(booking3);

        // When
        long count = bookingRepository.countByAppointmentDateBetweenAndStatusIn(start, end, List.of("PENDING", "CONFIRMED"));

        // Then
        assertThat(count).isEqualTo(2);
    }
}