package com.prettynails.repository;

import com.prettynails.entity.CustomerNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerNoteRepository extends JpaRepository<CustomerNote, String> {

    List<CustomerNote> findByUserIdOrderByCreatedAtDesc(String userId);

    List<CustomerNote> findByAdminIdOrderByCreatedAtDesc(String adminId);

    @Query("SELECT cn FROM CustomerNote cn WHERE cn.userId = :userId ORDER BY cn.createdAt DESC")
    List<CustomerNote> findTop5ByUserIdOrderByCreatedAtDesc(@Param("userId") String userId);
}