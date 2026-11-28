package com.prettynails.security;

import com.prettynails.entity.Account;
import com.prettynails.entity.User;
import com.prettynails.repository.AccountRepository;
import com.prettynails.repository.LoyaltyCardRepository;
import com.prettynails.repository.UserRepository;
import com.prettynails.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final LoyaltyCardRepository loyaltyCardRepository;
    private final TimeProvider timeProvider;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String email = extractEmail(oAuth2User, registrationId);
        String name = extractName(oAuth2User, registrationId);
        String providerId = oAuth2User.getName(); // OAuth2 provider's unique ID for the user
        String imageUrl = extractImageUrl(oAuth2User, registrationId);

        if (email == null || email.isBlank()) {
            throw new InternalAuthenticationServiceException(
                    "Email not found from OAuth2 provider: " + registrationId);
        }

        // Verify email is verified from OAuth2 provider
        if (!isEmailVerified(oAuth2User, registrationId)) {
            throw new InternalAuthenticationServiceException(
                    "Email not verified with OAuth2 provider: " + registrationId);
        }

        // Check if account already linked
        Optional<Account> existingAccount = accountRepository.findByProviderAndProviderAccountId(
                registrationId, providerId);

        if (existingAccount.isPresent()) {
            // Account linked, load existing user
            User user = existingAccount.get().getUser();
            updateAccountTokens(existingAccount.get(), userRequest);
            return new CustomOAuth2User(user, oAuth2User.getAttributes());
        }

        // Check if user exists with this email
        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(email);

        if (existingUser.isPresent()) {
            // Link OAuth2 account to existing user
            User user = existingUser.get();
            linkOAuth2Account(user, registrationId, providerId, userRequest);
            return new CustomOAuth2User(user, oAuth2User.getAttributes());
        }

        // Create new user
        User newUser = createUser(email, name, registrationId, providerId, imageUrl, userRequest);
        return new CustomOAuth2User(newUser, oAuth2User.getAttributes());
    }

    private String extractEmail(OAuth2User oAuth2User, String registrationId) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        if ("google".equals(registrationId)) {
            return (String) attributes.get("email");
        } else if ("facebook".equals(registrationId)) {
            return (String) attributes.get("email");
        }

        return (String) attributes.get("email");
    }

    private String extractName(OAuth2User oAuth2User, String registrationId) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        if ("google".equals(registrationId)) {
            return (String) attributes.get("name");
        } else if ("facebook".equals(registrationId)) {
            return (String) attributes.get("name");
        }

        return (String) attributes.get("name");
    }

    private String extractImageUrl(OAuth2User oAuth2User, String registrationId) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        if ("google".equals(registrationId)) {
            return (String) attributes.get("picture");
        } else if ("facebook".equals(registrationId)) {
            Object picture = attributes.get("picture");
            if (picture instanceof Map) {
                Map<?, ?> pictureMap = (Map<?, ?>) picture;
                Object data = pictureMap.get("data");
                if (data instanceof Map) {
                    return (String) ((Map<?, ?>) data).get("url");
                }
            }
        }

        return null;
    }

    private User createUser(String email, String name, String provider, String providerId,
                            String imageUrl, OAuth2UserRequest userRequest) {
        User user = User.builder()
                .email(email.toLowerCase().trim())
                .name(name != null ? name : email.split("@")[0])
                .password(UUID.randomUUID().toString()) // Random password for OAuth2 users
                .role("CUSTOMER")
                .emailVerified(timeProvider.localNow())
                .image(imageUrl)
                .oauth2Provider(provider)
                .oauth2ProviderId(providerId)
                .build();

        user = userRepository.save(user);

        // Create loyalty card
        com.prettynails.entity.LoyaltyCard loyaltyCard = com.prettynails.entity.LoyaltyCard.builder()
                .userId(user.getId())
                .stampCount(0)
                .expiresAt(timeProvider.localNow().plusYears(1))
                .build();
        loyaltyCardRepository.save(loyaltyCard);

        // Create account record
        Account account = Account.builder()
                .userId(user.getId())
                .type("oauth2")
                .provider(provider)
                .providerAccountId(providerId)
                .accessToken(userRequest.getAccessToken().getTokenValue())
                .refreshToken(null) // Refresh token handled separately via OAuth2AuthorizedClientService
                .expiresAt(userRequest.getAccessToken().getExpiresAt() != null
                        ? (int) userRequest.getAccessToken().getExpiresAt().getEpochSecond() : null)
                .tokenType(userRequest.getAccessToken().getTokenType().getValue())
                .scope(userRequest.getAccessToken().getScopes().toString())
                .build();
        accountRepository.save(account);

        log.info("Created new OAuth2 user via {}", provider);
        return user;
    }

    private void linkOAuth2Account(User user, String provider, String providerId,
                                   OAuth2UserRequest userRequest) {
        // Update user OAuth2 info if not set
        if (user.getOauth2Provider() == null) {
            user.setOauth2Provider(provider);
            user.setOauth2ProviderId(providerId);
            userRepository.save(user);
        }

        // Create or update account record
        Optional<Account> existingAccount = accountRepository.findByProviderAndProviderAccountId(
                provider, providerId);

        Account account;
        if (existingAccount.isPresent()) {
            account = existingAccount.get();
        } else {
            account = Account.builder()
                    .userId(user.getId())
                    .type("oauth2")
                    .provider(provider)
                    .providerAccountId(providerId)
                    .build();
        }

        account.setAccessToken(userRequest.getAccessToken().getTokenValue());
        account.setRefreshToken(null); // Refresh token handled separately
        account.setExpiresAt(userRequest.getAccessToken().getExpiresAt() != null
                ? (int) userRequest.getAccessToken().getExpiresAt().getEpochSecond() : null);
        account.setTokenType(userRequest.getAccessToken().getTokenType().getValue());
        account.setScope(userRequest.getAccessToken().getScopes().toString());

        accountRepository.save(account);

        log.info("Linked OAuth2 account via {}", provider);
    }

    private void updateAccountTokens(Account account, OAuth2UserRequest userRequest) {
        account.setAccessToken(userRequest.getAccessToken().getTokenValue());
        account.setRefreshToken(null); // Refresh token handled separately
        account.setExpiresAt(userRequest.getAccessToken().getExpiresAt() != null
                ? (int) userRequest.getAccessToken().getExpiresAt().getEpochSecond() : null);
        account.setTokenType(userRequest.getAccessToken().getTokenType().getValue());
        account.setScope(userRequest.getAccessToken().getScopes().toString());

        accountRepository.save(account);
    }

    /**
     * Checks if the email is verified from the OAuth2 provider.
     * Google returns "email_verified" boolean, Facebook returns "verified" in the response.
     * For prototype: require verified email before auto-linking accounts.
     */

    /**
     * Checks if the email is verified from the OAuth2 provider.
     * Google returns "email_verified" boolean, Facebook returns "verified" in the response.
     */
    private boolean isEmailVerified(OAuth2User oAuth2User, String registrationId) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        if ("google".equals(registrationId)) {
            Object verified = attributes.get("email_verified");
            return verified instanceof Boolean && (Boolean) verified;
        } else if ("facebook".equals(registrationId)) {
            // Facebook doesn't have a direct email_verified field in basic profile
            // The email is considered verified if it's present in the response
            return attributes.containsKey("email") && attributes.get("email") != null;
        }

        // Default: require email_verified field
        Object verified = attributes.get("email_verified");
        return verified instanceof Boolean && (Boolean) verified;
    }
}