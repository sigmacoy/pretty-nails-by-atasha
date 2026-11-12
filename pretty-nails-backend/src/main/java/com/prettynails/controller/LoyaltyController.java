package com.prettynails.controller;

import com.prettynails.dto.LoyaltyDtos.*;
import com.prettynails.entity.User;
import com.prettynails.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("No authenticated user");
        }
        return (User) authentication.getPrincipal();
    }

    // Customer endpoints
    @GetMapping("/loyalty/card")
    public ResponseEntity<LoyaltyCardDto> getLoyaltyCard() {
        User currentUser = getCurrentUser();
        LoyaltyCardDto card = loyaltyService.getLoyaltyCard(currentUser.getId());
        return ResponseEntity.ok(card);
    }

    @GetMapping("/loyalty/stamps")
    public ResponseEntity<List<LoyaltyStampDto>> getStampHistory() {
        User currentUser = getCurrentUser();
        List<LoyaltyStampDto> stamps = loyaltyService.getStampHistory(currentUser.getId());
        return ResponseEntity.ok(stamps);
    }

    @PostMapping("/loyalty/stamp")
    public ResponseEntity<StampResponse> addStampViaQr(@Valid @RequestBody StampRequest request) {
        User currentUser = getCurrentUser();
        StampResponse response = loyaltyService.addStampViaQr(currentUser.getId(), request.getQrCode());
        return ResponseEntity.ok(response);
    }

    // Admin endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/loyalty")
    public ResponseEntity<AdminLoyaltyPageResponse> getAllLoyaltyCards(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AdminLoyaltyCardDto> page = loyaltyService.getAllLoyaltyCards(search, pageable);
        AdminLoyaltyPageResponse response = AdminLoyaltyPageResponse.builder()
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

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/loyalty")
    public ResponseEntity<LoyaltyActionResponse> adminLoyaltyAction(@Valid @RequestBody LoyaltyActionRequest request) {
        LoyaltyActionResponse response = loyaltyService.adminLoyaltyAction(request);
        return ResponseEntity.ok(response);
    }
}