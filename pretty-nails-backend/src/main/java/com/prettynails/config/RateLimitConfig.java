package com.prettynails.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "app.rate-limit.auth")
public class RateLimitConfig {

    private int requestsPerMinute = 10;
    private int requestsPerHour = 100;

    public Bucket createAuthBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(requestsPerMinute, Refill.intervally(requestsPerMinute, Duration.ofMinutes(1))))
                .addLimit(Bandwidth.classic(requestsPerHour, Refill.intervally(requestsPerHour, Duration.ofHours(1))))
                .build();
    }

    public int getRequestsPerMinute() {
        return requestsPerMinute;
    }

    public void setRequestsPerMinute(int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    public int getRequestsPerHour() {
        return requestsPerHour;
    }

    public void setRequestsPerHour(int requestsPerHour) {
        this.requestsPerHour = requestsPerHour;
    }
}