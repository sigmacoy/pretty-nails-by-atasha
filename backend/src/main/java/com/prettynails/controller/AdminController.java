package com.prettynails.controller;

import com.prettynails.dto.AdminDtos.*;
import com.prettynails.dto.LoyaltyDtos.LoyaltySettingsDto;
import com.prettynails.entity.User;
import com.prettynails.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    private String getCurrentAdminId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("No authenticated user");
        }
        return ((User) authentication.getPrincipal()).getId();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public AdminStatsDto getAdminStats() {
        return adminService.getAdminStats();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/reports")
    public AdminReportsDto getAdminReports(@RequestParam(required = false, defaultValue = "this-month") String period) {
        return adminService.getAdminReports(period);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/settings")
    public LoyaltySettingsDto getLoyaltySettings() {
        return adminService.getLoyaltySettings();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/settings")
    public LoyaltySettingsDto updateLoyaltySettings(@RequestBody LoyaltySettingsDto settings) {
        return adminService.updateLoyaltySettings(settings);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/customers")
    public List<CustomerListDto> getCustomers(@RequestParam(required = false) String search) {
        return adminService.getCustomers(search);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/customers/{userId}/notes")
    public CustomerNoteDto addCustomerNote(
            @PathVariable String userId,
            @RequestBody CustomerNoteRequest request
    ) {
        String adminId = getCurrentAdminId();
        return adminService.addCustomerNote(userId, adminId, request);
    }
}