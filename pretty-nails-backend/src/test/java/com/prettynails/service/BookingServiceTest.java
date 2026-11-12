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
    private LoyaltyService loyaltyService;

    @InjectMocks
    private BookingService bookingService;

    private User testUser;
    private Booking testBooking;
    private BookingRequest bookingRequest;

    @BeforeEach
    void setUp() {
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
    void confirmBooking_whenRedeemLoyaltyRewardIsTrue_shouldDeductStamps() {
        testBooking.setRedeemLoyaltyReward(true);
        when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        BookingDto result = bookingService.confirmBooking("booking-123");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
        verify(loyaltyService).redeemRewardStamps("user-123", "booking-123", 10);
    }

    @Test
    void completeBooking_shouldUpdateStatusToCompleted() {
        when(bookingRepository.findById("booking-123")).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        BookingDto result = bookingService.completeBooking("booking-123");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("COMPLETED");
    }
}