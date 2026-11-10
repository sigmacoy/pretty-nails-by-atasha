package com.prettynails.repository;

import com.prettynails.entity.BookingService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingServiceRepository extends JpaRepository<BookingService, String> {

    List<BookingService> findByBookingId(String bookingId);

    void deleteByBookingId(String bookingId);
}