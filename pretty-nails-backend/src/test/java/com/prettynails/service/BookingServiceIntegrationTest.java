package com.prettynails.service;

import com.prettynails.dto.BookingDtos.*;
import com.prettynails.entity.Availability;
import com.prettynails.entity.Booking;
import com.prettynails.entity.Payment;
import com.prettynails.entity.Service;
import com.prettynails.entity.ServiceVariant;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.IntegrationTestBase;
import com.prettynails.repository.*;
import com.prettynails.util.TimeProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

class BookingServiceIntegrationTest extends IntegrationTestBase {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingServiceRepository bookingServiceRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceVariantRepository serviceVariantRepository;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoyaltyCardRepository loyaltyCardRepository;

    @Autowired
    private LoyaltyService loyaltyService;

    @Autowired
    private TimeProvider timeProvider;

    private User testUser;
    private Service testService;
    private ServiceVariant testVariant;
    private BookingRequest bookingRequest;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        testUser = userRepository.save(testUser);

        // Create loyalty card for user
        var loyaltyCard = com.prettynails.entity.LoyaltyCard.builder()
                .userId(testUser.getId())
                .stampCount(0)
                .expiresAt(timeProvider.localNow().plusYears(1))
                .build();
        loyaltyCardRepository.save(loyaltyCard);

        // Create test service
        testService = new Service();
        testService.setName("Test Service");
        testService.setCategory("GEL");
        testService.setDescription("Test service description");
        testService.setBasePrice(50000);
        testService.setDuration(60);
        testService.setIsActive(true);
        testService = serviceRepository.save(testService);

        // Create test variant
        testVariant = ServiceVariant.builder()
                .serviceId(testService.getId())
                .name("Classic Single-Tone")
                .price(50000)
                .build();
        testVariant = serviceVariantRepository.save(testVariant);

        // Create booking request
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
                                .serviceId(testService.getId())
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        // Ensure date is available
        Availability availability = Availability.builder()
                .date(timeProvider.startOfDay(LocalDate.of(2025, 12, 25)))
                .isAvailable(true)
                .build();
        availabilityRepository.save(availability);
    }

    @Test
    void createBooking_whenValidRequest_shouldCreateBooking() {
        // When
        BookingResponse response = bookingService.createBooking(testUser, bookingRequest);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getBookingId()).isNotNull();
        assertThat(response.getMessage()).isNotNull();

        // Verify booking saved
        Booking saved = bookingRepository.findById(response.getBookingId()).orElseThrow();
        assertThat(saved.getUserId()).isEqualTo(testUser.getId());
        assertThat(saved.getStatus()).isEqualTo("PENDING");
        assertThat(saved.getAppointmentDate()).isEqualTo(timeProvider.startOfDay(LocalDate.of(2025, 12, 25)));
        assertThat(saved.getStartTime()).isEqualTo("10:00");
        assertThat(saved.getTotalPrice()).isEqualTo(50000);

        // Verify payment created
        Payment payment = paymentRepository.findByBookingId(response.getBookingId()).orElseThrow();
        assertThat(payment.getAmount()).isEqualTo(10000);
        assertThat(payment.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void createBooking_whenDateNotAvailable_shouldThrowBadRequestException() {
        // Given - make date unavailable
        Availability unavailableDate = Availability.builder()
                .date(timeProvider.startOfDay(LocalDate.of(2025, 12, 25)))
                .isAvailable(false)
                .build();
        availabilityRepository.save(unavailableDate);

        // When/Then
        assertThatThrownBy(() -> bookingService.createBooking(testUser, bookingRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not available");
    }

    @Test
    void createBooking_whenSlotAlreadyBookedPending_shouldThrowBadRequestException() {
        // Given - create first booking
        BookingResponse firstBooking = bookingService.createBooking(testUser, bookingRequest);
        assertThat(firstBooking).isNotNull();

        // Create another user
        User anotherUser = User.builder()
                .name("Another User")
                .email("another@example.com")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        User savedAnotherUser = userRepository.save(anotherUser);

        var anotherLoyaltyCard = com.prettynails.entity.LoyaltyCard.builder()
                .userId(savedAnotherUser.getId())
                .stampCount(0)
                .expiresAt(timeProvider.localNow().plusYears(1))
                .build();
        loyaltyCardRepository.save(anotherLoyaltyCard);

        // When/Then - attempt to book same slot
        assertThatThrownBy(() -> bookingService.createBooking(savedAnotherUser, bookingRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("time slot has just been booked");
    }

    @Test
    void createBooking_whenSlotAlreadyBookedConfirmed_shouldThrowBadRequestException() {
        // Given - create and confirm first booking
        BookingResponse firstBooking = bookingService.createBooking(testUser, bookingRequest);
        bookingService.confirmBooking(firstBooking.getBookingId());

        // Create another user
        User anotherUser = User.builder()
                .name("Another User")
                .email("another@example.com")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        User savedAnotherUser = userRepository.save(anotherUser);

        var anotherLoyaltyCard = com.prettynails.entity.LoyaltyCard.builder()
                .userId(savedAnotherUser.getId())
                .stampCount(0)
                .expiresAt(timeProvider.localNow().plusYears(1))
                .build();
        loyaltyCardRepository.save(anotherLoyaltyCard);

        // When/Then - attempt to book same slot
        assertThatThrownBy(() -> bookingService.createBooking(savedAnotherUser, bookingRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("time slot has just been booked");
    }

    @Test
    void confirmBooking_whenValid_shouldConfirmBooking() {
        // Given
        BookingResponse booking = bookingService.createBooking(testUser, bookingRequest);

        // When
        BookingDto confirmed = bookingService.confirmBooking(booking.getBookingId());

        // Then
        assertThat(confirmed).isNotNull();
        assertThat(confirmed.getStatus()).isEqualTo("CONFIRMED");

        Booking saved = bookingRepository.findById(booking.getBookingId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    void confirmBooking_whenAnotherPendingBookingExistsForSameSlot_shouldThrowBadRequestException() {
        // Given - create first booking (PENDING)
        BookingResponse booking1 = bookingService.createBooking(testUser, bookingRequest);

        // Create another user and booking for same slot (manually set to PENDING)
        User anotherUser = User.builder()
                .name("Another User")
                .email("another@example.com")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        anotherUser = userRepository.save(anotherUser);

        var anotherLoyaltyCard = com.prettynails.entity.LoyaltyCard.builder()
                .userId(anotherUser.getId())
                .stampCount(0)
                .expiresAt(timeProvider.localNow().plusYears(1))
                .build();
        loyaltyCardRepository.save(anotherLoyaltyCard);

        // Manually insert another PENDING booking for same slot (simulating race condition)
        Booking booking2 = Booking.builder()
                .userId(anotherUser.getId())
                .status("PENDING")
                .appointmentDate(timeProvider.startOfDay(LocalDate.of(2025, 12, 25)))
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(60000)
                .downpayment(10000)
                .notes("Another booking")
                .inspirationImg("http://example.com/image2.jpg")
                .redeemLoyaltyReward(false)
                .build();
        booking2 = bookingRepository.save(booking2);

        // When/Then - attempt to confirm first booking
        assertThatThrownBy(() -> bookingService.confirmBooking(booking1.getBookingId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("another PENDING or CONFIRMED booking already holds this date and time slot");
    }

    @Test
    void confirmBooking_whenOnlyCurrentBookingExistsForSlot_shouldConfirmSuccessfully() {
        // Given
        BookingResponse booking = bookingService.createBooking(testUser, bookingRequest);

        // When
        BookingDto confirmed = bookingService.confirmBooking(booking.getBookingId());

        // Then
        assertThat(confirmed).isNotNull();
        assertThat(confirmed.getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    void cancelBookingByCustomer_whenOwnBookingAndPending_shouldCancel() {
        // Given
        BookingResponse booking = bookingService.createBooking(testUser, bookingRequest);

        // When
        BookingDto cancelled = bookingService.cancelBookingByCustomer(booking.getBookingId(), testUser.getId());

        // Then
        assertThat(cancelled).isNotNull();
        assertThat(cancelled.getStatus()).isEqualTo("CANCELLED");

        Booking saved = bookingRepository.findById(booking.getBookingId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void cancelBookingByCustomer_whenNotOwnBooking_shouldThrowBadRequestException() {
        // Given
        BookingResponse booking = bookingService.createBooking(testUser, bookingRequest);
        final String bookingId = booking.getBookingId();

        // Create another user
        User anotherUser = User.builder()
                .name("Another User")
                .email("another@example.com")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        User savedAnotherUser = userRepository.save(anotherUser);

        // When/Then
        assertThatThrownBy(() -> bookingService.cancelBookingByCustomer(bookingId, savedAnotherUser.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You can only cancel your own bookings");
    }

    @Test
    void cancelBookingByCustomer_whenWithin24Hours_shouldThrowBadRequestException() {
        // Given - create booking for tomorrow (within 24 hours)
        LocalDateTime tomorrow = timeProvider.localNow().plusHours(12);
        String appointmentDate = tomorrow.toLocalDate().toString();

        BookingRequest soonRequest = BookingRequest.builder()
                .appointmentDate(appointmentDate)
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .services(List.of(
                        BookingServiceRequest.builder()
                                .serviceId(testService.getId())
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        // Ensure date is available
        Availability availability = Availability.builder()
                .date(timeProvider.startOfDay(tomorrow.toLocalDate()))
                .isAvailable(true)
                .build();
        availabilityRepository.save(availability);

        BookingResponse booking = bookingService.createBooking(testUser, soonRequest);

        // When/Then
        assertThatThrownBy(() -> bookingService.cancelBookingByCustomer(booking.getBookingId(), testUser.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("24 hours notice");
    }

    @Test
    void cancelBookingByCustomer_whenMoreThan24Hours_shouldAllowCancellation() {
        // Given - create booking for 2 days from now
        LocalDateTime future = timeProvider.localNow().plusDays(2);
        String appointmentDate = future.toLocalDate().toString();

        BookingRequest futureRequest = BookingRequest.builder()
                .appointmentDate(appointmentDate)
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .services(List.of(
                        BookingServiceRequest.builder()
                                .serviceId(testService.getId())
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        // Ensure date is available
        Availability availability = Availability.builder()
                .date(timeProvider.startOfDay(future.toLocalDate()))
                .isAvailable(true)
                .build();
        availabilityRepository.save(availability);

        BookingResponse booking = bookingService.createBooking(testUser, futureRequest);

        // When
        BookingDto cancelled = bookingService.cancelBookingByCustomer(booking.getBookingId(), testUser.getId());

        // Then
        assertThat(cancelled).isNotNull();
        assertThat(cancelled.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void rescheduleBooking_whenValidAndMoreThan24Hours_shouldReschedule() {
        // Given - create booking for 2 days from now
        LocalDateTime future = timeProvider.localNow().plusDays(2);
        String appointmentDate = future.toLocalDate().toString();

        BookingRequest futureRequest = BookingRequest.builder()
                .appointmentDate(appointmentDate)
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .services(List.of(
                        BookingServiceRequest.builder()
                                .serviceId(testService.getId())
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        // Ensure date is available
        Availability availability = Availability.builder()
                .date(timeProvider.startOfDay(future.toLocalDate()))
                .isAvailable(true)
                .build();
        availabilityRepository.save(availability);

        BookingResponse booking = bookingService.createBooking(testUser, futureRequest);

        // Create new date for reschedule (3 days from now)
        LocalDateTime newDate = timeProvider.localNow().plusDays(3);
        String newAppointmentDate = newDate.toLocalDate().toString();

        RescheduleRequest rescheduleRequest = RescheduleRequest.builder()
                .appointmentDate(newAppointmentDate)
                .startTime("14:00")
                .build();

        // Ensure new date is available
        Availability newAvailability = Availability.builder()
                .date(timeProvider.startOfDay(newDate.toLocalDate()))
                .isAvailable(true)
                .build();
        availabilityRepository.save(newAvailability);

        // When
        BookingDto rescheduled = bookingService.rescheduleBooking(booking.getBookingId(), testUser.getId(), rescheduleRequest);

        // Then
        assertThat(rescheduled).isNotNull();
        assertThat(rescheduled.getAppointmentDate()).contains(newAppointmentDate);
        assertThat(rescheduled.getStartTime()).isEqualTo("14:00");
    }

    @Test
    void rescheduleBooking_whenWithin24Hours_shouldThrowBadRequestException() {
        // Given - create booking for tomorrow (within 24 hours)
        LocalDateTime tomorrow = timeProvider.localNow().plusHours(12);
        String appointmentDate = tomorrow.toLocalDate().toString();

        BookingRequest soonRequest = BookingRequest.builder()
                .appointmentDate(appointmentDate)
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .services(List.of(
                        BookingServiceRequest.builder()
                                .serviceId(testService.getId())
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        // Ensure date is available
        Availability availability = Availability.builder()
                .date(timeProvider.startOfDay(tomorrow.toLocalDate()))
                .isAvailable(true)
                .build();
        availabilityRepository.save(availability);

        BookingResponse booking = bookingService.createBooking(testUser, soonRequest);

        // When/Then
        RescheduleRequest rescheduleRequest = RescheduleRequest.builder()
                .appointmentDate(timeProvider.localNow().plusDays(2).toLocalDate().toString())
                .startTime("14:00")
                .build();

        assertThatThrownBy(() -> bookingService.rescheduleBooking(booking.getBookingId(), testUser.getId(), rescheduleRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("24 hours notice");
    }

    @Test
    void rescheduleBooking_whenNewSlotAlreadyBooked_shouldThrowBadRequestException() {
        // Given - create first booking for 2 days from now
        LocalDateTime future = timeProvider.localNow().plusDays(2);
        String appointmentDate = future.toLocalDate().toString();

        BookingRequest futureRequest = BookingRequest.builder()
                .appointmentDate(appointmentDate)
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .services(List.of(
                        BookingServiceRequest.builder()
                                .serviceId(testService.getId())
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        // Ensure date is available
        Availability availability = Availability.builder()
                .date(timeProvider.startOfDay(future.toLocalDate()))
                .isAvailable(true)
                .build();
        availabilityRepository.save(availability);

        BookingResponse booking = bookingService.createBooking(testUser, futureRequest);

        // Create another user and booking for the new target slot
        User anotherUser = User.builder()
                .name("Another User")
                .email("another@example.com")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        anotherUser = userRepository.save(anotherUser);

        var anotherLoyaltyCard = com.prettynails.entity.LoyaltyCard.builder()
                .userId(anotherUser.getId())
                .stampCount(0)
                .expiresAt(timeProvider.localNow().plusYears(1))
                .build();
        loyaltyCardRepository.save(anotherLoyaltyCard);

        // Create booking for the target reschedule slot
        LocalDateTime newDate = timeProvider.localNow().plusDays(3);
        String newAppointmentDate = newDate.toLocalDate().toString();

        BookingRequest anotherRequest = BookingRequest.builder()
                .appointmentDate(newAppointmentDate)
                .startTime("14:00")
                .endTime("16:00")
                .totalPrice(60000)
                .downpayment(10000)
                .services(List.of(
                        BookingServiceRequest.builder()
                                .serviceId(testService.getId())
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        // Ensure new date is available
        Availability newAvailability = Availability.builder()
                .date(timeProvider.startOfDay(newDate.toLocalDate()))
                .isAvailable(true)
                .build();
        availabilityRepository.save(newAvailability);

        BookingResponse anotherBooking = bookingService.createBooking(anotherUser, anotherRequest);

        // When/Then - attempt to reschedule first booking to the taken slot
        RescheduleRequest rescheduleRequest = RescheduleRequest.builder()
                .appointmentDate(newAppointmentDate)
                .startTime("14:00")
                .build();

        assertThatThrownBy(() -> bookingService.rescheduleBooking(booking.getBookingId(), testUser.getId(), rescheduleRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("selected time slot is not available");
    }

    @Test
    void getUserBookings_shouldReturnUserBookings() {
        // Given
        BookingResponse booking1 = bookingService.createBooking(testUser, bookingRequest);

        // Create another booking for same user on different date
        LocalDateTime future = timeProvider.localNow().plusDays(3);
        BookingRequest futureRequest = BookingRequest.builder()
                .appointmentDate(future.toLocalDate().toString())
                .startTime("14:00")
                .endTime("16:00")
                .totalPrice(60000)
                .downpayment(10000)
                .services(List.of(
                        BookingServiceRequest.builder()
                                .serviceId(testService.getId())
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        Availability availability = Availability.builder()
                .date(timeProvider.startOfDay(future.toLocalDate()))
                .isAvailable(true)
                .build();
        availabilityRepository.save(availability);

        BookingResponse booking2 = bookingService.createBooking(testUser, futureRequest);

        // When
        List<BookingDto> bookings = bookingService.getUserBookings(testUser.getId());

        // Then
        assertThat(bookings).hasSize(2);
        // Should be ordered by appointment date descending (newest first)
        assertThat(bookings.get(0).getAppointmentDate()).contains(future.toLocalDate().toString());
        assertThat(bookings.get(1).getAppointmentDate()).contains("2025-12-25");
    }

    @Test
    void completeBooking_shouldUpdateStatusToCompleted() {
        // Given
        BookingResponse booking = bookingService.createBooking(testUser, bookingRequest);
        bookingService.confirmBooking(booking.getBookingId());

        // When
        BookingDto completed = bookingService.completeBooking(booking.getBookingId());

        // Then
        assertThat(completed).isNotNull();
        assertThat(completed.getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    void confirmBooking_whenRedeemLoyaltyReward_shouldDeductStamps() {
        // Given - user has 10 stamps
        var loyaltyCard = loyaltyCardRepository.findByUserId(testUser.getId()).orElseThrow();
        loyaltyCard.setStampCount(10);
        loyaltyCardRepository.save(loyaltyCard);

        // Create booking with loyalty reward
        BookingRequest rewardRequest = BookingRequest.builder()
                .appointmentDate("2025-12-26")
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .redeemLoyaltyReward(true)
                .services(List.of(
                        BookingServiceRequest.builder()
                                .serviceId(testService.getId())
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        Availability availability = Availability.builder()
                .date(timeProvider.startOfDay(LocalDate.of(2025, 12, 26)))
                .isAvailable(true)
                .build();
        availabilityRepository.save(availability);

        BookingResponse booking = bookingService.createBooking(testUser, rewardRequest);

        // When
        BookingDto confirmed = bookingService.confirmBooking(booking.getBookingId());

        // Then
        assertThat(confirmed).isNotNull();
        assertThat(confirmed.getStatus()).isEqualTo("CONFIRMED");
        assertThat(confirmed.getRedeemLoyaltyReward()).isTrue();

        // Verify stamps deducted
        var updatedCard = loyaltyCardRepository.findByUserId(testUser.getId()).orElseThrow();
        assertThat(updatedCard.getStampCount()).isEqualTo(0);
    }
}