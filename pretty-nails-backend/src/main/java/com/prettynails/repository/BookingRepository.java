package com.prettynails.repository;

import com.prettynails.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    List<Booking> findByUserIdOrderByAppointmentDateDesc(String userId);

    long countByAppointmentDateBetweenAndStatusIn(LocalDateTime start, LocalDateTime end, List<String> statuses);

    Page<Booking> findAdminBookings(LocalDateTime date, LocalDateTime start, LocalDateTime end, String status, List<String> statusList, String search, String sortDirection, Pageable pageable);

    List<Booking> findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(LocalDateTime start, LocalDateTime end);

    List<Booking> findCompletedBookingsWithoutStamps(String userId);

    List<Booking> findByStatus(String status);

    List<Booking> findByAppointmentDateBetweenAndStatus(LocalDateTime start, LocalDateTime end, String status);
}