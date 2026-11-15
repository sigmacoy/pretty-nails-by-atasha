package com.prettynails.controller;

import com.prettynails.dto.AvailabilityDtos.*;
import com.prettynails.entity.User;
import com.prettynails.service.AvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @GetMapping("/availability")
    public List<AvailabilityDto> getAvailableDates() {
        return availabilityService.getAvailableDates();
    }

    @GetMapping("/availability/slots")
    public List<AvailabilitySlotDto> getAvailableSlots(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return availabilityService.getAvailableSlots(date);
    }

    @GetMapping("/availability/staff/{staffId}")
    public List<AvailabilityDto> getStaffSchedule(@PathVariable String staffId) {
        return availabilityService.getStaffSchedule(staffId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/availability")
    public ResponseEntity<AvailabilityDto> createAvailability(@Valid @RequestBody AvailabilityRequest request) {
        return ResponseEntity.ok(availabilityService.createAvailability(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/availability/{id}")
    public ResponseEntity<AvailabilityDto> updateAvailability(
            @PathVariable String id,
            @Valid @RequestBody AvailabilityRequest request) {
        return ResponseEntity.ok(availabilityService.updateAvailability(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/availability/{id}")
    public ResponseEntity<Void> deleteAvailability(@PathVariable String id) {
        availabilityService.deleteAvailability(id);
        return ResponseEntity.noContent().build();
    }
}