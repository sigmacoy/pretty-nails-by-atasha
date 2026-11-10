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

    List<Booking> findByUserIdAndStatusIn(String userId, List<String> statuses);

    List<Booking> findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(
            LocalDateTime start, LocalDateTime end);

    List<Booking> findByAppointmentDateAndStatusIn(LocalDateTime date, List<String> statuses);

    long countByAppointmentDateBetweenAndStatusIn(LocalDateTime start, LocalDateTime end, List<String> statuses);

    @Query("SELECT b FROM Booking b WHERE " +
           "(:date IS NULL OR b.appointmentDate = :date) AND " +
           "(:start IS NULL OR :end IS NULL OR (b.appointmentDate >= :start AND b.appointmentDate <= :end)) AND " +
           "(:status IS NULL OR :status = 'ALL' OR b.status IN :statusList) AND " +
           "(:search IS NULL OR LOWER(b.user.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(b.user.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY b.appointmentDate :sortDirection, b.startTime :sortDirection, b.createdAt :sortDirection")
    Page<Booking> findAdminBookings(
            @Param("date") LocalDateTime date,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("status") String status,
            @Param("statusList") List<String> statusList,
            @Param("search") String search,
            @Param("sortDirection") String sortDirection,
            Pageable pageable);

    List<Booking> findByStatusInOrderByAppointmentDateAscStartTimeAsc(List<String> statuses);

    List<Booking> findByUserIdAndStatusOrderByAppointmentDateDesc(String userId, String status);

    @Query("SELECT b FROM Booking b WHERE b.userId = :userId AND b.status = 'COMPLETED' " +
           "AND NOT EXISTS (SELECT 1 FROM LoyaltyStamp ls WHERE ls.bookingId = b.id) " +
           "ORDER BY b.appointmentDate DESC")
    List<Booking> findCompletedBookingsWithoutStamps(@Param("userId") String userId);
}