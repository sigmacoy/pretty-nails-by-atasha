package com.prettynails.controller;

import com.prettynails.dto.BookingDtos.*;
import com.prettynails.entity.User;
import com.prettynails.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("No authenticated user");
        }
        return (User) authentication.getPrincipal();
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {
        User currentUser = getCurrentUser();
        BookingResponse response = bookingService.createBooking(currentUser, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingDto>> getUserBookings() {
        User currentUser = getCurrentUser();
        List<BookingDto> bookings = bookingService.getUserBookings(currentUser.getId());
        return ResponseEntity.ok(bookings);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/bookings/{id}/complete")
    public ResponseEntity<BookingDto> completeBooking(@PathVariable String id) {
        BookingDto completedBooking = bookingService.completeBooking(id);
        return ResponseEntity.ok(completedBooking);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/bookings")
    public ResponseEntity<List<BookingDto>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<BookingDto> bookings = bookingService.getAllBookings(status, startDate, endDate);
        return ResponseEntity.ok(bookings);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/bookings/{id}/confirm")
    public ResponseEntity<BookingDto> confirmBooking(@PathVariable String id) {
        BookingDto confirmedBooking = bookingService.confirmBooking(id);
        return ResponseEntity.ok(confirmedBooking);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/bookings/{id}/cancel")
    public ResponseEntity<BookingDto> cancelBooking(@PathVariable String id) {
        BookingDto cancelledBooking = bookingService.cancelBooking(id);
        return ResponseEntity.ok(cancelledBooking);
    }
}