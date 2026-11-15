package com.prettynails.controller;

import com.prettynails.dto.PaymentDtos.*;
import com.prettynails.entity.User;
import com.prettynails.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("No authenticated user");
        }
        return (User) authentication.getPrincipal();
    }

    @GetMapping("/payments/{bookingId}")
    public ResponseEntity<PaymentDto> getPaymentByBookingId(@PathVariable String bookingId) {
        // Customer can only see their own payment, admin can see all
        // For now, just return the payment
        return ResponseEntity.ok(paymentService.getPaymentByBookingId(bookingId));
    }

    @PostMapping("/payments")
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody PaymentRequest request) {
        User currentUser = null;
        try {
            currentUser = getCurrentUser();
        } catch (Exception ignored) {
        }
        return ResponseEntity.ok(paymentService.createPayment(currentUser, request));
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