package com.prettynails.service;

import com.prettynails.dto.LoyaltyDtos.*;
import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.LoyaltyStamp;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.BookingRepository;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.LoyaltyStampRepository;
import com.prettynails.repository.UserRepository;
import com.prettynails.util.TimeProvider;
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
    private final BookingRepository bookingRepository;
    private final TimeProvider timeProvider;
    private final AdminService adminService;

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
        return addStampCore(userId, bookingId, "SERVICE", false).getStampCount();
    }

    /**
     * Core stamp-adding logic shared by all stamp methods.
     * Handles: duplicate check, card get-or-create, increment, timestamps, stamp record creation.
     *
     * @param userId the user ID
     * @param bookingId the booking ID
     * @param source the stamp source (e.g., "SERVICE", "QR_SCAN", "QR_SCAN_STAFF")
     * @param includeRewardThreshold whether to include reward threshold in response
     * @return StampResponse with success, stampCount, and optionally requiredStamps
     */
    private StampResponse addStampCore(String userId, String bookingId, String source, boolean includeRewardThreshold) {
        // Check if stamp already exists for this booking
        if (loyaltyStampRepository.existsByBookingId(bookingId)) {
            LoyaltyCard existingCard = loyaltyCardRepository.findByUserId(userId).orElse(null);
            return StampResponse.builder()
                    .success(false)
                    .stampCount(existingCard != null ? existingCard.getStampCount() : 0)
                    .message("Stamp already exists for this booking")
                    .build();
        }

        // Get or create loyalty card
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                .orElseGet(() -> {
                    LoyaltyCard newCard = LoyaltyCard.builder()
                            .userId(userId)
                            .stampCount(0)
                            .expiresAt(timeProvider.localNow().plusYears(1))
                            .build();
                    return loyaltyCardRepository.save(newCard);
                });

        // Add stamp
        int newStampCount = (loyaltyCard.getStampCount() != null ? loyaltyCard.getStampCount() : 0) + 1;
        LocalDateTime now = timeProvider.localNow();
        loyaltyCard.setStampCount(newStampCount);
        loyaltyCard.setLastStampAt(now);
        loyaltyCard.setExpiresAt(now.plusMonths(12));
        loyaltyCardRepository.save(loyaltyCard);

        // Create stamp record
        LoyaltyStamp stamp = LoyaltyStamp.builder()
                .cardId(loyaltyCard.getId())
                .bookingId(bookingId)
                .earnedAt(now)
                .source(source)
                .build();
        loyaltyStampRepository.save(stamp);

        StampResponse.StampResponseBuilder builder = StampResponse.builder()
                .success(true)
                .stampCount(newStampCount)
                .message("Stamp added successfully");

        if (includeRewardThreshold) {
            int rewardThreshold = adminService.getLoyaltySettings().getRewardThreshold();
            if (rewardThreshold < 1) {
                rewardThreshold = 10;
            }
            builder.requiredStamps(rewardThreshold);
        }

        return builder.build();
    }

    /**
     * Parse QR code to extract bookingId and stampType.
     * Supported formats:
     * - "BOOKING:<bookingId>"
     * - "BOOKING:<bookingId>:<stampType>"
     * - "<bookingId>:<stampType>[:<timestamp>]"
     */
    private ParsedQr parseQrCode(String qrCode) {
        String trimmedQr = qrCode.trim();
        String bookingId;
        String stampType = "SERVICE";

        if (trimmedQr.startsWith("BOOKING:")) {
            String afterPrefix = trimmedQr.substring("BOOKING:".length()).trim();
            if (afterPrefix.isEmpty()) {
                throw new BadRequestException("Invalid QR code format");
            }
            if (afterPrefix.contains(":")) {
                String[] subParts = afterPrefix.split(":", 2);
                bookingId = subParts[0];
                if (subParts.length > 1 && !subParts[1].isBlank()) {
                    stampType = subParts[1];
                }
            } else {
                bookingId = afterPrefix;
            }
        } else {
            String[] parts = trimmedQr.split(":");
            if (parts.length < 2) {
                throw new BadRequestException("Invalid QR code format");
            }
            bookingId = parts[0];
            stampType = parts[1];
        }

        return new ParsedQr(bookingId, stampType);
    }

    private record ParsedQr(String bookingId, String stampType) {}

    /**
     * Get user's loyalty card (creates one if it doesn't exist)
     */
    public LoyaltyCardDto getLoyaltyCard(String userId) {
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                .orElseGet(() -> {
                    LoyaltyCard newCard = LoyaltyCard.builder()
                            .userId(userId)
                            .stampCount(0)
                            .expiresAt(timeProvider.localNow().plusYears(1))
                            .build();
                    return loyaltyCardRepository.save(newCard);
                });

        return mapToLoyaltyCardDto(loyaltyCard);
    }

    /**
     * Get user's stamp history (creates loyalty card if it doesn't exist)
     */
    public List<LoyaltyStampDto> getStampHistory(String userId) {
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                .orElseGet(() -> {
                    LoyaltyCard newCard = LoyaltyCard.builder()
                            .userId(userId)
                            .stampCount(0)
                            .expiresAt(timeProvider.localNow().plusYears(1))
                            .build();
                    return loyaltyCardRepository.save(newCard);
                });

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

        try {
            ParsedQr parsed = parseQrCode(qrCode);
            return addStampCore(userId, parsed.bookingId(), parsed.stampType(), false);
        } catch (BadRequestException e) {
            return StampResponse.builder()
                    .success(false)
                    .stampCount(0)
                    .message(e.getMessage())
                    .build();
        }
    }

    /**
     * Add stamp via QR code by booking ID (staff facing)
     * The QR code contains the booking ID, and staff can add a stamp for that booking
     * without customer authentication.
     *
     * QR Code formats supported:
     * - "BOOKING:<bookingId>"
     * - "bookingId:stampType:timestamp"
     */
    @Transactional
    public StampResponse addStampViaQrByBookingId(String qrCode) {
        if (qrCode == null || qrCode.isBlank()) {
            return StampResponse.builder()
                    .success(false)
                    .stampCount(0)
                    .message("Invalid QR code format")
                    .build();
        }

        try {
            ParsedQr parsed = parseQrCode(qrCode);
            String bookingId = parsed.bookingId();

            // Find the booking to get the user ID
            var bookingOpt = bookingRepository.findById(bookingId);
            if (bookingOpt.isEmpty()) {
                return StampResponse.builder()
                        .success(false)
                        .stampCount(0)
                        .message("Booking not found")
                        .build();
            }

            String userId = bookingOpt.get().getUserId();
            // Staff source includes "_STAFF" suffix
            return addStampCore(userId, bookingId, parsed.stampType() + "_STAFF", true);
        } catch (BadRequestException e) {
            return StampResponse.builder()
                    .success(false)
                    .stampCount(0)
                    .message(e.getMessage())
                    .build();
        }
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
                .earnedAt(timeProvider.localNow())
                .source("REWARD_REDEMPTION")
                .amount(-stampCountToDeduct)
                .build();
        loyaltyStampRepository.save(redemptionStamp);
    }

    /**
     * Get all loyalty cards for admin (with pagination and search)
     * Excludes users with ADMIN role
     * Uses database-level filtering and pagination for scalability
     */
    public Page<AdminLoyaltyCardDto> getAllLoyaltyCards(String search, Pageable pageable) {
        Page<LoyaltyCard> cardPage = loyaltyCardRepository.findCustomerCardsWithSearch(search, pageable);
        return cardPage.map(this::mapToAdminLoyaltyCardDto);
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
                loyaltyCard.setLastStampAt(timeProvider.localNow());
                loyaltyCard.setExpiresAt(timeProvider.localNow().plusMonths(12));
                message = amount + " stamp(s) added";
            }
            case REMOVE_STAMP -> {
                int amount = request.getAmount() != null ? request.getAmount() : 1;
                int newCount = Math.max(0, loyaltyCard.getStampCount() - amount);
                loyaltyCard.setStampCount(newCount);
                if (newCount > 0) {
                    loyaltyCard.setLastStampAt(timeProvider.localNow());
                    loyaltyCard.setExpiresAt(timeProvider.localNow().plusMonths(12));
                }
                message = amount + " stamp(s) removed";
            }
            case RESET -> {
                loyaltyCard.setStampCount(0);
                loyaltyCard.setLastStampAt(null);
                loyaltyCard.setExpiresAt(timeProvider.localNow().plusYears(1));
                message = "Loyalty card reset";
            }
            case EXTEND -> {
                int months = request.getAmount() != null ? request.getAmount() : 12;
                LocalDateTime base = loyaltyCard.getExpiresAt() != null && loyaltyCard.getExpiresAt().isAfter(timeProvider.localNow())
                        ? loyaltyCard.getExpiresAt()
                        : timeProvider.localNow();
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