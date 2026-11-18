package com.prettynails.service;

import com.prettynails.dto.BookingDtos.*;
import com.prettynails.entity.Availability;
import com.prettynails.entity.Booking;
import com.prettynails.entity.Payment;
import com.prettynails.entity.ServiceVariant;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.*;
import com.prettynails.service.BookingService;
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
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingServiceRepository bookingServiceRepository;

    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private ServiceVariantRepository serviceVariantRepository;

    @Mock
    private AvailabilityRepository availabilityRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoyaltyCardRepository loyaltyCardRepository;

    @Mock
    private TimeProvider timeProvider;

    @InjectMocks
    private BookingService bookingService;

    private User testUser;
    private Booking testBooking;
    private BookingRequest bookingRequest;

    @BeforeEach
    void setUp() {
        lenient().when(timeProvider.localNow()).thenReturn(LocalDateTime.now());
        lenient().when(timeProvider.isAtLeast24HoursInFuture(any())).thenReturn(true);

        testUser = User.builder()
                .id("user-123")
                .name("Test User")
                .email("test@example.com")
                .role("CUSTOMER")
                .build();

        bookingRequest = BookingRequest.builder()
                .appointmentDate("2025-12-25")
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImage("http://example.com/image.jpg")
                .services(List.of(
                        BookingServiceRequest.builder()
                                .serviceId("service-1")
                                .variantId("variant-1")
                                .quantity(1)
                                .build()
                ))
                .build();

        testBooking = Booking.builder()
                .id("booking-123")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(LocalDateTime.of(2025, 12, 25, 0, 0))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .services(List.of())
                .redeemLoyaltyReward(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createBooking_whenValidRequest_shouldCreateBooking() {
        when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any())).thenReturn(List.of());
        when(bookingRepository.countByAppointmentDateBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);

        // Need to mock service and variant lookup
        var testService = new com.prettynails.entity.Service();
        testService.setId("service-1");
        testService.setName("Test Service");
        testService.setBasePrice(50000);
        testService.setVariants(List.of());

        when(serviceRepository.findById("service-1")).thenReturn(Optional.of(testService));

        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);
        when(bookingServiceRepository.save(any(com.prettynails.entity.BookingService.class))).thenReturn(null);
        when(paymentRepository.save(any(Payment.class))).thenReturn(null);

        BookingResponse response = bookingService.createBooking(testUser, bookingRequest);

        assertThat(response).isNotNull();
        assertThat(response.getBookingId()).isEqualTo("booking-123");
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void createBooking_whenDateNotAvailable_shouldThrowBadRequestException() {
        Availability unavailableDate = Availability.builder()
                .date(LocalDateTime.of(2025, 12, 25, 0, 0))
                .isAvailable(false)
                .build();

        when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any()))
                .thenReturn(List.of(unavailableDate));

        assertThatThrownBy(() -> bookingService.createBooking(testUser, bookingRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not available");
    }

    @Test
    void getUserBookings_shouldReturnUserBookings() {
        when(bookingRepository.findByUserIdOrderByAppointmentDateDesc("user-123"))
                .thenReturn(List.of(testBooking));

        List<BookingDto> bookings = bookingService.getUserBookings("user-123");

        assertThat(bookings).hasSize(1);
        assertThat(bookings.get(0).getId()).isEqualTo("booking-123");
    }

    @Test
    void getBookingById_whenBookingExists_shouldReturnBookingDto() {
        when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBooking));

        BookingDto booking = bookingService.getBookingById("booking-123");

        assertThat(booking).isNotNull();
        assertThat(booking.getId()).isEqualTo("booking-123");
    }

    @Test
    void getBookingById_whenBookingNotExists_shouldThrowResourceNotFoundException() {
        when(bookingRepository.findById("booking-123")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.getBookingById("booking-123"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Booking not found with id");
    }

    @Test
    void cancelBookingByCustomer_whenOwnBookingAndPending_shouldCancel() {
        when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        BookingDto result = bookingService.cancelBookingByCustomer("booking-123", "user-123");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void cancelBookingByCustomer_whenNotOwnBooking_shouldThrowBadRequestException() {
        when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBooking));

        assertThatThrownBy(() -> bookingService.cancelBookingByCustomer("booking-123", "other-user"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You can only cancel your own bookings");
    }

    @Test
    void cancelBookingByCustomer_whenCompleted_shouldThrowBadRequestException() {
        testBooking.setStatus("COMPLETED");
        when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBooking));

        assertThatThrownBy(() -> bookingService.cancelBookingByCustomer("booking-123", "user-123"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only PENDING or CONFIRMED bookings can be cancelled");
    }

    @Test
    void completeBooking_shouldUpdateStatusToCompleted() {
        when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        BookingDto result = bookingService.completeBooking("booking-123");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("COMPLETED");
    }

    // ===== Tests for partial unique index / slot conflict (Item 1, 5) =====

    @Test
    void createBooking_whenSlotAlreadyBookedPending_shouldThrowBadRequestException() {
        lenient().when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any())).thenReturn(List.of());
        lenient().when(bookingRepository.countByAppointmentDateBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), any()))
                .thenReturn(true); // Slot already taken by PENDING booking

        var testService = new com.prettynails.entity.Service();
        testService.setId("service-1");
        testService.setName("Test Service");
        testService.setBasePrice(50000);
        testService.setVariants(List.of());

        lenient().when(serviceRepository.findById("service-1")).thenReturn(Optional.of(testService));

        assertThatThrownBy(() -> bookingService.createBooking(testUser, bookingRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("time slot has just been booked");
    }

    @Test
    void createBooking_whenSlotAlreadyBookedConfirmed_shouldThrowBadRequestException() {
        lenient().when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any())).thenReturn(List.of());
        lenient().when(bookingRepository.countByAppointmentDateBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), any()))
                .thenReturn(true); // Slot already taken by CONFIRMED booking

        var testService = new com.prettynails.entity.Service();
        testService.setId("service-1");
        testService.setName("Test Service");
        testService.setBasePrice(50000);
        testService.setVariants(List.of());

        lenient().when(serviceRepository.findById("service-1")).thenReturn(Optional.of(testService));

        assertThatThrownBy(() -> bookingService.createBooking(testUser, bookingRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("time slot has just been booked");
    }

    @Test
    void confirmBooking_whenAnotherPendingBookingExistsForSameSlot_shouldThrowBadRequestException() {
        // Another booking (different ID) already holds this slot as PENDING
        Booking testBookingForConfirm = Booking.builder()
                .id("booking-123")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(LocalDateTime.of(2025, 12, 25, 0, 0))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .services(List.of())
                .redeemLoyaltyReward(false)
                .createdAt(LocalDateTime.now())
                .build();

        lenient().when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBookingForConfirm));
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                any(), anyString(), any())).thenReturn(true);
        lenient().when(bookingRepository.countByAppointmentDateAndStartTimeAndStatusInAndIdNot(
                any(), anyString(), any(), anyString())).thenReturn(1L);

        assertThatThrownBy(() -> bookingService.confirmBooking("booking-123"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("another PENDING or CONFIRMED booking already holds this date and time slot");
    }

    @Test
    void confirmBooking_whenAnotherConfirmedBookingExistsForSameSlot_shouldThrowBadRequestException() {
        Booking testBookingForConfirm = Booking.builder()
                .id("booking-123")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(LocalDateTime.of(2025, 12, 25, 0, 0))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .services(List.of())
                .redeemLoyaltyReward(false)
                .createdAt(LocalDateTime.now())
                .build();

        lenient().when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBookingForConfirm));
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                any(), anyString(), any())).thenReturn(true);
        lenient().when(bookingRepository.countByAppointmentDateAndStartTimeAndStatusInAndIdNot(
                any(), anyString(), any(), anyString())).thenReturn(1L);

        assertThatThrownBy(() -> bookingService.confirmBooking("booking-123"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("another PENDING or CONFIRMED booking already holds this date and time slot");
    }

    @Test
    void confirmBooking_whenOnlyCurrentBookingExistsForSlot_shouldConfirmSuccessfully() {
        Booking testBookingForConfirm = Booking.builder()
                .id("booking-123")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(LocalDateTime.of(2025, 12, 25, 0, 0))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .services(List.of())
                .redeemLoyaltyReward(false)
                .createdAt(LocalDateTime.now())
                .build();

        lenient().when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBookingForConfirm));
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(
                any(), anyString(), any())).thenReturn(true);
        lenient().when(bookingRepository.countByAppointmentDateAndStartTimeAndStatusInAndIdNot(
                any(), anyString(), any(), anyString())).thenReturn(0L); // No OTHER bookings
        lenient().when(bookingRepository.save(any(Booking.class))).thenReturn(testBookingForConfirm);

        BookingDto result = bookingService.confirmBooking("booking-123");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
    }

    // ===== Tests for timezone boundary calculations using TimeProvider (Item 2) =====

    @Test
    void createBooking_usesTimeProviderForStartOfDay() {
        LocalDateTime manilaStartOfDay = LocalDateTime.of(2025, 12, 25, 0, 0);
        lenient().when(timeProvider.startOfDay(LocalDate.of(2025, 12, 25))).thenReturn(manilaStartOfDay);
        lenient().when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any())).thenReturn(List.of());
        lenient().when(bookingRepository.countByAppointmentDateBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), any())).thenReturn(false);

        var testService = new com.prettynails.entity.Service();
        testService.setId("service-1");
        testService.setName("Test Service");
        testService.setBasePrice(50000);
        testService.setVariants(List.of());
        lenient().when(serviceRepository.findById("service-1")).thenReturn(Optional.of(testService));
        lenient().when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);
        lenient().when(bookingServiceRepository.save(any())).thenReturn(null);
        lenient().when(paymentRepository.save(any(Payment.class))).thenReturn(null);

        bookingService.createBooking(testUser, bookingRequest);

        // Verify TimeProvider.startOfDay was called for the appointment date (at least once)
        verify(timeProvider, atLeastOnce()).startOfDay(LocalDate.of(2025, 12, 25));
        // Verify the appointment date was set using Manila timezone start of day
        verify(bookingRepository).save(argThat(b -> b.getAppointmentDate().equals(manilaStartOfDay)));
    }

    @Test
    void createBooking_usesTimeProviderForAvailabilityDateRange() {
        lenient().when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any())).thenReturn(List.of());
        lenient().when(bookingRepository.countByAppointmentDateBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), any())).thenReturn(false);

        var testService = new com.prettynails.entity.Service();
        testService.setId("service-1");
        testService.setName("Test Service");
        testService.setBasePrice(50000);
        testService.setVariants(List.of());
        lenient().when(serviceRepository.findById("service-1")).thenReturn(Optional.of(testService));
        lenient().when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);
        lenient().when(bookingServiceRepository.save(any())).thenReturn(null);
        lenient().when(paymentRepository.save(any(Payment.class))).thenReturn(null);

        bookingService.createBooking(testUser, bookingRequest);

        // Verify availability check uses TimeProvider.startOfDay and endOfDay (at least once each)
        verify(timeProvider, atLeastOnce()).startOfDay(LocalDate.of(2025, 12, 25));
        verify(timeProvider, atLeastOnce()).endOfDay(LocalDate.of(2025, 12, 25));
    }

    @Test
    void rescheduleBooking_usesTimeProviderForNewDate() {
        Booking testBookingForReschedule = Booking.builder()
                .id("booking-123")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(LocalDateTime.of(2025, 12, 25, 0, 0))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .services(List.of())
                .redeemLoyaltyReward(false)
                .createdAt(LocalDateTime.now())
                .build();

        LocalDateTime newStartOfDay = LocalDateTime.of(2025, 12, 26, 0, 0);
        LocalDateTime newEndOfDay = LocalDateTime.of(2025, 12, 26, 23, 59, 59, 999_999_999);

        BookingRequest rescheduleRequest = BookingRequest.builder()
                .appointmentDate("2025-12-26")
                .startTime("14:00")
                .endTime("16:00")
                .totalPrice(50000)
                .downpayment(10000)
                .build();

        lenient().when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBookingForReschedule));
        lenient().when(timeProvider.isAtLeast24HoursInFuture(any())).thenReturn(true);
        lenient().when(timeProvider.startOfDay(LocalDate.of(2025, 12, 26))).thenReturn(newStartOfDay);
        lenient().when(timeProvider.endOfDay(LocalDate.of(2025, 12, 26))).thenReturn(newEndOfDay);
        lenient().when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any())).thenReturn(List.of());
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), any())).thenReturn(false);
        lenient().when(bookingRepository.countByAppointmentDateBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
        lenient().when(bookingRepository.save(any(Booking.class))).thenReturn(testBookingForReschedule);

        // Need a real TimeProvider for the date parsing to work with mocked startOfDay
        // The service uses LocalDate.parse then timeProvider.startOfDay
        // This verifies the flow uses TimeProvider for the new date
        bookingService.rescheduleBooking("booking-123", "user-123", RescheduleRequest.builder()
                .appointmentDate("2025-12-26")
                .startTime("14:00")
                .build());

        // Service calls startOfDay twice (once for newAppointmentDateTime, once for startOfDay variable)
        verify(timeProvider, times(2)).startOfDay(LocalDate.of(2025, 12, 26));
        verify(timeProvider).endOfDay(LocalDate.of(2025, 12, 26));
    }

    // ===== Tests for 24-hour cutoff using TimeProvider (Item 7) =====

    @Test
    void cancelBookingByCustomer_within24Hours_shouldThrowBadRequestException() {
        LocalDateTime appointmentSoon = LocalDateTime.now().plusHours(12); // Within 24 hours
        testBooking.setAppointmentDate(appointmentSoon.withHour(10).withMinute(0));
        testBooking.setStartTime("10:00");

        when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBooking));
        when(timeProvider.isAtLeast24HoursInFuture(any())).thenReturn(false); // Within 24 hours

        assertThatThrownBy(() -> bookingService.cancelBookingByCustomer("booking-123", "user-123"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("24 hours notice");
    }

    @Test
    void cancelBookingByCustomer_moreThan24Hours_shouldAllowCancellation() {
        LocalDateTime appointmentLater = LocalDateTime.now().plusHours(48); // More than 24 hours
        testBooking.setAppointmentDate(appointmentLater.withHour(10).withMinute(0));
        testBooking.setStartTime("10:00");

        when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBooking));
        when(timeProvider.isAtLeast24HoursInFuture(any())).thenReturn(true); // More than 24 hours
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        BookingDto result = bookingService.cancelBookingByCustomer("booking-123", "user-123");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void rescheduleBooking_within24Hours_shouldThrowBadRequestException() {
        LocalDateTime appointmentSoon = LocalDateTime.now().plusHours(12);
        Booking testBookingForReschedule = Booking.builder()
                .id("booking-123")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(appointmentSoon.withHour(10).withMinute(0))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .services(List.of())
                .redeemLoyaltyReward(false)
                .createdAt(LocalDateTime.now())
                .build();

        lenient().when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBookingForReschedule));
        lenient().when(timeProvider.isAtLeast24HoursInFuture(any())).thenReturn(false);

        assertThatThrownBy(() -> bookingService.rescheduleBooking("booking-123", "user-123",
                RescheduleRequest.builder().appointmentDate("2025-12-26").startTime("14:00").build()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("24 hours notice");
    }

    @Test
    void rescheduleBooking_moreThan24Hours_shouldAllowReschedule() {
        LocalDateTime appointmentLater = LocalDateTime.now().plusHours(48);
        Booking testBookingForReschedule = Booking.builder()
                .id("booking-123")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(appointmentLater.withHour(10).withMinute(0))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .services(List.of())
                .redeemLoyaltyReward(false)
                .createdAt(LocalDateTime.now())
                .build();

        LocalDateTime newStartOfDay = LocalDateTime.of(2025, 12, 26, 0, 0);
        LocalDateTime newEndOfDay = LocalDateTime.of(2025, 12, 26, 23, 59, 59, 999_999_999);

        lenient().when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBookingForReschedule));
        lenient().when(timeProvider.isAtLeast24HoursInFuture(any())).thenReturn(true);
        lenient().when(timeProvider.startOfDay(LocalDate.of(2025, 12, 26))).thenReturn(newStartOfDay);
        lenient().when(timeProvider.endOfDay(LocalDate.of(2025, 12, 26))).thenReturn(newEndOfDay);
        lenient().when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any())).thenReturn(List.of());
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), any())).thenReturn(false);
        lenient().when(bookingRepository.countByAppointmentDateBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
        lenient().when(bookingRepository.save(any(Booking.class))).thenReturn(testBookingForReschedule);

        BookingDto result = bookingService.rescheduleBooking("booking-123", "user-123",
                RescheduleRequest.builder().appointmentDate("2025-12-26").startTime("14:00").build());

        assertThat(result).isNotNull();
        // LocalDateTime.toString() omits seconds when zero, so format is "2025-12-26T00:00"
        assertThat(result.getAppointmentDate()).isEqualTo("2025-12-26T00:00");
    }

    // ===== Tests for rescheduleBooking slot conflict check (Item 5) =====

    @Test
    void rescheduleBooking_whenNewSlotAlreadyBookedByAnother_shouldThrowBadRequestException() {
        LocalDateTime appointmentLater = LocalDateTime.now().plusHours(48);
        Booking testBookingForReschedule = Booking.builder()
                .id("booking-123")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(appointmentLater.withHour(10).withMinute(0))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .services(List.of())
                .redeemLoyaltyReward(false)
                .createdAt(LocalDateTime.now())
                .build();

        lenient().when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBookingForReschedule));
        lenient().when(timeProvider.isAtLeast24HoursInFuture(any())).thenReturn(true);
        lenient().when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any())).thenReturn(List.of());
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), any())).thenReturn(true); // New slot taken
        lenient().when(bookingRepository.countByAppointmentDateBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);

        assertThatThrownBy(() -> bookingService.rescheduleBooking("booking-123", "user-123",
                RescheduleRequest.builder().appointmentDate("2025-12-26").startTime("14:00").build()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("selected time slot is not available");
    }

    @Test
    void rescheduleBooking_whenMovingToSameSlot_shouldAllow() {
        // Use a fixed date for consistency
        LocalDate testDate = LocalDate.of(2025, 12, 26);
        LocalDateTime testAppointmentDate = testDate.atStartOfDay(); // 00:00 - start of day
        LocalDateTime appointmentLater = testAppointmentDate.plusHours(48); // Future date for 24-hour check

        Booking testBookingForReschedule = Booking.builder()
                .id("booking-123")
                .userId("user-123")
                .status("PENDING")
                .appointmentDate(testAppointmentDate) // Start of day (00:00)
                .startTime("10:00") // Actual start time
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .notes("Test booking")
                .inspirationImg("http://example.com/image.jpg")
                .services(List.of())
                .redeemLoyaltyReward(false)
                .createdAt(LocalDateTime.now())
                .build();

        LocalDateTime newStartOfDay = testAppointmentDate; // Same date
        LocalDateTime newEndOfDay = testDate.atTime(23, 59, 59, 999_999_999);

        lenient().when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBookingForReschedule));
        lenient().when(timeProvider.isAtLeast24HoursInFuture(any())).thenReturn(true);
        lenient().when(timeProvider.startOfDay(testDate)).thenReturn(newStartOfDay);
        lenient().when(timeProvider.endOfDay(testDate)).thenReturn(newEndOfDay);
        lenient().when(availabilityRepository.findByDateBetweenOrderByDateAsc(any(), any())).thenReturn(List.of());
        lenient().when(bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(any(), anyString(), any())).thenReturn(true); // Same slot (current booking)
        lenient().when(bookingRepository.countByAppointmentDateBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
        lenient().when(bookingRepository.save(any(Booking.class))).thenReturn(testBookingForReschedule);

        BookingDto result = bookingService.rescheduleBooking("booking-123", "user-123",
                RescheduleRequest.builder().appointmentDate(testDate.toString()).startTime("10:00").build());

        assertThat(result).isNotNull();
    }
}