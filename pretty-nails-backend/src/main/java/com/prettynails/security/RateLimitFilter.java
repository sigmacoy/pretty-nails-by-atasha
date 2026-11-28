package com.prettynails.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.prettynails.config.RateLimitConfig;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig rateLimitConfig;
    // Caffeine cache with bounded size (max 10,000 entries, expire after 1 hour of inactivity)
    private final Cache<String, Bucket> bucketCache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterAccess(Duration.ofHours(1))
            .build();

    public RateLimitFilter(RateLimitConfig rateLimitConfig) {
        this.rateLimitConfig = rateLimitConfig;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Only apply rate limiting to auth endpoints
        if (path.startsWith("/api/auth/")) {
            String clientIp = getClientIp(request);
            String key = clientIp + ":" + path;

            // Get or create bucket for this key
            Bucket bucket = bucketCache.get(key, k -> rateLimitConfig.createAuthBucket());

            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Get client IP with spoofing protection.
     * In production behind a trusted proxy, configure server.forward-headers-strategy=native
     * or use Spring Cloud Gateway. Only trust X-Forwarded-For when explicitly configured.
     * For local development, fall back to remote address.
     */
    private String getClientIp(HttpServletRequest request) {
        // For security, only use proxy headers when running behind a known proxy
        // In production, this should be configured via server.tomcat.remoteip.internal-proxies
        // For now, use remoteAddr as the primary source, with header fallback only for known proxy setups

        String remoteAddr = request.getRemoteAddr();

        // Check if we're likely behind a proxy (common proxy IPs or forwarded headers present)
        // This is a basic heuristic; production should use explicit proxy configuration
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        String xRealIp = request.getHeader("X-Real-IP");

        // If the remote address is a private/local address and we have proxy headers,
        // we're likely behind a proxy and can trust the headers
        if (isPrivateOrLocalAddress(remoteAddr) && (xForwardedFor != null || xRealIp != null)) {
            // Prefer X-Real-IP if present (set by nginx/proxy)
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp.trim();
            }
            // Fall back to first IP in X-Forwarded-For chain
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                String[] ips = xForwardedFor.split(",");
                if (ips.length > 0) {
                    return ips[0].trim();
                }
            }
        }

        return remoteAddr;
    }

    private boolean isPrivateOrLocalAddress(String ip) {
        if (ip == null) return false;
        // Check for localhost, private ranges (RFC 1918), and Docker networks
        return ip.equals("127.0.0.1") ||
               ip.equals("0:0:0:0:0:0:0:1") ||
               ip.startsWith("10.") ||
               ip.startsWith("192.168.") ||
               ip.startsWith("172.16.") || ip.startsWith("172.17.") ||
               ip.startsWith("172.18.") || ip.startsWith("172.19.") ||
               ip.startsWith("172.20.") || ip.startsWith("172.21.") ||
               ip.startsWith("172.22.") || ip.startsWith("172.23.") ||
               ip.startsWith("172.24.") || ip.startsWith("172.25.") ||
               ip.startsWith("172.26.") || ip.startsWith("172.27.") ||
               ip.startsWith("172.28.") || ip.startsWith("172.29.") ||
               ip.startsWith("172.30.") || ip.startsWith("172.31.") ||
               ip.startsWith("169.254."); // link-local
    }
}