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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoyaltyServiceTest {

    @Mock
    private LoyaltyCardRepository loyaltyCardRepository;

    @Mock
    private LoyaltyStampRepository loyaltyStampRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LoyaltyService loyaltyService;

    private User testUser;
    private LoyaltyCard testLoyaltyCard;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user-123")
                .name("Test User")
                .email("test@example.com")
                .role("CUSTOMER")
                .build();

        testLoyaltyCard = LoyaltyCard.builder()
                .id("card-123")
                .userId("user-123")
                .stampCount(5)
                .lastStampAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();
    }

    @Test
    void getLoyaltyCard_whenCardExists_shouldReturnCardDto() {
        when(loyaltyCardRepository.findByUserId("user-123")).thenReturn(Optional.of(testLoyaltyCard));

        LoyaltyCardDto card = loyaltyService.getLoyaltyCard("user-123");

        assertThat(card).isNotNull();
        assertThat(card.getId()).isEqualTo("card-123");
        assertThat(card.getUserId()).isEqualTo("user-123");
        assertThat(card.getStampCount()).isEqualTo(5);
    }

    @Test
    void getLoyaltyCard_whenCardNotExists_shouldThrowResourceNotFoundException() {
        when(loyaltyCardRepository.findByUserId("user-123")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loyaltyService.getLoyaltyCard("user-123"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("LoyaltyCard not found with userId");
    }

    @Test
    void addStampViaQr_whenValidQrCode_shouldAddStamp() {
        when(loyaltyCardRepository.findByUserId("user-123")).thenReturn(Optional.of(testLoyaltyCard));
        when(loyaltyStampRepository.existsByBookingId("booking-123")).thenReturn(false);
        when(loyaltyCardRepository.save(any(LoyaltyCard.class))).thenReturn(testLoyaltyCard);
        when(loyaltyStampRepository.save(any(LoyaltyStamp.class))).thenReturn(null);

        StampResponse response = loyaltyService.addStampViaQr("user-123", "booking-123:SERVICE:1234567890");

        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getStampCount()).isEqualTo(6);
    }

    @Test
    void addStampViaQr_whenStampAlreadyExists_shouldReturnFailure() {
        when(loyaltyCardRepository.findByUserId("user-123")).thenReturn(Optional.of(testLoyaltyCard));
        when(loyaltyStampRepository.existsByBookingId("booking-123")).thenReturn(true);

        StampResponse response = loyaltyService.addStampViaQr("user-123", "booking-123:SERVICE:1234567890");

        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Stamp already exists for this booking");
    }

    @Test
    void addStampViaQr_whenInvalidQrFormat_shouldReturnFailure() {
        StampResponse response = loyaltyService.addStampViaQr("user-123", "invalid-qr");

        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Invalid QR code format");
    }

    @Test
    void addStampViaQr_whenBookingPrefixFormat_shouldAddStamp() {
        when(loyaltyCardRepository.findByUserId("user-123")).thenReturn(Optional.of(testLoyaltyCard));
        when(loyaltyStampRepository.existsByBookingId("booking-456")).thenReturn(false);
        when(loyaltyCardRepository.save(any(LoyaltyCard.class))).thenReturn(testLoyaltyCard);
        when(loyaltyStampRepository.save(any(LoyaltyStamp.class))).thenReturn(null);

        StampResponse response = loyaltyService.addStampViaQr("user-123", "BOOKING:booking-456");

        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getStampCount()).isEqualTo(6);
    }

    @Test
    void redeemRewardStamps_whenCardExists_shouldDeductStamps() {
        when(loyaltyCardRepository.findByUserId("user-123")).thenReturn(Optional.of(testLoyaltyCard));
        when(loyaltyCardRepository.save(any(LoyaltyCard.class))).thenReturn(testLoyaltyCard);
        when(loyaltyStampRepository.save(any(LoyaltyStamp.class))).thenReturn(null);

        loyaltyService.redeemRewardStamps("user-123", "booking-123", 5);

        assertThat(testLoyaltyCard.getStampCount()).isEqualTo(0);
        verify(loyaltyStampRepository).save(any(LoyaltyStamp.class));
    }

    @Test
    void adminLoyaltyAction_addStamp_shouldAddStamps() {
        when(loyaltyCardRepository.findByUserId("user-123")).thenReturn(Optional.of(testLoyaltyCard));
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(loyaltyCardRepository.save(any(LoyaltyCard.class))).thenReturn(testLoyaltyCard);

        LoyaltyActionRequest request = LoyaltyActionRequest.builder()
                .userId("user-123")
                .action(LoyaltyActionRequest.Action.ADD_STAMP)
                .amount(3)
                .build();

        LoyaltyActionResponse response = loyaltyService.adminLoyaltyAction(request);

        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getLoyaltyCard().getStampCount()).isEqualTo(8);
    }

    @Test
    void adminLoyaltyAction_removeStamp_shouldRemoveStamps() {
        when(loyaltyCardRepository.findByUserId("user-123")).thenReturn(Optional.of(testLoyaltyCard));
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(loyaltyCardRepository.save(any(LoyaltyCard.class))).thenReturn(testLoyaltyCard);

        LoyaltyActionRequest request = LoyaltyActionRequest.builder()
                .userId("user-123")
                .action(LoyaltyActionRequest.Action.REMOVE_STAMP)
                .amount(2)
                .build();

        LoyaltyActionResponse response = loyaltyService.adminLoyaltyAction(request);

        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getLoyaltyCard().getStampCount()).isEqualTo(3);
    }

    @Test
    void adminLoyaltyAction_reset_shouldResetCard() {
        when(loyaltyCardRepository.findByUserId("user-123")).thenReturn(Optional.of(testLoyaltyCard));
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(loyaltyCardRepository.save(any(LoyaltyCard.class))).thenReturn(testLoyaltyCard);

        LoyaltyActionRequest request = LoyaltyActionRequest.builder()
                .userId("user-123")
                .action(LoyaltyActionRequest.Action.RESET)
                .build();

        LoyaltyActionResponse response = loyaltyService.adminLoyaltyAction(request);

        assertThat(response).isNotNull();
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getLoyaltyCard().getStampCount()).isEqualTo(0);
    }
}