package com.prettynails.repository;

import com.prettynails.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    Optional<Payment> findByBookingId(String bookingId);

    Long sumPaidAmountSince(LocalDateTime since);

    List<Payment> findByUserId(String userId);
}