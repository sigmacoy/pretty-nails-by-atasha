package com.prettynails.repository;

import com.prettynails.entity.ServiceVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceVariantRepository extends JpaRepository<ServiceVariant, String> {

    List<ServiceVariant> findByServiceId(String serviceId);

    Optional<ServiceVariant> findByServiceIdAndName(String serviceId, String name);

    @Modifying
    @Transactional
    @Query("DELETE FROM ServiceVariant sv WHERE sv.serviceId = :serviceId")
    void deleteByServiceId(String serviceId);
}