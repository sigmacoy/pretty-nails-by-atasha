package com.prettynails.repository;

import com.prettynails.entity.LoyaltyCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyCardRepository extends JpaRepository<LoyaltyCard, String> {

    Optional<LoyaltyCard> findByUserId(String userId);

    @Query("SELECT lc FROM LoyaltyCard lc WHERE lc.user.role != 'ADMIN' ORDER BY lc.updatedAt DESC")
    List<LoyaltyCard> findCustomerCards();

    /**
     * Find loyalty cards for non-admin users with search and pagination.
     * Pushes filtering to database level instead of loading all into memory.
     */
    @Query("SELECT lc FROM LoyaltyCard lc JOIN lc.user u " +
           "WHERE u.role != 'ADMIN' " +
           "AND (:search IS NULL OR :search = '' " +
           "  OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY lc.updatedAt DESC")
    Page<LoyaltyCard> findCustomerCardsWithSearch(@Param("search") String search, Pageable pageable);

    long countByStampCountGreaterThan(int stampCount);

    @Query("SELECT COUNT(ls) FROM LoyaltyStamp ls WHERE ls.earnedAt >= :since")
    long countStampsSince(LocalDateTime since);

    @Query("SELECT COUNT(ls) FROM LoyaltyStamp ls WHERE ls.earnedAt >= :since AND ls.source = 'REWARD_REDEMPTION'")
    long countRedeemedStampsSince(LocalDateTime since);
}