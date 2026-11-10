package com.prettynails.repository;

import com.prettynails.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmailIgnoreCase(String email);

    long countByRole(String role);

    List<User> findByRole(String role);

    List<User> searchCustomers(String search);
}