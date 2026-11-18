package com.prettynails.service;

import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.repository.BookingRepository;
import com.prettynails.repository.UserRepository;
import com.prettynails.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoShowPolicyService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final TimeProvider timeProvider;
    private final EmailService emailService;

    @Value("${app.no-show.max-allowed:3}")
    private int maxAllowedNoShows;

    @Value("${app.no-show.block-duration-days:30}")
    private int blockDurationDays;

    @Value("${app.no-show.permanent-block-threshold:5}")
    private int permanentBlockThreshold;

    @Transactional
    public void recordNoShow(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found: " + userId));

        // Count total no-shows for this user
        long noShowCount = bookingRepository.countByUserIdAndStatus(userId, "NO_SHOW");

        log.info("User {} has {} no-show(s)", userId, noShowCount);

        if (noShowCount >= permanentBlockThreshold) {
            // Permanent block (or very long period)
            user.setLockedUntil(timeProvider.localNow().plusYears(10)); // Effectively permanent
            userRepository.save(user);
            sendBlockNotification(user, noShowCount, true);
            log.warn("User {} permanently blocked after {} no-shows", userId, noShowCount);
        } else if (noShowCount >= maxAllowedNoShows) {
            // Temporary block
            user.setLockedUntil(timeProvider.localNow().plusDays(blockDurationDays));
            userRepository.save(user);
            sendBlockNotification(user, noShowCount, false);
            log.warn("User {} blocked for {} days after {} no-shows", userId, blockDurationDays, noShowCount);
        }
    }

    @Transactional
    public void unblockUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found: " + userId));

        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        log.info("User {} unblocked by admin", userId);
    }

    public long getNoShowCount(String userId) {
        return bookingRepository.countByUserIdAndStatus(userId, "NO_SHOW");
    }

    public boolean isBlocked(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getLockedUntil() == null) {
            return false;
        }
        return user.getLockedUntil().isAfter(timeProvider.localNow());
    }

    public LocalDateTime getBlockedUntil(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null ? user.getLockedUntil() : null;
    }

    private void sendBlockNotification(User user, long noShowCount, boolean permanent) {
        try {
            String subject = permanent ?
                    "Your Pretty Nails Account Has Been Permanently Blocked" :
                    "Your Pretty Nails Account Has Been Temporarily Blocked";

            String message = String.format(
                    "Dear %s,\n\n" +
                            "Your account has been %s due to %d no-show appointment(s).\n\n" +
                            "%s\n\n" +
                            "If you believe this is an error, please contact us.\n\n" +
                            "Best regards,\nPretty Nails Team",
                    user.getName(),
                    permanent ? "permanently blocked" : "temporarily blocked for " + blockDurationDays + " days",
                    noShowCount,
                    permanent ?
                            "This action cannot be reversed automatically. Please contact us for assistance." :
                            "Your account will be automatically unblocked after " + blockDurationDays + " days."
            );

            emailService.sendEmail(user.getEmail(), subject, message);
        } catch (Exception e) {
            log.error("Failed to send block notification to user {}: {}", user.getId(), e.getMessage());
        }
    }
}