package com.prettynails.service;

import org.springframework.stereotype.Service;

@Service
public interface EmailService {

    void sendEmailVerification(String email, String name, String token);

    void sendPasswordReset(String email, String name, String token);
}