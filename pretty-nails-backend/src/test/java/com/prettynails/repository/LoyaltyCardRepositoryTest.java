package com.prettynails.repository;

import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@TestPropertySource(locations = "classpath:application-test.yml")
class LoyaltyCardRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.testcontainers.jdbc.ContainerDatabaseDriver");
    }

    @Autowired
    private LoyaltyCardRepository loyaltyCardRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByUserId_whenCardExists_shouldReturnCard() {
        // Given
        String userId = "user-123";
        LoyaltyCard card = LoyaltyCard.builder()
                .userId(userId)
                .stampCount(5)
                .lastStampAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        entityManager.persistAndFlush(card);

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
        String userId = "user-123";
        LoyaltyCard card = LoyaltyCard.builder()
                .userId(userId)
                .stampCount(3)
                .lastStampAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        entityManager.persistAndFlush(card);

        // When
        card.setStampCount(4);
        card.setLastStampAt(LocalDateTime.now());
        entityManager.persistAndFlush(card);
        entityManager.clear();

        // Then
        Optional<LoyaltyCard> found = loyaltyCardRepository.findByUserId(userId);
        assertThat(found).isPresent();
        assertThat(found.get().getStampCount()).isEqualTo(4);
    }

    @Test
    void stampCounting_whenRedeemingStamps_shouldDeductCount() {
        // Given
        String userId = "user-123";
        LoyaltyCard card = LoyaltyCard.builder()
                .userId(userId)
                .stampCount(9)
                .lastStampAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        entityManager.persistAndFlush(card);

        // When - redeem 9 stamps for free service
        card.setStampCount(0);
        entityManager.persistAndFlush(card);
        entityManager.clear();

        // Then
        Optional<LoyaltyCard> found = loyaltyCardRepository.findByUserId(userId);
        assertThat(found).isPresent();
        assertThat(found.get().getStampCount()).isEqualTo(0);
    }

    @Test
    void stampExpiry_whenCardExpires_shouldHavePastExpiryDate() {
        // Given
        String userId = "user-123";
        LoyaltyCard card = LoyaltyCard.builder()
                .userId(userId)
                .stampCount(5)
                .lastStampAt(LocalDateTime.now().minusMonths(13))
                .expiresAt(LocalDateTime.now().minusMonths(1))
                .build();

        entityManager.persistAndFlush(card);

        // When/Then
        Optional<LoyaltyCard> found = loyaltyCardRepository.findByUserId(userId);
        assertThat(found).isPresent();
        assertThat(found.get().getExpiresAt()).isBefore(LocalDateTime.now());
    }

    @Test
    void countByStampCountGreaterThan_shouldCountCorrectly() {
        // Given
        LoyaltyCard card1 = LoyaltyCard.builder()
                .userId("user-1")
                .stampCount(3)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        LoyaltyCard card2 = LoyaltyCard.builder()
                .userId("user-2")
                .stampCount(7)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        LoyaltyCard card3 = LoyaltyCard.builder()
                .userId("user-3")
                .stampCount(9)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        entityManager.persistAndFlush(card1);
        entityManager.persistAndFlush(card2);
        entityManager.persistAndFlush(card3);

        // When
        long count = loyaltyCardRepository.countByStampCountGreaterThan(5);

        // Then
        assertThat(count).isEqualTo(2); // user-2 and user-3
    }

    @Test
    void findCustomerCards_shouldExcludeAdminAndOwner() {
        // Given
        User adminUser = User.builder()
                .id("admin-1")
                .email("admin@prettynails.com")
                .name("Admin User")
                .phone("1111111111")
                .password("encoded")
                .role("ADMIN")
                .build();

        User ownerUser = User.builder()
                .id("owner-1")
                .email("owner@prettynails.com")
                .name("Atasha Owner")
                .phone("2222222222")
                .password("encoded")
                .role("ADMIN")
                .build();

        User customerUser = User.builder()
                .id("customer-1")
                .email("customer@example.com")
                .name("Regular Customer")
                .phone("3333333333")
                .password("encoded")
                .role("CUSTOMER")
                .build();

        entityManager.persistAndFlush(adminUser);
        entityManager.persistAndFlush(ownerUser);
        entityManager.persistAndFlush(customerUser);

        LoyaltyCard adminCard = LoyaltyCard.builder()
                .userId("admin-1")
                .stampCount(0)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        LoyaltyCard ownerCard = LoyaltyCard.builder()
                .userId("owner-1")
                .stampCount(0)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        LoyaltyCard customerCard = LoyaltyCard.builder()
                .userId("customer-1")
                .stampCount(5)
                .expiresAt(LocalDateTime.now().plusMonths(11))
                .build();

        entityManager.persistAndFlush(adminCard);
        entityManager.persistAndFlush(ownerCard);
        entityManager.persistAndFlush(customerCard);

        // When
        var results = loyaltyCardRepository.findCustomerCards();

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getUserId()).isEqualTo("customer-1");
    }
}