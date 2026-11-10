package com.prettynails.repository;

import com.prettynails.entity.LoyaltyCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoyaltyCardRepository extends JpaRepository<LoyaltyCard, String> {

    Optional<LoyaltyCard> findByUserId(String userId);

    List<LoyaltyCard> findCustomerCards();
}