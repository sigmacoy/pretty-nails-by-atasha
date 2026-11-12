package com.prettynails.service;

import com.prettynails.dto.AdminDtos.*;
import com.prettynails.entity.Booking;
import com.prettynails.entity.CustomerNote;
import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.Setting;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.BookingRepository;
import com.prettynails.repository.CustomerNoteRepository;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.SettingRepository;
import com.prettynails.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final LoyaltyCardRepository loyaltyCardRepository;
    private final SettingRepository settingRepository;
    private final CustomerNoteRepository customerNoteRepository;

    private static final String LOYALTY_SETTINGS_KEY = "loyalty_settings";

    /**
     * Get dashboard statistics
     */
    public AdminStatsDto getDashboardStats() {
        long totalCustomers = userRepository.countByRole("CUSTOMER");
        long totalBookings = bookingRepository.count();
        long totalRevenue = bookingRepository.sumTotalPriceByStatus("COMPLETED");
        long pendingBookings = bookingRepository.countByStatus("PENDING");

        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = currentMonth.atEndOfMonth().atTime(23, 59, 59);
        long completedThisMonth = bookingRepository.countByStatusAndAppointmentDateBetween("COMPLETED", startOfMonth, endOfMonth);

        long loyaltyActive = loyaltyCardRepository.countByStampCountGreaterThan(0);

        return AdminStatsDto.builder()
                .totalCustomers(totalCustomers)
                .totalBookings(totalBookings)
                .totalRevenue(totalRevenue)
                .pendingBookings(pendingBookings)
                .completedThisMonth(completedThisMonth)
                .loyaltyActive(loyaltyActive)
                .build();
    }

    /**
     * Get reports for a given period
     */
    public AdminReportsDto getReports(String period) {
        LocalDateTime start;
        LocalDateTime end = LocalDateTime.now();

        if ("week".equalsIgnoreCase(period)) {
            start = end.minusWeeks(1);
        } else if ("month".equalsIgnoreCase(period)) {
            start = end.minusMonths(1);
        } else if ("quarter".equalsIgnoreCase(period)) {
            start = end.minusMonths(3);
        } else if ("year".equalsIgnoreCase(period)) {
            start = end.minusYears(1);
        } else {
            // Default to month
            start = end.minusMonths(1);
        }

        // Revenue in period
        Long revenue = bookingRepository.sumTotalPriceByStatusAndDateBetween("COMPLETED", start, end);
        if (revenue == null) revenue = 0L;

        // Bookings count in period
        long bookingsCount = bookingRepository.countByAppointmentDateBetween(start, end);

        // Top services in period
        List<Booking> completedBookings = bookingRepository.findByStatusAndAppointmentDateBetween("COMPLETED", start, end);
        Map<String, Long> serviceCounts = completedBookings.stream()
                .flatMap(booking -> booking.getServices().stream())
                .collect(Collectors.groupingBy(
                        bs -> bs.getService() != null ? bs.getService().getName() : "Unknown",
                        Collectors.counting()
                ));

        List<TopServiceDto> topServices = serviceCounts.entrySet().stream()
                .map(e -> TopServiceDto.builder()
                        .serviceName(e.getKey())
                        .count(e.getValue())
                        .build())
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .limit(5)
                .collect(Collectors.toList());

        // Loyalty stats in period
        long stampsIssued = loyaltyCardRepository.countStampsSince(start);
        long stampsRedeemed = loyaltyCardRepository.countRedeemedStampsSince(start);

        return AdminReportsDto.builder()
                .period(period)
                .revenue(revenue)
                .bookingsCount(bookingsCount)
                .topServices(topServices)
                .loyaltyStats(LoyaltyStatsDto.builder()
                        .issued(stampsIssued)
                        .redeemed(stampsRedeemed)
                        .build())
                .build();
    }

    /**
     * Get loyalty settings
     */
    public LoyaltySettingsDto getLoyaltySettings() {
        Optional<Setting> setting = settingRepository.findByKey(LOYALTY_SETTINGS_KEY);
        if (setting.isPresent()) {
            // Parse JSON settings
            // For simplicity, we'll use defaults if parsing fails
            return parseSettings(setting.get().getValue());
        }
        // Return defaults
        return LoyaltySettingsDto.builder()
                .stampsPerService(1)
                .stampsPerAmount(1)
                .amountThreshold(100000) // 1000 PHP in centavos
                .freeServiceReward("Free Basic Manicure")
                .cardExpiryMonths(12)
                .build();
    }

    /**
     * Update loyalty settings
     */
    @Transactional
    public LoyaltySettingsDto updateLoyaltySettings(LoyaltySettingsDto settings) {
        // Convert to JSON string (simplified - in production use ObjectMapper)
        String json = String.format(
                "{\"stampsPerService\":%d,\"stampsPerAmount\":%d,\"amountThreshold\":%d,\"freeServiceReward\":\"%s\",\"cardExpiryMonths\":%d}",
                settings.getStampsPerService(),
                settings.getStampsPerAmount(),
                settings.getAmountThreshold(),
                settings.getFreeServiceReward(),
                settings.getCardExpiryMonths()
        );

        Setting setting = settingRepository.findByKey(LOYALTY_SETTINGS_KEY)
                .orElse(Setting.builder().key(LOYALTY_SETTINGS_KEY).description("Loyalty program settings").build());
        setting.setValue(json);
        settingRepository.save(setting);

        return settings;
    }

    /**
     * Get paginated customer list with search
     */
    public Page<CustomerListDto> getCustomers(String search, Pageable pageable) {
        List<User> users;
        if (search != null && !search.isBlank()) {
            users = userRepository.searchCustomers(search);
        } else {
            users = userRepository.findByRole("CUSTOMER");
        }

        List<CustomerListDto> dtos = users.stream()
                .map(this::mapToCustomerListDto)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtos.size());
        List<CustomerListDto> pageContent = (start <= end) ? dtos.subList(start, end) : List.of();

        return new PageImpl<>(pageContent, pageable, dtos.size());
    }

    /**
     * Add customer note
     */
    @Transactional
    public CustomerNoteDto addCustomerNote(String userId, String content, String adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        CustomerNote note = CustomerNote.builder()
                .userId(userId)
                .adminId(adminId)
                .content(content)
                .nickname(user.getNickname())
                .build();

        note = customerNoteRepository.save(note);

        return mapToCustomerNoteDto(note, admin);
    }

    private CustomerListDto mapToCustomerListDto(User user) {
        long bookingCount = bookingRepository.countByUserId(user.getId());
        Optional<LoyaltyCard> loyaltyCard = loyaltyCardRepository.findByUserId(user.getId());

        return CustomerListDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .bookingCount(bookingCount)
                .loyaltyStamps(loyaltyCard.map(LoyaltyCard::getStampCount).orElse(0))
                .build();
    }

    private CustomerNoteDto mapToCustomerNoteDto(CustomerNote note, User admin) {
        return CustomerNoteDto.builder()
                .id(note.getId())
                .userId(note.getUserId())
                .adminId(note.getAdminId())
                .content(note.getContent())
                .nickname(note.getNickname())
                .createdAt(note.getCreatedAt())
                .build();
    }

    private LoyaltySettingsDto parseSettings(String json) {
        try {
            // Simple JSON parsing - in production use ObjectMapper
            // For now, return defaults
            return LoyaltySettingsDto.builder()
                    .stampsPerService(1)
                    .stampsPerAmount(1)
                    .amountThreshold(100000)
                    .freeServiceReward("Free Basic Manicure")
                    .cardExpiryMonths(12)
                    .build();
        } catch (Exception e) {
            return LoyaltySettingsDto.builder()
                    .stampsPerService(1)
                    .stampsPerAmount(1)
                    .amountThreshold(100000)
                    .freeServiceReward("Free Basic Manicure")
                    .cardExpiryMonths(12)
                    .build();
        }
    }
}