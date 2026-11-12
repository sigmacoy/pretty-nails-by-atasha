package com.prettynails.service;

import com.prettynails.dto.BookingDtos.*;
import com.prettynails.entity.Availability;
import com.prettynails.entity.Booking;
import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.Payment;
import com.prettynails.entity.ServiceVariant;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.AvailabilityRepository;
import com.prettynails.repository.BookingRepository;
import com.prettynails.repository.BookingServiceRepository;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.PaymentRepository;
import com.prettynails.repository.ServiceRepository;
import com.prettynails.repository.ServiceVariantRepository;
import com.prettynails.repository.UserRepository;
import com.prettynails.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingServiceRepository bookingServiceRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceVariantRepository serviceVariantRepository;
    private final AvailabilityRepository availabilityRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final LoyaltyCardRepository loyaltyCardRepository;
    private final LoyaltyService loyaltyService;

    private static final int DEFAULT_MAX_SLOTS = 4;
    private static final int DEFAULT_DOWNPAYMENT = 10000; // 100 PHP in centavos

    @Transactional
    public BookingResponse createBooking(User user, BookingRequest request) {
        // 1. Parse appointmentDate
        LocalDate appointmentDate = LocalDate.parse(request.getAppointmentDate());
        LocalDateTime appointmentDateTime = appointmentDate.atStartOfDay();

        // 2. Check availability (if not available or holiday -> 400)
        LocalDateTime startOfDay = appointmentDate.atStartOfDay();
        LocalDateTime endOfDay = appointmentDate.atTime(23, 59, 59, 999_999_999);

        Availability availability = availabilityRepository.findByDateBetweenOrderByDateAsc(startOfDay, endOfDay)
                .stream().findFirst().orElse(null);

        if (availability != null && !availability.getIsAvailable()) {
            throw new BadRequestException("The owner is not available on this date (marked as holiday or break).");
        }

        // 3. Count existing active bookings for that date (PENDING, CONFIRMED)
        long existingBookings = bookingRepository.countByAppointmentDateBetweenAndStatusIn(
                startOfDay, endOfDay, List.of("PENDING", "CONFIRMED"));

        // 4. Max slots = availability?.maxSlots : 4 (DEFAULT_MAX_SLOTS)
        int maxSlots = availability != null ? availability.getMaxSlots() : DEFAULT_MAX_SLOTS;

        // 5. If full -> 400
        if (existingBookings >= maxSlots) {
            throw new BadRequestException("This day has reached its maximum queue capacity (" + maxSlots + " clients max).");
        }

        // 6. Resolve services: find by ID, fallback by name matching (clean/gel/ext/ped)
        List<BookingServiceRequest> serviceRequests = request.getServices();
        List<ResolvedService> resolvedServices = new ArrayList<>();

        for (BookingServiceRequest sr : serviceRequests) {
            com.prettynails.entity.Service service = serviceRepository.findById(sr.getServiceId()).orElse(null);

            if (service == null) {
                // Try to find by name matching (fallback)
                service = findServiceByFallbackName(sr.getServiceId());
            }

            if (service != null) {
                ServiceVariant variant = null;
                if (sr.getVariantId() != null) {
                    variant = serviceVariantRepository.findByServiceIdAndName(service.getId(), sr.getVariantId())
                            .orElse(service.getVariants().stream().findFirst().orElse(null));
                } else if (!service.getVariants().isEmpty()) {
                    variant = service.getVariants().get(0);
                }

                int price = (variant != null) ? variant.getPrice() : service.getBasePrice();
                resolvedServices.add(new ResolvedService(service.getId(), variant != null ? variant.getId() : null,
                        sr.getQuantity() != null ? sr.getQuantity() : 1, price));
            }
        }

        if (resolvedServices.isEmpty()) {
            com.prettynails.entity.Service defaultService = serviceRepository.findAll().stream().findFirst().orElse(null);
            if (defaultService != null) {
                ServiceVariant variant = defaultService.getVariants().stream().findFirst().orElse(null);
                resolvedServices.add(new ResolvedService(defaultService.getId(),
                        variant != null ? variant.getId() : null, 1, defaultService.getBasePrice()));
            }
        }

        if (resolvedServices.isEmpty()) {
            throw new BadRequestException("No valid services found");
        }

        // 7. Calculate endTime if not provided (default 3 hours = 180 minutes)
        String endTime = request.getEndTime();
        if (endTime == null || endTime.isEmpty()) {
            endTime = calculateEndTime(request.getStartTime(), 180); // default 3 hours
        }

        // 8. Handle loyalty reward redemption validation
        boolean isRedeemingLoyalty = Boolean.TRUE.equals(request.getRedeemLoyaltyReward());
        if (isRedeemingLoyalty) {
            LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new BadRequestException("Customer does not have an active loyalty card to redeem rewards."));
            if (loyaltyCard.getStampCount() == null || loyaltyCard.getStampCount() < 10) {
                throw new BadRequestException("Insufficient loyalty stamps. 10 stamps are required to redeem a free service discount.");
            }
        }

        // 9. Create Booking (status=PENDING, downpayment default 10000 centavos = ₱100)
        Booking booking = Booking.builder()
                .userId(user.getId())
                .appointmentDate(appointmentDateTime)
                .startTime(request.getStartTime())
                .endTime(endTime)
                .totalPrice(request.getTotalPrice())
                .downpayment(request.getDownpayment() != null ? request.getDownpayment() : DEFAULT_DOWNPAYMENT)
                .notes(request.getNotes())
                .inspirationImg(request.getInspirationImage())
                .redeemLoyaltyReward(isRedeemingLoyalty)
                .status("PENDING")
                .build();

        booking = bookingRepository.save(booking);

        // 10. Create BookingService entries
        for (ResolvedService rs : resolvedServices) {
            com.prettynails.entity.BookingService bs = com.prettynails.entity.BookingService.builder()
                    .bookingId(booking.getId())
                    .serviceId(rs.serviceId)
                    .variantId(rs.variantId)
                    .quantity(rs.quantity)
                    .price(rs.price)
                    .build();
            bookingServiceRepository.save(bs);
        }

        // 11. Create Payment record (status=PAID if waived by loyalty reward or paymentReference provided, else PENDING)
        int effectiveDownpayment = request.getDownpayment() != null ? request.getDownpayment() : DEFAULT_DOWNPAYMENT;
        boolean isDownpaymentWaived = isRedeemingLoyalty && effectiveDownpayment == 0;
        Payment payment = Payment.builder()
                .bookingId(booking.getId())
                .userId(user.getId())
                .amount(effectiveDownpayment)
                .status(isDownpaymentWaived || (request.getPaymentReference() != null && !request.getPaymentReference().isEmpty()) ? "PAID" : "PENDING")
                .method(isDownpaymentWaived ? "LOYALTY_REWARD" : "GCASH")
                .reference(isDownpaymentWaived ? "LOYALTY_REWARD" : request.getPaymentReference())
                .verifiedAt(isDownpaymentWaived || (request.getPaymentReference() != null && !request.getPaymentReference().isEmpty()) ? LocalDateTime.now() : null)
                .build();
        paymentRepository.save(payment);

        return BookingResponse.builder()
                .bookingId(booking.getId())
                .message("Appointment request submitted. Awaiting owner confirmation.")
                .build();
    }

    public List<BookingDto> getUserBookings(String userId) {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByAppointmentDateDesc(userId);
        return bookings.stream().map(this::mapToBookingDto).collect(Collectors.toList());
    }

    @Transactional
    public BookingDto completeBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        // Update status to COMPLETED
        booking.setStatus("COMPLETED");
        booking = bookingRepository.save(booking);

        return mapToBookingDto(booking);
    }

    public List<BookingDto> getAllBookings(String status, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59, 999_999_999) : null;

        List<Booking> bookings;
        if (status != null && !status.isEmpty() && start != null && end != null) {
            bookings = bookingRepository.findByAppointmentDateBetweenAndStatus(start, end, status);
        } else if (status != null && !status.isEmpty()) {
            bookings = bookingRepository.findByStatus(status);
        } else if (start != null && end != null) {
            bookings = bookingRepository.findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(start, end);
        } else {
            bookings = bookingRepository.findAll();
        }

        return bookings.stream().map(this::mapToBookingDto).collect(Collectors.toList());
    }

    @Transactional
    public BookingDto confirmBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        String currentStatus = booking.getStatus();
        if (!"PENDING".equals(currentStatus)) {
            throw new BadRequestException("Only PENDING bookings can be confirmed. Current status: " + currentStatus);
        }

        booking.setStatus("CONFIRMED");
        booking = bookingRepository.save(booking);

        // If loyalty reward redemption was requested, deduct 10 stamps on confirmation
        if (Boolean.TRUE.equals(booking.getRedeemLoyaltyReward())) {
            loyaltyService.redeemRewardStamps(booking.getUserId(), booking.getId(), 10);
        }

        return mapToBookingDto(booking);
    }

    @Transactional
    public BookingDto cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        String currentStatus = booking.getStatus();
        if (!"PENDING".equals(currentStatus) && !"CONFIRMED".equals(currentStatus)) {
            throw new BadRequestException("Only PENDING or CONFIRMED bookings can be cancelled. Current status: " + currentStatus);
        }

        booking.setStatus("CANCELLED");
        booking = bookingRepository.save(booking);

        return mapToBookingDto(booking);
    }

    private com.prettynails.entity.Service findServiceByFallbackName(String serviceId) {
        String idLower = serviceId.toLowerCase();
        if (idLower.contains("clean")) {
            return serviceRepository.findByName("Nail Cleaning").orElse(null);
        } else if (idLower.contains("gel") && !idLower.contains("ext") && !idLower.contains("ped")) {
            return serviceRepository.findByName("Nail Gel").orElse(null);
        } else if (idLower.contains("ext")) {
            return serviceRepository.findByName("Soft Gel Extension").orElse(null);
        } else if (idLower.contains("ped")) {
            return serviceRepository.findByName("Nail Gel Pedicure").orElse(null);
        }
        return serviceRepository.findAll().stream().findFirst().orElse(null);
    }

    private String calculateEndTime(String startTime, int durationMinutes) {
        LocalTime start = LocalTime.parse(startTime);
        return start.plusMinutes(durationMinutes).format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private BookingDto mapToBookingDto(Booking booking) {
        List<BookingServiceDto> serviceDtos = booking.getServices() != null ?
                booking.getServices().stream()
                .map(bs -> BookingServiceDto.builder()
                        .id(bs.getId())
                        .bookingId(bs.getBookingId())
                        .serviceId(bs.getServiceId())
                        .variantId(bs.getVariantId())
                        .quantity(bs.getQuantity())
                        .price(bs.getPrice())
                        .service(mapToServiceDto(bs.getService()))
                        .build())
                .collect(Collectors.toList()) : List.of();

        PaymentDto paymentDto = null;
        if (booking.getPayment() != null) {
            Payment p = booking.getPayment();
            paymentDto = PaymentDto.builder()
                    .id(p.getId())
                    .bookingId(p.getBookingId())
                    .userId(p.getUserId())
                    .amount(p.getAmount())
                    .status(p.getStatus())
                    .method(p.getMethod())
                    .reference(p.getReference())
                    .verifiedAt(p.getVerifiedAt() != null ? p.getVerifiedAt().toString() : null)
                    .verifiedBy(p.getVerifiedBy())
                    .build();
        }

        List<LoyaltyStampDto> stampDtos = booking.getLoyaltyStamps() != null ?
                booking.getLoyaltyStamps().stream()
                        .map(ls -> LoyaltyStampDto.builder()
                                .earnedAt(ls.getEarnedAt().toString())
                                .source(ls.getSource())
                                .amount(ls.getAmount())
                                .build())
                        .collect(Collectors.toList()) : List.of();

        return BookingDto.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .status(booking.getStatus())
                .appointmentDate(booking.getAppointmentDate().toString())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .totalPrice(booking.getTotalPrice())
                .downpayment(booking.getDownpayment())
                .notes(booking.getNotes())
                .inspirationImg(booking.getInspirationImg())
                .createdAt(booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : LocalDateTime.now().toString())
                .updatedAt(booking.getUpdatedAt() != null ? booking.getUpdatedAt().toString() : null)
                .services(serviceDtos)
                .payment(paymentDto)
                .loyaltyStamps(stampDtos)
                .redeemLoyaltyReward(booking.getRedeemLoyaltyReward())
                .build();
    }

    /**
     * Get booking by ID (for both customer and admin)
     */
    public BookingDto getBookingById(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        return mapToBookingDto(booking);
    }

    /**
     * Customer cancels their own booking
     */
    @Transactional
    public BookingDto cancelBookingByCustomer(String bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        // Verify ownership
        if (!booking.getUserId().equals(userId)) {
            throw new BadRequestException("You can only cancel your own bookings");
        }

        String currentStatus = booking.getStatus();
        if (!"PENDING".equals(currentStatus) && !"CONFIRMED".equals(currentStatus)) {
            throw new BadRequestException("Only PENDING or CONFIRMED bookings can be cancelled. Current status: " + currentStatus);
        }

        booking.setStatus("CANCELLED");
        booking = bookingRepository.save(booking);

        return mapToBookingDto(booking);
    }

    private ServiceDto mapToServiceDto(com.prettynails.entity.Service service) {
        if (service == null) return null;
        List<ServiceVariantDto> variantDtos = service.getVariants() != null ?
                service.getVariants().stream()
                .map(v -> ServiceVariantDto.builder()
                        .id(v.getId())
                        .serviceId(v.getServiceId())
                        .name(v.getName())
                        .price(v.getPrice())
                        .build())
                .collect(Collectors.toList()) : List.of();

        return ServiceDto.builder()
                .id(service.getId())
                .name(service.getName())
                .category(service.getCategory())
                .description(service.getDescription())
                .basePrice(service.getBasePrice())
                .duration(service.getDuration())
                .isActive(service.getIsActive())
                .variants(variantDtos)
                .build();
    }

    private record ResolvedService(String serviceId, String variantId, int quantity, int price) {}
}