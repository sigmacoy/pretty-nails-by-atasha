package com.prettynails.repository;

import com.prettynails.entity.LoyaltyCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyCardRepository extends JpaRepository<LoyaltyCard, String> {

    Optional<LoyaltyCard> findByUserId(String userId);

    @Query("SELECT lc FROM LoyaltyCard lc WHERE lc.user.role != 'ADMIN' AND lc.user.email != 'owner@prettynails.com' " +
           "AND lc.user.name NOT LIKE '%Atasha%' ORDER BY lc.updatedAt DESC")
    List<LoyaltyCard> findCustomerCards();

    List<LoyaltyCard> findByUserRoleNotOrderByUpdatedAtDesc(String role);
}