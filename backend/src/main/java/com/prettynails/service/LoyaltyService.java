package com.prettynails.service;

import com.prettynails.dto.LoyaltyDtos.*;
import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.LoyaltyStamp;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.LoyaltyStampRepository;
import com.prettynails.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyCardRepository loyaltyCardRepository;
    private final LoyaltyStampRepository loyaltyStampRepository;
    private final UserRepository userRepository;

    /**
     * Adds a stamp to the user's loyalty card when a booking is completed.
     *
     * @param bookingId the ID of the completed booking
     * @param userId the ID of the user
     * @return the updated stamp count
     * @throws ResourceNotFoundException if the user has no loyalty card
     * @throws BadRequestException if a stamp already exists for this booking
     */
    @Transactional
    public int addStampOnBookingCompletion(String bookingId, String userId) {
        // 1. Find user's LoyaltyCard by userId
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("LoyaltyCard", "userId", userId));

        // 2. Check if stamp already exists for this bookingId (prevent duplicates)
        if (loyaltyStampRepository.existsByBookingId(bookingId)) {
            throw new BadRequestException("Stamp already exists for booking: " + bookingId);
        }

        // 3. Increment stampCount, update lastStampAt, recalculate expiresAt (12 months from last stamp)
        int newStampCount = loyaltyCard.getStampCount() + 1;
        LocalDateTime now = LocalDateTime.now();
        loyaltyCard.setStampCount(newStampCount);
        loyaltyCard.setLastStampAt(now);
        loyaltyCard.setExpiresAt(now.plusMonths(12));

        loyaltyCardRepository.save(loyaltyCard);

        // 4. Create LoyaltyStamp record with source="SERVICE", earnedAt=now, link to booking
        LoyaltyStamp stamp = LoyaltyStamp.builder()
                .cardId(loyaltyCard.getId())
                .bookingId(bookingId)
                .earnedAt(now)
                .source("SERVICE")
                .build();

        loyaltyStampRepository.save(stamp);

        // 5. Return updated stampCount
        return newStampCount;
    }

    /**
     * Get user's loyalty card
     */
    public LoyaltyCardDto getLoyaltyCard(String userId) {
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("LoyaltyCard", "userId", userId));

        return mapToLoyaltyCardDto(loyaltyCard);
    }

    /**
     * Get user's stamp history
     */
    public List<LoyaltyStampDto> getStampHistory(String userId) {
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("LoyaltyCard", "userId", userId));

        List<LoyaltyStamp> stamps = loyaltyStampRepository.findByCardIdOrderByEarnedAtDesc(loyaltyCard.getId());
        return stamps.stream()
                .map(this::mapToLoyaltyStampDto)
                .collect(Collectors.toList());
    }

    /**
     * Add stamp via QR code (customer facing)
     * Supports formats:
     * - "BOOKING:<bookingId>"
     * - "bookingId:stampType:timestamp"
     */
    @Transactional
    public StampResponse addStampViaQr(String userId, String qrCode) {
        if (qrCode == null || qrCode.isBlank()) {
            return StampResponse.builder()
                    .success(false)
                    .stampCount(0)
                    .message("Invalid QR code format")
                    .build();
        }

        String bookingId;
        String stampType = "SERVICE";

        String trimmedQr = qrCode.trim();
        if (trimmedQr.startsWith("BOOKING:")) {
            bookingId = trimmedQr.substring("BOOKING:".length()).trim();
            if (bookingId.isEmpty()) {
                return StampResponse.builder()
                        .success(false)
                        .stampCount(0)
                        .message("Invalid QR code format")
                        .build();
            }
            if (bookingId.contains(":")) {
                String[] subParts = bookingId.split(":");
                bookingId = subParts[0];
                if (subParts.length > 1 && !subParts[1].isBlank()) {
                    stampType = subParts[1];
                }
            }
        } else {
            String[] parts = trimmedQr.split(":");
            if (parts.length < 2) {
                return StampResponse.builder()
                        .success(false)
                        .stampCount(0)
                        .message("Invalid QR code format")
                        .build();
            }
            bookingId = parts[0];
            stampType = parts[1];
        }

        // Check if stamp already exists for this booking
        if (loyaltyStampRepository.existsByBookingId(bookingId)) {
            LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                    .orElse(null);
            return StampResponse.builder()
                    .success(false)
                    .stampCount(loyaltyCard != null ? loyaltyCard.getStampCount() : 0)
                    .message("Stamp already exists for this booking")
                    .build();
        }

        // Get or create loyalty card
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                .orElseGet(() -> {
                    LoyaltyCard newCard = LoyaltyCard.builder()
                            .userId(userId)
                            .stampCount(0)
                            .expiresAt(LocalDateTime.now().plusYears(1))
                            .build();
                    return loyaltyCardRepository.save(newCard);
                });

        // Add stamp
        int newStampCount = (loyaltyCard.getStampCount() != null ? loyaltyCard.getStampCount() : 0) + 1;
        LocalDateTime now = LocalDateTime.now();
        loyaltyCard.setStampCount(newStampCount);
        loyaltyCard.setLastStampAt(now);
        loyaltyCard.setExpiresAt(now.plusMonths(12));
        loyaltyCardRepository.save(loyaltyCard);

        // Create stamp record
        LoyaltyStamp stamp = LoyaltyStamp.builder()
                .cardId(loyaltyCard.getId())
                .bookingId(bookingId)
                .earnedAt(now)
                .source(stampType)
                .build();
        loyaltyStampRepository.save(stamp);

        return StampResponse.builder()
                .success(true)
                .stampCount(newStampCount)
                .message("Stamp added successfully")
                .build();
    }

    /**
     * Deducts stamps when a loyalty reward is redeemed on booking confirmation.
     */
    @Transactional
    public void redeemRewardStamps(String userId, String bookingId, int stampCountToDeduct) {
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("LoyaltyCard", "userId", userId));

        int current = loyaltyCard.getStampCount() != null ? loyaltyCard.getStampCount() : 0;
        int newCount = Math.max(0, current - stampCountToDeduct);
        loyaltyCard.setStampCount(newCount);
        loyaltyCardRepository.save(loyaltyCard);

        LoyaltyStamp redemptionStamp = LoyaltyStamp.builder()
                .cardId(loyaltyCard.getId())
                .bookingId(bookingId)
                .earnedAt(LocalDateTime.now())
                .source("REWARD_REDEMPTION")
                .amount(-stampCountToDeduct)
                .build();
        loyaltyStampRepository.save(redemptionStamp);
    }

    /**
     * Get all loyalty cards for admin (with pagination and search)
     */
    public Page<AdminLoyaltyCardDto> getAllLoyaltyCards(String search, Pageable pageable) {
        // For simplicity, we'll fetch all and filter in memory for search
        // In production, you'd want a custom repository query
        List<LoyaltyCard> allCards = loyaltyCardRepository.findAll();

        List<AdminLoyaltyCardDto> filtered = allCards.stream()
                .filter(card -> {
                    if (search == null || search.isBlank()) return true;
                    User user = userRepository.findById(card.getUserId()).orElse(null);
                    if (user == null) return false;
                    String searchLower = search.toLowerCase();
                    return user.getName().toLowerCase().contains(searchLower) ||
                           user.getEmail().toLowerCase().contains(searchLower);
                })
                .map(this::mapToAdminLoyaltyCardDto)
                .collect(Collectors.toList());

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<AdminLoyaltyCardDto> pageContent = (start <= end) ? filtered.subList(start, end) : List.of();

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, filtered.size());
    }

    /**
     * Admin loyalty actions (add/remove/reset/extend stamps)
     */
    @Transactional
    public LoyaltyActionResponse adminLoyaltyAction(LoyaltyActionRequest request) {
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("LoyaltyCard", "userId", request.getUserId()));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        String message;
        switch (request.getAction()) {
            case ADD_STAMP -> {
                int amount = request.getAmount() != null ? request.getAmount() : 1;
                loyaltyCard.setStampCount(loyaltyCard.getStampCount() + amount);
                loyaltyCard.setLastStampAt(LocalDateTime.now());
                loyaltyCard.setExpiresAt(LocalDateTime.now().plusMonths(12));
                message = amount + " stamp(s) added";
            }
            case REMOVE_STAMP -> {
                int amount = request.getAmount() != null ? request.getAmount() : 1;
                int newCount = Math.max(0, loyaltyCard.getStampCount() - amount);
                loyaltyCard.setStampCount(newCount);
                if (newCount > 0) {
                    loyaltyCard.setLastStampAt(LocalDateTime.now());
                    loyaltyCard.setExpiresAt(LocalDateTime.now().plusMonths(12));
                }
                message = amount + " stamp(s) removed";
            }
            case RESET -> {
                loyaltyCard.setStampCount(0);
                loyaltyCard.setLastStampAt(null);
                loyaltyCard.setExpiresAt(LocalDateTime.now().plusYears(1));
                message = "Loyalty card reset";
            }
            case EXTEND -> {
                int months = request.getAmount() != null ? request.getAmount() : 12;
                LocalDateTime base = loyaltyCard.getExpiresAt() != null && loyaltyCard.getExpiresAt().isAfter(LocalDateTime.now())
                        ? loyaltyCard.getExpiresAt()
                        : LocalDateTime.now();
                loyaltyCard.setExpiresAt(base.plusMonths(months));
                message = "Expiry extended by " + months + " month(s)";
            }
            default -> throw new BadRequestException("Unknown action: " + request.getAction());
        }

        loyaltyCardRepository.save(loyaltyCard);

        return LoyaltyActionResponse.builder()
                .success(true)
                .loyaltyCard(mapToAdminLoyaltyCardDto(loyaltyCard, user))
                .message(message)
                .build();
    }

    private LoyaltyCardDto mapToLoyaltyCardDto(LoyaltyCard card) {
        return LoyaltyCardDto.builder()
                .id(card.getId())
                .userId(card.getUserId())
                .stampCount(card.getStampCount())
                .lastStampAt(card.getLastStampAt())
                .expiresAt(card.getExpiresAt())
                .build();
    }

    private LoyaltyStampDto mapToLoyaltyStampDto(LoyaltyStamp stamp) {
        return LoyaltyStampDto.builder()
                .id(stamp.getId())
                .cardId(stamp.getCardId())
                .bookingId(stamp.getBookingId())
                .earnedAt(stamp.getEarnedAt())
                .source(stamp.getSource())
                .amount(stamp.getAmount())
                .build();
    }

    private AdminLoyaltyCardDto mapToAdminLoyaltyCardDto(LoyaltyCard card) {
        User user = userRepository.findById(card.getUserId()).orElse(null);
        return mapToAdminLoyaltyCardDto(card, user);
    }

    private AdminLoyaltyCardDto mapToAdminLoyaltyCardDto(LoyaltyCard card, User user) {
        return AdminLoyaltyCardDto.builder()
                .id(card.getId())
                .userId(card.getUserId())
                .userName(user != null ? user.getName() : "Unknown")
                .userEmail(user != null ? user.getEmail() : "Unknown")
                .stampCount(card.getStampCount())
                .lastStampAt(card.getLastStampAt())
                .expiresAt(card.getExpiresAt())
                .build();
    }
}