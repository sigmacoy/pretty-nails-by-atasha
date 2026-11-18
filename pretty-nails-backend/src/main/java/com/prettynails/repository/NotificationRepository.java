package com.prettynails.repository;

import com.prettynails.entity.Notification;
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
public interface NotificationRepository extends JpaRepository<Notification, String> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(String userId);

    Page<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(String userId, String type);

    Page<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(String userId, String type, Pageable pageable);

    List<Notification> findByUserIdAndTypeAndReadFalseOrderByCreatedAtDesc(String userId, String type);

    Page<Notification> findByUserIdAndTypeAndReadFalseOrderByCreatedAtDesc(String userId, String type, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.id = :id")
    Optional<Notification> findByIdAndUserId(@Param("id") String id, @Param("userId") String userId);

    long countByUserIdAndReadFalse(String userId);

    long countByUserIdAndTypeAndReadFalse(String userId, String type);

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.createdAt >= :since")
    List<Notification> findByUserIdAndCreatedAtAfter(String userId, LocalDateTime since);
}