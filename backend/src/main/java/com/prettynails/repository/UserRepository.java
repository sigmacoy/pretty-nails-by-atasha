package com.prettynails.repository;

import com.prettynails.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findByRole(String role);

    List<User> findByRoleAndEmailNot(String role, String email);

    @Query("SELECT u FROM User u WHERE u.role = 'CUSTOMER' AND " +
           "(LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<User> searchCustomers(@Param("search") String search);

    @Query("SELECT u FROM User u WHERE u.role = 'CUSTOMER' AND u.bookings IS NOT EMPTY")
    List<User> findCustomersWithBookings();

    long countByRole(String role);
}