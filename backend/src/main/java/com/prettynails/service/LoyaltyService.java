package com.prettynails.service;

import com.prettynails.dto.AuthDtos.UserDto;
import com.prettynails.dto.LoyaltyDtos.*;
import com.prettynails.entity.*;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyCardRepository loyaltyCardRepository;
    private final LoyaltyStampRepository loyaltyStampRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final SettingRepository settingRepository;

    private static final String SHOP_QR_CODE = "prettynails-shop-qr-code";
    private static final String STAMP_PREFIX = "prettynails-stamp:";
    private static final int DEFAULT_STAMPS_REQUIRED = 10;
    private static final int DEFAULT_STAMP_EXPIRY_MONTHS = 12;
    private static final int STAMP_PER_AMOUNT_THRESHOLD = 50000; // ₱500 in centavos
    private static final int STAMP_PER_AMOUNT_DOUBLE_THRESHOLD = 100000; // ₱1000 in centavos

    // --- User-facing methods ---

    public LoyaltyCardDto getUserLoyaltyCard(String userId) {
        LoyaltyCard card = loyaltyCardRepository.findByUserId(userId)
                .orElseGet(() -> createLoyaltyCard(userId));

        return mapToLoyaltyCardDto(card, false);
    }

    @Transactional
    public StampResponse addStampViaQrCode(String userId, StampRequest request) {
        String qrCode = request.getQrCode();
        if (qrCode == null || qrCode.trim().isEmpty()) {
            return StampResponse.builder()
                    .success(false)
                    .message("QR code is required")
                    .build();
        }

        String bookingId = parseBookingIdFromQrCode(qrCode);

        if (bookingId == null) {
            // Shop QR code - find latest completed booking without stamp
            return processShopQrCode(userId);
        }

        // Per-booking QR code
        return processBookingQrCode(userId, bookingId);
    }

    // --- Admin methods ---

    public List<AdminLoyaltyCardDto> getAllLoyaltyCards() {
        List<LoyaltyCard> cards = loyaltyCardRepository.findCustomerCards();
        return cards.stream()
                .map(this::mapToAdminLoyaltyCardDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminLoyaltyCardDto processLoyaltyAction(String adminId, LoyaltyActionRequest request) {
        if (!"REDEEM".equalsIgnoreCase(request.getAction())) {
            throw new BadRequestException("Invalid action. Only REDEEM is supported.");
        }

        LoyaltyCard card = loyaltyCardRepository.findById(request.getCardId())
                .orElseThrow(() -> new ResourceNotFoundException("LoyaltyCard", "id", request.getCardId()));

        int redeemAmount = request.getAmount() != null ? request.getAmount() : 1;
        if (redeemAmount <= 0) {
            throw new BadRequestException("Redeem amount must be positive");
        }

        if (card.getStampCount() < redeemAmount) {
            throw new BadRequestException("Insufficient stamps for redemption");
        }

        card.setStampCount(card.getStampCount() - redeemAmount);
        card.setUpdatedAt(LocalDateTime.now());
        loyaltyCardRepository.save(card);

        return mapToAdminLoyaltyCardDto(card);
    }

    // --- Helper methods ---

    private LoyaltyCard createLoyaltyCard(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMonths(getStampExpiryMonths());

        LoyaltyCard card = LoyaltyCard.builder()
                .userId(userId)
                .stampCount(0)
                .lastStampAt(null)
                .expiresAt(expiresAt)
                .build();

        return loyaltyCardRepository.save(card);
    }

    private String parseBookingIdFromQrCode(String qrCode) {
        qrCode = qrCode.trim();

        // Shop QR code
        if (SHOP_QR_CODE.equals(qrCode)) {
            return null;
        }

        // Direct booking ID format: "prettynails-stamp:<bookingId>"
        if (qrCode.startsWith(STAMP_PREFIX)) {
            return qrCode.substring(STAMP_PREFIX.length());
        }

        // Try to parse as JSON
        try {
            // Simple JSON parsing for bookingId
            int bookingIdIndex = qrCode.indexOf("bookingId");
            if (bookingIdIndex >= 0) {
                int start = qrCode.indexOf(':', bookingIdIndex);
                int end = qrCode.indexOf('"', start + 2);
                if (start >= 0 && end > start) {
                    return qrCode.substring(start + 2, end);
                }
            }
        } catch (Exception ignored) {
            // Not valid JSON, treat as direct booking ID
        }

        // Assume it's a direct booking ID
        return qrCode;
    }

    private StampResponse processBookingQrCode(String userId, String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        // Verify booking belongs to user
        if (!booking.getUserId().equals(userId)) {
            return StampResponse.builder()
                    .success(false)
                    .message("This booking does not belong to you")
                    .build();
        }

        // Check if booking is completed
        if (!"COMPLETED".equals(booking.getStatus())) {
            return StampResponse.builder()
                    .success(false)
                    .message("Booking must be completed to earn stamps")
                    .build();
        }

        // Check if stamp already exists for this booking
        if (loyaltyStampRepository.existsByBookingId(bookingId)) {
            return StampResponse.builder()
                    .success(false)
                    .message("Stamp already earned for this booking")
                    .build();
        }

        // Calculate stamps earned
        int stampsEarned = calculateStampsForBooking(booking);

        if (stampsEarned <= 0) {
            return StampResponse.builder()
                    .success(false)
                    .message("No stamps earned for this service")
                    .build();
        }

        // Get or create loyalty card
        LoyaltyCard card = loyaltyCardRepository.findByUserId(userId)
                .orElseGet(() -> createLoyaltyCard(userId));

        // Check if card is expired and reset if needed
        if (isCardExpired(card)) {
            card.setStampCount(0);
            card.setLastStampAt(null);
        }

        // Update card
        card.setStampCount(card.getStampCount() + stampsEarned);
        card.setLastStampAt(LocalDateTime.now());
        card.setExpiresAt(LocalDateTime.now().plusMonths(getStampExpiryMonths()));
        card = loyaltyCardRepository.save(card);

        // Create stamp record
        LoyaltyStamp stamp = LoyaltyStamp.builder()
                .cardId(card.getId())
                .bookingId(bookingId)
                .earnedAt(LocalDateTime.now())
                .source(determineStampSource(booking))
                .amount(calculateStampAmount(booking))
                .build();
        loyaltyStampRepository.save(stamp);

        return StampResponse.builder()
                .success(true)
                .stampCount(card.getStampCount())
                .stampsEarned(stampsEarned)
                .message("Stamp earned successfully!")
                .build();
    }

    private StampResponse processShopQrCode(String userId) {
        // Find latest completed booking without stamp for this user
        List<Booking> completedBookings = bookingRepository.findCompletedBookingsWithoutStamps(userId);

        if (completedBookings.isEmpty()) {
            return StampResponse.builder()
                    .success(false)
                    .message("No completed bookings found without stamps")
                    .build();
        }

        // Get the latest completed booking
        Booking latestBooking = completedBookings.get(0);

        return processBookingQrCode(userId, latestBooking.getId());
    }

    private int calculateStampsForBooking(Booking booking) {
        // Check if booking has nail set services (GEL, EXTENSION, PEDICURE)
        boolean hasNailSet = hasNailSetService(booking);

        if (hasNailSet) {
            return 1; // 1 stamp per nail set
        }

        // Check amount-based stamps
        int totalPrice = booking.getTotalPrice();
        if (totalPrice >= STAMP_PER_AMOUNT_DOUBLE_THRESHOLD) {
            return 2; // 2 stamps for ₱1000+
        } else if (totalPrice >= STAMP_PER_AMOUNT_THRESHOLD) {
            return 1; // 1 stamp for ₱500+
        }

        return 0; // No stamps (e.g., Nail Cleaning alone < ₱500)
    }

    private boolean hasNailSetService(Booking booking) {
        if (booking.getServices() == null || booking.getServices().isEmpty()) {
            return false;
        }

        return booking.getServices().stream()
                .map(com.prettynails.entity.BookingService::getService)
                .filter(java.util.Objects::nonNull)
                .anyMatch(service -> {
                    String category = service.getCategory();
                    return "GEL".equals(category) || "EXTENSION".equals(category) || "PEDICURE".equals(category);
                });
    }

    private String determineStampSource(Booking booking) {
        if (hasNailSetService(booking)) {
            return "SERVICE";
        }
        return "AMOUNT";
    }

    private Integer calculateStampAmount(Booking booking) {
        if ("SERVICE".equals(determineStampSource(booking))) {
            return null; // Not applicable for service-based stamps
        }
        return booking.getTotalPrice();
    }

    private boolean isCardExpired(LoyaltyCard card) {
        if (card.getExpiresAt() == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(card.getExpiresAt());
    }

    private int getStampExpiryMonths() {
        return settingRepository.findByKey("loyalty_stamp_expiry_months")
                .map(s -> Integer.parseInt(s.getValue()))
                .orElse(DEFAULT_STAMP_EXPIRY_MONTHS);
    }

    private int getStampsRequired() {
        return settingRepository.findByKey("loyalty_stamps_required")
                .map(s -> Integer.parseInt(s.getValue()))
                .orElse(DEFAULT_STAMPS_REQUIRED);
    }

    // --- Mapping methods ---

    private LoyaltyCardDto mapToLoyaltyCardDto(LoyaltyCard card, boolean isAdmin) {
        List<LoyaltyStampDto> stampDtos = card.getStamps() != null ?
                card.getStamps().stream()
                        .sorted((a, b) -> b.getEarnedAt().compareTo(a.getEarnedAt()))
                        .map(this::mapToLoyaltyStampDto)
                        .collect(Collectors.toList()) : List.of();

        boolean expired = isCardExpired(card);

        return LoyaltyCardDto.builder()
                .stampCount(card.getStampCount())
                .lastStampAt(card.getLastStampAt() != null ? card.getLastStampAt().toString() : null)
                .expiresAt(card.getExpiresAt() != null ? card.getExpiresAt().toString() : null)
                .isExpired(expired)
                .stamps(stampDtos)
                .isAdmin(isAdmin)
                .build();
    }

    private AdminLoyaltyCardDto mapToAdminLoyaltyCardDto(LoyaltyCard card) {
        User user = card.getUser();

        List<LoyaltyStampDto> stampDtos = card.getStamps() != null ?
                card.getStamps().stream()
                        .sorted((a, b) -> b.getEarnedAt().compareTo(a.getEarnedAt()))
                        .map(this::mapToLoyaltyStampDto)
                        .collect(Collectors.toList()) : List.of();

        return AdminLoyaltyCardDto.builder()
                .id(card.getId())
                .userId(card.getUserId())
                .stampCount(card.getStampCount())
                .lastStampAt(card.getLastStampAt() != null ? card.getLastStampAt().toString() : null)
                .expiresAt(card.getExpiresAt() != null ? card.getExpiresAt().toString() : null)
                .createdAt(card.getCreatedAt() != null ? card.getCreatedAt().toString() : null)
                .updatedAt(card.getUpdatedAt() != null ? card.getUpdatedAt().toString() : null)
                .user(user != null ? UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .name(user.getName())
                        .nickname(user.getNickname())
                        .role(user.getRole())
                        .build() : null)
                .stamps(stampDtos)
                .build();
    }

    private LoyaltyStampDto mapToLoyaltyStampDto(LoyaltyStamp stamp) {
        return LoyaltyStampDto.builder()
                .earnedAt(stamp.getEarnedAt().toString())
                .source(stamp.getSource())
                .amount(stamp.getAmount())
                .build();
    }
}