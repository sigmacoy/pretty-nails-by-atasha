package com.prettynails.config;

import com.prettynails.entity.Gallery;
import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.Service;
import com.prettynails.entity.ServiceVariant;
import com.prettynails.entity.User;
import com.prettynails.repository.GalleryRepository;
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
    private final GalleryRepository galleryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminProperties adminProperties;

    @Override
    @Transactional
    public void run(String... args) {
        seedServices();
        seedAdminUser();
        seedGallery();
    }

    private void seedServices() {
        if (serviceRepository.count() > 0) {
            return; // Already seeded
        }

        // Service 1: Structured BIAB & Gel Overlay (GEL)
        Service biabOverlay = Service.builder()
                .name("Structured BIAB & Gel Overlay")
                .category("GEL")
                .description("Natural plate reinforcement with Russian dry cuticle prep and high-shine Japanese apex finish. Includes autoclave-sterilized implements.")
                .basePrice(50000) // 500 PHP in centavos
                .duration(60)
                .isActive(true)
                .build();
        biabOverlay = serviceRepository.save(biabOverlay);

        List<ServiceVariant> biabVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(biabOverlay.getId())
                        .name("Classic Single-Tone")
                        .price(50000)
                        .build(),
                ServiceVariant.builder()
                        .serviceId(biabOverlay.getId())
                        .name("French Accent Hairline")
                        .price(60000)
                        .build(),
                ServiceVariant.builder()
                        .serviceId(biabOverlay.getId())
                        .name("Magnetic Velvet Cat-Eye")
                        .price(65000)
                        .build()
        );
        serviceVariantRepository.saveAll(biabVariants);

        // Service 2: Soft Gel Sculpted Extensions (EXTENSION)
        Service softGelExtension = Service.builder()
                .name("Soft Gel Sculpted Extensions")
                .category("EXTENSION")
                .description("Sculpted length with apex architecture and Japanese soft gel. Unrushed structural balance designed for high durability. Autoclave sterilization guaranteed.")
                .basePrice(80000) // 800 PHP in centavos
                .duration(90)
                .isActive(true)
                .build();
        softGelExtension = serviceRepository.save(softGelExtension);

        List<ServiceVariant> extensionVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(softGelExtension.getId())
                        .name("Short")
                        .price(80000)
                        .build(),
                ServiceVariant.builder()
                        .serviceId(softGelExtension.getId())
                        .name("Medium")
                        .price(95000)
                        .build(),
                ServiceVariant.builder()
                        .serviceId(softGelExtension.getId())
                        .name("Long")
                        .price(110000)
                        .build()
        );
        serviceVariantRepository.saveAll(extensionVariants);

        // Service 3: Signature Luxe Gel Pedicure (PEDICURE)
        Service luxePedicure = Service.builder()
                .name("Signature Luxe Gel Pedicure")
                .category("PEDICURE")
                .description("Callus softening, gentle dry prep, natural foot soak, and high-shine long-wearing gel finish with sterilized tools.")
                .basePrice(60000) // 600 PHP in centavos
                .duration(60)
                .isActive(true)
                .build();
        luxePedicure = serviceRepository.save(luxePedicure);

        List<ServiceVariant> pedicureVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(luxePedicure.getId())
                        .name("Classic Luxe")
                        .price(60000)
                        .build(),
                ServiceVariant.builder()
                        .serviceId(luxePedicure.getId())
                        .name("French Finish")
                        .price(70000)
                        .build()
        );
        serviceVariantRepository.saveAll(pedicureVariants);

        // Service 4: Studio Dry Cuticle Prep & Hygiene Care (CLEANING)
        Service dryCuticlePrep = Service.builder()
                .name("Studio Dry Cuticle Prep & Hygiene Care")
                .category("CLEANING")
                .description("Precision e-file Russian dry manicuring, cuticle refinement, and natural plate conditioning without abrasive soaking. Hospital-grade autoclave sterilization.")
                .basePrice(30000) // 300 PHP in centavos
                .duration(30)
                .isActive(true)
                .build();
        dryCuticlePrep = serviceRepository.save(dryCuticlePrep);

        List<ServiceVariant> cuticleVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(dryCuticlePrep.getId())
                        .name("Standard Care")
                        .price(30000)
                        .build(),
                ServiceVariant.builder()
                        .serviceId(dryCuticlePrep.getId())
                        .name("Deep Restorative Care")
                        .price(45000)
                        .build()
        );
        serviceVariantRepository.saveAll(cuticleVariants);

        // Service 5: Bespoke Hand-Painted Nail Art (ADDON)
        Service nailArt = Service.builder()
                .name("Bespoke Hand-Painted Nail Art")
                .category("ADDON")
                .description("Custom fine-line artwork, tortoiseshell glass, metallic foil accents, or tailored editorial aesthetics.")
                .basePrice(15000) // 150 PHP in centavos
                .duration(30)
                .isActive(true)
                .build();
        nailArt = serviceRepository.save(nailArt);

        List<ServiceVariant> artVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(nailArt.getId())
                        .name("Minimalist Accent (2 nails)")
                        .price(15000)
                        .build(),
                ServiceVariant.builder()
                        .serviceId(nailArt.getId())
                        .name("Full Set Bespoke Concept")
                        .price(35000)
                        .build()
        );
        serviceVariantRepository.saveAll(artVariants);

        // Service 6: Gentle Gel Removal & Plate Conditioning (ADDON)
        Service gelRemoval = Service.builder()
                .name("Gentle Gel Removal & Plate Conditioning")
                .category("ADDON")
                .description("Safe electric-file debulking and gentle wrap soak-off without scraping or damaging natural keratin layers.")
                .basePrice(20000) // 200 PHP in centavos
                .duration(30)
                .isActive(true)
                .build();
        gelRemoval = serviceRepository.save(gelRemoval);

        List<ServiceVariant> removalVariants = Arrays.asList(
                ServiceVariant.builder()
                        .serviceId(gelRemoval.getId())
                        .name("Standard Removal")
                        .price(20000)
                        .build()
        );
        serviceVariantRepository.saveAll(removalVariants);
    }

    private void seedAdminUser() {
        // Seed primary owner account with username "admin" and password "admin"
        // This is the hardcoded prototype credential that must be preserved
        if (userRepository.findByEmailIgnoreCase("admin").isEmpty()) {
            User owner = User.builder()
                    .email("admin")
                    .name("Ma'am Atasha (Owner)")
                    .password(passwordEncoder.encode("admin"))
                    .role("ADMIN")
                    .phone("+639000000000")
                    .emailVerified(LocalDateTime.now())
                    .build();
            owner = userRepository.save(owner);

            LoyaltyCard loyaltyCard = LoyaltyCard.builder()
                    .userId(owner.getId())
                    .stampCount(0)
                    .expiresAt(LocalDateTime.now().plusYears(1))
                    .build();
            loyaltyCardRepository.save(loyaltyCard);
        }

        // Seed configurable admin if distinct from hardcoded "admin"
        // FIX: Only seed if adminEmail is non-empty AND not "admin" to avoid bogus empty-email row
        String adminEmail = adminProperties.getEmail();
        if (adminEmail != null && !adminEmail.isBlank() && !"admin".equalsIgnoreCase(adminEmail)
                && userRepository.findByEmailIgnoreCase(adminEmail).isEmpty()) {
            User admin = User.builder()
                    .email(adminEmail)
                    .name("Ma'am Atasha (Owner)")
                    .password(passwordEncoder.encode(adminProperties.getPassword()))
                    .role("ADMIN")
                    .phone(adminProperties.getPhone())
                    .emailVerified(LocalDateTime.now())
                    .build();
            admin = userRepository.save(admin);

            LoyaltyCard loyaltyCard = LoyaltyCard.builder()
                    .userId(admin.getId())
                    .stampCount(0)
                    .expiresAt(LocalDateTime.now().plusYears(1))
                    .build();
            loyaltyCardRepository.save(loyaltyCard);
        }
    }

    private void seedGallery() {
        if (galleryRepository.count() > 0) {
            return; // Already seeded
        }

        List<Gallery> galleryItems = Arrays.asList(
                Gallery.builder()
                        .title("Magnetic Velvet Cat-Eye in Bronze Shimmer")
                        .description("Deep multidimensional magnetic velvet shimmer over structured BIAB base with glass apex finish.")
                        .imageUrl("/gallery/sample2.jpg")
                        .category("GEL")
                        .isActive(true)
                        .build(),
                Gallery.builder()
                        .title("Tortoiseshell Glass & Noir Minimalist")
                        .description("Hand-painted amber tortoiseshell layers accented with delicate noir contours and gold leaf hairline.")
                        .imageUrl("/gallery/sample3.jpg")
                        .category("NAIL_ART")
                        .isActive(true)
                        .build(),
                Gallery.builder()
                        .title("Burgundy Wave French with Gold Hairline")
                        .description("Deep Bordeaux negative-space wave french finished with micro gold gilding and reinforced apex.")
                        .imageUrl("/gallery/sample4.jpg")
                        .category("GEL")
                        .isActive(true)
                        .build(),
                Gallery.builder()
                        .title("Milky Blush Soft Gel with Glass Cushion Top")
                        .description("Natural almond sculpted extensions with translucent milky blush gradient and ultra-plump cushion top.")
                        .imageUrl("/gallery/sample5.jpg")
                        .category("EXTENSION")
                        .isActive(true)
                        .build(),
                Gallery.builder()
                        .title("Pastel Buttercup & Metallic Foil Accent")
                        .description("Subtle spring buttercup monochrome paired with abstract silver foil flakes and satin matte balance.")
                        .imageUrl("/gallery/sample6.jpg")
                        .category("NAIL_ART")
                        .isActive(true)
                        .build(),
                Gallery.builder()
                        .title("Precision Cuticle Prep & Gold Contour Detail")
                        .description("Russian dry e-file hygienic care paired with seamless high-shine gel finish and micro-metallic lines.")
                        .imageUrl("/gallery/sample7.jpg")
                        .category("PEDICURE")
                        .isActive(true)
                        .build()
        );

        galleryRepository.saveAll(galleryItems);
    }
}
