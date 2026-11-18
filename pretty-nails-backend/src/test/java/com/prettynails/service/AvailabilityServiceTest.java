package com.prettynails.service;

import com.prettynails.dto.AvailabilityDtos.*;
import com.prettynails.entity.Availability;
import com.prettynails.repository.AvailabilityRepository;
import com.prettynails.repository.BookingRepository;
import com.prettynails.util.TimeProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private AvailabilityRepository availabilityRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TimeProvider timeProvider;

    @InjectMocks
    private AvailabilityService availabilityService;

    private LocalDate testDate;
    private LocalDateTime testDateTime;
    private Availability testAvailability;

    @BeforeEach
    void setUp() {
        testDate = LocalDate.of(2025, 12, 25);
        testDateTime = LocalDateTime.of(2025, 12, 25, 0, 0);

        testAvailability = Availability.builder()
                .id("avail-1")
                .date(testDateTime)
                .isAvailable(true)
                .startTime("09:00")
                .endTime("18:00")
                .maxSlots(20) // Increased to allow more slots for testing
                .createdAt(LocalDateTime.now())
                .build();

        lenient().when(timeProvider.startOfDay(testDate)).thenReturn(testDateTime);
        lenient().when(timeProvider.startOfToday()).thenReturn(LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0));
    }

    @Test
    void getAvailableSlots_whenNoAvailabilityForDate_shouldReturnEmptyList() {
        when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.empty());

        List<AvailabilitySlotDto> slots = availabilityService.getAvailableSlots(testDate);

        assertThat(slots).isEmpty();
    }

    @Test
    void getAvailableSlots_whenAvailabilityNotAvailable_shouldReturnEmptyList() {
        testAvailability.setIsAvailable(false);
        when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.of(testAvailability));

        List<AvailabilitySlotDto> slots = availabilityService.getAvailableSlots(testDate);

        assertThat(slots).isEmpty();
    }

    // ===== Tests for availability flag - PENDING bookings (Item 3) =====

    @Test
    void getAvailableSlots_whenSlotHasPendingBooking_shouldMarkSlotUnavailable() {
        lenient().when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.of(testAvailability));
        // Default for all slots - available
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                eq(testDateTime), anyString(), anyList())).thenReturn(false);
        // Slot 09:00-09:30 has a PENDING booking - override default
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                eq(testDateTime), eq("09:00"), anyList())).thenReturn(true);

        List<AvailabilitySlotDto> slots = availabilityService.getAvailableSlots(testDate);

        assertThat(slots).isNotEmpty();
        // Find the 09:00 slot
        AvailabilitySlotDto slot0900 = slots.stream()
                .filter(s -> s.getStartTime().equals("09:00"))
                .findFirst()
                .orElseThrow();
        assertThat(slot0900.getAvailable()).isFalse();
        // Find the 09:30 slot
        AvailabilitySlotDto slot0930 = slots.stream()
                .filter(s -> s.getStartTime().equals("09:30"))
                .findFirst()
                .orElseThrow();
        assertThat(slot0930.getAvailable()).isTrue();
    }

    @Test
    void getAvailableSlots_whenSlotHasConfirmedBooking_shouldMarkSlotUnavailable() {
        lenient().when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.of(testAvailability));
        // Default for all slots - available
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                eq(testDateTime), anyString(), anyList())).thenReturn(false);
        // Slot 10:00-10:30 has a CONFIRMED booking - override default
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                eq(testDateTime), eq("10:00"), anyList())).thenReturn(true);

        List<AvailabilitySlotDto> slots = availabilityService.getAvailableSlots(testDate);

        AvailabilitySlotDto slot1000 = slots.stream()
                .filter(s -> s.getStartTime().equals("10:00"))
                .findFirst()
                .orElseThrow();
        assertThat(slot1000.getAvailable()).isFalse();
    }

    @Test
    void getAvailableSlots_whenSlotHasCancelledBooking_shouldMarkSlotAvailable() {
        lenient().when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.of(testAvailability));
        // CANCELLED bookings should NOT make slot unavailable
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                eq(testDateTime), anyString(), anyList())).thenReturn(false);

        List<AvailabilitySlotDto> slots = availabilityService.getAvailableSlots(testDate);

        AvailabilitySlotDto slot1100 = slots.stream()
                .filter(s -> s.getStartTime().equals("11:00"))
                .findFirst()
                .orElseThrow();
        assertThat(slot1100.getAvailable()).isTrue();
    }

    @Test
    void getAvailableSlots_whenSlotHasCompletedBooking_shouldMarkSlotAvailable() {
        lenient().when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.of(testAvailability));
        // COMPLETED bookings should NOT make slot unavailable
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                eq(testDateTime), anyString(), anyList())).thenReturn(false);

        List<AvailabilitySlotDto> slots = availabilityService.getAvailableSlots(testDate);

        AvailabilitySlotDto slot1200 = slots.stream()
                .filter(s -> s.getStartTime().equals("12:00"))
                .findFirst()
                .orElseThrow();
        assertThat(slot1200.getAvailable()).isTrue();
    }

    @Test
    void getAvailableSlots_whenSlotHasNoShowBooking_shouldMarkSlotAvailable() {
        lenient().when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.of(testAvailability));
        // NO_SHOW bookings should NOT make slot unavailable - all slots available
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                eq(testDateTime), anyString(), anyList())).thenReturn(false);

        List<AvailabilitySlotDto> slots = availabilityService.getAvailableSlots(testDate);

        // Find the 13:00 slot (should be within 09:00-18:00 with 20 max slots)
        AvailabilitySlotDto slot1300 = slots.stream()
                .filter(s -> s.getStartTime().equals("13:00"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("13:00 slot not found in generated slots: " + slots));
        assertThat(slot1300.getAvailable()).isTrue();
    }

    @Test
    void getAvailableSlots_respectsMaxSlotsLimit() {
        Availability limitedAvailability = Availability.builder()
                .id("avail-2")
                .date(testDateTime)
                .isAvailable(true)
                .startTime("09:00")
                .endTime("12:00") // 3 hours = 6 slots of 30 min
                .maxSlots(2) // But only 2 max slots
                .createdAt(LocalDateTime.now())
                .build();

        lenient().when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.of(limitedAvailability));
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), anyList()))
                .thenReturn(false);

        List<AvailabilitySlotDto> slots = availabilityService.getAvailableSlots(testDate);

        // Should only generate 2 slots (maxSlots) even though 6 would fit in the time range
        assertThat(slots).hasSize(2);
        assertThat(slots.get(0).getStartTime()).isEqualTo("09:00");
        assertThat(slots.get(1).getStartTime()).isEqualTo("09:30");
    }

    @Test
    void getAvailableSlots_usesTimeProviderForStartOfDay() {
        lenient().when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.of(testAvailability));
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), anyList()))
                .thenReturn(false);

        availabilityService.getAvailableSlots(testDate);

        verify(timeProvider).startOfDay(testDate);
    }

    @Test
    void getAvailableSlots_generatesCorrectSlotTimes() {
        Availability customAvailability = Availability.builder()
                .id("avail-3")
                .date(testDateTime)
                .isAvailable(true)
                .startTime("10:00")
                .endTime("11:00") // 1 hour = 2 slots
                .maxSlots(4)
                .createdAt(LocalDateTime.now())
                .build();

        lenient().when(availabilityRepository.findByDate(testDateTime)).thenReturn(Optional.of(customAvailability));
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), anyList()))
                .thenReturn(false);

        List<AvailabilitySlotDto> slots = availabilityService.getAvailableSlots(testDate);

        assertThat(slots).hasSize(2);
        assertThat(slots.get(0).getStartTime()).isEqualTo("10:00");
        assertThat(slots.get(0).getEndTime()).isEqualTo("10:30");
        assertThat(slots.get(1).getStartTime()).isEqualTo("10:30");
        assertThat(slots.get(1).getEndTime()).isEqualTo("11:00");
    }

    @Test
    void getAvailableDates_usesTimeProviderForStartOfToday() {
        LocalDateTime manilaToday = LocalDateTime.of(2025, 12, 20, 0, 0);
        lenient().when(timeProvider.startOfToday()).thenReturn(manilaToday);
        lenient().when(availabilityRepository.findAvailableDatesFrom(manilaToday)).thenReturn(List.of(testAvailability));

        List<AvailabilityDto> dates = availabilityService.getAvailableDates();

        assertThat(dates).hasSize(1);
        verify(timeProvider).startOfToday();
    }
}