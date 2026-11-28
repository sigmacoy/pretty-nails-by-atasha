package com.prettynails.service;

import com.prettynails.dto.PaymentDtos.*;
import com.prettynails.entity.Booking;
import com.prettynails.entity.Payment;
import com.prettynails.entity.User;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.BookingRepository;
import com.prettynails.repository.PaymentRepository;
import com.prettynails.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final TimeProvider timeProvider;

    public PaymentDto getPaymentByBookingId(String bookingId) {
        Optional<Payment> payment = paymentRepository.findByBookingId(bookingId);
        if (payment.isEmpty()) {
            throw new ResourceNotFoundException("Payment", "bookingId", bookingId);
        }
        return mapToDto(payment.get());
    }

    @Transactional
    public PaymentResponse createPayment(String userId, PaymentRequest request) {
        // Verify booking exists and belongs to user
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", request.getBookingId()));

        if (!booking.getUserId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("You can only create payments for your own bookings");
        }

        // Check if payment already exists for this booking
        Optional<Payment> existingOpt = paymentRepository.findByBookingId(request.getBookingId());
        Payment payment;
        if (existingOpt.isPresent()) {
            payment = existingOpt.get();
            // Prevent overwriting payment details - only allow updating reference if not set
            if (request.getReference() != null && (payment.getReference() == null || payment.getReference().isBlank())) {
                payment.setReference(request.getReference());
            }
            // Do NOT allow changing amount, method, or status here
        } else {
            payment = Payment.builder()
                    .bookingId(request.getBookingId())
                    .userId(userId)
                    .amount(request.getAmount())
                    .status("PENDING")
                    .method(request.getMethod() != null ? request.getMethod() : "GCASH")
                    .reference(request.getReference())
                    .build();
        }

        payment = paymentRepository.save(payment);

        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBookingId())
                .status(payment.getStatus())
                .message("Payment record processed")
                .build();
    }

    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        return createPayment(null, request);
    }

    @Transactional
    public PaymentDto verifyPayment(String paymentId, User admin) {
        // Use pessimistic locking to prevent concurrent verifications
        Payment payment = paymentRepository.findByIdWithPessimisticLock(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Double-check status after acquiring lock
        if ("PAID".equals(payment.getStatus())) {
            throw new IllegalStateException("Payment has already been verified.");
        }

        // Verify booking ownership (admin can verify any)
        String bookingId = payment.getBookingId();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        payment.setStatus("PAID");
        payment.setVerifiedAt(timeProvider.localNow());
        payment.setVerifiedBy(admin != null ? admin.getId() : "ADMIN");
        payment = paymentRepository.save(payment);

        // Update booking status to CONFIRMED
        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        return mapToDto(payment);
    }

    public List<PaymentDto> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private PaymentDto mapToDto(Payment p) {
        String createdAt = p.getCreatedAt() != null ? p.getCreatedAt().toString() : null;
        String updatedAt = p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null;
        String verifiedAt = p.getVerifiedAt() != null ? p.getVerifiedAt().toString() : null;

        return PaymentDto.builder()
                .id(p.getId())
                .bookingId(p.getBookingId())
                .userId(p.getUserId())
                .amount(p.getAmount())
                .status(p.getStatus())
                .method(p.getMethod())
                .reference(p.getReference())
                .verifiedAt(verifiedAt)
                .verifiedBy(p.getVerifiedBy())
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }
}