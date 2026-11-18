package com.prettynails.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Configuration for JPA auditing.
 * Enables automatic population of createdBy, createdDate, lastModifiedBy, lastModifiedDate fields.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<String> auditorAware(AuditorAwareImpl auditorAwareImpl) {
        return auditorAwareImpl;
    }
}