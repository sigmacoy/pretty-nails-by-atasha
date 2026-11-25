package com.prettynails.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Profile("!local")
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.verification-url:http://localhost:3000/verify-email}")
    private String verificationUrl;

    @Value("${app.email.reset-url:http://localhost:3000/reset-password}")
    private String resetUrl;

    @Value("${app.email.from-email:noreply@prettynails.example.com}")
    private String fromEmail;

    @Override
    @Async
    public void sendEmailVerification(String email, String name, String token) {
        String verificationLink = verificationUrl + "?token=" + token;
        String subject = "Verify your email - Pretty Nails Salon";
        String htmlBody = buildVerificationEmailHtml(name, verificationLink);

        sendHtmlEmail(email, subject, htmlBody);
    }

    @Override
    @Async
    public void sendPasswordReset(String email, String name, String token) {
        String resetLink = resetUrl + "?token=" + token;
        String subject = "Reset your password - Pretty Nails Salon";
        String htmlBody = buildPasswordResetEmailHtml(name, resetLink);

        sendHtmlEmail(email, subject, htmlBody);
    }

    @Override
    @Async
    public void sendEmail(String to, String subject, String body) {
        // For backward compatibility, convert plain text to simple HTML
        String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <tr>
                            <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="padding: 32px 0;">
                                    <tr>
                                        <td style="color: #333333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">%s</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(subject, body);

        sendHtmlEmail(to, subject, htmlBody);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
            throw new EmailSendException("Failed to send email to " + to, e);
        }
    }

    private String buildVerificationEmailHtml(String name, String verificationLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verify your email - Pretty Nails Salon</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <tr>
                            <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                    <tr>
                                        <td style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #eeeeee;">
                                            <h1 style="margin: 0; color: #1a1a2e; font-size: 28px; font-weight: 700;">Pretty Nails Salon</h1>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Content -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="padding: 32px 0;">
                                    <tr>
                                        <td style="color: #333333; font-size: 16px; line-height: 1.6;">
                                            <p style="margin: 0 0 16px;">Hello <strong>%s</strong>,</p>
                                            <p style="margin: 0 0 16px;">Thank you for registering with Pretty Nails Salon. Please click the button below to verify your email address:</p>

                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="margin: 32px 0;">
                                                <tr>
                                                    <td style="text-align: center;">
                                                        <a href="%s" style="display: inline-block; background-color: #d6336c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Verify Email Address</a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin: 16px 0 0; font-size: 14px; color: #666666;">Or copy and paste this link into your browser:</p>
                                            <p style="margin: 8px 0 0; font-size: 13px; color: #999999; word-break: break-all;">%s</p>

                                            <p style="margin: 24px 0 0; font-size: 14px; color: #666666;">This link will expire in 24 hours.</p>
                                            <p style="margin: 16px 0 0; font-size: 14px; color: #666666;">If you didn't create an account, please ignore this email.</p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Footer -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="border-top: 1px solid #eeeeee; padding-top: 24px;">
                                    <tr>
                                        <td style="color: #999999; font-size: 13px; text-align: center; line-height: 1.5;">
                                            <p style="margin: 0;">Best regards,<br>Pretty Nails Team</p>
                                            <p style="margin: 16px 0 0;">© 2025 Pretty Nails Salon. All rights reserved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(name, verificationLink, verificationLink);
    }

    private String buildPasswordResetEmailHtml(String name, String resetLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Reset your password - Pretty Nails Salon</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <tr>
                            <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                    <tr>
                                        <td style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #eeeeee;">
                                            <h1 style="margin: 0; color: #1a1a2e; font-size: 28px; font-weight: 700;">Pretty Nails Salon</h1>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Content -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="padding: 32px 0;">
                                    <tr>
                                        <td style="color: #333333; font-size: 16px; line-height: 1.6;">
                                            <p style="margin: 0 0 16px;">Hello <strong>%s</strong>,</p>
                                            <p style="margin: 0 0 16px;">You requested to reset your password. Please click the button below to set a new password:</p>

                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="margin: 32px 0;">
                                                <tr>
                                                    <td style="text-align: center;">
                                                        <a href="%s" style="display: inline-block; background-color: #d6336c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin: 16px 0 0; font-size: 14px; color: #666666;">Or copy and paste this link into your browser:</p>
                                            <p style="margin: 8px 0 0; font-size: 13px; color: #999999; word-break: break-all;">%s</p>

                                            <p style="margin: 24px 0 0; font-size: 14px; color: #666666;">This link will expire in 1 hour.</p>
                                            <p style="margin: 16px 0 0; font-size: 14px; color: #666666;">If you didn't request a password reset, please ignore this email.</p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Footer -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="border-top: 1px solid #eeeeee; padding-top: 24px;">
                                    <tr>
                                        <td style="color: #999999; font-size: 13px; text-align: center; line-height: 1.5;">
                                            <p style="margin: 0;">Best regards,<br>Pretty Nails Team</p>
                                            <p style="margin: 16px 0 0;">© 2025 Pretty Nails Salon. All rights reserved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(name, resetLink, resetLink);
    }

    public static class EmailSendException extends RuntimeException {
        public EmailSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}