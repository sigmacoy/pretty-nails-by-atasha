package com.prettynails.repository;

import com.prettynails.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    Optional<Account> findByProviderAndProviderAccountId(String provider, String providerAccountId);

    List<Account> findByUserId(String userId);
}