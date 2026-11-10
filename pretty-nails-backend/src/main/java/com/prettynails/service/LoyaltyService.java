package com.prettynails.service;

import com.prettynails.entity.LoyaltyCard;
import com.prettynails.entity.LoyaltyStamp;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.LoyaltyStampRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyCardRepository loyaltyCardRepository;
    private final LoyaltyStampRepository loyaltyStampRepository;

    /**
     * Adds a stamp to the user's loyalty card when a booking is completed.
     *
     * @param bookingId the ID of the completed booking
     * @param userId the ID of the user
     * @return the updated stamp count
     * @throws ResourceNotFoundException if the user has no loyalty card
     * @throws BadRequestException if a stamp already exists for this booking
     */
    @Transactional
    public int addStampOnBookingCompletion(String bookingId, String userId) {
        // 1. Find user's LoyaltyCard by userId
        LoyaltyCard loyaltyCard = loyaltyCardRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("LoyaltyCard", "userId", userId));

        // 2. Check if stamp already exists for this bookingId (prevent duplicates)
        if (loyaltyStampRepository.existsByBookingId(bookingId)) {
            throw new BadRequestException("Stamp already exists for booking: " + bookingId);
        }

        // 3. Increment stampCount, update lastStampAt, recalculate expiresAt (12 months from last stamp)
        int newStampCount = loyaltyCard.getStampCount() + 1;
        LocalDateTime now = LocalDateTime.now();
        loyaltyCard.setStampCount(newStampCount);
        loyaltyCard.setLastStampAt(now);
        loyaltyCard.setExpiresAt(now.plusMonths(12));

        loyaltyCardRepository.save(loyaltyCard);

        // 4. Create LoyaltyStamp record with source="SERVICE", earnedAt=now, link to booking
        LoyaltyStamp stamp = LoyaltyStamp.builder()
                .cardId(loyaltyCard.getId())
                .bookingId(bookingId)
                .earnedAt(now)
                .source("SERVICE")
                .build();

        loyaltyStampRepository.save(stamp);

        // 5. Return updated stampCount
        return newStampCount;
    }
}