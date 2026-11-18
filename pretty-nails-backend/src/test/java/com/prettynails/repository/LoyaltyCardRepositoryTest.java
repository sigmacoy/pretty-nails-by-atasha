package com.prettynails.repository;

import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.User;
import com.prettynails.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class LoyaltyCardRepositoryTest extends IntegrationTestBase {

    @Autowired
    private LoyaltyCardRepository loyaltyCardRepository;

    @Autowired
    private UserRepository userRepository;

    private User createTestUser(String email, String role) {
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded")
                .role(role)
                .build();
        return userRepository.save(user);
    }

    @Test
    void findByUserId_whenCardExists_shouldReturnCard() {
        // Given
        User user = createTestUser("user123@example.com", "CUSTOMER");
        String userId = user.getId();
        LoyaltyCard card = LoyaltyCard.builder()
                .userId(userId)
                .stampCount(5)
                .lastStampAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        loyaltyCardRepository.save(card);

        // When
        Optional<LoyaltyCard> found = loyaltyCardRepository.findByUserId(userId);

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getUserId()).isEqualTo(userId);
        assertThat(found.get().getStampCount()).isEqualTo(5);
    }

    @Test
    void findByUserId_whenCardNotExists_shouldReturnEmpty() {
        // When
        Optional<LoyaltyCard> found = loyaltyCardRepository.findByUserId("nonexistent-user");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    void stampCounting_whenIncrementingStamps_shouldUpdateCount() {
        // Given
        User user = createTestUser("user123@example.com", "CUSTOMER");
        String userId = user.getId();
        LoyaltyCard card = LoyaltyCard.builder()
                .userId(userId)
                .stampCount(3)
                .lastStampAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        loyaltyCardRepository.save(card);

        // When
        card.setStampCount(4);
        card.setLastStampAt(LocalDateTime.now());
        loyaltyCardRepository.save(card);

        // Then
        Optional<LoyaltyCard> found = loyaltyCardRepository.findByUserId(userId);
        assertThat(found).isPresent();
        assertThat(found.get().getStampCount()).isEqualTo(4);
    }

    @Test
    void stampCounting_whenRedeemingStamps_shouldDeductCount() {
        // Given
        User user = createTestUser("user123@example.com", "CUSTOMER");
        String userId = user.getId();
        LoyaltyCard card = LoyaltyCard.builder()
                .userId(userId)
                .stampCount(9)
                .lastStampAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        loyaltyCardRepository.save(card);

        // When - redeem 9 stamps for free service
        card.setStampCount(0);
        loyaltyCardRepository.save(card);

        // Then
        Optional<LoyaltyCard> found = loyaltyCardRepository.findByUserId(userId);
        assertThat(found).isPresent();
        assertThat(found.get().getStampCount()).isEqualTo(0);
    }

    @Test
    void stampExpiry_whenCardExpires_shouldHavePastExpiryDate() {
        // Given
        User user = createTestUser("user123@example.com", "CUSTOMER");
        String userId = user.getId();
        LoyaltyCard card = LoyaltyCard.builder()
                .userId(userId)
                .stampCount(5)
                .lastStampAt(LocalDateTime.now().minusMonths(13))
                .expiresAt(LocalDateTime.now().minusMonths(1))
                .build();

        loyaltyCardRepository.save(card);

        // When/Then
        Optional<LoyaltyCard> found = loyaltyCardRepository.findByUserId(userId);
        assertThat(found).isPresent();
        assertThat(found.get().getExpiresAt()).isBefore(LocalDateTime.now());
    }

    @Test
    void countByStampCountGreaterThan_shouldCountCorrectly() {
        // Given
        User user1 = createTestUser("user1@example.com", "CUSTOMER");
        User user2 = createTestUser("user2@example.com", "CUSTOMER");
        User user3 = createTestUser("user3@example.com", "CUSTOMER");

        LoyaltyCard card1 = LoyaltyCard.builder()
                .userId(user1.getId())
                .stampCount(3)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        LoyaltyCard card2 = LoyaltyCard.builder()
                .userId(user2.getId())
                .stampCount(7)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        LoyaltyCard card3 = LoyaltyCard.builder()
                .userId(user3.getId())
                .stampCount(9)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        loyaltyCardRepository.save(card1);
        loyaltyCardRepository.save(card2);
        loyaltyCardRepository.save(card3);

        // When
        long count = loyaltyCardRepository.countByStampCountGreaterThan(5);

        // Then
        assertThat(count).isEqualTo(2); // user-2 and user-3
    }

    @Test
    void findCustomerCards_shouldExcludeAdminAndOwner() {
        // Given
        User adminUser = createTestUser("admin@prettynails.com", "ADMIN");
        User ownerUser = createTestUser("owner@prettynails.com", "ADMIN");
        User customerUser = createTestUser("customer@example.com", "CUSTOMER");

        LoyaltyCard adminCard = LoyaltyCard.builder()
                .userId(adminUser.getId())
                .stampCount(0)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        LoyaltyCard ownerCard = LoyaltyCard.builder()
                .userId(ownerUser.getId())
                .stampCount(0)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        LoyaltyCard customerCard = LoyaltyCard.builder()
                .userId(customerUser.getId())
                .stampCount(5)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        loyaltyCardRepository.save(adminCard);
        loyaltyCardRepository.save(ownerCard);
        loyaltyCardRepository.save(customerCard);

        // When
        var results = loyaltyCardRepository.findCustomerCards();

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getUserId()).isEqualTo(customerUser.getId());
    }
}