package com.prettynails.repository;

import com.prettynails.entity.ServiceVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceVariantRepository extends JpaRepository<ServiceVariant, String> {

    Optional<ServiceVariant> findByServiceIdAndName(String serviceId, String name);

    List<ServiceVariant> findByServiceId(String serviceId);

    void deleteByServiceId(String serviceId);
}