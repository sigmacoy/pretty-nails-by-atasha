package com.prettynails.controller;

import com.prettynails.dto.AdminDtos.*;
import com.prettynails.entity.User;
import com.prettynails.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("No authenticated user");
        }
        return (User) authentication.getPrincipal();
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/reports")
    public ResponseEntity<AdminReportsDto> getReports(@RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(adminService.getReports(period));
    }

    @GetMapping("/settings")
    public ResponseEntity<LoyaltySettingsDto> getLoyaltySettings() {
        return ResponseEntity.ok(adminService.getLoyaltySettings());
    }

    @PostMapping("/settings")
    public ResponseEntity<LoyaltySettingsDto> updateLoyaltySettings(@Valid @RequestBody LoyaltySettingsDto settings) {
        return ResponseEntity.ok(adminService.updateLoyaltySettings(settings));
    }

    @GetMapping("/customers")
    public ResponseEntity<CustomerPageResponse> getCustomers(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        var page = adminService.getCustomers(search, pageable);
        CustomerPageResponse response = CustomerPageResponse.builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/customers/{userId}/notes")
    public ResponseEntity<CustomerNoteDto> addCustomerNote(
            @PathVariable String userId,
            @Valid @RequestBody CustomerNoteRequest request) {
        User currentUser = getCurrentUser();
        CustomerNoteDto note = adminService.addCustomerNote(userId, request.getContent(), currentUser.getId());
        return ResponseEntity.ok(note);
    }
}