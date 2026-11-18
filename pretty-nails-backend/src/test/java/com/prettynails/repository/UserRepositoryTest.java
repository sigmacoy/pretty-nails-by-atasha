package com.prettynails.repository;

import com.prettynails.entity.User;
import com.prettynails.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserRepositoryTest extends IntegrationTestBase {

    @Autowired
    private UserRepository userRepository;

    private String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }

    @Test
    void findByEmailIgnoreCase_whenEmailExists_shouldReturnUser() {
        // Given
        String email = uniqueEmail("Test");
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        userRepository.save(user);

        // When
        Optional<User> found = userRepository.findByEmailIgnoreCase(email.toLowerCase());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo(email);
    }

    @Test
    void findByEmailIgnoreCase_whenEmailNotExists_shouldReturnEmpty() {
        // When
        Optional<User> found = userRepository.findByEmailIgnoreCase("nonexistent-" + UUID.randomUUID() + "@example.com");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    void emailUniqueness_shouldPreventDuplicateEmails() {
        // Given
        String email = uniqueEmail("test");
        User user1 = User.builder()
                .email(email)
                .name("Test User 1")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        userRepository.saveAndFlush(user1);

        // When/Then
        User user2 = User.builder()
                .email(email)
                .name("Test User 2")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        assertThatThrownBy(() -> userRepository.saveAndFlush(user2))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class)
                .hasRootCauseInstanceOf(org.postgresql.util.PSQLException.class)
                .hasMessageContaining("unique");
    }

    @Test
    void findByEmailVerificationToken_whenTokenExists_shouldReturnUser() {
        // Given
        String token = "verification-token-123";
        String email = uniqueEmail("test");
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerificationToken(token)
                .emailVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .build();

        userRepository.save(user);

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
        String email = uniqueEmail("test");
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .passwordResetToken(token)
                .passwordResetTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        userRepository.save(user);

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
        String email = uniqueEmail("test");
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .failedLoginAttempts(4)
                .build();

        userRepository.save(user);

        // When - increment to 5 (MAX_FAILED_ATTEMPTS)
        user.setFailedLoginAttempts(5);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        // Then
        Optional<User> found = userRepository.findByEmailIgnoreCase(email);
        assertThat(found).isPresent();
        assertThat(found.get().getFailedLoginAttempts()).isEqualTo(5);
        assertThat(found.get().getLockedUntil()).isNotNull();
        assertThat(found.get().getLockedUntil()).isAfter(LocalDateTime.now());
    }

    @Test
    void accountLock_whenSuccessfulLogin_shouldResetFailedAttempts() {
        // Given
        String email = uniqueEmail("test");
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .failedLoginAttempts(3)
                .lockedUntil(LocalDateTime.now().plusMinutes(15))
                .build();

        userRepository.save(user);

        // When - successful login resets attempts
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // Then
        Optional<User> found = userRepository.findByEmailIgnoreCase(email);
        assertThat(found).isPresent();
        assertThat(found.get().getFailedLoginAttempts()).isEqualTo(0);
        assertThat(found.get().getLockedUntil()).isNull();
    }

    @Test
    void isEnabled_whenEmailNotVerified_shouldReturnFalse() {
        // Given
        String email = uniqueEmail("test");
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(null)
                .build();

        userRepository.save(user);

        // When/Then
        assertThat(user.isEnabled()).isFalse();
    }

    @Test
    void isEnabled_whenEmailVerified_shouldReturnTrue() {
        // Given
        String email = uniqueEmail("test");
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // When/Then
        assertThat(user.isEnabled()).isTrue();
    }

    @Test
    void isAccountNonLocked_alwaysReturnsTrue_perEntityImplementation() {
        // Given - User entity's isAccountNonLocked() always returns true
        // (actual lock status is checked via CustomUserDetailsService)
        String email = uniqueEmail("test");
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .lockedUntil(LocalDateTime.now().plusMinutes(10))
                .build();

        userRepository.save(user);

        // When/Then - entity method always returns true
        assertThat(user.isAccountNonLocked()).isTrue();
    }

    @Test
    void isAccountNonLocked_whenLockedUntilPast_returnsTrue() {
        // Given
        String email = uniqueEmail("test");
        User user = User.builder()
                .email(email)
                .name("Test User")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .lockedUntil(LocalDateTime.now().minusMinutes(10))
                .build();

        userRepository.save(user);

        // When/Then
        assertThat(user.isAccountNonLocked()).isTrue();
    }

    @Test
    void countByRole_shouldCountCorrectly() {
        // Given - use unique role names to avoid conflicts with other tests in same transaction
        String roleSuffix = UUID.randomUUID().toString().substring(0, 8);
        String customerRole = "CUSTOMER_" + roleSuffix;
        String adminRole = "ADMIN_" + roleSuffix;

        User user1 = User.builder()
                .email("customer1-" + roleSuffix + "@example.com")
                .name("Customer 1")
                .phone("1234567890")
                .password("encoded-password")
                .role(customerRole)
                .build();

        User user2 = User.builder()
                .email("customer2-" + roleSuffix + "@example.com")
                .name("Customer 2")
                .phone("0987654321")
                .password("encoded-password")
                .role(customerRole)
                .build();

        User admin = User.builder()
                .email("admin-" + roleSuffix + "@example.com")
                .name("Admin")
                .phone("1111111111")
                .password("encoded-password")
                .role(adminRole)
                .build();

        userRepository.save(user1);
        userRepository.save(user2);
        userRepository.save(admin);

        // When
        long customerCount = userRepository.countByRole(customerRole);
        long adminCount = userRepository.countByRole(adminRole);

        // Then
        assertThat(customerCount).isEqualTo(2);
        assertThat(adminCount).isEqualTo(1);
    }

    @Test
    void findByRole_shouldReturnCorrectUsers() {
        // Given - use unique role names to avoid conflicts with other tests in same transaction
        String roleSuffix = UUID.randomUUID().toString().substring(0, 8);
        String customerRole = "CUSTOMER_" + roleSuffix;
        String adminRole = "ADMIN_" + roleSuffix;

        User user1 = User.builder()
                .email("customer1-" + roleSuffix + "@example.com")
                .name("Customer 1")
                .phone("1234567890")
                .password("encoded-password")
                .role(customerRole)
                .build();

        User admin = User.builder()
                .email("admin-" + roleSuffix + "@example.com")
                .name("Admin")
                .phone("1111111111")
                .password("encoded-password")
                .role(adminRole)
                .build();

        userRepository.save(user1);
        userRepository.save(admin);

        // When
        var customers = userRepository.findByRole(customerRole);
        var admins = userRepository.findByRole(adminRole);

        // Then
        assertThat(customers).hasSize(1);
        assertThat(customers.get(0).getEmail()).isEqualTo("customer1-" + roleSuffix + "@example.com");
        assertThat(admins).hasSize(1);
        assertThat(admins.get(0).getEmail()).isEqualTo("admin-" + roleSuffix + "@example.com");
    }

    @Test
    void searchCustomers_shouldSearchByNameAndEmail() {
        // Given - use unique emails to avoid conflicts with other tests
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user1 = User.builder()
                .email("maria.santos-" + suffix + "@example.com")
                .name("Maria Santos")
                .phone("1234567890")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        User user2 = User.builder()
                .email("juan.dela.cruz-" + suffix + "@example.com")
                .name("Juan Dela Cruz")
                .phone("0987654321")
                .password("encoded-password")
                .role("CUSTOMER")
                .build();

        userRepository.save(user1);
        userRepository.save(user2);

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