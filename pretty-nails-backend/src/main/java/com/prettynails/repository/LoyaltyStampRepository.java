package com.prettynails.repository;

import com.prettynails.entity.LoyaltyStamp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoyaltyStampRepository extends JpaRepository<LoyaltyStamp, String> {

    boolean existsByBookingId(String bookingId);

    List<LoyaltyStamp> findByCardId(String cardId);

    List<LoyaltyStamp> findByCardIdOrderByEarnedAtDesc(String cardId);

    @Query("SELECT COUNT(ls) FROM LoyaltyStamp ls WHERE ls.earnedAt >= :since")
    long countStampsSince(@Param("since") LocalDateTime since);
}