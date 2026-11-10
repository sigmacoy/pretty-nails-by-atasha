package com.prettynails.repository;

import com.prettynails.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {

    Optional<Session> findBySessionToken(String sessionToken);

    List<Session> findByUserId(String userId);

    void deleteByUserId(String userId);

    void deleteByExpiresBefore(LocalDateTime expires);
}