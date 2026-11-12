package com.prettynails.controller;

import com.prettynails.dto.LoyaltyDtos.*;
import com.prettynails.entity.User;
import com.prettynails.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("/loyalty/card")
    public ResponseEntity<LoyaltyCardDto> getLoyaltyCard() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        LoyaltyCardDto card = loyaltyService.getUserLoyaltyCard(user.getId());
        return ResponseEntity.ok(card);
    }

    @PostMapping("/loyalty/stamp")
    public ResponseEntity<StampResponse> addStamp(@Valid @RequestBody StampRequest request) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        StampResponse response = loyaltyService.addStampViaQrCode(user.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/loyalty")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminLoyaltyCardDto>> getAllLoyaltyCards() {
        List<AdminLoyaltyCardDto> cards = loyaltyService.getAllLoyaltyCards();
        return ResponseEntity.ok(cards);
    }

    @PostMapping("/admin/loyalty")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminLoyaltyCardDto> loyaltyAction(@Valid @RequestBody LoyaltyActionRequest request) {
        User admin = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        AdminLoyaltyCardDto updatedCard = loyaltyService.processLoyaltyAction(admin.getId(), request);
        return ResponseEntity.ok(updatedCard);
    }
}