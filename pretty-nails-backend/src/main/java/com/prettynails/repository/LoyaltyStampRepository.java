package com.prettynails.repository;

import com.prettynails.entity.LoyaltyStamp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoyaltyStampRepository extends JpaRepository<LoyaltyStamp, String> {

    boolean existsByBookingId(String bookingId);

    List<LoyaltyStamp> findByCardId(String cardId);

    long countStampsSince(LocalDateTime since);
}