package com.prettynails.repository;

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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Testcontainers
@TestPropertySource(locations = "classpath:application-test.yml")
class UserRepositoryTest {

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
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByEmailIgnoreCase_whenEmailExists_shouldReturnUser() {
        // Given
        User user = User.builder()
                .email("Test@Example.COM")
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        entityManager.persistAndFlush(user);

        // When
        Optional<User> found = userRepository.findByEmailIgnoreCase("test@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("Test@Example.COM");
    }

    @Test
    void findByEmailIgnoreCase_whenEmailNotExists_shouldReturnEmpty() {
        // When
        Optional<User> found = userRepository.findByEmailIgnoreCase("nonexistent@example.com");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    void emailUniqueness_shouldPreventDuplicateEmails() {
        // Given
        User user1 = User.builder()
                .email("test@example.com")
                .name("Test User 1")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        entityManager.persistAndFlush(user1);

        // When/Then
        User user2 = User.builder()
                .email("test@example.com")
                .name("Test User 2")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        assertThatThrownBy(() -> entityManager.persistAndFlush(user2))
                .hasCauseInstanceOf(jakarta.persistence.PersistenceException.class)
                .hasRootCauseInstanceOf(org.postgresql.util.PSQLException.class)
                .hasMessageContaining("unique");
    }

    @Test
    void findByEmailVerificationToken_whenTokenExists_shouldReturnUser() {
        // Given
        String token = "verification-token-123";
        User user = User.builder()
                .email("test@example.com")
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerificationToken(token)
                .emailVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .build();

        entityManager.persistAndFlush(user);

        // When
        Optional<User> found = userRepository.findByEmailVerificationToken(token);

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmailVerificationToken()).isEqualTo(token);
    }

    @Test
    void findByEmailVerificationToken_whenTokenNotExists_shouldReturnEmpty() {
        // When
        Optional<User> found = userRepository.findByEmailVerificationToken("nonexistent-token");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    void findByPasswordResetToken_whenTokenExists_shouldReturnUser() {
        // Given
        String token = "reset-token-123";
        User user = User.builder()
                .email("test@example.com")
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .passwordResetToken(token)
                .passwordResetTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        entityManager.persistAndFlush(user);

        // When
        Optional<User> found = userRepository.findByPasswordResetToken(token);

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getPasswordResetToken()).isEqualTo(token);
    }

    @Test
    void findByPasswordResetToken_whenTokenNotExists_shouldReturnEmpty() {
        // When
        Optional<User> found = userRepository.findByPasswordResetToken("nonexistent-token");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    void accountLock_whenFailedAttemptsReachMax_shouldSetLockedUntil() {
        // Given
        User user = User.builder()
                .email("test@example.com")
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .failedLoginAttempts(4)
                .build();

        entityManager.persistAndFlush(user);

        // When - increment to 5 (MAX_FAILED_ATTEMPTS)
        user.setFailedLoginAttempts(5);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(15));
        entityManager.persistAndFlush(user);
        entityManager.clear();

        // Then
        Optional<User> found = userRepository.findByEmailIgnoreCase("test@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getFailedLoginAttempts()).isEqualTo(5);
        assertThat(found.get().getLockedUntil()).isNotNull();
        assertThat(found.get().getLockedUntil()).isAfter(LocalDateTime.now());
    }

    @Test
    void accountLock_whenSuccessfulLogin_shouldResetFailedAttempts() {
        // Given
        User user = User.builder()
                .email("test@example.com")
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .failedLoginAttempts(3)
                .lockedUntil(LocalDateTime.now().plusMinutes(15))
                .build();

        entityManager.persistAndFlush(user);

        // When - successful login resets attempts
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        entityManager.persistAndFlush(user);
        entityManager.clear();

        // Then
        Optional<User> found = userRepository.findByEmailIgnoreCase("test@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getFailedLoginAttempts()).isEqualTo(0);
        assertThat(found.get().getLockedUntil()).isNull();
    }

    @Test
    void isEnabled_whenEmailNotVerified_shouldReturnFalse() {
        // Given
        User user = User.builder()
                .email("test@example.com")
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(null)
                .build();

        entityManager.persistAndFlush(user);

        // When/Then
        assertThat(user.isEnabled()).isFalse();
    }

    @Test
    void isEnabled_whenEmailVerified_shouldReturnTrue() {
        // Given
        User user = User.builder()
                .email("test@example.com")
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();

        entityManager.persistAndFlush(user);

        // When/Then
        assertThat(user.isEnabled()).isTrue();
    }

    @Test
    void isAccountNonLocked_whenLockedUntilFuture_shouldReturnFalse() {
        // Given
        User user = User.builder()
                .email("test@example.com")
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .lockedUntil(LocalDateTime.now().plusMinutes(10))
                .build();

        entityManager.persistAndFlush(user);

        // When/Then
        assertThat(user.isAccountNonLocked()).isFalse();
    }

    @Test
    void isAccountNonLocked_whenLockedUntilPast_shouldReturnTrue() {
        // Given
        User user = User.builder()
                .email("test@example.com")
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .lockedUntil(LocalDateTime.now().minusMinutes(10))
                .build();

        entityManager.persistAndFlush(user);

        // When/Then
        assertThat(user.isAccountNonLocked()).isTrue();
    }

    @Test
    void countByRole_shouldCountCorrectly() {
        // Given
        User user1 = User.builder()
                .email("customer1@example.com")
                .name("Customer 1")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        User user2 = User.builder()
                .email("customer2@example.com")
                .name("Customer 2")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        User admin = User.builder()
                .email("admin@example.com")
                .name("Admin")
                .phone("1111111111")
                .password("encoded-password")
                .role("ADMIN")
                .build();

        entityManager.persistAndFlush(user1);
        entityManager.persistAndFlush(user2);
        entityManager.persistAndFlush(admin);

        // When
        long customerCount = userRepository.countByRole("CUSTOMER");
        long adminCount = userRepository.countByRole("ADMIN");

        // Then
        assertThat(customerCount).isEqualTo(2);
        assertThat(adminCount).isEqualTo(1);
    }

    @Test
    void findByRole_shouldReturnCorrectUsers() {
        // Given
        User user1 = User.builder()
                .email("customer1@example.com")
                .name("Customer 1")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        User admin = User.builder()
                .email("admin@example.com")
                .name("Admin")
                .phone("1111111111")
                .password("encoded-password")
                .role("ADMIN")
                .build();

        entityManager.persistAndFlush(user1);
        entityManager.persistAndFlush(admin);

        // When
        var customers = userRepository.findByRole("CUSTOMER");
        var admins = userRepository.findByRole("ADMIN");

        // Then
        assertThat(customers).hasSize(1);
        assertThat(customers.get(0).getEmail()).isEqualTo("customer1@example.com");
        assertThat(admins).hasSize(1);
        assertThat(admins.get(0).getEmail()).isEqualTo("admin@example.com");
    }

    @Test
    void searchCustomers_shouldSearchByNameAndEmail() {
        // Given
        User user1 = User.builder()
                .email("maria.santos@example.com")
                .name("Maria Santos")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        User user2 = User.builder()
                .email("juan.dela.cruz@example.com")
                .name("Juan Dela Cruz")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        entityManager.persistAndFlush(user1);
        entityManager.persistAndFlush(user2);

        // When
        var results = userRepository.searchCustomers("maria");

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Maria Santos");

        // When
        results = userRepository.searchCustomers("santos");

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Maria Santos");

        // When
        results = userRepository.searchCustomers("juan");

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Juan Dela Cruz");
    }
}