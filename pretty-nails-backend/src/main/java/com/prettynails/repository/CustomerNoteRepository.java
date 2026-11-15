package com.prettynails.repository;

import com.prettynails.entity.CustomerNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerNoteRepository extends JpaRepository<CustomerNote, String> {

    List<CustomerNote> findByUserIdOrderByCreatedAtDesc(String userId);

    List<CustomerNote> findTop5ByUserIdOrderByCreatedAtDesc(String userId);

    List<CustomerNote> findByAdminIdOrderByCreatedAtDesc(String adminId);
}