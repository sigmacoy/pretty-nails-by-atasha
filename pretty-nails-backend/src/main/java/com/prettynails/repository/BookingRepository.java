package com.prettynails.repository;

import com.prettynails.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    List<Booking> findByUserIdOrderByAppointmentDateDesc(String userId);

    long countByAppointmentDateBetweenAndStatusIn(LocalDateTime start, LocalDateTime end, List<String> statuses);

    long countByAppointmentDateBetween(LocalDateTime start, LocalDateTime end);

    long countByUserId(String userId);

    @Query("SELECT b FROM Booking b WHERE " +
           "(:date IS NULL OR b.appointmentDate = :date) AND " +
           "(:start IS NULL OR :end IS NULL OR (b.appointmentDate >= :start AND b.appointmentDate <= :end)) AND " +
           "(:status IS NULL OR :status = 'ALL' OR b.status IN :statusList) AND " +
           "(:search IS NULL OR LOWER(b.user.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(b.user.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY " +
           "CASE WHEN :sortDirection = 'ASC' THEN b.appointmentDate END ASC, " +
           "CASE WHEN :sortDirection = 'DESC' THEN b.appointmentDate END DESC, " +
           "CASE WHEN :sortDirection = 'ASC' THEN b.startTime END ASC, " +
           "CASE WHEN :sortDirection = 'DESC' THEN b.startTime END DESC, " +
           "CASE WHEN :sortDirection = 'ASC' THEN b.createdAt END ASC, " +
           "CASE WHEN :sortDirection = 'DESC' THEN b.createdAt END DESC")
    Page<Booking> findAdminBookings(
            @Param("date") LocalDateTime date,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("status") String status,
            @Param("statusList") List<String> statusList,
            @Param("search") String search,
            @Param("sortDirection") String sortDirection,
            Pageable pageable);

    List<Booking> findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT b FROM Booking b WHERE b.userId = :userId AND b.status = 'COMPLETED' " +
           "AND NOT EXISTS (SELECT 1 FROM LoyaltyStamp ls WHERE ls.bookingId = b.id) " +
           "ORDER BY b.appointmentDate DESC")
    List<Booking> findCompletedBookingsWithoutStamps(@Param("userId") String userId);

    List<Booking> findByStatus(String status);

    List<Booking> findByAppointmentDateBetweenAndStatus(LocalDateTime start, LocalDateTime end, String status);

    long countByStatus(String status);

    long countByStatusAndAppointmentDateBetween(String status, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE b.status = :status")
    Long sumTotalPriceByStatus(String status);

    @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE b.status = :status AND b.appointmentDate BETWEEN :start AND :end")
    Long sumTotalPriceByStatusAndDateBetween(String status, LocalDateTime start, LocalDateTime end);

    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.appointmentDate BETWEEN :start AND :end")
    List<Booking> findByStatusAndAppointmentDateBetween(String status, LocalDateTime start, LocalDateTime end);
}