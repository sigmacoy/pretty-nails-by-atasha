package com.prettynails.security;

import com.prettynails.entity.User;
import com.prettynails.service.UserAccountLockService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserAccountLockService userAccountLockService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = oAuth2User.getUser();

        // Check if account is locked using Manila timezone
        if (!userAccountLockService.isAccountNonLocked(user)) {
            log.warn("OAuth2 login attempt for locked account");
            String frontendUrl = System.getenv().getOrDefault("FRONTEND_URL", "http://localhost:3000");
            String redirectUrl = frontendUrl + "/login?error=account_locked";
            response.sendRedirect(redirectUrl);
            return;
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(new CustomUserDetails(user, userAccountLockService));

        // Set token in HttpOnly cookie (secure in production)
        Cookie cookie = new Cookie("access_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(request.isSecure()); // true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge((int) (jwtUtil.getExpiration() / 1000)); // Convert ms to seconds
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);

        // Redirect to frontend without token in URL
        String frontendUrl = System.getenv().getOrDefault("FRONTEND_URL", "http://localhost:3000");
        String redirectUrl = frontendUrl + "/oauth2/callback";
        response.sendRedirect(redirectUrl);
    }
}