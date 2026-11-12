package com.prettynails.controller;

import com.prettynails.dto.AvailabilityDtos.*;
import com.prettynails.service.AvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @GetMapping("/api/availability")
    public List<AvailabilityDto> getAvailableDates() {
        return availabilityService.getAvailableDates();
    }

    @GetMapping("/api/admin/availability")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AvailabilityDto> getAdminAvailabilities(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        return availabilityService.getAdminAvailabilities(start, end);
    }

    @PostMapping("/api/admin/availability")
    @PreAuthorize("hasRole('ADMIN')")
    public AvailabilityDto upsertAvailability(@Valid @RequestBody AvailabilityRequest request) {
        return availabilityService.upsertAvailability(request);
    }

    @DeleteMapping("/api/admin/availability/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAvailability(@PathVariable String id) {
        availabilityService.deleteAvailability(id);
    }
}