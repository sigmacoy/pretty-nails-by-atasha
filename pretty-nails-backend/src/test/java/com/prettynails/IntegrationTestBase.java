package com.prettynails;

import org.junit.jupiter.api.TestInstance;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
    classes = TestApplication.class,
    properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5432/testdb",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.datasource.username=test",
        "spring.datasource.password=test",
        "spring.jpa.hibernate.ddl-auto=create",
        "spring.flyway.enabled=false",
        "spring.sql.init.mode=never",
        "spring.cache.type=simple",
        "spring.cache.caffeine.spec=maximumSize=500,expireAfterWrite=5m",
        "spring.mail.host=localhost",
        "spring.mail.port=25",
        "spring.mail.username=test",
        "spring.mail.password=test",
        "spring.mail.properties.mail.smtp.auth=false",
        "spring.mail.properties.mail.smtp.starttls.enable=false",
        "spring.mail.properties.mail.smtp.starttls.required=false",
        "spring.autoconfigure.exclude=com.giffing.bucket4j.spring.boot.starter.Bucket4jAutoConfiguration,com.giffing.bucket4j.spring.boot.starter.config.filter.servlet.Bucket4JAutoConfigurationServletFilter,com.giffing.bucket4j.spring.boot.starter.config.filter.reactive.webflux.Bucket4JAutoConfigurationWebfluxFilter,com.giffing.bucket4j.spring.boot.starter.config.filter.reactive.gateway.Bucket4JAutoConfigurationSpringCloudGatewayFilter,com.giffing.bucket4j.spring.boot.starter.Bucket4jStartupCheckConfiguration",
        "jwt.secret=cHJldHR5bmFpbHMtc2VjcmV0LWtleS1mb3Itand0LXRva2VuLWdlbmVyYXRpb24tbXVzdC1iZS1hdC1sZWFzdC0yNTYtYml0cy1sb25n",
        "jwt.expiration=2592000000",
        "app.cors.allowed-origins=http://localhost:3000",
        "app.admin.email=admin",
        "app.admin.password=admin",
        "app.admin.phone=+639000000000",
        "app.upload.dir=uploads",
        "app.upload.max-file-size=5242880",
        "app.upload.base-url=",
        "app.email.verification-url=http://localhost:3000/verify-email",
        "app.email.reset-url=http://localhost:3000/reset-password",
        "app.email.from-email=noreply@prettynails.example.com",
        "app.rate-limit.auth.requests-per-minute=10",
        "app.rate-limit.auth.requests-per-hour=100",
        "app.password-policy.min-length=8",
        "app.password-policy.min-zxcvbn-score=0",
        "app.password-policy.hibp-check-enabled=false",
        "app.password-policy.history-size=5",
        "logging.level.com.prettynails=DEBUG",
        "logging.level.org.testcontainers=INFO",
        "logging.level.org.hibernate.SQL=DEBUG"
    }
)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class IntegrationTestBase {
}