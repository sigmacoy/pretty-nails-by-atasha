package com.prettynails.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Profile("local")
@Slf4j
public class EmailServiceMock implements EmailService {

    @Override
    @Async
    public void sendEmailVerification(String email, String name, String token) {
        String verificationLink = "http://localhost:3000/verify-email?token=" + token;
        log.info("═══════════════════════════════════════════════════════════");
        log.info("📧 [MOCK EMAIL] Email Verification");
        log.info("═══════════════════════════════════════════════════════════");
        log.info("To: {}", email);
        log.info("Name: {}", name);
        log.info("Token: {}", token);
        log.info("Verification Link: {}", verificationLink);
        log.info("Subject: Verify your email - Pretty Nails Salon");
        log.info("═══════════════════════════════════════════════════════════");
    }

    @Override
    @Async
    public void sendPasswordReset(String email, String name, String token) {
        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        log.info("═══════════════════════════════════════════════════════════");
        log.info("📧 [MOCK EMAIL] Password Reset");
        log.info("═══════════════════════════════════════════════════════════");
        log.info("To: {}", email);
        log.info("Name: {}", name);
        log.info("Token: {}", token);
        log.info("Reset Link: {}", resetLink);
        log.info("Subject: Reset your password - Pretty Nails Salon");
        log.info("═══════════════════════════════════════════════════════════");
    }

    @Override
    @Async
    public void sendEmail(String email, String subject, String message) {
        log.info("═══════════════════════════════════════════════════════════");
        log.info("📧 [MOCK EMAIL] Generic Email");
        log.info("═══════════════════════════════════════════════════════════");
        log.info("To: {}", email);
        log.info("Subject: {}", subject);
        log.info("Message: {}", message);
        log.info("═══════════════════════════════════════════════════════════");
    }
}