package com.prettynails.service;

import com.prettynails.dto.AdminDtos.AdminReportsDto;
import com.prettynails.dto.AdminDtos.AdminStatsDto;
import com.prettynails.dto.AdminDtos.BookingByDayDto;
import com.prettynails.dto.AdminDtos.CustomerListDto;
import com.prettynails.dto.AdminDtos.CustomerNoteDto;
import com.prettynails.dto.AdminDtos.CustomerNoteRequest;
import com.prettynails.dto.AdminDtos.MonthlyRevenueDto;
import com.prettynails.dto.AdminDtos.TopServiceDto;
import com.prettynails.dto.AuthDtos.UserDto;
import com.prettynails.dto.LoyaltyDtos.LoyaltySettingsDto;
import com.prettynails.entity.Booking;
import com.prettynails.entity.BookingService;
import com.prettynails.entity.CustomerNote;
import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.LoyaltyStamp;
import com.prettynails.entity.Payment;
import com.prettynails.entity.Setting;
import com.prettynails.entity.User;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.BookingRepository;
import com.prettynails.repository.CustomerNoteRepository;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.LoyaltyStampRepository;
import com.prettynails.repository.PaymentRepository;
import com.prettynails.repository.SettingRepository;
import com.prettynails.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final LoyaltyStampRepository loyaltyStampRepository;
    private final CustomerNoteRepository customerNoteRepository;
    private final SettingRepository settingRepository;
    private final LoyaltyCardRepository loyaltyCardRepository;

    // Default settings
    private static final int DEFAULT_STAMPS_REQUIRED = 9;
    private static final int DEFAULT_STAMP_EXPIRY_MONTHS = 12;
    private static final boolean DEFAULT_STAMP_PER_SERVICE = true;
    private static final int DEFAULT_STAMP_PER_AMOUNT = 50000; // 500 PHP in centavos

    // Settings keys
    private static final String KEY_STAMPS_REQUIRED = "loyalty.stamps_required";
    private static final String KEY_STAMP_EXPIRY_MONTHS = "loyalty.stamp_expiry_months";
    private static final String KEY_STAMP_PER_SERVICE = "loyalty.stamp_per_service";
    private static final String KEY_STAMP_PER_AMOUNT = "loyalty.stamp_per_amount";

    @Transactional(readOnly = true)
    public AdminStatsDto getAdminStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfToday = now.toLocalDate().atTime(23, 59, 59);
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();

        // Total customers (role = CUSTOMER)
        long totalCustomers = userRepository.countByRole("CUSTOMER");

        // Today's bookings
        long todayBookings = bookingRepository.countByAppointmentDateBetweenAndStatusIn(
                startOfToday, endOfToday, List.of("PENDING", "CONFIRMED", "COMPLETED"));

        // Pending bookings
        long pendingBookings = bookingRepository.countByAppointmentDateBetweenAndStatusIn(
                startOfToday, endOfToday, List.of("PENDING"));

        // Monthly revenue (paid payments this month)
        Long monthlyRevenue = paymentRepository.sumPaidAmountSince(startOfMonth);
        if (monthlyRevenue == null) monthlyRevenue = 0L;

        // Monthly customers (customers with bookings this month)
        List<Booking> thisMonthBookings = bookingRepository.findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(
                startOfMonth, now);
        Set<String> monthlyCustomerIds = thisMonthBookings.stream()
                .map(Booking::getUserId)
                .collect(Collectors.toSet());
        long monthlyCustomers = monthlyCustomerIds.size();

        // Stamps this month
        long stampsThisMonth = loyaltyStampRepository.countStampsSince(startOfMonth);

        return AdminStatsDto.builder()
                .totalCustomers(totalCustomers)
                .todayBookings(todayBookings)
                .pendingBookings(pendingBookings)
                .monthlyRevenue(monthlyRevenue)
                .monthlyCustomers(monthlyCustomers)
                .stampsThisMonth(stampsThisMonth)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminReportsDto getAdminReports(String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = calculatePeriodStart(period, now);

        // Monthly aggregates
        Long monthlyRevenue = paymentRepository.sumPaidAmountSince(startDate);
        if (monthlyRevenue == null) monthlyRevenue = 0L;

        List<Booking> periodBookings = bookingRepository.findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(
                startDate, now);

        long monthlyBookings = periodBookings.size();

        Set<String> monthlyCustomerIds = periodBookings.stream()
                .map(Booking::getUserId)
                .collect(Collectors.toSet());
        long monthlyCustomers = monthlyCustomerIds.size();

        long monthlyStamps = loyaltyStampRepository.countStampsSince(startDate);

        // Revenue by month (last 6 months)
        List<MonthlyRevenueDto> revenueByMonth = getRevenueByMonth(now);

        // Top services (last 6 months)
        List<TopServiceDto> topServices = getTopServices(now);

        // Bookings by day (last 7 days)
        List<BookingByDayDto> bookingsByDay = getBookingsByDay(now);

        return AdminReportsDto.builder()
                .monthlyRevenue(monthlyRevenue)
                .monthlyCustomers(monthlyCustomers)
                .monthlyBookings(monthlyBookings)
                .monthlyStamps(monthlyStamps)
                .revenueByMonth(revenueByMonth)
                .topServices(topServices)
                .bookingsByDay(bookingsByDay)
                .build();
    }

    private LocalDateTime calculatePeriodStart(String period, LocalDateTime now) {
        if (period == null) period = "this-month";
        return switch (period) {
            case "last-month" -> YearMonth.from(now.minusMonths(1)).atDay(1).atStartOfDay();
            case "this-year" -> YearMonth.from(now).withMonth(1).atDay(1).atStartOfDay();
            case "last-year" -> YearMonth.from(now.minusYears(1)).withMonth(1).atDay(1).atStartOfDay();
            default -> YearMonth.from(now).atDay(1).atStartOfDay(); // this-month
        };
    }

    private List<MonthlyRevenueDto> getRevenueByMonth(LocalDateTime now) {
        List<MonthlyRevenueDto> result = new ArrayList<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(now).minusMonths(i);
            LocalDateTime start = ym.atDay(1).atStartOfDay();
            LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);

            Long revenue = paymentRepository.sumPaidAmountSince(start);
            if (revenue == null) revenue = 0L;

            long bookings = bookingRepository.findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(start, end).size();

            result.add(MonthlyRevenueDto.builder()
                    .month(ym.format(monthFormatter))
                    .revenue(revenue)
                    .bookings(bookings)
                    .build());
        }
        return result;
    }

    private List<TopServiceDto> getTopServices(LocalDateTime now) {
        LocalDateTime sixMonthsAgo = now.minusMonths(6);
        List<Booking> bookings = bookingRepository.findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(sixMonthsAgo, now);

        // Count services from completed bookings
        Map<String, Long> serviceCount = new HashMap<>();
        Map<String, Long> serviceRevenue = new HashMap<>();

        for (Booking booking : bookings) {
            if ("COMPLETED".equals(booking.getStatus())) {
                for (BookingService bs : booking.getServices()) {
                    String serviceName = bs.getService() != null ? bs.getService().getName() : "Unknown";
                    serviceCount.merge(serviceName, (long) bs.getQuantity(), Long::sum);
                    serviceRevenue.merge(serviceName, (long) bs.getPrice() * bs.getQuantity(), Long::sum);
                }
            }
        }

        return serviceCount.entrySet().stream()
                .map(entry -> TopServiceDto.builder()
                        .name(entry.getKey())
                        .count(entry.getValue())
                        .revenue(serviceRevenue.getOrDefault(entry.getKey(), 0L))
                        .build())
                .sorted(Comparator.comparing(TopServiceDto::getCount).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    private List<BookingByDayDto> getBookingsByDay(LocalDateTime now) {
        List<BookingByDayDto> result = new ArrayList<>();
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("EEE M/d");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = now.toLocalDate().minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(23, 59, 59);

            long count = bookingRepository.countByAppointmentDateBetweenAndStatusIn(
                    start, end, List.of("PENDING", "CONFIRMED", "COMPLETED"));

            result.add(BookingByDayDto.builder()
                    .day(date.format(dayFormatter))
                    .count(count)
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public LoyaltySettingsDto getLoyaltySettings() {
        List<String> keys = List.of(
                KEY_STAMPS_REQUIRED,
                KEY_STAMP_EXPIRY_MONTHS,
                KEY_STAMP_PER_SERVICE,
                KEY_STAMP_PER_AMOUNT
        );

        Map<String, String> settings = settingRepository.findByKeyIn(keys).stream()
                .collect(Collectors.toMap(Setting::getKey, Setting::getValue));

        int stampsRequired = parseInt(settings.get(KEY_STAMPS_REQUIRED), DEFAULT_STAMPS_REQUIRED);
        int stampExpiryMonths = parseInt(settings.get(KEY_STAMP_EXPIRY_MONTHS), DEFAULT_STAMP_EXPIRY_MONTHS);
        boolean stampPerService = parseBoolean(settings.get(KEY_STAMP_PER_SERVICE), DEFAULT_STAMP_PER_SERVICE);
        int stampPerAmount = parseInt(settings.get(KEY_STAMP_PER_AMOUNT), DEFAULT_STAMP_PER_AMOUNT);

        return LoyaltySettingsDto.builder()
                .stampsRequired(stampsRequired)
                .stampExpiryMonths(stampExpiryMonths)
                .stampPerService(stampPerService)
                .stampPerAmount(stampPerAmount)
                .build();
    }

    @Transactional
    public LoyaltySettingsDto updateLoyaltySettings(LoyaltySettingsDto settings) {
        List<Setting> toSave = new ArrayList<>();

        toSave.add(settingRepository.findByKey(KEY_STAMPS_REQUIRED)
                .map(s -> { s.setValue(String.valueOf(settings.getStampsRequired())); return s; })
                .orElseGet(() -> Setting.builder()
                        .key(KEY_STAMPS_REQUIRED)
                        .value(String.valueOf(settings.getStampsRequired()))
                        .description("Number of stamps required for a free service")
                        .build()));

        toSave.add(settingRepository.findByKey(KEY_STAMP_EXPIRY_MONTHS)
                .map(s -> { s.setValue(String.valueOf(settings.getStampExpiryMonths())); return s; })
                .orElseGet(() -> Setting.builder()
                        .key(KEY_STAMP_EXPIRY_MONTHS)
                        .value(String.valueOf(settings.getStampExpiryMonths()))
                        .description("Months after which stamps expire")
                        .build()));

        toSave.add(settingRepository.findByKey(KEY_STAMP_PER_SERVICE)
                .map(s -> { s.setValue(String.valueOf(settings.getStampPerService())); return s; })
                .orElseGet(() -> Setting.builder()
                        .key(KEY_STAMP_PER_SERVICE)
                        .value(String.valueOf(settings.getStampPerService()))
                        .description("Whether to give stamp per service")
                        .build()));

        toSave.add(settingRepository.findByKey(KEY_STAMP_PER_AMOUNT)
                .map(s -> { s.setValue(String.valueOf(settings.getStampPerAmount())); return s; })
                .orElseGet(() -> Setting.builder()
                        .key(KEY_STAMP_PER_AMOUNT)
                        .value(String.valueOf(settings.getStampPerAmount()))
                        .description("Amount in centavos per stamp")
                        .build()));

        settingRepository.saveAll(toSave);

        return getLoyaltySettings();
    }

    private int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private boolean parseBoolean(String value, boolean defaultValue) {
        if (value == null) return defaultValue;
        return Boolean.parseBoolean(value);
    }

    @Transactional(readOnly = true)
    public List<CustomerListDto> getCustomers(String search) {
        List<User> users;

        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.searchCustomers(search.trim());
        } else {
            users = userRepository.findByRole("CUSTOMER");
        }

        // Get customer cards for stamp info
        List<LoyaltyCard> cards = loyaltyCardRepository.findCustomerCards();
        Map<String, LoyaltyCard> cardMap = cards.stream()
                .collect(Collectors.toMap(LoyaltyCard::getUserId, c -> c));

        // Get recent notes for each customer (limit 5)
        Map<String, List<CustomerNote>> notesMap = new HashMap<>();
        for (User user : users) {
            List<CustomerNote> notes = customerNoteRepository.findTop5ByUserIdOrderByCreatedAtDesc(user.getId());
            if (!notes.isEmpty()) {
                notesMap.put(user.getId(), notes);
            }
        }

        return users.stream().map(user -> {
            LoyaltyCard card = cardMap.get(user.getId());
            List<CustomerNote> notes = notesMap.getOrDefault(user.getId(), List.of());

            long bookingCount = bookingRepository.findByUserIdOrderByAppointmentDateDesc(user.getId()).size();

            List<CustomerNoteDto> noteDtos = notes.stream()
                    .map(this::mapToCustomerNoteDto)
                    .collect(Collectors.toList());

            return CustomerListDto.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .nickname(user.getNickname())
                    .image(user.getImage())
                    .bookingCount(bookingCount)
                    .stampCount(card != null ? card.getStampCount() : 0)
                    .lastStampAt(card != null && card.getLastStampAt() != null ? card.getLastStampAt().toString() : null)
                    .expiresAt(card != null && card.getExpiresAt() != null ? card.getExpiresAt().toString() : null)
                    .isExpired(card != null && card.getExpiresAt() != null && card.getExpiresAt().isBefore(LocalDateTime.now()))
                    .recentNotes(noteDtos)
                    .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerNoteDto> getCustomerNotes(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<CustomerNote> notes = customerNoteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notes.stream().map(this::mapToCustomerNoteDto).collect(Collectors.toList());
    }

    @Transactional
    public CustomerNoteDto addCustomerNote(String userId, String adminId, CustomerNoteRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", "id", adminId));

        CustomerNote note = CustomerNote.builder()
                .userId(userId)
                .adminId(adminId)
                .content(request.getContent())
                .nickname(request.getNickname())
                .build();

        note = customerNoteRepository.save(note);
        return mapToCustomerNoteDto(note);
    }

    @Transactional
    public CustomerNoteDto updateCustomerNote(String noteId, String adminId, CustomerNoteRequest request) {
        CustomerNote note = customerNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("CustomerNote", "id", noteId));

        if (!adminId.equals(note.getAdminId())) {
            throw new IllegalStateException("You can only edit your own notes");
        }

        note.setContent(request.getContent());
        note.setNickname(request.getNickname());
        note = customerNoteRepository.save(note);

        return mapToCustomerNoteDto(note);
    }

    @Transactional
    public void deleteCustomerNote(String noteId, String adminId) {
        CustomerNote note = customerNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("CustomerNote", "id", noteId));

        if (!adminId.equals(note.getAdminId())) {
            throw new IllegalStateException("You can only delete your own notes");
        }

        customerNoteRepository.delete(note);
    }

    private CustomerNoteDto mapToCustomerNoteDto(CustomerNote note) {
        UserDto adminDto = null;
        if (note.getAdmin() != null) {
            adminDto = new UserDto();
            adminDto.setId(note.getAdmin().getId());
            adminDto.setName(note.getAdmin().getName());
            adminDto.setEmail(note.getAdmin().getEmail());
            adminDto.setRole(note.getAdmin().getRole());
            adminDto.setNickname(note.getAdmin().getNickname());
            adminDto.setPhone(note.getAdmin().getPhone());
            adminDto.setImage(note.getAdmin().getImage());
            adminDto.setCreatedAt(note.getAdmin().getCreatedAt());
        }

        return CustomerNoteDto.builder()
                .id(note.getId())
                .userId(note.getUserId())
                .adminId(note.getAdminId())
                .content(note.getContent())
                .nickname(note.getNickname())
                .createdAt(note.getCreatedAt() != null ? note.getCreatedAt().toString() : null)
                .updatedAt(note.getUpdatedAt() != null ? note.getUpdatedAt().toString() : null)
                .admin(adminDto)
                .build();
    }
}