package com.prettynails.repository;

import com.prettynails.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    Optional<Payment> findByBookingId(String bookingId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'PAID' AND p.verifiedAt >= :since")
    Long sumPaidAmountSince(@Param("since") LocalDateTime since);

    List<Payment> findByUserId(String userId);
}