package com.prettynails.repository;

import com.prettynails.entity.LoyaltyCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyCardRepository extends JpaRepository<LoyaltyCard, String> {

    Optional<LoyaltyCard> findByUserId(String userId);

    @Query("SELECT lc FROM LoyaltyCard lc WHERE lc.user.role != 'ADMIN' AND lc.user.email != 'owner@prettynails.com' " +
           "AND lc.user.name NOT LIKE '%Atasha%' ORDER BY lc.updatedAt DESC")
    List<LoyaltyCard> findCustomerCards();

    long countByStampCountGreaterThan(int stampCount);

    @Query("SELECT COUNT(ls) FROM LoyaltyStamp ls WHERE ls.earnedAt >= :since")
    long countStampsSince(LocalDateTime since);

    @Query("SELECT COUNT(ls) FROM LoyaltyStamp ls WHERE ls.earnedAt >= :since AND ls.source = 'REDEEM'")
    long countRedeemedStampsSince(LocalDateTime since);
}