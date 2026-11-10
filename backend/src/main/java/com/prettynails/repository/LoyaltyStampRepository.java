package com.prettynails.repository;

import com.prettynails.entity.LoyaltyStamp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyStampRepository extends JpaRepository<LoyaltyStamp, String> {

    List<LoyaltyStamp> findByCardIdOrderByEarnedAtDesc(String cardId);

    Optional<LoyaltyStamp> findByBookingId(String bookingId);

    List<LoyaltyStamp> findByBookingIdIn(List<String> bookingIds);

    @Query("SELECT COUNT(ls) FROM LoyaltyStamp ls WHERE ls.earnedAt >= :startDate")
    long countStampsSince(@Param("startDate") LocalDateTime startDate);

    boolean existsByBookingId(String bookingId);
}