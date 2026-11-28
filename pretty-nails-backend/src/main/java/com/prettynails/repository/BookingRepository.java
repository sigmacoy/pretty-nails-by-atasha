package com.prettynails.repository;

import com.prettynails.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    List<Booking> findByUserIdOrderByAppointmentDateDesc(String userId);

    long countByAppointmentDateBetweenAndStatusIn(LocalDate start, LocalDate end, List<String> statuses);

    long countByAppointmentDateBetween(LocalDate start, LocalDate end);

    long countByUserId(String userId);

    
    List<Booking> findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(LocalDate start, LocalDate end);

    @Query("SELECT b FROM Booking b WHERE b.userId = :userId AND b.status = 'COMPLETED' " +
           "AND NOT EXISTS (SELECT 1 FROM LoyaltyStamp ls WHERE ls.bookingId = b.id) " +
           "ORDER BY b.appointmentDate DESC")
    List<Booking> findCompletedBookingsWithoutStamps(@Param("userId") String userId);

    List<Booking> findByStatus(String status);

    List<Booking> findByAppointmentDateBetweenAndStatus(LocalDate start, LocalDate end, String status);

    long countByStatus(String status);

    long countByStatusAndAppointmentDateBetween(String status, LocalDate start, LocalDate end);

    long countByUserIdAndStatus(String userId, String status);

    @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE b.status = :status")
    Long sumTotalPriceByStatus(String status);

    @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE b.status = :status AND b.appointmentDate BETWEEN :start AND :end")
    Long sumTotalPriceByStatusAndDateBetween(String status, LocalDate start, LocalDate end);

    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.appointmentDate BETWEEN :start AND :end")
    List<Booking> findByStatusAndAppointmentDateBetween(String status, LocalDate start, LocalDate end);

    boolean existsByAppointmentDateAndStartTimeAndStatusIn(LocalDate appointmentDate, String startTime, List<String> statuses);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.appointmentDate = :appointmentDate AND b.startTime = :startTime AND b.status IN :statuses AND b.id != :excludeId")
    long countByAppointmentDateAndStartTimeAndStatusInAndIdNot(
            @Param("appointmentDate") LocalDate appointmentDate,
            @Param("startTime") String startTime,
            @Param("statuses") List<String> statuses,
            @Param("excludeId") String excludeId);

    @EntityGraph(attributePaths = {"user", "services", "payment"})
    @Query("SELECT b FROM Booking b WHERE b.userId = :userId ORDER BY b.appointmentDate DESC, b.startTime DESC")
    Page<Booking> findByUserIdOrderByAppointmentDateDesc(@Param("userId") String userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "services", "payment"})
    @Query("SELECT b FROM Booking b WHERE b.status IN :statuses ORDER BY b.appointmentDate ASC, b.startTime ASC")
    Page<Booking> findByStatusIn(@Param("statuses") List<String> statuses, Pageable pageable);
}