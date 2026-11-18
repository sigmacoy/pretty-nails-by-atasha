package com.prettynails.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prettynails.dto.BookingDtos.*;
import com.prettynails.entity.Availability;
import com.prettynails.entity.Booking;
import com.prettynails.entity.Service;
import com.prettynails.entity.ServiceVariant;
import com.prettynails.entity.User;
import com.prettynails.IntegrationTestBase;
import com.prettynails.repository.*;
import com.prettynails.security.JwtUtil;
import com.prettynails.service.BookingService;
import com.prettynails.util.TimeProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.yml")
@Transactional
class BookingControllerIntegrationTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceVariantRepository serviceVariantRepository;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private LoyaltyCardRepository loyaltyCardRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TimeProvider timeProvider;

    @MockBean
    private BookingService bookingService;

    private User testUser;
    private String validToken;
    private Service testService;
    private ServiceVariant testVariant;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password(passwordEncoder.encode("password123"))
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        testUser = userRepository.save(testUser);

        // Create loyalty card
        var loyaltyCard = com.prettynails.entity.LoyaltyCard.builder()
                .userId(testUser.getId())
                .stampCount(0)
                .expiresAt(timeProvider.localNow().plusYears(1))
                .build();
        loyaltyCardRepository.save(loyaltyCard);

        // Generate valid JWT token
        validToken = jwtUtil.generateToken(testUser);

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

        // Ensure date is available
        Availability availability = Availability.builder()
                .date(timeProvider.startOfDay(LocalDate.of(2025, 12, 25)))
                .isAvailable(true)
                .build();
        availabilityRepository.save(availability);
    }

    @Test
    void createBooking_whenValidRequest_shouldReturnBookingResponse() throws Exception {
        // Given
        BookingRequest request = BookingRequest.builder()
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

        BookingResponse mockResponse = BookingResponse.builder()
                .bookingId("booking-123")
                .message("Booking created successfully")
                .build();

        when(bookingService.createBooking(any(User.class), any(BookingRequest.class))).thenReturn(mockResponse);

        // When/Then
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value("booking-123"))
                .andExpect(jsonPath("$.message").value("Booking created successfully"));

        verify(bookingService).createBooking(any(User.class), any(BookingRequest.class));
    }

    @Test
    void createBooking_whenNotAuthenticated_shouldReturnUnauthorized() throws Exception {
        // Given
        BookingRequest request = BookingRequest.builder()
                .appointmentDate("2025-12-25")
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

        // When/Then
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUserBookings_whenAuthenticated_shouldReturnBookings() throws Exception {
        // Given
        List<BookingDto> mockBookings = List.of(
                BookingDto.builder()
                        .id("booking-1")
                        .userId(testUser.getId())
                        .status("PENDING")
                        .appointmentDate("2025-12-25T00:00")
                        .startTime("10:00")
                        .endTime("12:00")
                        .totalPrice(50000)
                        .downpayment(10000)
                        .build(),
                BookingDto.builder()
                        .id("booking-2")
                        .userId(testUser.getId())
                        .status("CONFIRMED")
                        .appointmentDate("2025-12-26T00:00")
                        .startTime("14:00")
                        .endTime("16:00")
                        .totalPrice(60000)
                        .downpayment(10000)
                        .build()
        );

        when(bookingService.getUserBookings(anyString())).thenReturn(mockBookings);

        // When/Then
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value("booking-1"))
                .andExpect(jsonPath("$[1].id").value("booking-2"));

        verify(bookingService).getUserBookings(testUser.getId());
    }

    @Test
    void getBookingById_whenOwnBooking_shouldReturnBooking() throws Exception {
        // Given
        BookingDto mockBooking = BookingDto.builder()
                .id("booking-123")
                .userId(testUser.getId())
                .status("PENDING")
                .appointmentDate("2025-12-25T00:00")
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .build();

        when(bookingService.getBookingById(anyString())).thenReturn(mockBooking);

        // When/Then
        mockMvc.perform(get("/api/bookings/booking-123")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("booking-123"))
                .andExpect(jsonPath("$.userId").value(testUser.getId()));

        verify(bookingService).getBookingById("booking-123");
    }

    @Test
    void getBookingById_whenNotOwnBooking_shouldReturnForbidden() throws Exception {
        // Given
        BookingDto mockBooking = BookingDto.builder()
                .id("booking-123")
                .userId("other-user-id")
                .status("PENDING")
                .appointmentDate("2025-12-25T00:00")
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .build();

        when(bookingService.getBookingById(anyString())).thenReturn(mockBooking);

        // When/Then
        mockMvc.perform(get("/api/bookings/booking-123")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isForbidden());

        verify(bookingService).getBookingById("booking-123");
    }

    @Test
    void cancelBookingByCustomer_whenOwnBooking_shouldReturnCancelledBooking() throws Exception {
        // Given
        BookingDto mockBooking = BookingDto.builder()
                .id("booking-123")
                .userId(testUser.getId())
                .status("CANCELLED")
                .appointmentDate("2025-12-25T00:00")
                .startTime("10:00")
                .endTime("12:00")
                .totalPrice(50000)
                .downpayment(10000)
                .build();

        when(bookingService.cancelBookingByCustomer(anyString(), anyString())).thenReturn(mockBooking);

        // When/Then
        mockMvc.perform(put("/api/bookings/booking-123/cancel")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("booking-123"))
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(bookingService).cancelBookingByCustomer("booking-123", testUser.getId());
    }

    @Test
    void cancelBookingByCustomer_whenNotOwnBooking_shouldReturnBadRequest() throws Exception {
        // Given
        when(bookingService.cancelBookingByCustomer(anyString(), anyString()))
                .thenThrow(new com.prettynails.exception.BadRequestException("You can only cancel your own bookings"));

        // When/Then
        mockMvc.perform(put("/api/bookings/booking-123/cancel")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You can only cancel your own bookings"));

        verify(bookingService).cancelBookingByCustomer("booking-123", testUser.getId());
    }

    @Test
    void rescheduleBooking_whenValidRequest_shouldReturnRescheduledBooking() throws Exception {
        // Given
        RescheduleRequest request = RescheduleRequest.builder()
                .appointmentDate("2025-12-26")
                .startTime("14:00")
                .build();

        BookingDto mockBooking = BookingDto.builder()
                .id("booking-123")
                .userId(testUser.getId())
                .status("PENDING")
                .appointmentDate("2025-12-26T00:00")
                .startTime("14:00")
                .endTime("16:00")
                .totalPrice(50000)
                .downpayment(10000)
                .build();

        when(bookingService.rescheduleBooking(anyString(), anyString(), any(RescheduleRequest.class))).thenReturn(mockBooking);

        // When/Then
        mockMvc.perform(put("/api/bookings/booking-123/reschedule")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("booking-123"))
                .andExpect(jsonPath("$.appointmentDate").value("2025-12-26T00:00"))
                .andExpect(jsonPath("$.startTime").value("14:00"));

        verify(bookingService).rescheduleBooking(eq("booking-123"), eq(testUser.getId()), any(RescheduleRequest.class));
    }
}