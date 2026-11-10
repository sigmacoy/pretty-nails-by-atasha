package com.prettynails.service;

import com.prettynails.dto.BookingDtos.*;
import com.prettynails.dto.LoyaltyDtos.LoyaltyStampDto;
import com.prettynails.entity.Availability;
import com.prettynails.entity.Booking;
import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.Payment;
import com.prettynails.entity.ServiceVariant;
import com.prettynails.entity.User;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.*;
import com.prettynails.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    private static final int DEFAULT_MAX_SLOTS = 4;
    private static final int DEFAULT_DOWNPAYMENT = 10000; // 100 PHP in centavos

    @Transactional
    public BookingResponse createBooking(User user, BookingRequest request) {
        // Parse appointment date
        LocalDate appointmentDate = LocalDate.parse(request.getAppointmentDate());
        LocalDateTime appointmentDateTime = appointmentDate.atStartOfDay();

        // Check availability
        LocalDateTime startOfDay = appointmentDate.atStartOfDay();
        LocalDateTime endOfDay = appointmentDate.atTime(23, 59, 59, 999_999_999);

        Availability availability = availabilityRepository.findByDateBetweenOrderByDateAsc(startOfDay, endOfDay)
                .stream().findFirst().orElse(null);

        if (availability != null && !availability.getIsAvailable()) {
            throw new BadRequestException("The owner is not available on this date (marked as holiday or break).");
        }

        // Count existing active bookings for that date
        long existingBookings = bookingRepository.countByAppointmentDateBetweenAndStatusIn(
                startOfDay, endOfDay, List.of("PENDING", "CONFIRMED"));

        int maxSlots = availability != null ? availability.getMaxSlots() : DEFAULT_MAX_SLOTS;
        if (existingBookings >= maxSlots) {
            throw new BadRequestException("This day has reached its maximum queue capacity (" + maxSlots + " clients max).");
        }

        // Resolve services
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

        // Calculate end time if not provided
        String endTime = request.getEndTime();
        if (endTime == null || endTime.isEmpty()) {
            endTime = calculateEndTime(request.getStartTime(), 180); // default 3 hours
        }

        // Create booking
        Booking booking = Booking.builder()
                .userId(user.getId())
                .appointmentDate(appointmentDateTime)
                .startTime(request.getStartTime())
                .endTime(endTime)
                .totalPrice(request.getTotalPrice())
                .downpayment(request.getDownpayment() != null ? request.getDownpayment() : DEFAULT_DOWNPAYMENT)
                .notes(request.getNotes())
                .inspirationImg(request.getInspirationImage())
                .status("PENDING")
                .build();

        booking = bookingRepository.save(booking);

        // Create booking services
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

        // Create payment record
        Payment payment = Payment.builder()
                .bookingId(booking.getId())
                .userId(user.getId())
                .amount(request.getDownpayment() != null ? request.getDownpayment() : DEFAULT_DOWNPAYMENT)
                .status(request.getPaymentReference() != null && !request.getPaymentReference().isEmpty() ? "PAID" : "PENDING")
                .method("GCASH")
                .reference(request.getPaymentReference())
                .verifiedAt(request.getPaymentReference() != null && !request.getPaymentReference().isEmpty() ? LocalDateTime.now() : null)
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

    public Page<BookingDto> getAdminBookings(LocalDateTime date, LocalDateTime start, LocalDateTime end,
                                              String status, String search, String sort, int page, int size) {
        List<String> statusList = null;
        if (status != null && !status.equals("ALL")) {
            statusList = List.of(status.split(","));
        }

        String sortDirection = "desc".equalsIgnoreCase(sort) ? "DESC" : "ASC";
        Pageable pageable = PageRequest.of(page, size);

        Page<Booking> bookings = bookingRepository.findAdminBookings(
                date, start, end, status, statusList, search, sortDirection, pageable);

        return bookings.map(this::mapToBookingDto);
    }

    @Transactional
    public BookingDto updateBookingStatus(String bookingId, String status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        booking.setStatus(status);
        booking = bookingRepository.save(booking);

        // If marking as completed, ensure payment is marked paid
        if ("COMPLETED".equals(status)) {
            Payment payment = paymentRepository.findByBookingId(bookingId).orElse(null);
            if (payment != null && !"PAID".equals(payment.getStatus())) {
                payment.setStatus("PAID");
                payment.setVerifiedAt(LocalDateTime.now());
                paymentRepository.save(payment);
            }
        }

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
        List<BookingServiceDto> serviceDtos = booking.getServices().stream()
                .map(bs -> BookingServiceDto.builder()
                        .id(bs.getId())
                        .bookingId(bs.getBookingId())
                        .serviceId(bs.getServiceId())
                        .variantId(bs.getVariantId())
                        .quantity(bs.getQuantity())
                        .price(bs.getPrice())
                        .service(mapToServiceDto(bs.getService()))
                        .build())
                .collect(Collectors.toList());

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
                .createdAt(booking.getCreatedAt().toString())
                .updatedAt(booking.getUpdatedAt() != null ? booking.getUpdatedAt().toString() : null)
                .services(serviceDtos)
                .payment(paymentDto)
                .loyaltyStamps(stampDtos)
                .build();
    }

    private ServiceDto mapToServiceDto(com.prettynails.entity.Service service) {
        if (service == null) return null;
        List<ServiceVariantDto> variantDtos = service.getVariants().stream()
                .map(v -> ServiceVariantDto.builder()
                        .id(v.getId())
                        .serviceId(v.getServiceId())
                        .name(v.getName())
                        .price(v.getPrice())
                        .build())
                .collect(Collectors.toList());

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