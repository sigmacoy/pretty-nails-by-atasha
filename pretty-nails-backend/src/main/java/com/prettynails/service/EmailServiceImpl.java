package com.prettynails.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Value("${app.email.verification-url:http://localhost:3000/verify-email}")
    private String verificationUrl;

    @Value("${app.email.reset-url:http://localhost:3000/reset-password}")
    private String resetUrl;

    @Override
    public void sendEmailVerification(String email, String name, String token) {
        String verificationLink = verificationUrl + "?token=" + token;
        String subject = "Verify your email - Pretty Nails Salon";
        String body = String.format(
                "Hello %s,\n\n" +
                "Thank you for registering with Pretty Nails Salon. Please click the link below to verify your email address:\n\n" +
                "%s\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you didn't create an account, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Pretty Nails Team",
                name, verificationLink);

        // In production, integrate with an email service like SendGrid, Mailgun, AWS SES, etc.
        log.info("EMAIL VERIFICATION - To: {}, Subject: {}, Body:\n{}", email, subject, body);
    }

    @Override
    public void sendPasswordReset(String email, String name, String token) {
        String resetLink = resetUrl + "?token=" + token;
        String subject = "Reset your password - Pretty Nails Salon";
        String body = String.format(
                "Hello %s,\n\n" +
                "You requested to reset your password. Please click the link below to set a new password:\n\n" +
                "%s\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you didn't request a password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Pretty Nails Team",
                name, resetLink);

        // In production, integrate with an email service like SendGrid, Mailgun, AWS SES, etc.
        log.info("PASSWORD RESET - To: {}, Subject: {}, Body:\n{}", email, subject, body);
    }
}