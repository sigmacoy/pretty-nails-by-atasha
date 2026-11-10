package com.prettynails.config;

import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.Service;
import com.prettynails.entity.ServiceVariant;
import com.prettynails.entity.User;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.ServiceRepository;
import com.prettynails.repository.ServiceVariantRepository;
import com.prettynails.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ServiceRepository serviceRepository;
    private final ServiceVariantRepository serviceVariantRepository;
    private final UserRepository userRepository;
    private final LoyaltyCardRepository loyaltyCardRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminProperties adminProperties;

    @Override
    @Transactional
    public void run(String... args) {
        seedServices();
        seedAdminUser();
    }

    private void seedServices() {
        if (serviceRepository.count() > 0) {
            return; // Already seeded
        }

        // Service 1: Nail Cleaning (CLEANING)
        Service nailCleaning = Service.builder()
                .name("Nail Cleaning")
                .category("CLEANING")
                .description("Professional nail cleaning service")
                .basePrice(30000) // ₱300.00 in centavos
                .duration(30)
                .isActive(true)
                .build();
        nailCleaning = serviceRepository.save(nailCleaning);

        List<ServiceVariant> cleaningVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(nailCleaning.getId())
                        .name("Basic")
                        .price(30000) // ₱300.00
                        .build(),
                ServiceVariant.builder()
                        .serviceId(nailCleaning.getId())
                        .name("Deep Clean")
                        .price(45000) // ₱450.00
                        .build()
        );
        serviceVariantRepository.saveAll(cleaningVariants);

        // Service 2: Nail Gel (GEL)
        Service nailGel = Service.builder()
                .name("Nail Gel")
                .category("GEL")
                .description("Classic gel nail service")
                .basePrice(50000) // ₱500.00
                .duration(60)
                .isActive(true)
                .build();
        nailGel = serviceRepository.save(nailGel);

        List<ServiceVariant> gelVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(nailGel.getId())
                        .name("Classic")
                        .price(50000) // ₱500.00
                        .build(),
                ServiceVariant.builder()
                        .serviceId(nailGel.getId())
                        .name("French")
                        .price(60000) // ₱600.00
                        .build()
        );
        serviceVariantRepository.saveAll(gelVariants);

        // Service 3: Soft Gel Extension (EXTENSION)
        Service softGelExtension = Service.builder()
                .name("Soft Gel Extension")
                .category("EXTENSION")
                .description("Soft gel nail extension service")
                .basePrice(80000) // ₱800.00
                .duration(90)
                .isActive(true)
                .build();
        softGelExtension = serviceRepository.save(softGelExtension);

        List<ServiceVariant> extensionVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(softGelExtension.getId())
                        .name("Short")
                        .price(80000) // ₱800.00
                        .build(),
                ServiceVariant.builder()
                        .serviceId(softGelExtension.getId())
                        .name("Medium")
                        .price(95000) // ₱950.00
                        .build(),
                ServiceVariant.builder()
                        .serviceId(softGelExtension.getId())
                        .name("Long")
                        .price(110000) // ₱1100.00
                        .build()
        );
        serviceVariantRepository.saveAll(extensionVariants);

        // Service 4: Nail Gel Pedicure (PEDICURE)
        Service nailGelPedicure = Service.builder()
                .name("Nail Gel Pedicure")
                .category("PEDICURE")
                .description("Gel pedicure service")
                .basePrice(60000) // ₱600.00
                .duration(60)
                .isActive(true)
                .build();
        nailGelPedicure = serviceRepository.save(nailGelPedicure);

        List<ServiceVariant> pedicureVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(nailGelPedicure.getId())
                        .name("Classic")
                        .price(60000) // ₱600.00
                        .build(),
                ServiceVariant.builder()
                        .serviceId(nailGelPedicure.getId())
                        .name("French")
                        .price(70000) // ₱700.00
                        .build()
        );
        serviceVariantRepository.saveAll(pedicureVariants);
    }

    private void seedAdminUser() {
        String adminEmail = adminProperties.getEmail();

        // Check if admin already exists
        Optional<User> existingAdmin = userRepository.findByEmailIgnoreCase(adminEmail);
        if (existingAdmin.isPresent()) {
            return; // Admin already exists
        }

        // Create admin user
        User admin = User.builder()
                .email(adminEmail)
                .name("Admin User")
                .password(passwordEncoder.encode(adminProperties.getPassword()))
                .role("ADMIN")
                .phone(adminProperties.getPhone())
                .emailVerified(LocalDateTime.now())
                .build();
        admin = userRepository.save(admin);

        // Create loyalty card for admin
        LoyaltyCard loyaltyCard = LoyaltyCard.builder()
                .userId(admin.getId())
                .stampCount(0)
                .expiresAt(LocalDateTime.now().plusYears(1))
                .build();
        loyaltyCardRepository.save(loyaltyCard);
    }
}