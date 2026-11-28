package com.prettynails.controller;

import com.prettynails.dto.PaymentDtos.*;
import com.prettynails.entity.User;
import com.prettynails.security.CustomUserDetails;
import com.prettynails.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController extends BaseController {

    private final PaymentService paymentService;

    @GetMapping("/payments/{bookingId}")
    public ResponseEntity<PaymentDto> getPaymentByBookingId(@PathVariable String bookingId) {
        User currentUser = getCurrentUser();
        PaymentDto payment = paymentService.getPaymentByBookingId(bookingId);

        // Customer can only see their own payment, admin can see all
        if (!payment.getUserId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new AccessDeniedException("You can only view your own payments");
        }

        return ResponseEntity.ok(payment);
    }

    @PostMapping("/payments")
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody PaymentRequest request) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(paymentService.createPayment(currentUser.getId(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/payments/{id}/verify")
    public ResponseEntity<PaymentDto> verifyPayment(@PathVariable String id) {
        User admin = getCurrentUser();
        return ResponseEntity.ok(paymentService.verifyPayment(id, admin));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/payments")
    public ResponseEntity<java.util.List<PaymentDto>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }
}