package com.prettynails.service;

import com.nulabinc.zxcvbn.Strength;
import com.nulabinc.zxcvbn.Zxcvbn;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Service for enforcing password strength policies.
 * Uses zxcvbn for entropy-based strength estimation and
 * HaveIBeenPwned API for breach checking (k-anonymity model).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordPolicyService {

    private final Zxcvbn zxcvbn = new Zxcvbn();
    private final WebClient webClient = WebClient.builder()
            .defaultHeader(HttpHeaders.USER_AGENT, "PrettyNails/1.0")
            .build();

    @Value("${app.password-policy.min-length:12}")
    private int minLength;

    @Value("${app.password-policy.min-zxcvbn-score:3}")
    private int minZxcvbnScore;

    @Value("${app.password-policy.history-size:5}")
    private int historySize;

    public int getHistorySize() {
        return historySize;
    }

    @Value("${app.password-policy.hibp-check-enabled:true}")
    private boolean hibpCheckEnabled;

    @Value("${app.password-policy.hibp-api-url:https://api.pwnedpasswords.com/range/}")
    private String hibpApiUrl;

    // Common weak passwords to reject
    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password", "password123", "123456", "123456789", "qwerty",
            "abc123", "letmein", "welcome", "admin", "admin123",
            "prettynails", "prettynails123", "nailsalon", "nailsalon123",
            "philippines", "manila", "password1", "passw0rd"
    );

    // Patterns for complexity requirements
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("\\d");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?`~]");

    /**
     * Validates a password against the configured policy.
     *
     * @param password the password to validate
     * @param userInputs optional user inputs (email, name, etc.) for zxcvbn context
     * @return ValidationResult with success status and messages
     */
    public ValidationResult validate(String password, String... userInputs) {
        ValidationResult.ValidationResultBuilder result = ValidationResult.builder();

        if (password == null || password.isEmpty()) {
            return result.success(false).message("Password is required").build();
        }

        // Check minimum length
        if (password.length() < minLength) {
            return result.success(false)
                    .message("Password must be at least " + minLength + " characters long")
                    .build();
        }

        // Check against common passwords
        if (COMMON_PASSWORDS.contains(password.toLowerCase(Locale.ROOT))) {
            return result.success(false)
                    .message("Password is too common. Please choose a more unique password.")
                    .build();
        }

        // Check complexity requirements
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            return result.success(false)
                    .message("Password must contain at least one uppercase letter")
                    .build();
        }
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            return result.success(false)
                    .message("Password must contain at least one lowercase letter")
                    .build();
        }
        if (!DIGIT_PATTERN.matcher(password).find()) {
            return result.success(false)
                    .message("Password must contain at least one digit")
                    .build();
        }
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            return result.success(false)
                    .message("Password must contain at least one special character (!@#$%^&*...)")
                    .build();
        }

        // Check zxcvbn strength
        Strength strength = zxcvbn.measure(password, List.of(userInputs));
        int score = strength.getScore(); // 0-4

        if (score < minZxcvbnScore) {
            String feedback = strength.getFeedback().getWarning();
            if (feedback == null || feedback.isEmpty()) {
                List<String> suggestions = strength.getFeedback().getSuggestions();
                feedback = suggestions.isEmpty() ? "Password is too weak" : String.join(" ", suggestions);
            }
            return result.success(false)
                    .message("Password strength insufficient: " + feedback)
                    .zxcvbnScore(score)
                    .build();
        }

        // Check HaveIBeenPwned (k-anonymity model)
        if (hibpCheckEnabled) {
            Optional<String> breachMessage = checkHaveIBeenPwned(password);
            if (breachMessage.isPresent()) {
                return result.success(false)
                        .message(breachMessage.get())
                        .build();
            }
        }

        return result.success(true)
                .message("Password meets all requirements")
                .zxcvbnScore(score)
                .build();
    }

    /**
     * Checks if a password has been exposed in data breaches using HaveIBeenPwned API.
     * Uses k-anonymity model: sends only first 5 chars of SHA-1 hash.
     *
     * @param password the password to check
     * @return Optional containing breach message if found, empty otherwise
     */
    private Optional<String> checkHaveIBeenPwned(String password) {
        try {
            String sha1Hash = sha1(password);
            String prefix = sha1Hash.substring(0, 5).toUpperCase(Locale.ROOT);
            String suffix = sha1Hash.substring(5).toUpperCase(Locale.ROOT);

            String url = hibpApiUrl + prefix;
            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                for (String line : response.split("\n")) {
                    String[] parts = line.split(":");
                    if (parts.length == 2 && parts[0].equals(suffix)) {
                        int count = Integer.parseInt(parts[1].trim());
                        return Optional.of("This password has appeared in " + count +
                                " data breach(es). Please choose a different password.");
                    }
                }
            }
        } catch (WebClientResponseException e) {
            log.warn("HaveIBeenPwned API error: {}", e.getStatusCode());
        } catch (Exception e) {
            log.warn("Error checking HaveIBeenPwned: {}", e.getMessage());
        }
        return Optional.empty();
    }

    /**
     * Computes SHA-1 hash of a string.
     */
    private String sha1(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 algorithm not available", e);
        }
    }

    /**
     * Checks if a new password matches any of the previous passwords in history.
     *
     * @param newPassword the new password to check
     * @param passwordHistory list of previous password hashes (most recent first)
     * @param passwordEncoder the password encoder to verify hashes
     * @return true if password was reused, false otherwise
     */
    public boolean isPasswordReused(String newPassword, List<String> passwordHistory,
                                     PasswordEncoder passwordEncoder) {
        if (passwordHistory == null || passwordHistory.isEmpty()) {
            return false;
        }
        int checkCount = Math.min(historySize, passwordHistory.size());
        for (int i = 0; i < checkCount; i++) {
            if (passwordEncoder.matches(newPassword, passwordHistory.get(i))) {
                return true;
            }
        }
        return false;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationResult {
        private boolean success;
        private String message;
        private Integer zxcvbnScore;
    }
}