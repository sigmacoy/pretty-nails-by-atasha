package com.prettynails.service;

import com.prettynails.dto.PaymentDtos.*;
import com.prettynails.entity.Booking;
import com.prettynails.entity.Payment;
import com.prettynails.entity.User;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.BookingRepository;
import com.prettynails.repository.PaymentRepository;
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

    public PaymentDto getPaymentByBookingId(String bookingId) {
        Optional<Payment> payment = paymentRepository.findByBookingId(bookingId);
        if (payment.isEmpty()) {
            throw new ResourceNotFoundException("Payment", "bookingId", bookingId);
        }
        return mapToDto(payment.get());
    }

    @Transactional
    public PaymentResponse createPayment(User user, PaymentRequest request) {
        String userId = (user != null && user.getId() != null) ? user.getId() : "";
        if (userId.isEmpty() && request.getBookingId() != null) {
            userId = bookingRepository.findById(request.getBookingId())
                    .map(Booking::getUserId)
                    .orElse("");
        }

        // Check if payment already exists for this booking
        Optional<Payment> existingOpt = paymentRepository.findByBookingId(request.getBookingId());
        Payment payment;
        if (existingOpt.isPresent()) {
            payment = existingOpt.get();
            if (!userId.isEmpty()) {
                payment.setUserId(userId);
            }
            if (request.getAmount() != null) {
                payment.setAmount(request.getAmount());
            }
            if (request.getMethod() != null) {
                payment.setMethod(request.getMethod());
            }
            if (request.getReference() != null) {
                payment.setReference(request.getReference());
            }
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
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        payment.setStatus("PAID");
        payment.setVerifiedAt(LocalDateTime.now());
        payment.setVerifiedBy(admin != null ? admin.getId() : "ADMIN");
        payment = paymentRepository.save(payment);

        // Update booking status to CONFIRMED
        Optional<Booking> bookingOpt = bookingRepository.findById(payment.getBookingId());
        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            booking.setStatus("CONFIRMED");
            bookingRepository.save(booking);
        }

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