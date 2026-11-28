# Basis on CODE-REVIEW.md — Terminal 1 (Opus, High Effort)

## Terminal 1 Launch Instructions (Parallel Worktree)

Run this in **Terminal 1** from the repository root so it works in an isolated worktree without colliding with Terminal 2 (`frontend/` and `tests/e2e/`):

```bash
cd /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone
claude -w fix-backend --model opus
```

Inside Claude Code CLI, set effort to high (if not already set):
```text
/effort high
```

> **Alternative manual git worktree (if you prefer explicit branches):**
> ```bash
> git worktree add ../app-dev-wt-backend -b fix/backend
> cd ../app-dev-wt-backend
> claude --model opus
> ```

---

## Prompt to Paste into Terminal 1 (Opus — High Effort)

```text
Read `docs/CODE-REVIEW.md` first — specifically the **Prototype & Database Constraints**, **Implementation Decisions (Confirmed)**, and **Sections 7, 8, 9, 10, and 11** (Backend Config, Security, Exception Handling, Util, Resources, Controllers, DTOs, Services, Entities, Repositories, and Backend Unit & Integration Tests).

Your job is to implement ALL `Critical`, `High`, `Medium`, and `Low` fixes in `pretty-nails-backend/` ONLY.
DO NOT modify `frontend/` or `tests/e2e/` (those are being handled in parallel in Terminal 2).

---

### 1. Mandatory Constraints & Decisions (Do Not Violate)
1. **Prototype Credentials:** Keep the hardcoded default admin account (`Email: admin` / `Password: admin`) intact in `AdminProperties.java`, `DataSeeder.java`, and `data.sql`. Do NOT delete it. (Still fix the bug in `DataSeeder.java` where empty `ADMIN_EMAIL=""` creates a bogus empty-email `ADMIN` row.)
2. **Prototype Registration & Login Smoothness:**
   - In `AuthService.register(...)`, set `emailVerified` automatically on creation (using `TimeProvider.localNow()`) so `User.isEnabled()` is `true` immediately for prototype users (no manual SQL update needed to log in).
   - Ensure `GlobalExceptionHandler` explicitly handles `BadCredentialsException`, `DisabledException`, and `LockedException` with clean `401`/`403` JSON responses instead of HTTP 500s.
3. **Database Policy:** **No Supabase** and **No local file-based H2 (`jdbc:h2:file:...`)**. PostgreSQL is the primary database, and `application-local.yml` must remain strictly in-memory H2 (`jdbc:h2:mem:...`).
4. **Booking Slot Capacity:** Enforce **1 active booking per time slot** (`(appointment_date, start_time)`):
   - Drop `Booking.java`'s unconditional `@UniqueConstraint(name = "uk_booking_slot_active", ...)` so `CANCELLED` and `NO_SHOW` bookings reopen the slot automatically.
   - Rely on Flyway `V2`'s partial unique index (`WHERE status NOT IN ('CANCELLED', 'NO_SHOW')`) and align `BookingRepository`, `AvailabilityService`, and `BookingService` with this rule.
5. **JWT Auth Delivery:** Keep `Authorization: Bearer` header + `localStorage` as the primary prototype transport. Fix `JwtAuthenticationFilter` so expired/malformed JWTs never cause HTTP 500s, and enforce `isEnabled()` and `isAccountNonLocked()`.
6. **OAuth2 Login:** Wire `.oauth2Login(...)` in `SecurityConfig.java` with `CustomOAuth2UserService` and `OAuth2AuthenticationSuccessHandler`, and fix unverified email auto-linking, lazy proxy loading, and token/URL logging leaks.
7. **Admin Features Support (for Terminal 2):**
   - Ensure `GET /api/admin/reports/revenue` returns real aggregated revenue data for the Dashboard chart.
   - Add/verify a persisted customer block/unblock field & endpoint (e.g., `isBlocked` on `User` + `PATCH /api/admin/customers/{id}/block`) so Terminal 2 can wire real customer blocking instead of client-only state.

---

### 2. Detailed Execution Plan by Section

#### Phase A — Entities, Repositories & Flyway Migrations (Sections 10 & 7)
1. **Flyway & Schema Alignment:**
   - Add `V1__Initial_schema.sql` (or reconcile Flyway `V1`–`V3` cleanly) so fresh PostgreSQL databases migrate from scratch without relying on `ddl-auto: update`.
   - Fix the `V3` `audit_logs` DDL vs `AuditLog.java` mismatch (`NOT NULL` `admin_id` / `timestamp` alignment).
   - Remove `@UniqueConstraint(name = "uk_booking_slot_active", ...)` from `Booking.java` so it does not conflict with `V2`'s partial unique index.
2. **Entity Fixes (`pretty-nails-backend/src/main/java/.../entity/`):**
   - Add `@Builder.Default` to all entities with initialized fields (e.g., `Availability`, `Booking`, `BookingService`, `Gallery`, `LoyaltyCard`, `Notification`, `Payment`, `Service`, `User`) so `.builder()` never nulls `NOT NULL` columns.
   - Fix `User.java`:
     - Remove `CascadeType.ALL` + `orphanRemoval = true` from `bookings`, `payments`, `notes`, and `adminNotes` to protect financial/audit history.
     - Fix `User.isAccountNonLocked()` (stop hardcoding `true`; tie to lock/blocked state).
     - Add `@JsonIgnore` / `@ToString.Exclude` on sensitive fields (`password`, `getAuthorities()`, lazy collections).
   - Fix `Account.java`: encrypt OAuth tokens at rest (`@Convert` AttributeConverter) or exclude from serialization/logging (`@JsonIgnore`, `@ToString.Exclude`).
   - Add `@Version` optimistic locking on `Booking`, `Payment`, and `LoyaltyCard` where concurrent updates occur.
   - Fix `Service.java` `variantsJson` mapping (`@JdbcTypeCode(SqlTypes.JSON)`).
   - Add missing `@Table` indexes on foreign keys and query columns (`BookingService`, `CustomerNote`, `Gallery`, `LoyaltyStamp`, `Account`).
3. **Repository Fixes (`pretty-nails-backend/src/main/java/.../repository/`):**
   - Fix `LoyaltyCardRepository.countRedeemedStampsSince` (`'REDEEM'` vs `LoyaltyService`'s `'REWARD_REDEMPTION'` mismatch).
   - Remove hardcoded owner exclusions in `LoyaltyCardRepository.findCustomerCards()`.
   - Fix PostgreSQL null-parameter JPQL hazards in `AuditLogRepository` and `BookingRepository` (avoid untyped `:param IS NULL` in PostgreSQL JPQL).

#### Phase B — Config, Security, Exception Handling & Resources (Section 7)
1. **Configuration & Dependencies (`pom.xml`, `application*.yml`):**
   - Add `spring-boot-starter-actuator` to `pom.xml` and permit `/actuator/health` in `SecurityConfig` for Docker healthchecks.
   - Remove hardcoded fallback `jwt.secret` from base `application.yml` (keep local dev secret only in `application-local.yml` or env var).
   - Ensure `application-local.yml` uses `jdbc:h2:mem:...` only (no `jdbc:h2:file:...`).
2. **Security (`SecurityConfig`, `JwtAuthenticationFilter`, `JwtUtil`, `RateLimitFilter`, OAuth2):**
   - In `SecurityConfig.java`: wire `.oauth2Login(...)` with `CustomOAuth2UserService` and `OAuth2AuthenticationSuccessHandler`; configure `AuthenticationEntryPoint` / `AccessDeniedHandler` for clean 401/403 JSON responses; fix CORS `allowCredentials` configuration; protect sensitive upload paths if needed.
   - In `JwtAuthenticationFilter.java`: catch expired/malformed/invalid JWT exceptions cleanly (never throw 500), and check `user.isEnabled()` and `user.isAccountNonLocked()`.
   - In `RateLimitFilter.java`: prevent `X-Forwarded-For` IP spoofing and replace unbounded `ConcurrentHashMap` with a bounded cache (e.g., Caffeine) to prevent memory DoS.
   - In `CustomOAuth2UserService.java` & `OAuth2AuthenticationSuccessHandler.java`: require verified email before auto-linking accounts, fix lazy proxy loading issues, and remove JWTs from INFO logs and redirect URLs where possible (or handle securely).
3. **Exception Handling & Seeding:**
   - In `GlobalExceptionHandler.java`: do NOT leak `ex.getMessage()` on 500 responses; log full stack traces server-side and return a generic error message; explicitly handle `BadCredentialsException`, `DisabledException`, and `LockedException` with 401/403.
   - In `DataSeeder.java`: fix empty `ADMIN_EMAIL=""` creating a bogus empty-email `ADMIN` row while preserving `admin`/`admin`.

#### Phase C — Controllers, DTOs & Services (Sections 8 & 9)
1. **Controllers & DTOs (Section 8):**
   - `NotificationController`: add `@PreAuthorize` on `/api/notifications/send` and `/broadcast`; fix SSE sink overwrite/removal race condition.
   - `PaymentController`: fix IDOR on `GET /api/payments` and payment overwrite flaws on `POST /api/payments`.
   - `LoyaltyController`: fix unverified customer QR self-stamping on `POST /api/loyalty/stamp` (enforce staff/admin role or signed/verified booking token).
   - Add `@Valid` on nested DTO lists (`BookingDtos.BookingRequest.services`, `ServiceDtos.ServiceRequest.variants`), validate `NotificationDtos`, and add `@NotNull` on `LoyaltySettingsDto`.
   - Ensure `GET /api/admin/reports/revenue` and `PATCH /api/admin/customers/{id}/block` are properly exposed and secured with `@PreAuthorize("hasRole('ADMIN')")`.
2. **Services (Section 9):**
   - `BookingService`: compute `totalPrice` and `downpayment` server-side from catalog prices (never trust client-supplied totals); do NOT self-mark `Payment` as `PAID` just because `paymentReference` is non-empty; enforce `1 active booking per time slot`.
   - `LoyaltyService`: verify booking existence, ownership, and `COMPLETED` status before awarding stamps via QR; make stamp/redemption checks atomic.
   - `PaymentService`: verify booking ownership and `PAID` immutability before creating/updating payments.
   - `AvailabilityService`: fix N+1 queries and duration overlap checks.
   - `FileStorageService`: enforce path traversal protection and strict MIME/extension validation.

#### Phase D — Backend Unit & Integration Tests (Section 11)
1. Fix `BookingServiceTest` missing `@Mock LoyaltyService` and `@Mock NoShowPolicyService` causing `NullPointerException` in `completeBooking_shouldUpdateStatusToCompleted`.
2. Fix `IntegrationTestBase` / `application-test.yml` so tests don't mask Flyway/PostgreSQL behavior, and update `BookingRepositoryTest` to verify `CANCELLED` / `NO_SHOW` slots CAN be rebooked.
3. Fix `AuthServiceIntegrationTest` password mismatch and reduce over-mocking in `AdminControllerIntegrationTest`, `AuthControllerIntegrationTest`, `BookingControllerIntegrationTest`.
4. Fix `BookingServiceIntegrationTest` deferred-flush artifacts and wall-clock-flaky 24h cutoff tests, and `LoyaltyCardRepositoryTest` L1 cache (`flush`/`clear`).
5. Add unit/integration tests for security (401/403, IDOR, `@PreAuthorize`), slot rebooking, and customer blocking.

---

### 3. Verification
Run the full backend test suite after your edits:
```bash
cd pretty-nails-backend && ./mvnw test
```
Do not finish until `./mvnw test` compiles and passes (or report any environment/Docker requirement if Testcontainers/local Postgres is unavailable).
```
