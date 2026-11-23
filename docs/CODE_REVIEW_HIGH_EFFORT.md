# High-Effort Code Review Report

**Project:** Pretty Nails by Atasha (Spring Boot 4.1.2 + Next.js 14)
**Review Scope:** `git diff 25e9730d..HEAD` (13 QA fixes + docs + Docker + auth + loyalty + booking flow)
**Effort Level:** High (8 angles, recall-optimized)
**Date:** 2026-11-24

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High     | 4 |
| Medium   | 3 |
| Low      | 0 |
| **Total** | **10** |

---

## Findings (Ranked by Severity)

STATUS: DONE
### 1. [Critical] PaymentController.createPayment Silently Swallows Auth Failure

**File:** `pretty-nails-backend/src/main/java/com/prettynails/controller/PaymentController.java`
**Lines:** 45–52

```java
@PostMapping("/payments")
public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody PaymentRequest request) {
    User currentUser = null;
    try {
        currentUser = getCurrentUser();
    } catch (Exception ignored) {
    }
    return ResponseEntity.ok(paymentService.createPayment(currentUser, request));
}
```

**Failure Scenario:** Any caller (unauthenticated or with expired JWT) hits `/api/payments`. The `catch (Exception ignored)` swallows the `AccessDeniedException` from `getCurrentUser()`. The method passes `null` to `PaymentService.createPayment`. The service derives `userId` from the booking or leaves it empty. Result: payment records with no attributable user. This breaks the audit trail and enables deposit verification bypass.

**Fix:** Remove the try-catch block. Let Spring Security return 401 or 403. If unauthenticated payment creation is truly needed (for example, a webhook), create a separate endpoint with explicit permission.

---

STATUS: DONE
### 2. [Critical] Middleware Reads JWT from Cookie; Auth Stores in localStorage

**File:** `frontend/src/app/middleware.ts`
**Line:** 28
**Related:** `frontend/src/lib/auth.ts` (token storage), `frontend/CLAUDE.md:26`

```typescript
const token = request.cookies.get('prettynails_token')?.value;
```

**Failure Scenario:**
1. User logs in. Token is stored in `localStorage` (per `auth.ts`).
2. Middleware checks cookie `prettynails_token`. Result is `undefined`.
3. Protected route `/my-bookings` triggers middleware redirect to `/login`.
4. User has a valid token in localStorage but middleware does not see it. This causes an infinite redirect loop or forces re-login.

**Fix:** Align storage. Choose one:
- Move token to httpOnly cookie (set by backend on login). Remove localStorage usage.
- Change middleware to read from `Authorization` header. This requires client-side rewrite.
- Accept that middleware cannot validate JWT without cookie.

---

STATUS: DONE
### 3. [Critical] Admin Credentials Hardcoded in All Profiles (Including Docker)

**Files:**
- `pretty-nails-backend/src/main/resources/application.yml:65-67`
- `pretty-nails-backend/src/main/resources/application-local.yml:45-46`
- `pretty-nails-backend/src/main/resources/application-docker.yml` (inherits from base)

```yaml
app:
  admin:
    email: admin
    password: admin
    phone: "+639000000000"
```

**Failure Scenario:** Docker image built from repo contains default `admin`/`admin`. Anyone pulling the image or deploying without overriding `SPRING_PROFILES_ACTIVE` and environment variables gets a pre-configured admin account. No rotation, no complexity requirement, same credentials across all deployments.

**Fix:** Remove defaults. Require `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables at startup. Fail fast if missing. Generate random password on first run and log it once.

---

STATUS: DONE
### 4. [High] JWT Secret Default is Hardcoded Base64 String

**Files:**
- `pretty-nails-backend/src/main/resources/application.yml:55`
- `pretty-nails-backend/src/main/resources/application-local.yml:35`

```yaml
jwt:
  secret: ${JWT_SECRET:cHJldHR5bmFpbHMtc2VjcmV0LWtleS1mb3Itand0LXRva2VuLWdlbmVyYXRpb24tbXVzdC1iZS1hdC1sZWFzdC0yNTYtYml0cy1sb25n}
```

**Failure Scenario:** Production deployment forgets `JWT_SECRET`. Application starts with the default. The default decodes to `prettynails-secret-key-for-jwt-token-generation-must-be-at-least-256-bits-long`. All issued tokens are forgeable by anyone with this repo. The default looks like a secure key but is public.

**Fix:** Remove default. Application must fail startup if `JWT_SECRET` is not set and length is less than 32 characters (256 bits).

---

STATUS: DONE
### 5. [High] LoyaltyService.getAllLoyaltyCards Loads Entire Table Into Memory

**File:** `pretty-nails-backend/src/main/java/com/prettynails/service/LoyaltyService.java`
**Lines:** 351–376

```java
public Page<AdminLoyaltyCardDto> getAllLoyaltyCards(String search, Pageable pageable) {
    List<LoyaltyCard> allCards = loyaltyCardRepository.findAll(); // Loads ALL rows
    // ... in-memory filter + manual pagination
}
```

**Failure Scenario:** 50,000 loyalty cards exist. `findAll()` loads 50,000 entities into JVM heap. Each request allocates approximately 50 MB or more. Concurrent admin requests cause OutOfMemoryError or garbage collection thrashing. Manual `subList` pagination defeats database-level limit and offset.

**Fix:** Add repository method:
```java
Page<LoyaltyCard> findByUserRoleNot(String role, Pageable pageable);
```
Or use JPA `@Query` with join on User table. Push search and filter to the database.

---

STATUS: DONE
### 6. [High] NotificationController and NotificationService Maintain Dual SSE Sink Maps

**Files:**
- `pretty-nails-backend/src/main/java/com/prettynails/controller/NotificationController.java:34-35, 49-50, 79-82`
- `pretty-nails-backend/src/main/java/com/prettynails/service/NotificationService.java:36-38, 107-116`

```java
// Controller
private final Map<String, Sinks.Many<NotificationEvent>> userSinks = new ConcurrentHashMap<>();
// Service
private final Map<String, Sinks.Many<NotificationEvent>> userSinkMap = new ConcurrentHashMap<>();
```

**Failure Scenario:**
1. User connects via SSE. `NotificationController.streamNotifications()` registers sink in `userSinks`.
2. Admin calls `POST /api/notifications/send`. `NotificationService.sendToUser()` pushes to `userSinkMap` (empty).
3. User never receives the notification.
4. On disconnect, only one map is cleaned. Leaked `Sinks.Many` objects accumulate per redeploy.

**Fix:** Use a single source of truth. Move sink registry to `NotificationService` or a dedicated `SseConnectionManager` bean. Controller calls `service.registerSink(userId, sink)`.

---

STATUS: DONE
### 7. [High] BookingForm.handleSubmit Creates Booking Then Payment Separately

**File:** `frontend/src/app/(public)/booking/BookingForm.tsx`
**Lines:** 524–539

```typescript
const response = await bookingsApi.create(bookingData);
const bookingId = response.data?.id;
if (bookingId && paymentMethod !== 'CASH' && trimmedRef) {
    try {
        await paymentsApi.create({ bookingId, amount: downpayment, method: paymentMethod, reference: trimmedRef });
    } catch (paymentErr) {
        console.warn('Payment record sync:', paymentErr); // Silent fail
    }
}
```

**Failure Scenario:**
1. Booking created successfully (201).
2. Payment API call fails (network, 500, validation).
3. Booking exists with no payment record. Admin sees "Unpaid" deposit. Customer thinks reservation is confirmed.
4. No compensation transaction, no retry, no user notification.

**Fix:** Backend: add `POST /api/bookings/with-payment` that creates both atomically in one transaction. Frontend: call single endpoint. If not feasible, implement saga pattern: on payment failure, call `DELETE /api/bookings/{id}` or mark booking `CANCELLED`.

---

STATUS: DONE
### 8. [Medium] LoyaltyService Has Three Stamp-Adding Methods with Duplicated Logic

**File:** `pretty-nails-backend/src/main/java/com/prettynails/service/LoyaltyService.java`
**Methods:** `addStampOnBookingCompletion` (44–76), `addStampViaQr` (121–208), `addStampViaQrByBookingId` (219–322)

**Failure Scenario:** QR parsing logic differs subtly between `addStampViaQr` (customer) and `addStampViaQrByBookingId` (staff). `addStampViaQrByBookingId` adds `"_STAFF"` suffix to source. `addStampViaQr` uses raw `stampType`. `addStampOnBookingCompletion` hardcodes `"SERVICE"`. Bug fixes must be applied in three places. Reward threshold check exists only in staff method.

**Fix:** Extract private `addStampCore(userId, bookingId, source, stampType)` handling: duplicate check, card get-or-create, increment, timestamps, stamp record creation. All three methods delegate to it.

---

STATUS: DONE
### 9. [Medium] Controllers Duplicate getCurrentUser() (25 Lines Each)

**Files:**
- `LoyaltyController.java:26–36`
- `NotificationController.java:151–162`
- `PaymentController.java:22–35`
- `AuthController.java:22–35`

**Failure Scenario:** Change to `CustomUserDetails` (for example, add `getTenantId()`) requires editing four or more files. `PaymentController` has extra `instanceof User` check that others lack. Inconsistent principal handling.

**Fix:** Create `BaseController` with `protected User getCurrentUser()`. Or use Spring Security `@AuthenticationPrincipal CustomUserDetails` in handler methods.

---

STATUS: DONE
### 10. [Medium] BookingForm Has Hardcoded Fallback Services (80 Lines)

**File:** `frontend/src/app/(public)/booking/BookingForm.tsx`
**Lines:** 56–134

```typescript
const defaultServicesFallback: ServiceDto[] = [
  { id: 'service-extension', name: 'Soft Gel Sculpted Extensions', ... },
  // 5 more hardcoded services with variants, prices, durations
];
```

**Failure Scenario:** Backend adds new service, changes price, or disables service. Frontend continues showing stale fallback until API recovers. Customer books at old price or for disabled service. Booking created with invalid `serviceId`. Backend returns 400 or silent data corruption.

**Fix:** Remove fallback. Show "Services unavailable, please refresh" skeleton. If offline support is needed, cache last successful `/api/services` response in `localStorage` with TTL (24 hours) and version check.

---

## Conventions Violations (CLAUDE.md)

| File | Rule (CLAUDE.md) | Violation |
|------|------------------|-----------|
| `middleware.ts:28` | "Token stored in localStorage" (frontend/CLAUDE.md:26) | Reads from cookie `prettynails_token` |
| `middleware.ts:4` | "Protected routes via middleware" | `/staff/scanner` public in middleware but backend requires `ADMIN`/`STAFF` |
| `application.yml:55` | No explicit rule, but security best practice | JWT secret default is hardcoded known value |

---

## Recommendations Priority Order

1. **Fix auth storage mismatch** (Finding 2) — blocks all authenticated flows.
2. **Remove hardcoded secrets** (Findings 3, 4) — critical for any production deploy.
3. **Fix PaymentController exception swallow** (Finding 1) — data integrity.
4. **Unify SSE sink registry** (Finding 6) — notifications broken.
5. **Atomic booking and payment** (Finding 7) — core business flow.
6. **Optimize LoyaltyService query** (Finding 5) — scalability.
7. **Deduplicate stamp logic and getCurrentUser** (Findings 8, 9) — maintainability.
8. **Remove hardcoded fallback services** (Finding 10) — data consistency.

---

## Files Modified in This Review Scope (for reference)

```
README.md
docs/QA-Nov20-10am.md
docs/QA-PLAN-Nov23.md
frontend/src/app/(admin)/admin/bookings/page.tsx
frontend/src/app/(admin)/admin/loyalty/page.tsx
frontend/src/app/(auth)/oauth2/callback/page.tsx
frontend/src/app/(customer)/loyalty/page.tsx
frontend/src/app/(public)/booking/BookingForm.tsx
frontend/src/app/layout.tsx
frontend/src/app/middleware.ts
frontend/src/components/admin/bookings/BookingsTable.tsx
frontend/src/components/auth/LoginForm.tsx
frontend/src/components/auth/RegisterForm.tsx
frontend/src/components/layout/Header.tsx
frontend/src/components/profile/ProfileForm.tsx
frontend/src/components/ui/PhoneInput.tsx
frontend/src/components/ui/index.ts
frontend/src/lib/api.ts
frontend/src/lib/validations.ts
frontend/src/types/api.ts
pretty-nails-backend/src/main/java/com/prettynails/controller/LoyaltyController.java
pretty-nails-backend/src/main/java/com/prettynails/controller/NotificationController.java
pretty-nails-backend/src/main/java/com/prettynails/controller/PaymentController.java
pretty-nails-backend/src/main/java/com/prettynails/dto/AdminDtos.java
pretty-nails-backend/src/main/java/com/prettynails/dto/PaymentDtos.java
pretty-nails-backend/src/main/java/com/prettynails/service/AdminService.java
pretty-nails-backend/src/main/java/com/prettynails/service/LoyaltyService.java
pretty-nails-backend/src/main/resources/application.yml
pretty-nails-backend/src/main/resources/application-local.yml
pretty-nails-backend/src/main/resources/application-docker.yml
docker-compose.yml
pretty-nails-backend/Dockerfile
frontend/Dockerfile
```