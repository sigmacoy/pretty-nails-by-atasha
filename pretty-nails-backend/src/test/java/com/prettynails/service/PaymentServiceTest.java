package com.prettynails.service;

import com.prettynails.dto.PaymentDtos.*;
import com.prettynails.entity.Booking;
import com.prettynails.entity.Payment;
import com.prettynails.entity.User;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.BookingRepository;
import com.prettynails.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private PaymentService paymentService;

    private User testCustomer;
    private User testAdmin;
    private Booking testBooking;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        testCustomer = User.builder()
                .id("cust-123")
                .name("Maria Santos")
                .email("maria@example.com")
                .role("CUSTOMER")
                .build();

        testAdmin = User.builder()
                .id("admin-999")
                .name("Salon Admin")
                .email("admin@prettynails.com")
                .role("ADMIN")
                .build();

        testBooking = Booking.builder()
                .id("booking-001")
                .userId("cust-123")
                .status("PENDING")
                .build();

        testPayment = Payment.builder()
                .id("pay-001")
                .bookingId("booking-001")
                .userId("cust-123")
                .amount(10000)
                .status("PENDING")
                .method("GCASH")
                .reference("GCASH-987654321")
                .build();
    }

    @Test
    void createPayment_withAuthenticatedUser_shouldAssociateUserId() {
        PaymentRequest request = PaymentRequest.builder()
                .bookingId("booking-001")
                .amount(10000)
                .method("GCASH")
                .reference("REF123456")
                .build();

        when(paymentRepository.findByBookingId("booking-001")).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment saved = invocation.getArgument(0);
            saved.setId("pay-new");
            return saved;
        });

        PaymentResponse response = paymentService.createPayment(testCustomer, request);

        assertThat(response).isNotNull();
        assertThat(response.getBookingId()).isEqualTo("booking-001");

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment savedPayment = captor.getValue();
        assertThat(savedPayment.getUserId()).isEqualTo("cust-123");
        assertThat(savedPayment.getReference()).isEqualTo("REF123456");
        assertThat(savedPayment.getMethod()).isEqualTo("GCASH");
    }

    @Test
    void createPayment_whenExistingPaymentExists_shouldUpdateExistingPayment() {
        PaymentRequest request = PaymentRequest.builder()
                .bookingId("booking-001")
                .amount(10000)
                .method("MAYA")
                .reference("MAYA-UPDATED-REF")
                .build();

        when(paymentRepository.findByBookingId("booking-001")).thenReturn(Optional.of(testPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.createPayment(testCustomer, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("pay-001");

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment saved = captor.getValue();
        assertThat(saved.getReference()).isEqualTo("MAYA-UPDATED-REF");
        assertThat(saved.getMethod()).isEqualTo("MAYA");
        assertThat(saved.getUserId()).isEqualTo("cust-123");
    }

    @Test
    void createPayment_withoutUser_shouldFallbackToBookingUserId() {
        PaymentRequest request = PaymentRequest.builder()
                .bookingId("booking-001")
                .amount(10000)
                .method("GCASH")
                .reference("FALLBACK-REF")
                .build();

        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(testBooking));
        when(paymentRepository.findByBookingId("booking-001")).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment saved = invocation.getArgument(0);
            saved.setId("pay-fallback");
            return saved;
        });

        PaymentResponse response = paymentService.createPayment(null, request);

        assertThat(response).isNotNull();
        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo("cust-123");
    }

    @Test
    void verifyPayment_whenPaymentExists_shouldMarkPaidAndConfirmBooking() {
        when(paymentRepository.findById("pay-001")).thenReturn(Optional.of(testPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentDto verified = paymentService.verifyPayment("pay-001", testAdmin);

        assertThat(verified).isNotNull();
        assertThat(verified.getStatus()).isEqualTo("PAID");
        assertThat(verified.getVerifiedBy()).isEqualTo("admin-999");
        assertThat(verified.getVerifiedAt()).isNotNull();

        // Verify booking status was updated to CONFIRMED
        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        assertThat(bookingCaptor.getValue().getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    void verifyPayment_whenPaymentNotFound_shouldThrowException() {
        when(paymentRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.verifyPayment("non-existent", testAdmin))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
