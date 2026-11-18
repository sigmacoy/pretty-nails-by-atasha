package com.prettynails.service;

import com.prettynails.dto.LoyaltyDtos.*;
import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.LoyaltyStamp;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.IntegrationTestBase;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.LoyaltyStampRepository;
import com.prettynails.repository.UserRepository;
import com.prettynails.util.TimeProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

class LoyaltyServiceIntegrationTest extends IntegrationTestBase {

    @Autowired
    private LoyaltyService loyaltyService;

    @Autowired
    private LoyaltyCardRepository loyaltyCardRepository;

    @Autowired
    private LoyaltyStampRepository loyaltyStampRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TimeProvider timeProvider;

    private User testUser;
    private LoyaltyCard testLoyaltyCard;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .name("Test User")
                .email("test@example.com")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        testUser = userRepository.save(testUser);

        // Create loyalty card
        testLoyaltyCard = LoyaltyCard.builder()
                .userId(testUser.getId())
                .stampCount(5)
                .lastStampAt(timeProvider.localNow().minusDays(1))
                .expiresAt(timeProvider.localNow().plusMonths(11))
                .build();
        testLoyaltyCard = loyaltyCardRepository.save(testLoyaltyCard);
    }

    @Test
    void getLoyaltyCard_whenCardExists_shouldReturnCardDto() {
        // When
        LoyaltyCardDto card = loyaltyService.getLoyaltyCard(testUser.getId());

        // Then
        assertThat(card).isNotNull();
        assertThat(card.getId()).isEqualTo(testLoyaltyCard.getId());
        assertThat(card.getUserId()).isEqualTo(testUser.getId());
        assertThat(card.getStampCount()).isEqualTo(5);
        assertThat(card.getExpiresAt()).isEqualTo(testLoyaltyCard.getExpiresAt());
    }

    @Test
    void getLoyaltyCard_whenCardNotExists_shouldThrowResourceNotFoundException() {
        // When/Then
        assertThatThrownBy(() -> loyaltyService.getLoyaltyCard("nonexistent-user"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("LoyaltyCard not found with userId");
    }

    @Test
    void addStampViaQr_whenValidQrCode_shouldAddStamp() {
        // When
        StampResponse response = loyaltyService.addStampViaQr(testUser.getId(), "booking-123:SERVICE:1234567890");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getStampCount()).isEqualTo(6);
        assertThat(response.getMessage()).isNull();

        // Verify stamp count updated
        LoyaltyCard updatedCard = loyaltyCardRepository.findByUserId(testUser.getId()).orElseThrow();
        assertThat(updatedCard.getStampCount()).isEqualTo(6);

        // Verify stamp record created
        var stamps = loyaltyStampRepository.findAll();
        assertThat(stamps).hasSize(1);
        assertThat(stamps.get(0).getBookingId()).isEqualTo("booking-123");
        assertThat(stamps.get(0).getSource()).isEqualTo("QR_CODE");
    }

    @Test
    void addStampViaQr_whenStampAlreadyExists_shouldReturnFailure() {
        // Given - create existing stamp
        LoyaltyStamp existingStamp = LoyaltyStamp.builder()
                .bookingId("booking-123")
                .cardId(testLoyaltyCard.getId())
                .source("QR_CODE")
                .amount(1)
                .earnedAt(timeProvider.localNow().minusDays(1))
                .build();
        loyaltyStampRepository.save(existingStamp);

        // When
        StampResponse response = loyaltyService.addStampViaQr(testUser.getId(), "booking-123:SERVICE:1234567890");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Stamp already exists for this booking");
        assertThat(response.getStampCount()).isEqualTo(5); // Unchanged

        // Verify stamp count not updated
        LoyaltyCard updatedCard = loyaltyCardRepository.findByUserId(testUser.getId()).orElseThrow();
        assertThat(updatedCard.getStampCount()).isEqualTo(5);
    }

    @Test
    void addStampViaQr_whenInvalidQrFormat_shouldReturnFailure() {
        // When
        StampResponse response = loyaltyService.addStampViaQr(testUser.getId(), "invalid-qr");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Invalid QR code format");
        assertThat(response.getStampCount()).isEqualTo(5); // Unchanged
    }

    @Test
    void addStampViaQr_whenBookingPrefixFormat_shouldAddStamp() {
        // When
        StampResponse response = loyaltyService.addStampViaQr(testUser.getId(), "BOOKING:booking-456");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getStampCount()).isEqualTo(6);

        // Verify stamp count updated
        LoyaltyCard updatedCard = loyaltyCardRepository.findByUserId(testUser.getId()).orElseThrow();
        assertThat(updatedCard.getStampCount()).isEqualTo(6);

        // Verify stamp record created
        var stamps = loyaltyStampRepository.findAll();
        assertThat(stamps).hasSize(1);
        assertThat(stamps.get(0).getBookingId()).isEqualTo("booking-456");
    }

    @Test
    void redeemRewardStamps_whenCardExists_shouldDeductStamps() {
        // Given - user has 9 stamps (enough for free service)
        testLoyaltyCard.setStampCount(9);
        loyaltyCardRepository.save(testLoyaltyCard);

        // When
        loyaltyService.redeemRewardStamps(testUser.getId(), "booking-123", 9);

        // Then
        LoyaltyCard updatedCard = loyaltyCardRepository.findByUserId(testUser.getId()).orElseThrow();
        assertThat(updatedCard.getStampCount()).isEqualTo(0);

        // Verify redeem stamp record created
        var stamps = loyaltyStampRepository.findAll();
        assertThat(stamps).hasSize(1);
        assertThat(stamps.get(0).getBookingId()).isEqualTo("booking-123");
        assertThat(stamps.get(0).getSource()).isEqualTo("REDEEM");
        assertThat(stamps.get(0).getAmount()).isEqualTo(-9);
    }

    @Test
    void adminLoyaltyAction_addStamp_shouldAddStamps() {
        // When
        LoyaltyActionRequest request = LoyaltyActionRequest.builder()
                .userId(testUser.getId())
                .action(LoyaltyActionRequest.Action.ADD_STAMP)
                .amount(3)
                .build();

        LoyaltyActionResponse response = loyaltyService.adminLoyaltyAction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getLoyaltyCard().getStampCount()).isEqualTo(8);

        // Verify card updated
        LoyaltyCard updatedCard = loyaltyCardRepository.findByUserId(testUser.getId()).orElseThrow();
        assertThat(updatedCard.getStampCount()).isEqualTo(8);
    }

    @Test
    void adminLoyaltyAction_removeStamp_shouldRemoveStamps() {
        // When
        LoyaltyActionRequest request = LoyaltyActionRequest.builder()
                .userId(testUser.getId())
                .action(LoyaltyActionRequest.Action.REMOVE_STAMP)
                .amount(2)
                .build();

        LoyaltyActionResponse response = loyaltyService.adminLoyaltyAction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getLoyaltyCard().getStampCount()).isEqualTo(3);

        // Verify card updated
        LoyaltyCard updatedCard = loyaltyCardRepository.findByUserId(testUser.getId()).orElseThrow();
        assertThat(updatedCard.getStampCount()).isEqualTo(3);
    }

    @Test
    void adminLoyaltyAction_removeStamp_moreThanAvailable_shouldSetToZero() {
        // Given - only 1 stamp
        testLoyaltyCard.setStampCount(1);
        loyaltyCardRepository.save(testLoyaltyCard);

        // When
        LoyaltyActionRequest request = LoyaltyActionRequest.builder()
                .userId(testUser.getId())
                .action(LoyaltyActionRequest.Action.REMOVE_STAMP)
                .amount(5)
                .build();

        LoyaltyActionResponse response = loyaltyService.adminLoyaltyAction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getLoyaltyCard().getStampCount()).isEqualTo(0);
    }

    @Test
    void adminLoyaltyAction_reset_shouldResetCard() {
        // When
        LoyaltyActionRequest request = LoyaltyActionRequest.builder()
                .userId(testUser.getId())
                .action(LoyaltyActionRequest.Action.RESET)
                .build();

        LoyaltyActionResponse response = loyaltyService.adminLoyaltyAction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getLoyaltyCard().getStampCount()).isEqualTo(0);

        // Verify card updated
        LoyaltyCard updatedCard = loyaltyCardRepository.findByUserId(testUser.getId()).orElseThrow();
        assertThat(updatedCard.getStampCount()).isEqualTo(0);
    }

    @Test
    void stampExpiry_whenCardExpired_shouldShowExpiredExpiryDate() {
        // Given - expired card
        testLoyaltyCard.setExpiresAt(timeProvider.localNow().minusDays(1));
        testLoyaltyCard.setStampCount(5);
        loyaltyCardRepository.save(testLoyaltyCard);

        // When
        LoyaltyCardDto card = loyaltyService.getLoyaltyCard(testUser.getId());

        // Then
        assertThat(card.getExpiresAt()).isBefore(timeProvider.localNow());
        assertThat(card.getStampCount()).isEqualTo(5);
    }
}