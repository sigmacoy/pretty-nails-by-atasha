package com.prettynails.service;

public interface EmailService {

    void sendEmailVerification(String email, String name, String token);

    void sendPasswordReset(String email, String name, String token);

    void sendEmail(String email, String subject, String message);
}