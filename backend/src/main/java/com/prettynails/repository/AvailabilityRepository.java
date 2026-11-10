package com.prettynails.repository;

import com.prettynails.entity.Availability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, String> {

    Optional<Availability> findByDate(LocalDateTime date);

    List<Availability> findByDateBetweenOrderByDateAsc(LocalDateTime start, LocalDateTime end);

    List<Availability> findByDateGreaterThanEqualOrderByDateAsc(LocalDateTime date);

    @Query("SELECT a FROM Availability a WHERE a.date >= :today AND a.isAvailable = true")
    List<Availability> findAvailableDatesFrom(@Param("today") LocalDateTime today);
}