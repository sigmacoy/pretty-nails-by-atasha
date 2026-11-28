# Comprehensive Per-File Code Review

**Repository:** `app-dev-capstone` (Pretty Nails by Atasha — Spring Boot 3.4 + Next.js)
**Files Scanned:** 336
**Files Reviewed:** 336
**Prototype & Database Constraints:**
- **Prototype-Only Scope:** The hardcoded default administrator account (`Email: admin` / `Password: admin`) is **intentionally preserved** for prototype evaluation and demo login (`AdminProperties`, `DataSeeder`, `data.sql`).
- **Database Policy:** **No Supabase** and **No local file-based H2 (`jdbc:h2:file:...`)**. PostgreSQL is the primary database (Docker / standard deployment), and any H2 usage in `local` development must remain strictly in-memory (`jdbc:h2:mem:...`).

**Implementation Decisions (Confirmed):**
1. **Implementation Scope:** Fix **all severities (`Critical`, `High`, `Medium`, `Low`)** in **application code & tests** (backend + frontend + unit/integration/e2e tests).
2. **Booking Slot Capacity:** **1 active booking per time slot** (`(appointment_date, start_time)`), enforced via Flyway `V2`'s partial unique index (`WHERE status NOT IN ('CANCELLED', 'NO_SHOW')`) so cancelled/no-show slots reopen automatically (drop `Booking.java`'s unconditional `@UniqueConstraint`).
3. **JWT Auth Delivery:** Keep **`Authorization: Bearer` header + `localStorage`** for prototype simplicity (ensure `JwtAuthenticationFilter` handles invalid/expired tokens cleanly without 500s).
4. **OAuth2 Login:** **Wire and fix `.oauth2Login(...)`** in `SecurityConfig` (Google/Facebook) along with `CustomOAuth2UserService` (verified email check, lazy proxy fix) and `OAuth2AuthenticationSuccessHandler`.
5. **Admin UI Features:** **Wire Dashboard revenue chart** to the real backend reports API (`GET /api/admin/reports/revenue`) and **add/persist customer blocking** in backend/frontend (or cleanly wire real status persistence instead of client-only state).

## Executive Summary

| Category | Files | Critical | High | Medium | Low | Info |
|---|---:|---:|---:|---:|---:|---:|
| 1. Root, CI/CD, Docker, Scripts, Diagrams & Docs | 49 | 2 | 11 | 52 | 27 | 3 |
| 2. Frontend Configuration, Lib, Hooks, Types & App Shell | 34 | 1 | 7 | 24 | 27 | 12 |
| 3. Frontend Pages — Admin & Auth | 18 | 0 | 9 | 20 | 12 | 3 |
| 4. Frontend Pages — Customer, Public & Staff | 12 | 2 | 6 | 18 | 12 | 3 |
| 5. Frontend Components — Admin & Auth | 27 | 0 | 8 | 18 | 41 | 8 |
| 6. Frontend Components — Booking, Customer, Layout, Loyalty, Profile, Staff & UI | 34 | 1 | 9 | 26 | 32 | 11 |
| 7. Backend Config, Security, Exception Handling, Util & Resources | 38 | 2 | 20 | 24 | 24 | 9 |
| 8. Backend Controllers & DTOs | 21 | 4 | 5 | 17 | 23 | 6 |
| 9. Backend Services | 17 | 3 | 16 | 20 | 14 | 6 |
| 10. Backend Entities & Repositories | 34 | 3 | 15 | 32 | 20 | 4 |
| 11. Backend Unit & Integration Tests | 21 | 1 | 10 | 28 | 18 | 0 |
| 12. E2E Tests, Frontend Unit Tests & Mocks | 31 | 0 | 5 | 15 | 23 | 4 |
| **Total** | **336** | **19** | **121** | **294** | **273** | **69** |

### Key Takeaways by Area
- **1. Root, CI/CD, Docker, Scripts, Diagrams & Docs:** Reviewed all 49 files. Critical issues: (1) `docs/entity-simple/Booking.java` enforces an unconditional unique constraint on `(appointment_date, start_time)`, breaking `Availability.maxSlots` and permanently blocking cancelled slots; (2) `scripts/verify_diagrams.mjs` references non-existent `DIAGRAMS/*` filenames and `backend/` paths. High issues include broken CD deployment wiring between `cd.yml` and `docker-compose.yml`, runtime `NEXT_PUBLIC_API_URL` in `docker-compose.yml`, missing `.env*` patterns in `.gitignore`, hardcoded fallback `JWT_SECRET` in `README.md` and destructive Flyway-wiping `TRUNCATE` in `how-to-run.md`, plaintext OAuth tokens in `Account.java`, `UserDetails` entity exposure in `User.java`, unresolved production blockers in `QA-REPORT.md`, and hardcoded developer paths in `verify_diagrams.mjs`. (Prototype `admin`/`admin` credentials are preserved as intended.)
- **2. Frontend Configuration, Lib, Hooks, Types & App Shell:** Reviewed all 34 files. Critical: frontend/src/app/middleware.ts is in the wrong directory (must be src/middleware.ts), completely disabling route protection. High: unverified JWT decoding/missing exp in middleware, missing output:'standalone' in next.config.js breaking Dockerfile, hardcoded localhost:8080 rewrite in next.config.js, useBooking variant pricing/catalog race-condition bugs, and Manila date parsing/timezone bugs in utils.ts.
- **3. Frontend Pages — Admin & Auth:** Systemic bugs across admin pages: (1) useQuery in hooks/useApi.ts only runs on mount, so filter/search/pagination/period updates in Bookings, Customers, Gallery, Loyalty, and Reports never re-fetch; (2) useAdminErrors() uses isolated local useState in (admin)/layout.tsx and every child page, leaving AdminErrorBanner disconnected; (3) Admin Dashboard renders hardcoded dailyRevenueData mock values, and Customers page simulates blocking only in client memory; (4) OAuth2 callback passes an unvalidated sessionStorage redirect target to router.push.
- **4. Frontend Pages — Customer, Public & Staff:** Reviewed all 12 customer, public, and staff App Router pages. Critical bugs in BookingForm.tsx: Step 4 payment receipt files are silently discarded on submit (and object URLs leaked), and filteredSlots rejects every 60-90m service because it compares full duration endTime against 30m slot endTime. High findings include fetchAvailableSlots/startTime circular re-fetch overwriting user selections, missing variant-less service selection, late auth gate losing form state, customer loyalty/page.tsx calling adminApi.getSettings() (causing 401 redirect/403 error), gallery/page.tsx search/category changes not re-fetching due to useQuery lacking query keys, and (staff)/scanner/page.tsx lacking any auth/RBAC guard.
- **5. Frontend Components — Admin & Auth:** Reviewed all 27 files (4 clean barrel files; 75 findings across 23 files: 8 High, 18 Medium, 41 Low, 8 Info). Key High issues: Open Redirects via unvalidated `redirect` query params in LoginForm.tsx and RegisterForm.tsx; unvalidated `inspirationUrl` link in BookingDetailsDrawer.tsx (Stored XSS risk); React StrictMode double-verification race condition on single-use tokens in VerifyEmailForm.tsx; missing BarcodeDetector fallback and getUserMedia stream leak in QrScannerModal.tsx; blind error-swallowing fallback in bookings/types.ts `transitionBookingStatus`; and responsive `hidden` classes omitted from `headerClassName` in CustomersTable.tsx.
- **6. Frontend Components — Booking, Customer, Layout, Loyalty, Profile, Staff & UI:** Reviewed all 34 files. Critical/High issues: (1) loyalty/QRScanner.tsx deadlocks camera start because <video ref={videoRef}> is conditionally mounted only after hasPermission is true, leaking MediaStream, plus stale isScanning closure; (2) staff/QRScanner.tsx fails to debounce duplicate QR scans due to stale lastScannedCode closure (allowing duplicate stamp awards) and blocks Start/Stop Scanning clicks via pointer-events-none; (3) PaymentQRCode.tsx renders a static decorative SVG QR instead of real GCash/Maya QR data; (4) customer/BookingCard.tsx hardcodes a 3h browser-local-TZ reschedule endTime; (5) Header.tsx never resets isMenuAnimating on mobile menu close; (6) AdminLayout.tsx/AdminSidebar.tsx overlap main content below lg; (7) Modal.tsx blocks backdrop clicks with an overlapping z-50 wrapper; (8) PhoneInput.tsx pattern="[0-9]*" fails native validation when formatted with spaces.
- **7. Backend Config, Security, Exception Handling, Util & Resources:** Reviewed all 38 files. Critical findings: (1) base application.yml ships a fallback JWT secret; (2) V3 audit_logs DDL conflicts with AuditLog.java. (Hardcoded `admin`/`admin` seeding in `DataSeeder`, `AdminProperties`, and `data.sql` is intentionally preserved for the prototype and downgraded to Info.) High findings include missing Actuator dependency and `/actuator/health` security permit for Dockerfile healthcheck, missing V1 Flyway baseline migration, `DataSeeder` creating an empty-email `ADMIN` when `ADMIN_EMAIL` defaults to `""`, `RateLimitFilter` IP spoofing and unbounded map DoS, `JwtAuthenticationFilter` 500s on invalid JWTs / cookie mismatch / missing lock & enabled checks, OAuth2 unverified email takeover & JWT leaked in redirect URL + INFO logs, unwired OAuth2 & CORS `allowCredentials(false)`, and `GlobalExceptionHandler` leaking `ex.getMessage()` on 500s. Database setup uses PostgreSQL (no Supabase) and strictly in-memory H2 (`jdbc:h2:mem:...`, no local H2 files).
- **8. Backend Controllers & DTOs:** Reviewed all 21 backend controller and DTO files. Found 4 Critical issues: missing @PreAuthorize on /api/notifications/send and /broadcast (NotificationController), IDOR and payment overwrite flaws on GET/POST /api/payments (PaymentController), and unverified customer QR self-stamping on POST /api/loyalty/stamp (LoyaltyController). Found 5 High issues: missing @Valid on nested DTO lists (BookingDtos.BookingRequest.services, ServiceDtos.ServiceRequest.variants), unvalidated notification request/event DTOs (NotificationDtos), missing @NotNull on LoyaltySettingsDto (AdminDtos), and SSE sink overwrite/removal race (NotificationController). Also identified 17 Medium, 23 Low, and 6 Info findings.
- **9. Backend Services:** Audited all 17 backend service files (3 Critical, 16 High, 20 Medium, 14 Low, 6 Info). Key critical findings: (1) BookingService.createBooking trusts client-supplied totalPrice/downpayment and self-marks Payment status as PAID from any non-empty paymentReference; (2) LoyaltyService.addStampViaQr awards stamps from unsigned client QR strings without verifying booking existence, ownership, or COMPLETED status; (3) PaymentService.createPayment allows overwriting existing payment records without verifying booking ownership or PAID immutability.
- **10. Backend Entities & Repositories:** Audited all 34 entity and repository files. Critical issues: (1) AuditLog entity schema mismatches Flyway V3 audit_logs table (NOT NULL admin_id/timestamp mismatch); (2) Booking @UniqueConstraint uk_booking_slot_active creates a full unique constraint across all statuses, conflicting with Flyway V2's partial unique index for PENDING/CONFIRMED slots; (3) User cascades CascadeType.ALL + orphanRemoval=true to bookings, payments, notes, and adminNotes, risking destruction of financial/audit history. High issues include missing @Builder.Default on 9 entities, User.isAccountNonLocked() hardcoded true, plaintext OAuth tokens in Account, LoyaltyCardRepository.countRedeemedStampsSince querying 'REDEEM' vs LoyaltyService's 'REWARD_REDEMPTION', hardcoded owner exclusions in LoyaltyCardRepository.findCustomerCards(), and PostgreSQL null-parameter JPQL hazards in AuditLogRepository and BookingRepository.
- **11. Backend Unit & Integration Tests:** Reviewed all 21 backend test files. Key findings: (1) Critical: BookingServiceTest omits @Mock LoyaltyService (and NoShowPolicyService), causing NullPointerException in completeBooking_shouldUpdateStatusToCompleted; (2) High: IntegrationTestBase/application-test.yml hardcode localhost Postgres with Flyway disabled (ddl-auto=create), masking a real bug where BookingRepositoryTest asserts uk_booking_slot_active blocks rebooking CANCELLED slots; (3) High: 4 integration test classes (AdminControllerIntegrationTest, AuthControllerIntegrationTest, BookingControllerIntegrationTest, AuthServiceIntegrationTest) boot full DB contexts while mocking their core service or AuthenticationManager, masking mismatches like AuthServiceIntegrationTest's password mismatch; (4) High: BookingServiceIntegrationTest has deferred-flush test artifacts and wall-clock-flaky 24h cutoff tests, and LoyaltyCardRepositoryTest reads L1 cache without flush/clear.
- **12. E2E Tests, Frontend Unit Tests & Mocks:** Reviewed all 31 files (0 Critical, 5 High, 15 Medium, 23 Low, 4 Info). Key issues: BookingForm.test.tsx contains 4 tautological API-mock tests that never render BookingForm and stubs useForm validation; BookingCard.test.tsx uses local-OS timezone getters for Asia/Manila 24h cutoff tests and non-assertive typeof-boolean utility tests; utils.test.ts has a UTC+8 day-rollover bug in createManilaDateTimeFromUTC plus leftover debug tests; jest.setup.ts masks all React 'Warning:' console errors; useApi.ts and html5-qrcode.ts mocks have shared mutable state / missing Html5QrcodeScanner.render; tests/e2e suites rely on static string matching rather than runtime browser/component/DB execution, contain placeholder assert.ok(true) checks (T1-77, T1-78, T2-80), inline-duplicate regexes instead of testing emoji-detector.mjs, check 'lucide-users' instead of PascalCase Users (T4-04), and use unchecked indexOf slices that can pass vacuously.

---

## 1. Root, CI/CD, Docker, Scripts, Diagrams & Docs

This batch spans the repository root configuration, GitHub Actions CI/CD workflows, Docker Compose orchestration, verification scripts, architecture diagrams, simplified JPA reference entities, and project/QA documentation. Key systemic risks include broken CI-to-CD image deployment wiring and runtime `NEXT_PUBLIC_API_URL` misconfiguration in Docker, critical JPA/schema bugs in `docs/entity-simple/` (such as a global slot unique constraint and missing `@Builder.Default` / `@JdbcTypeCode` annotations), broken file paths in `scripts/verify_diagrams.mjs`, and widespread documentation drift across `README.md`, `how-to-run.md`, `DIAGRAMS/`, and `docs/`.

| Severity | Count | Key Themes |
|---|---:|---|
| **Critical** | 2 | Global slot unique constraint in `Booking.java` breaking `maxSlots` and rebooking; broken paths in `scripts/verify_diagrams.mjs` |
| **High** | 11 | Broken CD image deployment & missing `.env` ignores; runtime `NEXT_PUBLIC_*` & insecure `JWT_SECRET`/`DB_PASSWORD` defaults in `docker-compose.yml`/`README.md`/`how-to-run.md`; plaintext OAuth tokens & `UserDetails` entity exposure; unresolved blockers in `QA-REPORT.md`; hardcoded dev paths in `verify_diagrams.mjs` |
| **Medium** | 52 | Java 17 vs 21 mismatch; missing `@Builder.Default` / `@Version` / `@JdbcTypeCode` and deprecated `@Entity` classes in `entity-simple/`; diagram/QA/doc drift and broken Mermaid node links |
| **Low** | 27 | Unpinned CI actions, missing DB indexes, minor typos/draft markers, and stale planning docs |
| **Info** | 3 | Minor terminology alignment notes and standard Maven wrapper root-vs-backend invocation notes |

---

### `.env.example`
- **[Low]** (Lines 1-9): Omits several environment variables documented in `README.md` (lines 435-449) and `docker-compose.yml` (line 46), specifically `JWT_EXPIRATION`, `PORT`, and `NEXT_PUBLIC_API_URL`. + **Suggestion:** Add commented defaults for `JWT_EXPIRATION=2592000000`, `PORT=8080`, and `NEXT_PUBLIC_API_URL=http://localhost:8080/api`.

### `.gitattributes`
- **[Low]** (Line 1): `/mvnw text eol=lf` anchors only to the repository root `mvnw`, leaving `pretty-nails-backend/mvnw` (referenced in `README.md` line 291 and `how-to-run.md` line 120) without enforced LF line endings. + **Suggestion:** Change `/mvnw text eol=lf` to `**/mvnw text eol=lf` (and add `*.sh text eol=lf`).

### `.github/workflows/cd.yml`
- **[High]** (Lines 47-63): The `deploy` job runs `docker pull` on the ephemeral GitHub Actions runner (lines 47-52) and never uses those images, while the SSH script (lines 59-63) runs `docker compose pull && docker compose up -d --remove-orphans` on `/opt/prettynails`. Because `docker-compose.yml` defines `build:` without `image:` (lines 20-22, 42-44), `docker compose pull` will not pull the GHCR SHA-tagged images built by `ci.yml`, and the remote host never logs into `ghcr.io` or receives `steps.tag.outputs.tag`. + **Suggestion:** Add `image:` tags in `docker-compose.yml` parameterized by `IMAGE_TAG` (or pass `IMAGE_TAG=${{ steps.tag.outputs.tag }}` via SSH) and authenticate `docker login ghcr.io` on the target server before `docker compose pull`.
- **[High]** (Lines 20-28, 42-46): Missing top-level `permissions:` declaration (should be least-privilege `contents: read`, `packages: read`), and `workflow_dispatch` sets `tag=${{ github.sha }}` even though `ci.yml` only builds/pushes images on `push` to `main` (so dispatching from another branch or unbuilt commit will fail `docker pull`). + **Suggestion:** Declare explicit `permissions:` and validate/pass an explicit `image_tag` input on `workflow_dispatch` (or verify the manifest exists before SSHing).
- **[Medium]** (Lines 22, 49, 52): `IMAGE_NAME: ${{ github.repository }}` is not lowercased; Docker/GHCR rejects uppercase characters in repository/owner names. + **Suggestion:** Lowercase `github.repository` in a step (e.g., `echo "image=ghcr.io/${GITHUB_REPOSITORY,,}" >> $GITHUB_OUTPUT`).
- **[Low]** (Lines 30-58): Uses mutable major version tags (`actions/checkout@v4`, `appleboy/ssh-action@v1`) instead of pinned commit SHAs, and the SSH `script:` lacks `set -euo pipefail`, meaning a failed `cd /opt/prettynails` would run `docker compose` in `$HOME`. + **Suggestion:** Pin third-party actions to full commit SHAs and prepend `set -euo pipefail` to the SSH script.

### `.github/workflows/ci.yml`
- **[Medium]** (Lines 10-11, 91, 99): `IMAGE_NAME: ${{ github.repository }}` is not lowercased, which causes `docker/build-push-action` to fail if the GitHub owner or repo name contains uppercase letters. + **Suggestion:** Normalize the repository name to lowercase before passing `tags:` to `docker/build-push-action`.
- **[Medium]** (Lines 13-42): `backend-test` invokes system `mvn test` instead of `./mvnw test` (ignoring `.mvn/wrapper` version pinning), and `ci.yml` lacks a workflow-level least-privilege `permissions: contents: read` block for test jobs. + **Suggestion:** Add top-level `permissions: contents: read` and use `./mvnw test` (or verify `pretty-nails-backend/mvnw` permissions).
- **[Low]** (Lines 30-95): Actions are pinned to major tags (`@v4`, `@v5`) instead of commit SHAs, and `docker-build` only pushes `:${{ github.sha }}` without a `:latest` / branch tag or vulnerability scan (e.g., Trivy). + **Suggestion:** Pin actions to SHAs and consider adding image scanning before pushing.

### `.gitignore`
- **[High]** (Lines 47-50, 68): Standard `.env` files (`.env`, `.env.local`, `.env.production`, `pretty-nails-backend/.env`) are not ignored; line 48 only matches `*.local.env` and line 68 only matches `frontend/.env.local`. + **Suggestion:** Add `.env`, `.env.*`, and `!.env.example` to `.gitignore`.
- **[Medium]** (Line 25): `*.iml` is ignored, yet `app-dev-capstone.iml` is tracked in the repository. + **Suggestion:** Untrack `app-dev-capstone.iml` with `git rm --cached app-dev-capstone.iml`.
- **[Low]** (Line 62): Ignores `/backend/` instead of runtime directories under `pretty-nails-backend/` (such as `uploads/` referenced in `README.md` line 394). + **Suggestion:** Add `uploads/` and `pretty-nails-backend/uploads/` to `.gitignore`.

### `.java-version`
- **[Medium]** (Line 1): Specifies Java `21` (matching `ci.yml` line 34 and `README.md` line 60), whereas root `pom.xml` line 30 declares `<java.version>17</java.version>`. + **Suggestion:** Align `pom.xml` `<java.version>` to `21` (or update `.java-version` if 17 is intended).

### `DIAGRAMS/ActivityD-simple.txt`
- **[Info]** (Lines 10, 33, 61-63): Step `C7` describes scanning a "Completion QR Code via Mobile App" while `A5` displays a "Session QR Code"; elsewhere (`README.md` line 50, `QA-BACUS.md` Flow 20) the client is a Next.js web app and staff scan the customer's QR code. Align terminology if a single QR flow is finalized.

### `DIAGRAMS/ActivityD.txt`
- **[Medium]** (Lines 101-104, 368-373): In Flow 6 (Admin Availability Management), `A13_Avail -->|Delete| S61` routes to `S61` ("Insert or Update Availability") and `A13_Avail -->|View| S62` routes to `S62` ("DELETE /api/admin/availability/{id}"), while `S63` ("GET /api/admin/availability/{id}") is completely disconnected! + **Suggestion:** Fix lines 368-373 so `Delete` points to `S62` (`D29`) and `View` points to `S63` (`D30`).
- **[Medium]** (Lines 19, 63, 65, 67, 74, 76, 85, 87, 122, 125, 150-151, 170): Twelve+ node labels contain stray numeric disambiguation suffixes (`"View My Bookings 2"`, `"GET /api/availability 2"`, `"Fetch Availabilities 3"`, etc.). + **Suggestion:** Remove the trailing ` 2` / ` 3` suffixes from display labels (keeping unique node IDs).
- **[Low]** (Lines 24-27, 211-220): `A2["Update Booking Status"]` is never linked from `StartAdmin` (orphan entry node), and system endpoint labels (`PUT /api/admin/bookings/{id}/status`, `GET /api/admin/stats`) diverge from `README.md` (`/api/bookings/{id}/status`). + **Suggestion:** Connect `A2` or remove it, and reconcile endpoint paths with the actual controllers.

### `DIAGRAMS/ClassD-simple.txt`
- **[Medium]** (Lines 77-86, 134): `Availability` includes `staffId`, `dayOfWeek`, and `isRecurring` with `User "1" -- "0..*" Availability`, contradicting `ClassD.txt` (lines 106-116), `ERD.txt` (lines 117-127), and `docs/entity-simple/Availability.java` where `Availability` is date-based (`date`, `maxSlots`) with no `staffId` relation. + **Suggestion:** Update `Availability` in `ClassD-simple.txt` to match the date-based `Availability` model.
- **[Low]** (Lines 44-75, 118-125, 137-140): `BookingService` omits `serviceId`, `Service "1" *-- "1..*" ServiceVariant` disallows variant-less services, `CustomerNote` omits `adminId`, and monetary fields use `BigDecimal` while the JPA entities use `Integer` centavos. + **Suggestion:** Align field types (`Integer` centavos) and optional `0..*` variant multiplicity with `ClassD.txt`.

### `DIAGRAMS/ClassD.txt`
- **[Medium]** (Lines 709-710): Both `User "1" *-- "0..*" CustomerNote : notes` and `User "1" *-- "0..*" CustomerNote : adminNotes` use composition (`*--`), which is semantically invalid (a `CustomerNote` cannot have two composite lifecycle owners). + **Suggestion:** Use association/aggregation (`--` or `o--`) for `adminNotes`.
- **[Medium]** (Lines 205-208, 263-264, 288-340): `AdminController.getCustomers` (line 329) returns `Page<User>` (exposing the `User` entity directly), `AuthService`/`PaymentService` list duplicate overloaded signatures (`updateProfile`, `changePassword`, `createPayment`), and controller return types inconsistently mix `ResponseEntity<T>` with raw `List<T>`/`Page<T>`. + **Suggestion:** Return a `UserDto` (`Page<UserDto>`) instead of `User`, wrap controller responses consistently in `ResponseEntity`, and remove stale overloaded methods.
- **[Low]** (Lines 351-356): `SecurityConfig` omits `CorsConfigurationSource` while modeling `jwtAuthenticationFilter()`. + **Suggestion:** Add `corsConfigurationSource()` to `SecurityConfig` if configured there.

### `DIAGRAMS/Database-Schema-D.txt`
- **[Medium]** (Lines 240-256): Uses mandatory one-to-one (`bookings ||--|| payments` and `users ||--|| loyalty_cards`) instead of optional zero-or-one (`||--o|`), even though a booking may not have a payment yet and admin users do not necessarily have loyalty cards; lines 240 and 255 also retain stale `Many-to-Many via junction` comments. + **Suggestion:** Change lines 244 and 250 to `||--o|` and fix the comments on lines 240 and 255.
- **[Low]** (Lines 74, 121, 139, 1-220): Models `appointment_date`, `availabilities.date`, and `loyalty_cards.expires_at` as `TIMESTAMP` (date-only fields would be clearer as `DATE`), and includes 15 tables while omitting `notifications` and `audit_logs` defined in `ERD.txt`. + **Suggestion:** Clarify `DATE` vs `TIMESTAMP` and document why `notifications`/`audit_logs` are excluded.

### `DIAGRAMS/ERD.txt`
- **[Medium]** (Lines 102-115, 248-252): `Payment.verifiedBy` (line 111) is typed `String` instead of `UUID verifiedBy FK` and lacks the `User ||--o{ Payment : "verifiedPayments"` relationship (both explicitly asserted by `scripts/verify_diagrams.mjs` lines 521 and 533). + **Suggestion:** Change `String verifiedBy` to `UUID verifiedBy FK` (or remove the assertion in `verify_diagrams.mjs`) and add the verifier relationship.
- **[Medium]** (Lines 6, 150-162, 211-224): Defines 17 entities (including `Notification`, `AuditLog`, and fields such as `Booking.redeemLoyaltyReward`, `Payment.version`, `User.failedLoginAttempts`), whereas `Database-Schema-D.txt`, `README.md` (line 453), and `scripts/verify_diagrams.mjs` (line 550) expect 15 entities. + **Suggestion:** Reconcile the 15-entity vs 17-entity schema across `ERD.txt`, `Database-Schema-D.txt`, and `verify_diagrams.mjs`.
- **[Low]** (Lines 13-52): `User` contains `oauth2Provider` and `oauth2ProviderId` alongside a separate `Account` entity (`User ||--o{ Account`), duplicating OAuth provider linkage. + **Suggestion:** Standardize on `Account` for OAuth links or document why `User` keeps denormalized OAuth columns.

### `DIAGRAMS/README.md`
- **[Medium]** (Lines 5-27): Embeds `./IMAGES-of-Diagrams/*.drawio.png` images without linking to the Mermaid `.txt` sources in `DIAGRAMS/`, and completely omits `Database-Schema-D.txt` (`Database Schema Diagram`), `ActivityD.txt`, `ClassD.txt`, and `Use-Case-D.txt`. + **Suggestion:** Add links to the `.txt` Mermaid files (including `Database-Schema-D.txt`) and ensure all referenced `.drawio.png` renders are kept up to date.

### `DIAGRAMS/Use-Case-D-standAlone.txt`
- **[Medium]** (Lines 69, 34-40, 71-73): `UC_Redeem` ("Redeem Reward Voucher") extends `UC_Progress` ("Track Reward Progress") rather than `UC_Slot` (booking/checkout where vouchers are redeemed per `QA-BACUS.md` Flow 6), and `UC_Fav` ("Save / Favorite Nail Designs") / `UC_Filter` ("Filter Gallery by Style, Color & Shape") describe features absent from `ClassD.txt` and `ERD.txt`. + **Suggestion:** Align `UC_Redeem` with the booking flow and reconcile planned vs implemented gallery features.
- **[Low]** (Lines 47-61): `Customer` has no direct arrow to `UC_Filter` or `UC_Resched`, relying solely on `<<extend>>` from `UC_Gallery`/`UC_History`. + **Suggestion:** Verify intended UML entry points for secondary flows.

### `DIAGRAMS/Use-Case-D.txt`
- **[Medium]** (Lines 48, 80-121): Use-case numbering and subgraphs (`UC12` = View Public Gallery, `UC13` = Manage Gallery, `UC14` = View My Loyalty Card) are completely out of sync with `scripts/verify_diagrams.mjs` (lines 386-435, which expects `UC12`/`UC10` removed and `UC14` = View Public Gallery). Also line 120 comment (`View All Loyalty Cards extends/includes Redeem Stamps`) contradicts line 121 (`UC17 -.->|"<<extend>>"| UC16`). + **Suggestion:** Reconcile `Use-Case-D.txt` IDs and comments with `verify_diagrams.mjs` and the current feature set.
- **[Low]** (Lines 135-136): `classDef includeStyle` and `classDef extendStyle` are defined but never applied to any elements. + **Suggestion:** Apply or remove unused `classDef` declarations.

### `HELP.md`
- **[Low]** (Lines 1-32): Unedited Spring Initializr boilerplate referencing `com.appdev.app-dev-capstone` / `com.appdev.app_dev_capstone` and generic Spring guides rather than the actual `pretty-nails-backend` project. + **Suggestion:** Remove `HELP.md` or replace it with project-specific links.

### `README.md`
- **[High]** (Lines 380, 389-391): Documents a publicly visible base64 default `jwt.secret` fallback (`cHJldHR5bmFpbHMtc2VjcmV0LWtleS1mb3Itand0LXRva2VuLWdlbmVyYXRpb24tbXVzdC1iZS1hdC1sZWFzdC0yNTYtYml0cy1sb25n`). If deployed beyond the local prototype without overriding `JWT_SECRET`, tokens can be forged. + **Suggestion:** Require `JWT_SECRET` in non-local profiles (while keeping `admin` / `admin` documented as the prototype admin login).
- **[Medium]** (Lines 307, 390-391, 485): Contradicts itself on default admin credentials: lines 307 and 485 state `admin@prettynails.local` / `admin123`, whereas lines 390-391 show `admin` / `admin`. + **Suggestion:** Update lines 307 and 485 to `admin` / `admin` to match `DataSeeder` and the prototype login credentials.
- **[Medium]** (Lines 169-256): Documented API endpoints (e.g., `PUT /api/bookings/{id}/status`, `GET /api/gallery/admin`, `GET /api/loyalty/admin`) diverge from `DIAGRAMS/ActivityD.txt` (`/api/admin/bookings/{id}/status`, `/api/admin/gallery`, `/api/admin/loyalty`) and `docs/QA-AMBE.md` / `docs/QA-BACUS.md`. + **Suggestion:** Audit and synchronize the API reference table against the actual Spring Boot `@RequestMapping` annotations.
- **[Low]** (Lines 118, 453, 538, 612-614): Line 118 contains a stray non-English typo (`Public availability查询 for booking`), line 453 says `15 tables` while `ERD.txt` has 17 entities, line 538 calls `pom.xml` a multi-module parent POM (it has no `<modules>`), and lines 612-614 duplicate `For questions or issues, please open a GitHub issue.`. + **Suggestion:** Fix the typo, remove the duplicate line, and clarify root `pom.xml` vs `pretty-nails-backend/pom.xml`.

### `TEST_READY.md`
- **[Medium]** (Lines 8-35): The Coverage Summary claims `183` total tests across `19 Suites` (`80 + 80 + 14 + 9`), whereas the Feature Checklist below it lists 16 features whose Tier columns sum to `500` (`216 + 214 + 38 + 32`). + **Suggestion:** Recompute and align the checklist numbers and suite count with the actual test runner output.
- **[Medium]** (Lines 4, 31): References `node tests/e2e/run-all.mjs` and `R5.1 Prisma Seed Local Assets`, whereas this project uses Spring Boot / JPA / Flyway (not Prisma). + **Suggestion:** Update references to match the actual test runner path and JPA/Flyway seeding.

### `app-dev-capstone.iml`
- **[Medium]** (Lines 4-5): Points to `<sourceFolder url="file://$MODULE_DIR$/backend/src" isTestSource="false" />`, which is a stale path (actual backend is `pretty-nails-backend/`), and `.iml` files are listed in `.gitignore` line 25 (`*.iml`). + **Suggestion:** Remove `app-dev-capstone.iml` from version control (`git rm --cached app-dev-capstone.iml`).

### `docker-compose.yml`
- **[High]** (Lines 45-46): `NEXT_PUBLIC_API_URL: http://backend:8080/api` is supplied at container runtime rather than as a Docker `args:` build argument. In Next.js, `NEXT_PUBLIC_*` variables are baked into client bundles at `next build` time, and `http://backend:8080/api` is a Docker-internal hostname unreachable from a user's browser. + **Suggestion:** Pass `NEXT_PUBLIC_API_URL` via `build.args` (pointing to the browser-reachable public/localhost API URL) and/or configure Next.js rewrites for server-to-backend proxying.
- **[High]** (Lines 8, 12, 25-26): `JWT_SECRET: ${JWT_SECRET}` allows an empty/unset secret without failing fast (`:?`), `DB_PASSWORD` defaults to weak `postgres` (`${DB_PASSWORD:-postgres}`), and PostgreSQL binds `5432:5432` on all interfaces (`0.0.0.0`). + **Suggestion:** Require `JWT_SECRET` (`${JWT_SECRET:?JWT_SECRET is required}`), require `DB_PASSWORD` in production, and bind DB port to `127.0.0.1:5432:5432` (or omit host port exposure).
- **[Medium]** (Lines 1, 19-52): Uses obsolete `version: '3.8'` key (line 1) and lacks `image:` tags on `backend`/`frontend` (breaking `cd.yml`'s `docker compose pull`). + **Suggestion:** Remove `version: '3.8'` and add `image: ghcr.io/${GITHUB_REPOSITORY}-backend:${IMAGE_TAG:-latest}` (and `-frontend`).
- **[Medium]** (Lines 23-39): `backend` has no persistent volume for uploaded images (`/app/uploads`), so uploaded gallery/receipt files are lost on container replacement; also, the healthcheck (line 35) relies on `wget` and `/actuator/health`, which fails if `wget` is missing in the JRE image or Actuator is not enabled/exposed. + **Suggestion:** Mount a named volume for uploads and verify `wget`/curl and `/actuator/health` availability in the backend image.

### `docs/QA-AMBE.md`
- **[Medium]** (Lines 8, 19-224): QA expectations diverge substantially from the actual domain model and API: assumes `OWNER` role (`admin@test.com`), integer IDs (`101`, `102`), peso amounts (`800`, `400`), `refreshToken`, and unverified/different endpoints (`POST /api/bookings/102/cancel`, `POST /api/admin/availability/blocked`, `POST /api/admin/bookings/103/verify-deposit`, `GET /api/admin/audit-logs`, `POST /api/admin/notifications/send`). + **Suggestion:** Update QA flows to use UUID IDs, centavos/UI-formatted amounts, `CUSTOMER`/`ADMIN` roles, and the implemented API paths.
- **[Low]** (Lines 6, 277): Line 6 states `Total Flows: 10 | Total Steps: 50` while the document contains 20 flows and line 277 states `Total: 20 Flows × 5 Steps = 100 Verification Steps`. + **Suggestion:** Update line 6 to `Total Flows: 20 | Total Steps: 100`.

### `docs/QA-BACUS.md`
- **[Medium]** (Lines 8, 19-247): References `OWNER` role and numerous tables/endpoints absent from `ERD.txt`/`ClassD.txt`/`README.md` (`gallery_favorite`, `loyalty_voucher`, `gallery.style`/`color`/`shape`/`displayOrder`, `PUT /api/admin/gallery/reorder`, `PUT /api/admin/services/{id}/pricing-rules`, `GET /api/services/2/variants/3/price?shape=coffin`, `PUT /api/admin/loyalty/tiers`, `POST /api/admin/loyalty/scan`). + **Suggestion:** Align test cases with the implemented endpoints and database schema.
- **[Low]** (Lines 6, 277): Line 6 states `Total Flows: 10 | Total Steps: 50` while the document contains 20 flows and line 277 states `100 Verification Steps`. + **Suggestion:** Update line 6 to `Total Flows: 20 | Total Steps: 100`.

### `docs/QA-REPORT.md`
- **[High]** (Lines 90-104, 134-140, 154-158, 190-196, 321): Records multiple critical production blockers—Gallery `lower(bytea)` 500 errors, `@CreationTimestamp` returning `null` on `Gallery`/`Availability` creates, missing auto-stamp issuance on booking completion, and customer login failures—yet concludes with `Overall Result: CONDITIONAL PASS`. + **Suggestion:** Keep release status as `FAIL / BLOCKED` until all `CRITICAL`/`HIGH` defects are verified resolved.
- **[Medium]** (Lines 6, 12, 16-18, 52-185, 248): States `Spring Boot 3.4.0` on line 6 vs `Spring Boot 4.1.2` on line 12; summary claims `40` flows (`32 Passed, 8 Failed, 0 Blocked`) while tables list many flows as `NOT TESTED` or `Blocked`; line 248 misspells `booking_services` as `bookings_services`. + **Suggestion:** Reconcile reported totals and Spring Boot version accurately.
- **[Medium]** (Lines 284-286): Remediation item #1 suggests using `@Lob` for PostgreSQL `TEXT` columns (which in Hibernate/PostgreSQL causes `oid`/`bytea` issues rather than fixing them), and item #2 suggests Hibernate's removed/deprecated `@Generated(value = GenerationTime.INSERT)`. + **Suggestion:** Recommend `@Column(columnDefinition = "TEXT")` (without `@Lob`) or `@JdbcTypeCode(SqlTypes.VARCHAR)`, and fix root timestamp initialization via `@PrePersist` or standard JPA auditing.

### `docs/entity-assignment.md`
- **[Medium]** (Lines 60-144): Early specification conflicts with `docs/entity-simple/`, `ERD.txt`, and `README.md`: specifies `Long` IDs, `OWNER` role, `FACEBOOK`/`GOOGLE` enums, `customerId`/`totalAmount`/`downpaymentProofUrl`/`stampType`, and feature-based packages (`com.prettynails.booking`, `loyalty`, `gallery`, `shared`) instead of `String` UUIDs and layered packages (`controller`, `service`, `entity`, `repository`). + **Suggestion:** Mark as historical/superseded or update to match current entity fields and packages.

### `docs/entity-simple/Account.java`
- **[High]** (Lines 40-44, 52-53): `accessToken`, `refreshToken`, and `idToken` are stored as plaintext `TEXT` columns without an attribute converter (`@Convert`) for encryption at rest or `@JsonIgnore` / `@ToString.Exclude` to prevent accidental serialization/logging. + **Suggestion:** Encrypt OAuth tokens at rest using a JPA `AttributeConverter` and annotate token fields with `@JsonIgnore` and `@ToString.Exclude`.
- **[Medium]** (Lines 28-29, 58-60): Dual mapping of writable `userId` alongside read-only `@ManyToOne User user` (`insertable = false, updatable = false`) without a database index on `user_id` can cause in-memory association staleness and slow user account lookups. + **Suggestion:** Add `@Index(name = "idx_account_user_id", columnList = "user_id")` on `@Table`.

### `docs/entity-simple/AuditLog.java`
- **[Medium]** (Lines 16-23): Marked `@Deprecated` yet still annotated with `@Entity` and `@Table(name = "audit_logs")`, causing JPA/Hibernate (`ddl-auto: update`) to scan and maintain an unused table. + **Suggestion:** Remove `@Entity`/`@Table` from deprecated reference classes or move them out of entity component scanning.
- **[Low]** (Lines 39, 61-65): Stores PII (`userEmail`, `ipAddress`, `userAgent`) in plaintext without a retention/purging policy. + **Suggestion:** Document retention or anonymization rules if `AuditLog` is re-enabled.

### `docs/entity-simple/Availability.java`
- **[Medium]** (Lines 20, 31-41): `@Builder` ignores Java field default initializers (`isAvailable = true`, `startTime = "08:00"`, `endTime = "22:00"`, `maxSlots = 4`) unless `@Builder.Default` is present; calling `Availability.builder().date(...).build()` leaves them `null` and violates `nullable = false`. + **Suggestion:** Annotate each initialized field with `@Builder.Default`:
```java
@Builder.Default
@Column(name = "is_available", nullable = false)
private Boolean isAvailable = true;
```
- **[Medium]** (Lines 28-29): `date` is typed as `LocalDateTime` (`// time component ignored`) with `@UniqueConstraint(columnNames = {"date"})`. Any non-zero time component allows duplicate rows for the same calendar day or timezone mismatch. + **Suggestion:** Change `date` to `java.time.LocalDate`.

### `docs/entity-simple/Booking.java`
- **[Critical]** (Line 16): `@Table(name = "bookings", uniqueConstraints = @UniqueConstraint(name = "uk_booking_slot_active", columnNames = {"appointment_date", "start_time"}))` enforces a global 1-booking uniqueness per `(appointment_date, start_time)` regardless of `status`. This breaks `Availability.maxSlots` (cannot have >1 concurrent booking) and permanently blocks a time slot from ever being rebooked after a booking is `CANCELLED` or `NO_SHOW`. + **Suggestion:** Drop the unconditional `UniqueConstraint` (or use a Flyway partial unique index `WHERE status NOT IN ('CANCELLED', 'NO_SHOW')` if single-slot) and enforce `maxSlots` capacity via transactional locking (`PESSIMISTIC_WRITE` on `Availability`).
- **[Medium]** (Lines 21, 32-33, 47-48, 66-73): `@Builder` omits `@Builder.Default` on `status = "PENDING"` and `downpayment = 10000` (causing `NOT NULL` failures when building), and leaves `services` / `loyaltyStamps` lists uninitialized (`null`). + **Suggestion:** Add `@Builder.Default` to `status`, `downpayment`, and initialize `services = new ArrayList<>()` / `loyaltyStamps = new ArrayList<>()`.
- **[Medium]** (Lines 35-36, 22): `appointmentDate` uses `LocalDateTime` ("time component ignored") instead of `LocalDate`, and `Booking` lacks `@Version` optimistic locking for concurrent status updates. + **Suggestion:** Use `LocalDate` for `appointmentDate` and add `@Version private Long version;`.

### `docs/entity-simple/BookingService.java`
- **[Medium]** (Lines 20, 37-38): `@Builder` lacks `@Builder.Default` on `quantity = 1`, resulting in `null` quantity (`nullable = false`) when constructed via `BookingService.builder()`. + **Suggestion:** Add `@Builder.Default` to `quantity`.
- **[Low]** (Lines 28-35): `variantName` is stored as a `length = 20` string (risking truncation for longer variant names) rather than a `variantId` FK (`ERD.txt` line 95), and `@Table` lacks indexes on `booking_id` and `service_id`. + **Suggestion:** Add indexes on `booking_id` and `service_id` and increase `variantName` length or link `ServiceVariant`.

### `docs/entity-simple/CustomerNote.java`
- **[Medium]** (Lines 15, 28-35): Lacks `@Table` indexes on `user_id` and `admin_id` for customer note queries, and lacks Bean Validation (`@NotBlank`, `@Size`) on `content`. + **Suggestion:** Add indexes on `user_id` and `admin_id` and `@NotBlank` validation on `content`.

### `docs/entity-simple/Gallery.java`
- **[Medium]** (Lines 20, 40-41): `@Builder` omits `@Builder.Default` on `isActive = true`, causing `null` -> `NOT NULL` constraint failures with `Gallery.builder()`. + **Suggestion:** Add `@Builder.Default` to `isActive`.
- **[Low]** (Lines 15, 34-38): Missing DB indexes on `(is_active, category)`, and line 35 comment (`stored in S3/cloudinary`) conflicts with local upload storage in `README.md`. + **Suggestion:** Add `@Index` for `is_active` and `category` and update the comment.

### `docs/entity-simple/LoyaltyCard.java`
- **[Medium]** (Lines 21, 32-33, 54-55): `@Builder` omits `@Builder.Default` on `stampCount = 0`, and `stamps` list is uninitialized (`null`). + **Suggestion:** Add `@Builder.Default` to `stampCount` and initialize `stamps = new ArrayList<>()`.
- **[Medium]** (Lines 22, 38-39): Lacks `@Version` optimistic locking on `stampCount` (exposing stamp additions/redemptions to lost-update race conditions), and `expiresAt` is `nullable = false` without `@PrePersist` or default initialization. + **Suggestion:** Add `@Version private Long version;` and initialize `expiresAt` in `@PrePersist` if null.

### `docs/entity-simple/LoyaltyStamp.java`
- **[Medium]** (Lines 15, 28-32): No unique constraint on `(card_id, booking_id)` (or `booking_id`), allowing duplicate stamps to be credited for the same booking under concurrent requests/QR scans. + **Suggestion:** Add a unique constraint (or partial unique index where `booking_id IS NOT NULL`) and an index on `card_id`.
- **[Low]** (Lines 21-44): Omits `source` and `amount` columns present in `ERD.txt` (lines 144-145) and `ClassD.txt` (lines 133-134). + **Suggestion:** Align fields with `ERD.txt` / `ClassD.txt`.

### `docs/entity-simple/Notification.java`
- **[Medium]** (Lines 16-17, 32-34): Annotated as `@Deprecated` yet still marked `@Entity` (creating an unused `notifications` table), and `id` lacks `@GeneratedValue(strategy = GenerationType.UUID)` unlike all other entities. + **Suggestion:** Remove `@Entity` if deprecated, or add `@GeneratedValue(strategy = GenerationType.UUID)` if active.
- **[Medium]** (Lines 29, 55-59): `@Builder` omits `@Builder.Default` on `priority = 2` and `read = false`, causing `NOT NULL` constraint violations on `read`. + **Suggestion:** Add `@Builder.Default` to `priority` and `read`.

### `docs/entity-simple/Payment.java`
- **[Medium]** (Lines 20, 37-38): `@Builder` omits `@Builder.Default` on `status = "PENDING"`, causing `NOT NULL` constraint failures with `Payment.builder()`. + **Suggestion:** Add `@Builder.Default` to `status`.
- **[Medium]** (Lines 28-29, 43-44, 61-63): Uses `@ManyToOne` on a `unique = true` `booking_id` column (inconsistent with `@OneToOne` on `Booking.java` line 69); lacks `@Version` optimistic locking for concurrent payment verification/refunds and lacks uniqueness on `reference` to prevent receipt reference reuse. + **Suggestion:** Switch to `@OneToOne(fetch = FetchType.LAZY)`, add `@Version`, and enforce unique/scoped `reference` validation.

### `docs/entity-simple/Service.java`
- **[Medium]** (Lines 21, 44-48): `variantsJson` specifies `columnDefinition = "JSONB"` on a `String` without `@JdbcTypeCode(SqlTypes.JSON)` (unlike `AuditLog.java` line 57), which fails in Hibernate 6+/PostgreSQL (`column "variants_json" is of type jsonb but expression is of type character varying`); also `@Builder` lacks `@Builder.Default` on `isActive = true`. + **Suggestion:** Add `@JdbcTypeCode(SqlTypes.JSON)` (or map a structured type) and `@Builder.Default` on `isActive`.
- **[Low]** (Lines 59-60): `CascadeType.ALL, orphanRemoval = true` on `Service.bookings` would delete historical `BookingService` line items if a `Service` is deleted, and `bookings` is uninitialized. + **Suggestion:** Remove `CascadeType.ALL`/`orphanRemoval` on `Service -> BookingService` (prefer soft-delete via `isActive = false`).

### `docs/entity-simple/ServiceVariant.java`
- **[Medium]** (Lines 15-17, 33-34): Marked `@Deprecated` yet still annotated `@Entity` (`service_variants`), and `name` length is `20` vs `50` in `Database-Schema-D.txt` line 61. + **Suggestion:** Remove `@Entity` if `ServiceVariant` is deprecated in favor of `variantsJson`, or align column lengths if active.

### `docs/entity-simple/Session.java`
- **[Low]** (Lines 15, 28-35): Stores `sessionToken` in plaintext (a DB read leak compromises active sessions) and lacks indexes on `user_id` and `expires` for lookup/cleanup queries. + **Suggestion:** Store a SHA-256 hash of `sessionToken` and add indexes on `user_id` and `expires`.

### `docs/entity-simple/Setting.java`
- **[Low]** (Lines 28-32): Column name `key` is a reserved keyword in SQL (requiring quoting in native queries) and `value` lacks size/type constraints. + **Suggestion:** Quote or rename column to `setting_key` if writing native SQL, and validate values in the service layer.

### `docs/entity-simple/User.java`
- **[High]** (Lines 26, 39-40, 66-86, 114-117): Implementing `UserDetails` directly on the `@Entity` `User` without `@JsonIgnore` on `password`, `getAuthorities()`, and lazy `@OneToMany` collections (`accounts`, `sessions`, `bookings`, `loyaltyCard`, `notes`, `adminNotes`, `payments`) risks leaking `password` hashes, infinite JSON recursion, or `LazyInitializationException` if `User` is ever returned by a controller (as depicted in `ClassD.txt` line 329). Additionally, `isEnabled()` returns `emailVerified != null`, which blocks seeded admin accounts or OAuth users if `emailVerified` is not explicitly set. + **Suggestion:** Annotate `password` and entity collections with `@JsonIgnore` / `@ToString.Exclude`, always map to `UserDto` in controllers, and ensure seeded/OAuth users set `emailVerified` (or separate `enabled` flag).
- **[Medium]** (Lines 25, 51-52, 78-79): `@Builder` omits `@Builder.Default` on `role = "CUSTOMER"` (causing `NOT NULL` violations), and line 79 comment `// Notes written by this customer` contradicts `CustomerNote.java` line 29 (`the customer this note is about`). + **Suggestion:** Add `@Builder.Default` to `role` and fix the Javadoc comment on `notes`.

### `docs/entity-simple/VerificationToken.java`
- **[Medium]** (Lines 14, 30-31): Stores `token` in plaintext (allowing password reset/email verification hijack if the DB is read) and defines a redundant `@UniqueConstraint(columnNames = {"identifier", "token"})` when `token` itself already has `unique = true` (line 30). + **Suggestion:** Store a cryptographic hash (e.g., SHA-256) of the token and remove the redundant composite unique constraint.

### `docs/list-of-pages.md`
- **[Low]** (Lines 4-28, 32): Contains unfinished template markers (`-` at the end of every line, timestamp `nov 13, 2026, 12pm` on line 4) and omits auth/account recovery routes documented in `README.md` (`/verify-email`, `/reset-password`, `/forgot-password`). + **Suggestion:** Clean up placeholder dashes and add all implemented auth routes.

### `how-to-run.md`
- **[High]** (Lines 87-99, 130, 210, 219, 228, 298): Omits `JWT_SECRET` from startup instructions (even though `QA-REPORT.md` line 29 notes startup required `JWT_SECRET` or falls back to a known default), and provides a `TRUNCATE TABLE ... CASCADE` command across all `public` tables that also wipes `flyway_schema_history`, breaking Flyway migrations on subsequent startups. (Note: `admin` / `admin` is the intended prototype admin credential; `README.md` lines 307/485 should be aligned to `admin` / `admin`.) + **Suggestion:** Document `JWT_SECRET` setup and exclude `flyway_schema_history` from the `TRUNCATE` query (`AND tablename != 'flyway_schema_history'`).
- **[Medium]** (Lines 84-112): Step 1 (lines 88, 92, 96) instructs running `./mvnw spring-boot:run` before Step 2 (line 111) tells the user to `cd pretty-nails-backend`; running `./mvnw spring-boot:run` from the repo root targets the empty root `pom.xml` instead of the backend application. + **Suggestion:** Add `cd pretty-nails-backend` in Step 1 before running `./mvnw spring-boot:run`.
- **[Low]** (Line 281): Contains an unfinished placeholder heading `### 4. Skip`. + **Suggestion:** Remove the placeholder section.

### `mvnw`
- **[Info]** (Lines 1-295): Standard Apache Maven Wrapper 3.3.4 POSIX shell script. Note that running `./mvnw` at the repository root targets the root `pom.xml` stub rather than `pretty-nails-backend/pom.xml`.

### `mvnw.cmd`
- **[Info]** (Lines 1-189): Standard Apache Maven Wrapper 3.3.4 Windows batch/PowerShell script. Same note regarding root `pom.xml` vs `pretty-nails-backend/pom.xml`.

### `pom.xml`
- **[Medium]** (Lines 11-31): Declares `<java.version>17</java.version>` (conflicting with `.java-version` `21`, `ci.yml`, and `README.md`), acts as a standalone Spring Boot JAR stub (`com.appdev:app-dev-capstone`) instead of a multi-module `<packaging>pom</packaging>` parent for `pretty-nails-backend`, and retains empty Initializr override tags (`<name/>`, `<license/>`, `<developer/>`, `<scm/>`). + **Suggestion:** Either configure it as a real multi-module parent POM (`<packaging>pom</packaging>`, `<modules><module>pretty-nails-backend</module></modules>`) with Java `21`, or remove the unused root stub/wrapper to avoid running the wrong project.

### `scripts/verify_diagrams.mjs`
- **[Critical]** (Lines 182-188, 546, 550): Hardcodes non-existent diagram filenames (`DIAGRAMS/database-schema-diagram.txt`, `DIAGRAMS/activity-diagram.txt`, `DIAGRAMS/use-case-diagram.txt`, `DIAGRAMS/class-diagram.txt`) instead of the actual files (`Database-Schema-D.txt`, `ActivityD.txt`, `Use-Case-D.txt`, `ClassD.txt`), and checks `backend/src/main/java/com/prettynails/entity` instead of `pretty-nails-backend/...`, causing the script to fail immediately. + **Suggestion:** Update `diagramFiles` and `jpaDir` to match the actual repository paths (or add CLI/path discovery).
- **[High]** (Lines 31-32, 63-65): Hardcodes developer-specific absolute paths under `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/node_modules/...` for `jsdom` and `mermaid`, making the script non-portable across developer machines and CI. + **Suggestion:** Declare `jsdom` and `mermaid` in a `package.json` (or `frontend/package.json`) and resolve via standard module imports only.
- **[Medium]** (Lines 303, 314-318, 385-435, 521, 533): Asserts outdated/mismatched rules against `Use-Case-D.txt` (`UC12` removed, `UC14` View Public Gallery) and `ERD.txt` (`UUID verifiedBy FK`, `verifiedPayments`), and its regex edge parser (`split('-->')`, `^([A-Za-z0-9_]+)\[`) ignores `-.->`, `---`, and `()`/`{}` node shapes. + **Suggestion:** Sync assertions with the canonical diagrams and use Mermaid's parsed AST/parser output instead of brittle regexes.

### `standalone-admin-features.md`
- **[Low]** (Lines 1-23): Early module breakdown mentions features not reflected in the current system docs/diagrams (e.g., line 8 "customer blocking", line 11 "Staff/cashier QR scanner" vs customer QR scan in `ActivityD.txt`, line 12 "₱500 and ₱1000 rules"). + **Suggestion:** Mark as a planning archive or update to match current behavior.

### `standalone-user-features.md`
- **[Low]** (Lines 1-32): Early planning doc conflicts with the implemented stack and docs (e.g., line 25 "Facebook/Gmail login", line 21 "Favoriting/saving designs", line 26 "Appointment, Stamp" entity names, and line 27 "no emojis" while `README.md` line 3 uses `💅`). + **Suggestion:** Mark as a planning archive or align with `README.md` and `DIAGRAMS/`.

---

## 2. Frontend Configuration, Lib, Hooks, Types & App Shell

This section covers 34 frontend configuration, build, app-shell, middleware, hook, utility, validation, and TypeScript definition files. The most severe issues are a misplaced Next.js middleware (`src/app/middleware.ts` instead of `src/middleware.ts`) that completely disables server-side route protection alongside unverified JWT decoding, a Docker build failure caused by missing `output: 'standalone'` in `next.config.js`, and functional/pricing bugs in `useBooking.ts` and Manila timezone helpers in `utils.ts`.

| Severity | Count | Key Themes |
| --- | ---: | --- |
| **Critical** | 1 | Misplaced `src/app/middleware.ts` disables all Next.js route protection |
| **High** | 7 | Unverified JWT/exp in middleware, missing `standalone` output & hardcoded localhost rewrite, `useBooking` variant/catalog bugs, Manila date parsing bugs |
| **Medium** | 24 | Open redirect & `/staff/scanner` routing bug, 401 redirect on `/auth/me`, missing CSRF/error logging/a11y focus contrast, `useQuery` race condition, weak `changePasswordSchema`, unsafe image/URL checks, weak DTO typing |
| **Low** | 27 | Stale docs (`CLAUDE.md`, `filemap.md`), duplicated helpers/constants across `utils.ts`/`constants.ts`/`types/api.ts`, `tsconfig` test scoping, minor edge-case bugs |
| **Info** | 12 | Redundant pnpm allowlist files, unused env/config fields, barrel exports, minor style/tooling notes |

---

### `frontend/.dockerignore`

- **[Low]** (Lines 38-42): Only specific `.env` filenames (`.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`) are excluded; other environment files such as `.env.production` or `.env.staging` would be copied into the Docker build context. **Suggestion:** Ignore all env files by default and explicitly allow templates if needed:
  ```gitignore
  .env*
  !.env.example
  ```

---

### `frontend/.env.local`

- **[Low]** (Lines 1-5): `.env.local` is committed to the repository (and tracked in `frontend/filemap.md`) rather than providing an `.env.example` template, which risks exposing local developer overrides or secrets if added later. **Suggestion:** Rename to `.env.example` in version control and ensure `.env.local` is gitignored.
- **[Info]** (Line 2): `NEXT_PUBLIC_API_URL` is defined here (`http://localhost:8080/api`) but is unused by `src/lib/api.ts` (which reads `NEXT_PUBLIC_API_BASE`) and `next.config.js` (which hardcodes `http://localhost:8080/api/:path*`).

---

### `frontend/.eslintrc.json`

- **[Info]** (Lines 1-6): Extends only `next/core-web-vitals` without TypeScript-ESLint rules or Prettier integration (`eslint-config-prettier`), and disables `react/no-unescaped-entities` globally.

---

### `frontend/.npmrc`

- **[Info]** (Line 1): `allow-builds=@parcel/watcher` duplicates the `@parcel/watcher` build allowlist already specified in `frontend/package.json` (`pnpm.approvedBuilds`) and `frontend/pnpm-workspace.yaml` (`allowBuilds`). Consolidate to the single configuration mechanism expected by your `pnpm` version.

---

### `frontend/CLAUDE.md`

- **[Low]** (Lines 24, 41, 43-44): Documentation contradicts the actual implementation: it references `lib/auth.ts` (actual file is `src/lib/auth.tsx`), claims tokens are stored in `localStorage` and attached by JWT interceptors (whereas `src/lib/api.ts` uses `withCredentials: true` with `httpOnly` cookies), and cites `middleware.ts` without noting its broken location at `src/app/middleware.ts`. **Suggestion:** Update `CLAUDE.md` to document cookie-based auth, `src/lib/auth.tsx`, and the corrected `src/middleware.ts` path.

---

### `frontend/Dockerfile`

- **[High]** (Lines 15, 21): Copies `/app/.next/standalone` and runs `ENTRYPOINT ["node", "server.js"]`, which will fail the Docker build because `frontend/next.config.js` does not configure `output: 'standalone'`. **Suggestion:** Add `output: 'standalone'` to `frontend/next.config.js`.
- **[Medium]** (Lines 19-20): `HEALTHCHECK` probes `http://localhost:3000`. In Next.js standalone containers, `server.js` binds to `process.env.HOSTNAME`, which Docker often sets to the container ID, causing `localhost:3000` healthchecks to fail. **Suggestion:** Add `ENV HOSTNAME="0.0.0.0"` in the `runner` stage before `ENTRYPOINT`.
- **[Low]** (Lines 5, 10-12): `ENV NEXT_TELEMETRY_DISABLED=1` is omitted in both stages, and `--ignore-scripts` in `pnpm install` will skip optional native build steps if native dependencies (such as `sharp`) are introduced.

---

### `frontend/filemap.md`

- **[Low]** (Lines 11, 159, 164, 171-175): The file map is out of date—it lists `eslint.config.js` (actual: `.eslintrc.json`), `lib/auth.ts` (actual: `src/lib/auth.tsx`), nonexistent `hooks/useAuth.ts`, `contexts/AuthContext.tsx`, and `src/styles/globals.css`, while omitting `error.tsx`, `global-error.tsx`, `lib/upload.ts`, `lib/site-config.ts`, `Dockerfile`, and `jest.config.js`. **Suggestion:** Regenerate or update `filemap.md` to match the actual tree.

---

### `frontend/jest.config.js`

- **[Medium]** (Lines 41-43): Enabling `resetMocks: true` alongside `clearMocks: true` and `restoreMocks: true` wipes the implementations and return values of every `jest.fn()` before each test, which can silently break module-level mock defaults in `src/jest.setup.ts` or `src/__mocks__/*`. **Suggestion:** Remove `resetMocks: true` (or keep only `clearMocks: true` and `restoreMocks: true`) unless tests explicitly re-stub every mock in `beforeEach`.
- **[Low]** (Lines 36-37): `forceExit: true` masks leaked timers/sockets instead of failing cleanly, while `detectOpenHandles: true` adds overhead to every test run. **Suggestion:** Fix underlying open handles and remove `forceExit: true`.

---

### `frontend/next-env.d.ts`

**Status:** Clean — no issues found.

---

### `frontend/next.config.js`

- **[High]** (Lines 2-24): Missing `output: 'standalone'`. Without this option, Next.js does not generate `.next/standalone` or `server.js`, breaking `frontend/Dockerfile` lines 15 and 21. **Suggestion:** Add `output: 'standalone'` to `nextConfig`.
- **[High]** (Lines 16-23): `rewrites()` hardcodes `destination: 'http://localhost:8080/api/:path*'`, which fails in Docker or multi-host deployments where the backend runs on another host/service, and ignores `.env.local`'s `NEXT_PUBLIC_API_URL`. **Suggestion:** Read the target origin from a server-side env var:
  ```js
  const backendOrigin = process.env.BACKEND_URL || 'http://localhost:8080';
  return [{ source: '/api/backend/:path*', destination: `${backendOrigin}/api/:path*` }];
  ```
- **[Medium]** (Lines 5-9): `images.remotePatterns` permits `{ protocol: 'https', hostname: '**' }`, allowing arbitrary third-party HTTPS hosts to be fetched and resized through `/_next/image` (SSRF-adjacent amplification / resource exhaustion risk). **Suggestion:** Restrict `hostname` to trusted image/CDN domains.
- **[Low]** (Lines 2-24): No HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) are configured via `async headers()`. **Suggestion:** Add standard baseline security headers in `nextConfig`.

---

### `frontend/package.json`

- **[Medium]** (Lines 38, 46-47, 52): Major version mismatch between `jest` / `jest-environment-jsdom` (`^30.5.2`), `@types/jest` (`^30.0.0`), and `ts-jest` (`^29.4.15`). `ts-jest@29` targets Jest 29, risking peer dependency conflicts and runtime incompatibilities. **Suggestion:** Align `jest`, `jest-environment-jsdom`, `@types/jest`, and `ts-jest` on the same major version.
- **[Low]** (Lines 14-15): `test` and `test:watch` scripts use Unix-specific inline `NODE_OPTIONS='--max-old-space-size=4096'` syntax, which fails on Windows shells. **Suggestion:** Use `cross-env` if cross-platform developer support is desired.
- **[Info]** (Lines 5-7, 24, 44): `pnpm.approvedBuilds` duplicates `.npmrc` and `pnpm-workspace.yaml` (and `pnpm` normally uses `onlyBuiltDependencies`); `next` and `eslint-config-next` are pinned to `14.2.5`—keep `next` updated to the latest `14.2.x` patch release.

---

### `frontend/pnpm-workspace.yaml`

- **[Info]** (Lines 1-2): Defines `allowBuilds` without a `packages` key and duplicates the `@parcel/watcher` setting already present in `.npmrc` and `package.json`.

---

### `frontend/postcss.config.js`

**Status:** Clean — no issues found.

---

### `frontend/prettier.config.js`

**Status:** Clean — no issues found.
- **[Info]**: `package.json` has no `format` or `format:check` script to enforce Prettier formatting in CI.

---

### `frontend/src/app/error.tsx`

- **[Low]** (Lines 32-38): The "Return to Studio" button uses `onClick={() => window.location.href = '/'}`, forcing a full page reload and performing an assignment inside an expression arrow function. **Suggestion:** Prefer `<Link href="/">` or `useRouter().push('/')` (or `window.location.assign('/')` if a hard reset is intentional).

---

### `frontend/src/app/global-error.tsx`

- **[Medium]** (Lines 6-13): Unlike `error.tsx`, `GlobalError` never logs or reports the caught `error` (no `useEffect` logging or error reporter), silently dropping critical root-level failures. **Suggestion:** Add a `useEffect(() => { console.error(error); }, [error]);` hook (or telemetry call).
- **[Low]** (Lines 14-20): Replaces the root layout without importing `./globals.css` or applying font CSS variables (`--font-sans`, `--font-serif`), and renders `<html lang="en">` without preserving dark mode class state, causing degraded/unstyled fallback rendering if CSS is not yet cached. **Suggestion:** Import `./globals.css` or use minimal self-contained inline/system styles.

---

### `frontend/src/app/globals.css`

- **[Medium]** (Lines 107-117): `:focus-visible` and `input:focus, textarea:focus, select:focus` use `outline-none` paired with a very faint `ring-1 ring-rose-800/30`. Removing the native outline breaks focus visibility in Windows High Contrast / `forced-colors` mode, and `30%` opacity 1px rings fail WCAG non-text contrast guidelines; applying `outline-none` on `:focus` also overrides `:focus-visible` behavior. **Suggestion:** Replace `outline-none` with `outline-transparent` (or `focus-visible:outline-2`), increase ring contrast/width (`ring-2 ring-primary/70`), and scope form element rules to `:focus-visible`.
- **[Low]** (Lines 120-148): `.animate-dropdown-enter` and `.animate-dropdown-exit` lack a `@media (prefers-reduced-motion: reduce)` rule for users sensitive to motion. **Suggestion:** Disable or shorten the animations inside `@media (prefers-reduced-motion: reduce)`.
- **[Low]** (Lines 91-104): Custom scrollbar styles only target `::-webkit-scrollbar`, leaving Firefox on default scrollbars. **Suggestion:** Add standard `scrollbar-width: thin` and `scrollbar-color` rules.

---

### `frontend/src/app/layout.tsx`

- **[Low]** (Lines 79-82): Manually renders `<head>` with `<link rel="preconnect">` tags for `fonts.googleapis.com` and `fonts.gstatic.com`. Because `Instrument_Sans` and `Newsreader` are loaded via `next/font/google`, Next.js self-hosts the fonts at build time and never fetches from Google Fonts at runtime; manually rendering `<head>` in App Router `RootLayout` is also discouraged. **Suggestion:** Remove lines 79-82.
- **[Low]** (Lines 21-60): `metadata.openGraph.images` and `metadata.twitter.images` use relative paths (`/images/og-image.jpg`) without setting `metadataBase`, causing Next.js to resolve social preview URLs against `http://localhost:3000` in production builds. **Suggestion:** Set `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://prettynails.ph')` on `metadata`.
- **[Info]** (Line 78): `suppressHydrationWarning` is set on `<html>`, though no theme script or theme provider is mounted in `RootLayout`.

---

### `frontend/src/app/middleware.ts`

- **[Critical]** (Lines 1-71): **Middleware is placed in the wrong directory (`src/app/middleware.ts`).** Next.js App Router only executes middleware located at `src/middleware.ts` (sibling to `src/app/`). Because this file lives inside `src/app/`, Next.js ignores it completely—leaving `/my-bookings`, `/loyalty`, `/profile`, and `/admin` completely unprotected at the edge. **Suggestion:** Move the file to `frontend/src/middleware.ts`.
- **[High]** (Lines 8-30, 37-62): **Unverified JWT decoding and missing `exp` check.** `decodeJwtPayload` base64-decodes the payload without verifying the JWT signature (`// Decode JWT payload (without verification)`) and never checks the `exp` claim, while route guards only test `if (!token)` / `if (token)`. Anyone can craft a cookie `prettynails_token=a.eyJyb2xlIjoiQURNSU4ifQ.c` to pass middleware checks, and expired tokens will pass middleware and bounce in client calls. **Suggestion:** Cryptographically verify the JWT and expiration in Edge Runtime using `jose` (`jwtVerify`) and redirect/clear invalid cookies:
  ```ts
  const { payload } = await jwtVerify(token, secretKey);
  ```
- **[Medium]** (Lines 39-42): **Open redirect vulnerability.** `const redirectTo = ... request.nextUrl.searchParams.get('redirect') || '/'` is passed directly to `new URL(redirectTo, request.url)`. A crafted link like `/login?redirect=https://evil.com` or `?redirect=//evil.com` redirects authenticated users to an external domain. **Suggestion:** Validate that `redirectTo` is a safe internal path (`redirectTo.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.startsWith('/\\')`).
- **[Medium]** (Lines 4, 32-43): `/staff/scanner` is grouped into `PUBLIC_ROUTES` alongside `/login` and `/register`. Because lines 37-43 redirect any request with a `token` away from `PUBLIC_ROUTES`, authenticated staff or `ADMIN` users visiting `/staff/scanner` are bounced away to `/admin` or `/`, while unauthenticated users can access `/staff/scanner` freely. **Suggestion:** Separate auth-redirect routes (`['/login', '/register']`) from `/staff/scanner` and enforce staff/admin authorization on `/staff/scanner`.
- **[Low]** (Lines 67-71): `matcher` excludes `favicon.ico` and `images`, but does not exclude `site.webmanifest`, `favicon-16x16.png`, `apple-touch-icon.png`, or other static asset extensions.

---

### `frontend/src/hooks/index.ts`

- **[Info]** (Lines 1-2): Exports `useBooking` and `useApi`, while `useAuth` lives in `src/lib/auth.tsx` (unlike `filemap.md`, which documents `hooks/useAuth.ts`). Re-exporting `useAuth` from `src/hooks/index.ts` (or aligning docs) improves discoverability.

---

### `frontend/src/hooks/useApi.ts`

- **[Medium]** (Lines 19-62): `useQuery` lacks an `AbortController` or request-sequence check, creating a race condition where out-of-order async responses overwrite newer data and `setState` can fire after unmount. It also accepts no dependency list (`deps`), so queries depending on reactive variables will not automatically re-run when arguments change. **Suggestion:** Track an active request ID / `AbortController` in `useEffect` cleanup and optionally accept a `deps` array.
- **[Medium]** (Lines 36-37, 61): Calling `refetch()` manually when `enabled === false` silently returns without running (`if (!enabled) return;`), making lazy/manual queries impossible with `useQuery({ enabled: false })`. **Suggestion:** Move the `if (!enabled) return;` guard into `useEffect` rather than `execute` so `refetch()` always executes on demand.
- **[Low]** (Lines 78-114): `useMutation` puts `mutationFn`, `onSuccess`, `onError`, and `onSettled` into `useCallback`'s dependency array (unlike `useQuery`, which uses refs). Passing inline callbacks causes `mutate` to change identity on every render. It also lacks an unmount guard before updating state. **Suggestion:** Store callbacks in refs and guard state updates on unmount.

---

### `frontend/src/hooks/useBooking.ts`

- **[High]** (Lines 42-61): `loadServiceDetails` calls `servicesApi.getActive()` over the network every single time `state.services` changes, with no caching or cancellation/sequence guard. Rapidly toggling services causes redundant API requests and a race condition where an older response overwrites `selectedServiceDetails`. **Suggestion:** Fetch active services once on mount (or via `useQuery`) and derive `selectedServiceDetails` synchronously with `useMemo`.
- **[High]** (Lines 139-172): Multiple correctness bugs in pricing, duration, and submission payload:
  - `computed.totalPrice` (line 165) and `totalDuration` (line 166) sum `s.basePrice` and `s.duration`, completely ignoring selected `variantId` pricing (`ServiceVariantDto.price`) and `quantity`.
  - `submitBooking` (lines 142-149) computes unused `totalDuration` and `totalPrice` variables (lines 139-140), drops `name`, `phone`, `endTime`, and `services` (`quantity`) from `bookingData`, and maps `variantIds` with `.filter(Boolean)` (line 144), which breaks positional alignment with `serviceIds` if only some selected services have variants.
  **Suggestion:** Compute totals from matching variant prices multiplied by `quantity`, send structured `services: state.services`, and remove dead variables.
- **[Medium]** (Lines 87-129): `fetchAvailableSlots` calls `availabilityApi.getAvailable()` and synthesizes 30-minute slots client-side instead of calling `availabilityApi.getSlots(date)` (which already exists in `src/lib/api.ts`), ignoring existing bookings and `maxSlots`. It also performs unvalidated `split(':').map(Number)` parsing (`NaN` risk on malformed times). **Suggestion:** Use `availabilityApi.getSlots(date)` directly and filter by `slot.available`.
- **[Low]** (Lines 167, 170): `downpayment` is hardcoded to the magic number `10000` (₱100 in centavos), and `canProceedStep3` checks only `!!state.name && !!state.phone` without validating against `bookingStep3Schema`.

---

### `frontend/src/lib/api.ts`

- **[Medium]** (Lines 19-27): The `401` response interceptor redirects any path other than `/login` and `/register` to `/login?redirect=...`. Because `AuthProvider` calls `authApi.me()` on mount across the entire app, a `401` response from `/auth/me` will forcibly redirect unauthenticated visitors off public pages (`/`, `/services`, `/gallery`, `/availability`). **Suggestion:** Skip the automatic redirect for `/auth/me` (or when a custom request flag is set) and let protected routes handle login redirects.
- **[Medium]** (Lines 5-12): Sets `withCredentials: true` for cookie-based auth without configuring CSRF protection (`xsrfCookieName` / `xsrfHeaderName` or an explicit CSRF header on mutations). **Suggestion:** Ensure backend CSRF protection (`SameSite=Lax/Strict` + CSRF token header) is paired with Axios `xsrfCookieName`/`xsrfHeaderName` if cookie auth is used for mutations.
- **[Low]** (Lines 1, 111, 121-122, 133, 159-160): Unused import `InternalAxiosRequestConfig` (line 1); `loyaltyApi.getCard` and `getMyCard` duplicate the exact same `/loyalty/card` call; `galleryApi.getAdmin` and `loyaltyApi.getAllCards` return ambiguous union types (`T[] | PaginatedPage`); `adminApi.getCustomers` returns `CustomerListDto[]` without pagination arguments despite `AdminCustomerPage` existing in `types/api.ts`.
- **[Info]** (Lines 33-177): Hardcodes endpoint paths instead of reusing `API_ENDPOINTS` from `src/lib/constants.ts`, and uses inline `import('@/types').Foo` expressions instead of top-level `import type`.

---

### `frontend/src/lib/auth.tsx`

- **[Medium]** (Lines 23-36, 51-59): `refreshUser` is recreated every render and the `AuthContext` `value` object is not memoized (`useMemo`), causing every `useAuth()` consumer to re-render whenever `AuthProvider` state updates. The mount `useEffect` also lacks an unmount guard before updating state. **Suggestion:** Wrap `refreshUser`, `login`, `logout` in `useCallback`, memoize `value` with `useMemo`, and guard state updates in `useEffect`.
- **[Low]** (Lines 4, 72-85): `AuthResponse` is imported on line 4 and unused. `clientAuth` (lines 73-85) is dead/misleading code: `clientAuth.login` has an unused parameter and empty body, while `clientAuth.logout` calls `authApi.logout()` without clearing `AuthProvider`'s React state (contradicting the comment on line 83). **Suggestion:** Remove `AuthResponse` and `clientAuth`.

---

### `frontend/src/lib/constants.ts`

- **[Medium]** (Lines 2-42): `API_ENDPOINTS` is incomplete and out of sync with `src/lib/api.ts`—it omits `/auth/logout`, `/auth/profile`, `/bookings/:id/cancel`, `/bookings/:id/reschedule`, `/availability/slots`, `/staff/loyalty/stamp`, and all `/payments*` endpoints while defining an unused `ADMIN_BY_ID` route—and `api.ts` does not reference it. **Suggestion:** Sync `API_ENDPOINTS` with `api.ts` and import it there as the single source of truth.
- **[Medium]** (Lines 115-119): `STORAGE_KEYS` defines `TOKEN: 'prettynails_token'` and `USER: 'prettynails_user'` under `Local Storage Keys`, contradicting the `httpOnly` cookie auth architecture in `src/lib/api.ts` and `src/lib/auth.tsx`. **Suggestion:** Remove `TOKEN` / `USER` from `STORAGE_KEYS` if auth is strictly cookie-based.
- **[Low]** (Lines 45-100): Duplicates domain enums and types (`UserRole`, `BookingStatus`, `ServiceCategory`, `GalleryCategory`, `ServiceVariant`, `LoyaltyAction`) that are also defined in `src/types/api.ts` (with differing names such as `LoyaltyAction` vs `LoyaltyActionType`). **Suggestion:** Define each constant/type in one place and re-export.

---

### `frontend/src/lib/site-config.ts`

- **[Info]** (Lines 1-12): `siteConfig.name` is `'Pretty Nails'` (versus `'Pretty Nails by Atasha'` in `layout.tsx`), and the studio address (`Sitio Sto. Niño B Aranas Extension Cebu City`) is only a comment on line 12 rather than a typed field.

---

### `frontend/src/lib/upload.ts`

- **[Medium]** (Lines 17-32): `validateImageFile` relies solely on browser-supplied `file.type`, which is easily spoofed (e.g., renaming an HTML/SVG/script file or changing extension) and can be empty on some systems. **Suggestion:** Validate both the file extension (`.jpg`, `.jpeg`, `.png`, `.webp`) and magic bytes client-side (in addition to authoritative server-side inspection).
- **[Low]** (Lines 55-58): Manually sets `'Content-Type': 'multipart/form-data'` without a `boundary` parameter to override `api.ts`'s default `'application/json'`. Setting `'Content-Type': undefined` is safer so Axios/XHR automatically sets the exact `multipart/form-data; boundary=...` header.
- **[Low]** (Lines 68-75): Casts `error as AxiosError<ApiError>` without checking `axios.isAxiosError(error)` and casts `response.data` inline. **Suggestion:** Guard with `if (axios.isAxiosError(error))` so non-Axios exceptions are handled predictably.

---

### `frontend/src/lib/utils.ts`

- **[High]** (Lines 188-231): `isWithin24HoursManila` and `isPastManila` contain multiple date-handling bugs and duplicate parsing logic:
  - `startTime.split(':').map(Number)` and `datePart.split('-').map(Number)` have no input validation; malformed strings produce `NaN` / `Invalid Date`, causing both functions to silently return `false`.
  - `appointmentDate.split('T')[0]` discards any UTC time component, shifting the date by 1 day if an ISO UTC timestamp (e.g., `"2025-12-25T16:00:00.000Z"`, midnight Manila) is passed.
  - `isWithin24HoursManila` checks `diffHours > 0` (line 208), excluding an appointment at `diffHours === 0`.
  **Suggestion:** Extract a shared `parseManilaDateTime` helper that validates `hours`, `minutes`, `year`, `month`, `day` (and handles/rejects non-Manila ISO timestamps explicitly).
- **[Medium]** (Lines 129-132): `generateId` uses `Math.random().toString(36)`, which is predictable and prone to collisions. **Suggestion:** Use `crypto.randomUUID()`.
- **[Medium]** (Lines 154-165): `isToday` and `isPast` evaluate against the browser's local timezone rather than Manila timezone (unlike `isWithin24HoursManila`/`isPastManila`) and do not check `isValid(date)`. **Suggestion:** Align timezone handling and guard with `if (!isValid(date)) return false;`.
- **[Low]** (Lines 3, 13-84, 134-152): Unused `addHours` import (line 3); `formatTime` returns `"NaN:undefined AM"` for inputs without `:` (because `parseInt` does not throw into the `catch` block); `getStatusLabel` only replaces the first `_` and breaks on `""`; `getInitials` creates empty parts on consecutive spaces; `debounce` uses `NodeJS.Timeout` instead of `ReturnType<typeof setTimeout>` and exposes no `.cancel()`; and `formatPrice`, `formatDate`, `formatTime`, `formatDateShort`, `getStatusColor`, `getStatusLabel` duplicate `src/types/api.ts` with different behavior.

---

### `frontend/src/lib/validations.ts`

- **[Medium]** (Lines 119-126): `changePasswordSchema` only enforces `.min(8)` on `newPassword`, omitting the uppercase, lowercase, digit, special-character, max-length (128), and `COMMON_PASSWORDS` checks enforced by `registerSchema` (lines 26-33) and `resetPasswordSchema` (lines 58-65). **Suggestion:** Extract a shared `strongPasswordSchema` and reuse it in all three schemas.
- **[Medium]** (Lines 97, 147): `z.string().url()` in `bookingStep3Schema.inspirationImg` and `gallerySchema.imageUrl` accepts non-HTTP(S) schemes such as `javascript:` or `data:`. **Suggestion:** Restrict to `http://` and `https://` URLs:
  ```ts
  z.string().url('Invalid URL').refine((u) => /^https?:\/\//i.test(u), 'Must be an HTTP(S) URL')
  ```
- **[Medium]** (Lines 23, 91, 95, 113): `PH_MOBILE_PATTERN` is declared on line 91 below `registerSchema` (relying on lazy `.refine()` evaluation) and is applied inconsistently: `registerSchema` and `profileSchema` strip spaces before matching while `bookingStep3Schema` does not. **Suggestion:** Declare `PH_MOBILE_PATTERN` at the top and normalize whitespace consistently across all phone fields.
- **[Low]** (Lines 26-33, 58-65, 138-141, 153): Duplicated password complexity rules between `registerSchema` and `resetPasswordSchema`; `serviceSchema` permits duplicate variant names (e.g., two `SMALL` variants); `availabilitySchema.date` only checks `.min(1)` instead of `YYYY-MM-DD`.

---

### `frontend/src/types/api.ts`

- **[Medium]** (Lines 348-403): Places runtime utility functions (`formatPrice`, `formatDate`, `formatTime`, `formatDateShort`, `getStatusColor`, `getStatusLabel`) and runtime constants inside a `types` module, duplicating `src/lib/utils.ts` and `src/lib/constants.ts` with weaker validation (e.g., `new Date(dateString)` without `isValid`, unvalidated `formatTime`). **Suggestion:** Keep `src/types/api.ts` strictly for TypeScript types/interfaces and import runtime helpers from `@/lib/utils` and constants from `@/lib/constants`.
- **[Medium]** (Lines 28, 39, 52, 58, 62, 75, 86, 93, 110, 179, 189, 313): Uses broad `string` types where strict union types already exist (`UserDto.role` / `CustomerListDto.role` -> `UserRole`, `ServiceDto.category` / `ServiceRequest.category` -> `ServiceCategory`, `ServiceVariantDto.name` -> `ServiceVariant`, `GalleryDto.category` / `GalleryRequest.category` -> `GalleryCategory`, `PaymentDto.method` / `BookingRequest.paymentMethod` -> `PaymentMethod`). **Suggestion:** Use the narrow union types (or `string` fallback only if backend can return unknown values).
- **[Low]** (Lines 98-113, 153-171, 194-202, 244-252): `BookingRequest` contains overlapping legacy fields (`inspirationImg` vs `inspirationImage`; `serviceIds`/`variantIds` vs `services`), and `AdminBookingPage`, `AdminCustomerPage`, `AdminGalleryPage`, `AdminLoyaltyPage` repeat the same Spring pagination wrapper instead of using a generic `PaginatedResponse<T>`.

---

### `frontend/src/types/index.ts`

- **[Info]** (Line 1): `export * from './api'` re-exports runtime formatter functions and constants alongside types because `src/types/api.ts` contains runtime code.

---

### `frontend/tailwind.config.ts`

- **[Info]** (Lines 5, 72-76): `content` includes an unused `./src/pages/**/*.{js,ts,jsx,tsx,mdx}` glob (project uses `src/app`), and `theme.extend.borderColor` duplicates `border`, `input`, and `ring` already defined under `theme.extend.colors`.

---

### `frontend/tsconfig.json`

- **[Low]** (Lines 25-26): `include` matches `**/*.ts` and `**/*.tsx` while `exclude` only lists `node_modules`. Even though `tsconfig.test.json` exists, Jest test files (`**/*.test.ts`, `**/*.test.tsx`), `src/__mocks__`, and `src/jest.setup.ts` are still type-checked by `tsc --noEmit` / `next build`, and `@types/jest` globals leak into application source files. **Suggestion:** Exclude test files and Jest mocks/setup from `tsconfig.json`.

---

### `frontend/tsconfig.test.json`

- **[Low]** (Line 25): `include` lists `.next/types/**/*.ts` (coupling test type-checking to Next.js build output) and a nonexistent root `"jest.setup.ts"` (the actual file in `jest.config.js` is `src/jest.setup.ts`, already covered by `**/*.ts`). **Suggestion:** Remove `.next/types/**/*.ts` and replace `"jest.setup.ts"` with `"src/jest.setup.ts"` (or rely on `**/*.ts`).

---

## 3. Frontend Pages — Admin & Auth

Across the 18 admin and auth pages, the most impactful defects are systemic: `useQuery` in `hooks/useApi.ts` does not re-execute when filter/search/pagination parameters change (breaking dynamic queries in Bookings, Customers, Gallery, Loyalty, and Reports), and `useAdminErrors()` uses isolated local state rather than shared context so error banners in `(admin)/layout.tsx` never display page-level errors. In addition, the Admin Dashboard renders hardcoded mock weekly revenue data, the Customers page simulates blocking only in local React state, and the OAuth2 callback page passes an unvalidated `sessionStorage` redirect target to `router.push`.

| File | Critical | High | Medium | Low | Info |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `frontend/src/app/(admin)/admin/availability/page.tsx` | 0 | 1 | 3 | 2 | 0 |
| `frontend/src/app/(admin)/admin/bookings/page.tsx` | 0 | 1 | 3 | 1 | 0 |
| `frontend/src/app/(admin)/admin/customers/page.tsx` | 0 | 2 | 1 | 1 | 0 |
| `frontend/src/app/(admin)/admin/gallery/page.tsx` | 0 | 1 | 2 | 1 | 0 |
| `frontend/src/app/(admin)/admin/loyalty/page.tsx` | 0 | 1 | 3 | 1 | 0 |
| `frontend/src/app/(admin)/admin/page.tsx` | 0 | 1 | 2 | 1 | 0 |
| `frontend/src/app/(admin)/admin/reports/page.tsx` | 0 | 1 | 1 | 0 | 0 |
| `frontend/src/app/(admin)/admin/services/page.tsx` | 0 | 0 | 1 | 1 | 1 |
| `frontend/src/app/(admin)/admin/settings/page.tsx` | 0 | 0 | 1 | 1 | 1 |
| `frontend/src/app/(admin)/layout.tsx` | 0 | 1 | 1 | 0 | 0 |
| `frontend/src/app/(auth)/email-verify/page.tsx` | 0 | 0 | 0 | 1 | 0 |
| `frontend/src/app/(auth)/forgot-password/page.tsx` | 0 | 0 | 0 | 0 | 1 |
| `frontend/src/app/(auth)/layout.tsx` | 0 | 0 | 0 | 1 | 0 |
| `frontend/src/app/(auth)/login/page.tsx` | 0 | 0 | 0 | 0 | 0 |
| `frontend/src/app/(auth)/oauth2/callback/page.tsx` | 0 | 0 | 2 | 1 | 0 |
| `frontend/src/app/(auth)/register/page.tsx` | 0 | 0 | 0 | 0 | 0 |
| `frontend/src/app/(auth)/reset-password/page.tsx` | 0 | 0 | 0 | 0 | 0 |
| `frontend/src/app/(auth)/verify-email/page.tsx` | 0 | 0 | 0 | 0 | 0 |
| **Total** | **0** | **9** | **20** | **12** | **3** |

### `frontend/src/app/(admin)/admin/availability/page.tsx`

- **[High]** (Lines 726-760): `AvailabilityForm` initializes `date: initialData?.date || ...` directly without stripping ISO time components (unlike line 153 `a.date.split('T')[0]` and line 680 `parseISO(row.date)`). If `initialData.date` includes a timestamp (e.g. `2026-11-28T00:00:00Z`), `<Input type="date" value={formData.date} />` renders blank or fails validation. Additionally, `<AvailabilityForm>` is rendered without a `key` prop, risking stale `useState` if `Modal` keeps children mounted across openings.
  **Suggestion:** Normalize the date string and key the form by target record/date:
  ```tsx
  <AvailabilityForm
    key={editingAvailability?.id ?? selectedDate?.toISOString() ?? 'new'}
    ...
  />
  // Inside AvailabilityForm:
  date: initialData?.date ? initialData.date.split('T')[0] : (defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
  ```
- **[Medium]** (Lines 88-98, 200-207): `weeklySchedule` is persisted only in `localStorage` under `'pretty_nails_working_hours'` with unvalidated `JSON.parse(saved)`. Weekly operating hours are not saved to the backend database, so other admin devices or customer booking flows will not reflect changes until manually synced per month, and malformed `localStorage` data can crash `.map`/`.find`.
  **Suggestion:** Persist weekly schedules via a backend API endpoint and validate parsed `localStorage` fallback arrays (verifying `Array.isArray(parsed)` and expected keys) before initializing state.
- **[Medium]** (Lines 210-243): `handleApplyScheduleToMonth` executes up to 31 sequential `await availabilityApi.upsert(...)` requests in a `for...of` loop (N+1 network waterfall). A failure mid-month leaves partial overrides applied, and `refetch()` is not called in the `catch` block, leaving UI state out of sync with the server. Also, existing open overrides are silently overwritten without confirmation.
  **Suggestion:** Introduce a bulk upsert endpoint (or batch with `Promise.allSettled` and surface partial failure counts) and always call `refetch()` in `finally`.
- **[Medium]** (Lines 78, 104-109): `addError` and `clearErrors` come from `useAdminErrors()`, which creates local component state disconnected from `AdminErrorBanner` in `(admin)/layout.tsx`. Initial load failures are silently ignored in the UI.
  **Suggestion:** Move `AdminError` state into a React Context provider wrapping `(admin)/layout.tsx` and render an inline retry banner when `availabilityApi.getAdmin()` fails.
- **[Low]** (Lines 178-182, 688-696): `handleDelete` uses blocking `window.confirm(...)`, and the table delete button is not disabled while `deleteMutation.isPending` is true, allowing duplicate `DELETE` requests on rapid clicks.
  **Suggestion:** Replace `confirm(...)` with a confirmation dialog and add `disabled={deleteMutation.isPending}` to the delete `<Button>`.
- **[Low]** (Lines 352-364, 826-842): Neither the weekly schedule time inputs nor `AvailabilityForm` validate that `startTime < endTime`, and the weekly `<input type="time">` controls on lines 352-364 lack `<label>` or `aria-label` attributes for screen readers.
  **Suggestion:** Validate `startTime < endTime` before saving/submitting and add `aria-label={`${day.name} start time`}` / `aria-label={`${day.name} end time`}`.

### `frontend/src/app/(admin)/admin/bookings/page.tsx`

- **[High]** (Lines 55-79): `useQuery(() => bookingsApi.getAdminBookings(params), ...)` passes `params`, but `useQuery` in `frontend/src/hooks/useApi.ts` only triggers on mount (`[enabled, execute]`) and ignores closure changes. Changing quick-filter tabs (`activeTab`), `search`, `startDate`, `endDate`, `statuses`, `sortBy`, or `currentPage` (when backend returns `AdminBookingPage`) does not trigger a network request until the user manually clicks `Refresh`.
  **Suggestion:** Extend `useQuery` to accept a dependency key/array (e.g. `queryKey: [params]`) or trigger `refetch()` in a `useEffect` whenever `params` changes.
- **[Medium]** (Lines 254-284): `handleExportCSV` has multiple defects: (1) it wraps `customer` in quotes without escaping embedded `"` (`""`) and without neutralizing spreadsheet formula prefixes (`=`, `+`, `-`, `@`, `\t`, `\r` — CWE-1236); (2) it uses `data:text/csv;charset=utf-8,` + `encodeURI(...)` which corrupts `#` and `%` characters instead of creating a `Blob`; (3) it exports only `allRawBookings` (the current page of 10 records when paginated); and (4) `b.downpayment || 10000` silently substitutes `₱100` if `downpayment` is `0`.
  **Suggestion:** Escape quotes and prefix formula-triggering cells with `'`, generate downloads via `new Blob([csv], { type: 'text/csv;charset=utf-8;' })` + `URL.createObjectURL`, and use `b.downpayment ?? 10000`.
- **[Medium]** (Lines 149-169): `tabCounts` (`ALL`, `TODAY`, `PENDING`, `CONFIRMED`, `COMPLETED`) is calculated from `allRawBookings`. When the backend returns a paginated `AdminBookingPage`, `allRawBookings` only contains the current page's filtered subset, causing unrelated status tab counts to drop to `0` when switching tabs.
  **Suggestion:** Fetch aggregate status counts from a dedicated backend summary endpoint (or include counts in the `AdminBookingPage` response).
- **[Medium]** (Lines 26, 68, 72-90): `adminApi.getCustomers()` fetches all customers unconditionally on every mount just for ID lookup; `useAdminErrors()` is disconnected from `AdminErrorBanner`; and `isError`/`error` (line 68) are destructured but never rendered, leaving initial load failures invisible.
  **Suggestion:** Include customer summary fields directly on `BookingDto` from the backend (avoiding the unbounded customer list fetch), share `AdminErrorBanner` via context, and render an error/retry state when `isError` is true.
- **[Low]** (Lines 16, 18, 46-52, 287-370): `AlertCircle` and `ShieldCheck` are unused imports; lines 287-370 duplicate the page header and layout shell for the initial loading state; and `todayStr` is memoized with `[]`, going stale if the page stays open past midnight.
  **Suggestion:** Remove unused imports, render the page header once above conditional loading/content sections, and compute `todayStr` dynamically or refresh it on focus.

### `frontend/src/app/(admin)/admin/customers/page.tsx`

- **[High]** (Lines 24-25, 67-79, 91-99): `handleToggleBlock` only mutates a local React `Set<string>` (`blockedCustomers`) and displays a success toast without calling any backend API. Refreshing the page discards all block/reinstate actions and never prevents blocked clients from booking. `customerNicknames` is likewise only stored in component memory.
  **Suggestion:** Wire `handleToggleBlock` to a real backend endpoint (e.g., `adminApi.updateCustomerStatus(customer.id, ...)`), await it, and call `refetch()` on success rather than faking persistence in local state.
- **[High]** (Lines 27-38, 46-51): `useQuery(() => adminApi.getCustomers(search), ...)` never re-fetches when `search` changes because `useQuery` lacks dependency tracking, and `filteredCustomers` only filters by `statusFilter` without any client-side `search` fallback. Typing in the search input has no effect.
  **Suggestion:** Pass `[search]` as a dependency key to `useQuery` (with debouncing) or filter `customersList` client-side by `name`, `email`, and `phone` when data is loaded in full.
- **[Medium]** (Lines 17, 31-36): `addError` / `clearErrors` from `useAdminErrors()` only updates local state and never reaches `AdminErrorBanner` in `(admin)/layout.tsx`.
  **Suggestion:** Use a shared error banner context and display an inline error state with retry if `customersData` fails to load.
- **[Low]** (Lines 40-43, 54-58): Casts `rawData as unknown as { content?: CustomerListDto[] }` instead of importing `AdminCustomerPage` from `@/types`, and does not clamp `currentPage` if `totalPages` shrinks after a refetch.
  **Suggestion:** Use `AdminCustomerPage` from `@/types` and clamp `const safePage = Math.min(currentPage, totalPages - 1)`.

### `frontend/src/app/(admin)/admin/gallery/page.tsx`

- **[High]** (Lines 54-73): `useQuery(() => galleryApi.getAdmin(params), ...)` never re-fetches when `params` (`search`, `category`, `currentPage`) changes because `useQuery` only runs on mount. When the backend returns `AdminGalleryPage`, searching, category filtering, and pagination are broken; even for flat array responses, no client-side `search`/`category` filtering exists.
  **Suggestion:** Pass `[params]` to `useQuery` (with debounced `search`) so filter and page changes trigger API fetches.
- **[Medium]** (Lines 169-177): `handleFormSubmit` awaits `updateMutation.mutate(...)` / `createMutation.mutate(...)` and unconditionally calls `setIsFormOpen(false); setEditingItem(null);`. Because `useMutation` catches errors and returns `null` instead of throwing, a failed upload or update still closes the modal and loses the user's input.
  **Suggestion:** Close the modal only when `const result = await ...; if (result !== null)` (or inside each mutation's `onSuccess` callback).
- **[Medium]** (Lines 46, 62, 66-71): `useAdminErrors()` is disconnected from `AdminErrorBanner`, and `isError`/`error` (line 62) are unused, leaving initial fetch failures indistinguishable from an empty gallery.
  **Suggestion:** Wire `AdminErrorBanner` via context and render an explicit error/retry view when `isError` is true.
- **[Low]** (Lines 9, 25-33, 81-89, 186-190, 204-266): Unused `RotateCcw` import; `AdminGalleryPage` interface (lines 25-33) is duplicated as `PaginatedGalleryResponse` (lines 81-89); loading state duplicates the full header and filter bar; `handleDelete` uses blocking `confirm(...)` without guarding `deleteMutation.isPending`.
  **Suggestion:** Remove unused imports and duplicate types, share the header across loading/loaded states, and guard deletes with `deleteMutation.isPending`.

### `frontend/src/app/(admin)/admin/loyalty/page.tsx`

- **[High]** (Lines 60-77): `useQuery(() => loyaltyApi.getAllCards(params), ...)` never re-fetches when `search` or `currentPage` changes. When the backend returns a paginated `AdminLoyaltyPage`, searching and paging never query the server.
  **Suggestion:** Add dependency tracking for `params` in `useQuery` (with debounced `search`).
- **[Medium]** (Line 219): Stray bare text `Studio Reservation Policy` is rendered directly inside the main container between the page header and the search bar.
  **Suggestion:** Remove this leftover text from line 219.
- **[Medium]** (Lines 42, 70-75, 83-85): `useAdminErrors()` is disconnected from `AdminErrorBanner` in `(admin)/layout.tsx`, swallowing card and settings fetch errors silently.
  **Suggestion:** Use a shared context for `AdminErrorBanner` and display an error state if `loyaltyApi.getAllCards` fails.
- **[Medium]** (Lines 79-95, 522-552): `settings` fetched from `adminApi.getSettings()` is unused for `maxStamps` (hardcoded `REWARD_THRESHOLD = 10`) and for the Quick Stamp Issuance preset buttons (`PHP 500 rule` -> `+1 stamp`, `PHP 1,000 rule` -> `+2 stamps` are hardcoded rather than derived from `settings?.amountThreshold` / `settings?.stampsPerAmount`).
  **Suggestion:** Derive preset labels/values from `settings` (with fallback defaults) so admin settings changes are reflected in the issuance modal.
- **[Low]** (Lines 21, 29-37, 102-110, 318-319, 561-579, 726, 738, 745-773): Unused `CheckCircle` import; duplicated `AdminLoyaltyPage` / `PaginatedLoyaltyResponse` types; `new Date(row.expiresAt).toLocaleDateString()` renders `"Invalid Date"` if `expiresAt` is missing; stepper `<button>`s (lines 561-579) lack `aria-label`; `parseInt(e.target.value) || 1` snaps cleared inputs to `1`; and `RESET` has no confirmation check while manual quantities lack client-side min/max clamping before `handleAction`.
  **Suggestion:** Guard `row.expiresAt` validity, add `aria-label` to stepper buttons, clamp numeric values on submit, and confirm before `RESET`.

### `frontend/src/app/(admin)/admin/page.tsx`

- **[High]** (Lines 52-61, 124-127): `dailyRevenueData` passed to `<RevenueChart>` is hardcoded dummy data (`Mon: 120000` through `Sun: 190000`) instead of real metrics from `reports` or a backend endpoint, misleading admins with fabricated revenue figures.
  **Suggestion:** Derive chart series from `adminApi.getReports(...)` or a dedicated weekly revenue endpoint, and show an empty state if unavailable.
- **[Medium]** (Lines 31-35): Passes `sort: 'desc'` (without a property name) to `bookingsApi.getAdminBookings({ page: 0, limit: 5, sort: 'desc' })`, unlike `admin/bookings/page.tsx` which uses `'appointmentDate,desc'`. Spring Data endpoints expecting `property,direction` can reject `'desc'` with a 500 error. Using `Promise.all` also causes all dashboard widgets to fail if any one endpoint errors.
  **Suggestion:** Change `sort` to `'appointmentDate,desc'` and switch `Promise.all` to `Promise.allSettled` so partial data still renders.
- **[Medium]** (Lines 21, 41-43): `useAdminErrors()` is disconnected from `AdminErrorBanner`, so dashboard fetch errors are never visible to the user.
  **Suggestion:** Connect `AdminErrorBanner` via context and render an inline error card when dashboard queries fail.
- **[Low]** (Lines 195-197): Assumes `bookingsRes.data` is always an `AdminBookingPage` object (`recentBookings?.content`), whereas `admin/bookings/page.tsx` handles flat `BookingDto[]` arrays. If a flat array is returned, `<RecentBookings>` receives `null` and shows no bookings.
  **Suggestion:** Normalize `Array.isArray(bookingsRes.data)` just like `admin/bookings/page.tsx`.

### `frontend/src/app/(admin)/admin/reports/page.tsx`

- **[High]** (Lines 18-29, 36): `useQuery(() => adminApi.getReports(period), ...)` does not re-fetch when `period` changes via `onPeriodChange={setPeriod}` because `useQuery` only runs on mount. Selecting a different reporting period leaves `'this-month'` data displayed.
  **Suggestion:** Pass `[period]` as a dependency key to `useQuery` (or trigger `refetch()` when `period` updates).
- **[Medium]** (Lines 15, 22-27): `useAdminErrors()` is disconnected from `AdminErrorBanner` in `(admin)/layout.tsx`, so failed report loads fail silently.
  **Suggestion:** Share `AdminErrorBanner` state via context and expose an error/retry state in `ReportsView`.

### `frontend/src/app/(admin)/admin/services/page.tsx`

- **[Medium]** (Lines 45, 58-63): `useAdminErrors()` is disconnected from `AdminErrorBanner` in `(admin)/layout.tsx`. When `servicesApi.getAll()` fails, the page silently shows `"No services cataloged"` instead of an error banner.
  **Suggestion:** Use a shared context for `AdminErrorBanner` and render an explicit error/retry card when `servicesApi.getAll()` fails.
- **[Low]** (Lines 52, 144-157, 231-232, 418-427): Maintains manual `isSubmitting` state duplicating `createMutation.isPending || updateMutation.isPending`; `handleDelete` uses blocking `window.confirm` and delete buttons lack `disabled={deleteMutation.isPending}`; and `v.name === 'SMALL' ? 'S' : v.name === 'MEDIUM' ? 'M' : 'L'` silently maps any unexpected variant name to `'L'`/`'Long'`.
  **Suggestion:** Derive `isSubmitting` from mutation `isPending`, disable delete buttons while deleting, and use a lookup map for length tier labels.
- **[Info]** (Lines 212-215): Renders a `<DollarSign />` icon next to `formatPrice(row.basePrice)` even though studio pricing is in PHP (`₱`).

### `frontend/src/app/(admin)/admin/settings/page.tsx`

- **[Medium]** (Lines 48, 56-61): `useAdminErrors()` is disconnected from `AdminErrorBanner`. If `adminApi.getSettings()` fails, the form silently falls back to `INITIAL_DEFAULTS` with no error indication, and clicking Save could overwrite server configuration with default values.
  **Suggestion:** Share `AdminErrorBanner` via context and block/warn before saving if initial settings failed to load.
- **[Low]** (Lines 15, 104, 328, 337, 349, 411, 459-468): The Save button is not disabled while `isLoading` is true or when `!isDirty`; `JSON.stringify(formData) !== JSON.stringify(activeSaved)` is sensitive to property ordering; `parseInt(e.target.value, 10) || 12` (and `|| 0`) prevents clearing inputs and lacks explicit validation before submit; and `Clock` (line 15) is an unused import.
  **Suggestion:** Disable submit when `isLoading || !isDirty`, compare fields explicitly for `isDirty`, validate numeric ranges on submit, and remove the unused `Clock` import.
- **[Info]** (Lines 165-303): Domains 1–3 (`Studio Identity & Location`, `Reservation & Deposit Policy`, `Hygiene & Sanitation Protocol`) are hardcoded static JSX inside `<form>` rather than persisted settings.

### `frontend/src/app/(admin)/layout.tsx`

- **[High]** (Lines 10, 29-33): `AdminRouteLayout` calls `useAdminErrors()` to feed `<AdminLayout errors={errors} ...>`, while all 9 child admin pages call `useAdminErrors()` independently. Because `useAdminErrors` is a plain `useState` hook rather than a Context, child pages' `addError()` calls never update `AdminErrorBanner`.
  **Suggestion:** Create an `AdminErrorProvider` context around `AdminLayout` and consume it via `useAdminErrors()`.
- **[Medium]** (Lines 20-26): Admin access control (`if (!isAdmin)`) is enforced only client-side after `/auth/me` resolves, and the `"Access denied"` fallback provides no redirect or navigation link back to `/login` or `/`.
  **Suggestion:** Enforce admin route gating in Next.js `middleware.ts` (in addition to backend `@PreAuthorize` checks) and provide a link to `/login` or `/` in the access-denied view.

### `frontend/src/app/(auth)/email-verify/page.tsx`

- **[Low]** (Lines 9-18): Uses `window.location.href = ...` inside `useEffect` instead of `useRouter().replace(...)` (or a server-side `redirect()`), triggering a full browser reload and leaving `/email-verify` in history, while rendering `null` during redirect.
  **Suggestion:** Use a server component with `redirect(...)` or `router.replace(...)` with a lightweight spinner fallback.

### `frontend/src/app/(auth)/forgot-password/page.tsx`

**Status:** Clean — no issues found.
- **[Info]** (Lines 10-13): `Suspense` fallback skeleton uses `aria-hidden="true"` without a screen-reader `role="status"` loading label.

### `frontend/src/app/(auth)/layout.tsx`

- **[Low]** (Lines 5-8): Applies `px-4 py-8 sm:py-12` around `{children}`, which causes vertical overflow/scrolling when `(auth)/oauth2/callback/page.tsx` renders an inner `min-h-screen` container.
  **Suggestion:** Remove `min-h-screen` from `OAuth2CallbackPage` (relying on `AuthLayout` for centering) or use `min-h-full` inside child auth views.

### `frontend/src/app/(auth)/login/page.tsx`

**Status:** Clean — no issues found.

### `frontend/src/app/(auth)/oauth2/callback/page.tsx`

- **[Medium]** (Lines 39-46): `sessionStorage.getItem('oauth_redirect')` is passed directly to `router.push(redirectTo)` without validating that it is a safe internal relative path (e.g., `/^\/(?!\/)/`). Values like `//evil.com` or `https://evil.com` stored in `oauth_redirect` can cause an open redirect.
  **Suggestion:** Validate the redirect target before navigating:
  ```ts
  const stored = sessionStorage.getItem('oauth_redirect');
  const safeRedirect = stored && stored.startsWith('/') && !stored.startsWith('//') ? stored : '/';
  ```
- **[Medium]** (Lines 17-35): Reads `token` from `searchParams` and rejects when `!token`, yet never sends `token` to the backend and instead calls `authApi.me()` assuming an `httpOnly` cookie is already set. Passing tokens in URL query parameters exposes credentials in browser history/server logs, and if `authApi.me()` returns `401`, the Axios interceptor in `lib/api.ts` performs `window.location.href = '/login?redirect=...'` before the `catch` toast can display.
  **Suggestion:** Rely exclusively on backend `httpOnly` cookies (dropping `?token=` from the redirect URL) or exchange a short-lived one-time code via `POST`, and handle unauthenticated state gracefully.
- **[Low]** (Lines 15-55, 58): `useEffect` includes `login` in its dependency array (`[searchParams, router, login]`), and `login` in `lib/auth.tsx` is not wrapped in `useCallback`; calling `login(response.data)` re-renders `AuthProvider`, changes `login`'s reference, and re-triggers `handleCallback` (issuing a duplicate `authApi.me()`, toast, and `router.push`). Also nests `min-h-screen` inside `AuthLayout`.
  **Suggestion:** Memoize `login` with `useCallback` in `AuthProvider`, guard the effect with a `useRef` execution flag, and replace `min-h-screen` with `py-12` inside `AuthLayout`.

### `frontend/src/app/(auth)/register/page.tsx`

**Status:** Clean — no issues found.

### `frontend/src/app/(auth)/reset-password/page.tsx`

**Status:** Clean — no issues found.

### `frontend/src/app/(auth)/verify-email/page.tsx`

**Status:** Clean — no issues found.

---

## 4. Frontend Pages — Customer, Public & Staff

This audit covers all 12 customer, public, and staff App Router pages and forms across booking, loyalty, availability, gallery, services, profile, and QR scanning flows. Key findings include silently discarded payment receipt uploads and broken slot duration filtering in `BookingForm.tsx`, an admin-only endpoint called from the customer loyalty page causing 401/403 failures, stale `useQuery` filtering in the gallery, and a missing authentication/role guard on the staff QR scanner route.

| File | Critical | High | Medium | Low | Info | Status |
| --- | :---: | :---: | :---: | :---: | :---: | --- |
| `frontend/src/app/(customer)/layout.tsx` | 0 | 0 | 0 | 0 | 1 | Info only |
| `frontend/src/app/(customer)/loyalty/page.tsx` | 0 | 1 | 1 | 2 | 1 | Issues found |
| `frontend/src/app/(customer)/my-bookings/page.tsx` | 0 | 0 | 3 | 1 | 0 | Issues found |
| `frontend/src/app/(customer)/profile/page.tsx` | 0 | 0 | 1 | 1 | 0 | Issues found |
| `frontend/src/app/(public)/availability/page.tsx` | 0 | 0 | 2 | 1 | 0 | Issues found |
| `frontend/src/app/(public)/booking/BookingForm.tsx` | 2 | 3 | 3 | 1 | 0 | Issues found |
| `frontend/src/app/(public)/booking/page.tsx` | 0 | 0 | 0 | 0 | 1 | Info only |
| `frontend/src/app/(public)/gallery/page.tsx` | 0 | 1 | 3 | 1 | 0 | Issues found |
| `frontend/src/app/(public)/layout.tsx` | 0 | 0 | 0 | 0 | 0 | Clean |
| `frontend/src/app/(public)/page.tsx` | 0 | 0 | 1 | 3 | 0 | Issues found |
| `frontend/src/app/(public)/services/page.tsx` | 0 | 0 | 2 | 1 | 0 | Issues found |
| `frontend/src/app/(staff)/scanner/page.tsx` | 0 | 1 | 2 | 1 | 0 | Issues found |
| **Total** | **2** | **6** | **18** | **12** | **3** | — |

### `frontend/src/app/(customer)/layout.tsx`

- **[Info]** (Lines 1-8): `CustomerLayout` is marked `'use client'` even though it only renders `<Layout>{children}</Layout>` (unlike `frontend/src/app/(public)/layout.tsx`, which omits `'use client'`), and it provides no shared customer authentication guard, leaving individual customer pages to handle unauthenticated states inconsistently. **Suggestion:** Remove `'use client'` if `<Layout>` is already a client component, and consider centralizing the auth-loading / sign-in redirect check here for all `(customer)` routes.

### `frontend/src/app/(customer)/loyalty/page.tsx`

- **[High]** (Lines 30-37): Calls `adminApi.getSettings()` (`GET /admin/settings`) inside `useQuery` with `{ enabled: true }`, regardless of authentication or role. Unauthenticated visitors receive a `401` that triggers the global `window.location.href` redirect to `/login` in `frontend/src/lib/api.ts`, making the unauthenticated card UI (lines 73-106) unreachable; authenticated customers receive `403 Forbidden` on every page load. Moreover, `settings` (line 37) is unused while `MAX_STAMPS` is hardcoded to `10` (line 40). **Suggestion:** Remove the `adminApi.getSettings()` call from the customer page (expose a public or customer loyalty config endpoint if dynamic thresholds are needed, or return `maxStamps` on `LoyaltyCardDto`):
```tsx
// Remove adminApi.getSettings() here; read threshold from loyaltyCard or a public endpoint
const MAX_STAMPS = loyaltyCard?.maxStamps ?? 10;
```
- **[Medium]** (Lines 45-51): `handleCopyVoucher` does not `await` or catch `navigator.clipboard.writeText(voucherCode)`, so denied clipboard permissions or non-HTTPS contexts trigger an unhandled promise rejection while still displaying `toast.success(...)`, and the 2-second `setTimeout` is not cleaned up on unmount. **Suggestion:** Make `handleCopyVoucher` `async`, wrap `await navigator.clipboard.writeText(voucherCode)` in `try/catch`, and clear any active timer ref on unmount.
- **[Low]** (Lines 53-71): `isAddingStamp` is updated in `handleAddStamp` (lines 54, 69) but never read in JSX (dead state), `refetch()` is not awaited, and `setIsScannerOpen(false)` is not called after a successful stamp. **Suggestion:** Either pass/display `isAddingStamp` as a loading state or remove it, `await refetch()`, and close the scanner modal on success.
- **[Low]** (Lines 7, 16, 86-101, 297-304): `LoyaltySettingsDto` and `AlertCircle` are unused imports; `<button type="button">` is nested inside `<Link>` on lines 86-101 (invalid HTML / duplicate keyboard focus stop); and `formatDate(loyaltyCard.expiresAt, ...)` is unguarded if `expiresAt` is nullish (renders `"Invalid date"`). **Suggestion:** Remove unused imports, style `<Link>` directly as a pill button instead of wrapping a `<button>`, and guard `loyaltyCard.expiresAt ? formatDate(...) : 'No expiration'`.
- **[Info]** (Lines 43, 112-115): `voucherCode` uses a `PN-` prefix while `formatMemberCardId` on line 277 produces `PNA-`, and the loading skeleton passes `{} as LoyaltyCardDto` instead of letting `LoyaltyCard` accept an optional `data` when `isLoading` is `true`. **Suggestion:** Align the ID/voucher prefix helper and type `data?: LoyaltyCardDto` when `isLoading` is true.

### `frontend/src/app/(customer)/my-bookings/page.tsx`

- **[Medium]** (Lines 28-31): `useQuery(() => bookingsApi.getUserBookings(), { enabled: true })` executes without checking `isAuthenticated` from `useAuth()`, causing unauthenticated visits to issue a failing `/bookings` call and trigger a hard `window.location.href` redirect from the Axios 401 interceptor. **Suggestion:** Gate the query with `const { isAuthenticated, isLoading: authLoading } = useAuth();` and pass `{ enabled: isAuthenticated }`, rendering an auth/sign-in state when `!authLoading && !isAuthenticated`.
- **[Medium]** (Lines 35-43): Uses browser-local date-only `isPast(booking.appointmentDate)` rather than `isPastManila(booking.appointmentDate, booking.startTime)` (available in `frontend/src/lib/utils.ts`), misclassifying earlier-today slots as upcoming and introducing timezone drift outside UTC+8. Additionally, `matchesTimeFilter = showPast || !isPastBooking` hides past `COMPLETED`, `CANCELLED`, and `NO_SHOW` bookings even when the user explicitly selects those status tabs unless "Show Past Visits" is toggled on. **Suggestion:** Use `isPastManila(b.appointmentDate, b.startTime)` and automatically include past bookings when `activeFilter` is `'COMPLETED'`, `'CANCELLED'`, or `'NO_SHOW'` (or decouple status tabs from the past toggle).
- **[Medium]** (Lines 45-53): `handleCancel` checks `err instanceof Error ? err.message : ...`; because `AxiosError` extends `Error`, `err.message` displays generic `"Request failed with status code ..."` instead of the backend error message (`response.data.message`), and `refetch()` is not awaited. **Suggestion:** Extract `(err as { response?: { data?: { message?: string } } }).response?.data?.message` before falling back, and `await refetch()`.
- **[Low]** (Lines 5, 84, 113-136, 245-252): `AlertCircle` is an unused import; the error fallback button calls `window.location.reload()` instead of `refetch()`; the `role="tablist"` filter bar lacks `aria-controls` and arrow-key navigation; and lines 245-252 nest a `<button>` inside `<Link>`. **Suggestion:** Remove `AlertCircle`, call `() => refetch()` on retry, use plain `aria-pressed` filter buttons or full tablist keyboard/ARIA semantics, and style `<Link>` directly as the CTA button.

### `frontend/src/app/(customer)/profile/page.tsx`

- **[Medium]** (Lines 19-36, 46-59): Duplicates `authApi.me()` inside `useEffect([user])` even though `AuthProvider` (`frontend/src/lib/auth.tsx`) already fetches and exposes `user` (and `ProfileForm` calls `refreshUser()`, causing a redundant second `authApi.me()` request after every profile save). When `user` becomes `null` (e.g., on logout), `userData` is not cleared, leaving stale profile data rendered; meanwhile, on initial load, `isLoading` is set to `false` while `authLoading` is still `true`, and if `user` populates before the inner `authApi.me()` completes, the page briefly flashes `"Unable to Load Profile"`, which also lacks any retry button or sign-in link. **Suggestion:** Derive `userData` directly from `useAuth()` (`user` and `refreshUser`) instead of maintaining duplicate local `userData`/`isLoading` state:
```tsx
const { user, isLoading: authLoading, refreshUser } = useAuth();
if (authLoading) return <LoadingSpinner />;
if (!user) return <ProfileErrorOrSignIn onRetry={refreshUser} />;
```
- **[Low]** (Lines 4, 61): `User` from `lucide-react` is unused, and `const isStaff = userData.role === 'ADMIN'` misnames an admin-only check. **Suggestion:** Remove the unused `User` import and rename `isStaff` to `isAdmin` (or check `['ADMIN', 'STAFF'].includes(userData.role)` if a staff role exists).

### `frontend/src/app/(public)/availability/page.tsx`

- **[Medium]** (Lines 32-37, 74-100): `availabilityApi.getAvailable()` returns studio day windows, and `handleDateClick` marks every generated 30-minute window `available: true` without querying `availabilityApi.getSlots(date)` for already-booked slots or filtering out elapsed time slots when today's date is selected (`isPast` only checks `< start of today`). In addition, `isLoading` (line 32) is unused and query errors are unhandled, silently rendering an empty calendar during loading or network failure. **Suggestion:** Render a loading skeleton while `isLoading` is true, handle API errors with a retry prompt, fetch booked/open slots via `availabilityApi.getSlots(dateStr)` on date click, and filter out slots earlier than the current Manila time when `isToday(date)` is true.
- **[Medium]** (Lines 66-70, 173-186): Unavailable calendar dates (`!available && hasData`) have `cursor-not-allowed` styling but are not `disabled`, and dates without availability records (`!hasData`) have `cursor-pointer` and are clickable, only to display `"No appointments scheduled for this date"`. Also, `avail.startTime.split(':')` / `avail.endTime.split(':')` (lines 76-77) are unguarded if malformed/missing and duplicate the slot generation logic in `BookingForm.tsx`. **Suggestion:** Disable dates where `!available` (or `!hasData`), guard time string parsing, and extract a shared `generateHalfHourSlots(startTime, endTime)` helper in `frontend/src/lib/utils.ts`.
- **[Low]** (Lines 188-190, 312-319, 329): `aria-selected={isSelected}` is used on a `<button>` outside a `gridcell`/`option` role; `<button>` is nested inside `<Link>` (lines 312-319); and policy copy at line 329 states *"12 hours prior to your slot"* whereas `BookingForm.tsx` (line 438), `services/page.tsx` (line 290), and `(public)/page.tsx` (line 488) state *"24 hours"*. **Suggestion:** Use `aria-pressed={isSelected}` on calendar day buttons, style `<Link>` directly, and unify the rescheduling cutoff copy across all pages.

### `frontend/src/app/(public)/booking/BookingForm.tsx`

- **[Critical]** (Lines 96-97, 372-401, 1571-1670): Step 4 lets users attach a payment receipt screenshot (`receiptFile`, `receiptPreview`) and explicitly states *"Receipt attached for manual verification by Atasha"*, **but `receiptFile` is never uploaded or included in `bookingsApi.create(bookingData)`**—the attachment is silently dropped on submit. Furthermore, `URL.createObjectURL(file)` (lines 1598, 1640) is never paired with `URL.revokeObjectURL(...)`, leaking blob URLs on replace/remove/unmount. **Suggestion:** Either upload `receiptFile` (e.g., via multipart `FormData` or an upload endpoint and pass its returned URL/ID in `bookingData`) or remove the misleading receipt upload UI until backend support exists, and revoke previous object URLs whenever `receiptPreview` changes or unmounts.
- **[Critical]** (Lines 309-322, 1112-1124): `filteredSlots` filters `availableSlots` using `calculateEndTime(slot.startTime, totalDuration) <= slot.endTime`. Each `slot` in `availableSlots` is a 30-minute window (`slot.endTime` is `slot.startTime + 30m`), whereas studio services have durations of 60–90 minutes (e.g., Soft Gel Extension = 90 min, Structured BIAB = 60 min). Consequently, `slotEnd > slot.endTime` for every slot whenever `totalDuration > 30`, causing `filteredSlots` to be `[]` and blocking Step 2 progression. In addition, `calculateEndTime` uses `% 24`, so a duration crossing midnight wraps to `"00:xx"`, which passes `"00:30" <= "22:00"` lexicographically. **Suggestion:** Compare against the day's overall closing time (or check contiguous open 30-minute slots from `availabilityApi.getSlots(date)`) using total minutes rather than `% 24` string comparisons:
```ts
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
// Check slotStart + totalDuration <= closingMinutes (without % 24 wrap)
```
- **[High]** (Lines 187-241, 243-294): `fetchAvailableSlots` includes `startTime` in its `useCallback` dependency array (line 241) and calls `setStartTime(...)` inside its body (lines 225, 234), while both the URL-parameter `useEffect` (line 267) and draft-restoration `useEffect` (line 294) depend on `fetchAvailableSlots`. Selecting a time slot changes `startTime`, recreates `fetchAvailableSlots`, re-triggers both effects, overwrites the user's current selections with the `localStorage` draft or URL params, and fires redundant availability fetches. On initial mount with `?service=...&date=...` query parameters, the draft restoration `useEffect` also races with and overwrites URL selections. **Suggestion:** Remove `startTime` from `fetchAvailableSlots`'s `useCallback` dependencies (pass `preferredStartTime?: string` as an argument), and merge URL-param initialization and draft fallback into a single mount effect where URL parameters take precedence over `localStorage` drafts.
- **[High]** (Lines 355-368, 555-570, 104-135): Authentication is checked only on Step 4 submit (`if (!isAuthenticated)`), and `saveBookingDraft()` only persists `selectedServices`, `appointmentDate`, `startTime`, and `endTime`. When redirected to `/login?redirect=%2Fbooking`, the user loses Step 3 consultation notes/inspiration URL, Step 4 payment reference/method, loyalty redemption selection, `receiptFile`, and any original URL query params (`?service=...`). **Suggestion:** Persist the restorable Step 3/4 text fields (`notes`, `inspirationImg`, `paymentMethod`, `paymentReference`, `redeemLoyaltyReward`, `currentStep`) in the draft (with clear guidance for receipt re-attachment), or prompt authentication before Step 3/4, and preserve `searchParams` in the `redirect` URL.
- **[High]** (Lines 966-1079): `BookingStep1`'s `ServiceCard` renders selection and deselection controls exclusively inside `{service.variants.length > 0 && (...)}` (lines 1016-1076). Any active service with zero variants (such as `Gentle Gel Removal` in `services/page.tsx`) cannot be selected or removed in Step 1. **Suggestion:** Add a card-level select/deselect button or checkbox when `service.variants.length === 0`.
- **[Medium]** (Lines 331-342, 1125): In `handleNext(2)`, calling `setStartTime(filteredSlots[0].startTime)` is asynchronous, so the immediate `if (startTime)` check reads the stale `''` closure value—forcing users to click "Continue" twice when relying on auto-selection, and `step2Form.trigger()` is never called to surface validation errors. Also, `today` (line 1125) uses UTC (`new Date().toISOString().split('T')[0]`), which is off by one day between 00:00 and 08:00 Manila time (UTC+8). **Suggestion:** Track the resolved `resolvedStartTime` in a local variable before advancing, call `await step2Form.trigger()`, and compute `today`/`maxDate` in the `Asia/Manila` timezone.
- **[Medium]** (Lines 178-184, 218-237): When `availabilityApi.getAvailable()` has no record for a chosen date or fails with a network/server error, `fetchAvailableSlots` silently falls back to `generateDefaultSlots()` (08:00–22:00), presenting closed studio dates or API outages as fully bookable; `servicesError` (line 178) is also ignored, and Step 1's error retry (line 886) reloads the whole page. **Suggestion:** Only display slots when the API confirms availability for that date, show an explicit error/retry state using `refetch` when availability or services fail to load, and distinguish empty catalogs from API errors.
- **[Medium]** (Lines 300-305, 364-368, 709, 806, 820, 1453-1476): `totalDuration` omits `selected.quantity`; `variant?.price || s.basePrice` uses `||` instead of `??` (falling back if a variant costs `0`); and when `redeemLoyaltyReward` is checked, `AppointmentSummaryCard` displays `₱0.00` for both downpayment and balance even with multiple services selected, while Step 4 and `handleSubmit` still require a GCash/Maya `paymentReference` and agreement to pay ₱100.00. **Suggestion:** Multiply duration by `selected?.quantity || 1`, use `??` for price fallback, and align reward-redemption pricing/payment reference rules with the backend contract.
- **[Low]** (Lines 12, 94, 386-387, 393, 555-570, 1145-1565): Unused `Banknote` import and unused `response` variable; `paymentMethod` includes `'CASH'` which is unrendered in UI and absent from `PaymentMethod` in `types/api.ts`; sends both `inspirationImg` and `inspirationImage`; the 1,723-line file duplicates `calculateEndTime`/`filteredSlots` (lines 309-322 vs 1112-1124) and receipt file validation (lines 1586-1600 vs 1628-1642); auth modal nests `<button>` inside `<Link>`; and multiple `<label>` elements lack `htmlFor` attributes. **Suggestion:** Split steps into separate files, deduplicate slot/file helpers, remove dead imports/fields, and add `htmlFor`/`id` pairs and direct `<Link>` styling.

### `frontend/src/app/(public)/booking/page.tsx`

- **[Info]** (Lines 1-30): Marked `'use client'` despite having no client hooks, state, or event handlers (it only wraps `<BookingForm />` in `<Suspense>`). **Suggestion:** Remove `'use client'` so `BookingPage` renders as a Server Component shell around the client `BookingForm`.

### `frontend/src/app/(public)/gallery/page.tsx`

- **[High]** (Lines 132-135): `useQuery` (`frontend/src/hooks/useApi.ts`) does not accept a query key or re-run when `queryFn`'s captured parameters change. Consequently, changing `search` (`debouncedSearch`) or `category` never re-fetches `galleryApi.getPublic({ search: debouncedSearch, category: category || undefined })`; only the initial mount request runs, and all subsequent filtering occurs client-side over the initial payload + fallback array. **Suggestion:** Update `useQuery` to accept a `deps` array (or pass `[debouncedSearch, category]`) if server-side search/filtering is intended, or fetch once with `galleryApi.getPublic()` without unused reactive parameters.
- **[Medium]** (Lines 349-359, 431-437): Both `"Reserve This Treatment"` and `"Select Design"` navigate to `/booking?design=${encodeURIComponent(item.title)}`, **but `BookingForm.tsx` (lines 245-247) never reads `searchParams.get('design')`**, so the chosen lookbook design is silently lost when arriving at `/booking`. **Suggestion:** Read `searchParams.get('design')` in `BookingForm.tsx` (e.g., to prefill consultation notes or `inspirationImg` with the selected lookbook item) or pass a `service` ID as well.
- **[Medium]** (Lines 138-177): `localGalleryFallback` is always merged into the grid even when live API entries succeed or when searching/filtering, and the `GEL` category filter (line 169) omits `'GEL OVERLAY'` and `'STUDIO CRAFT'` aliases present in `formatCategory` (lines 45-48). Also, query `error` is ignored with no user-facing error or retry option. **Suggestion:** Display an error banner when `galleryApi.getPublic` fails (or use fallbacks only when API items are empty), and normalize category aliases in a single mapping table.
- **[Medium]** (Lines 304, 349-358, 384-440): `GalleryItem` uses a clickable `<div onClick={onClick}>` (inaccessible to keyboard users) with nested interactive `<button>` and `<Link>` controls inside an `opacity-0 group-hover:opacity-100` overlay that is hidden on touch devices and keyboard focus. The preview `Modal` (line 304) also omits a `title` prop for `aria-labelledby` and nests `<button>` inside `<Link>`. **Suggestion:** Use a semantic `<button>` or visible card footer for touch/keyboard access, reveal overlay controls on `focus-within`, pass a `title` (or accessible `sr-only` title) to `Modal`, and style `<Link>` directly instead of wrapping a `<button>`.
- **[Low]** (Lines 314-318, 389-394): Uses raw `<img>` tags without `next/image` optimization or `onError` image fallback handling. **Suggestion:** Migrate to `next/image` (`<Image>`) with appropriate `sizes` and an error/placeholder fallback.

### `frontend/src/app/(public)/layout.tsx`

**Status:** Clean — no issues found.

### `frontend/src/app/(public)/page.tsx`

- **[Medium]** (Lines 302-304): Service rows link to `/services#${service.id}`, **but `ServiceCard` in `frontend/src/app/(public)/services/page.tsx` does not set `id={service.id}`**, so deep links fail to scroll to the selected treatment. **Suggestion:** Add `id={service.id}` (and `scroll-mt-24` for the sticky header) to the root `<Card>` in `services/page.tsx`.
- **[Low]** (Lines 23-78, 84-104, 107-169, 172-189): `localGalleryFallback` and `defaultServicesFallback` are re-allocated inside the component on every render and omitted from the `useMemo` dependency arrays (lines 104, 189); they also duplicate fallback catalogs in `gallery/page.tsx` and `services/page.tsx` with divergent category names, titles, and variants. **Suggestion:** Hoist fallback data to a shared module-level constant if fallbacks are retained, and unify category/title constants across public pages.
- **[Low]** (Lines 13-20, 488, 561): Query `error` states for services and gallery are unhandled (silently displaying hardcoded fallback prices that can drift from studio rates), and the page contradicts its own rescheduling policy (*"24 hours in advance"* at line 488 vs *"12-hr advance rescheduling"* at line 561). **Suggestion:** Surface a subtle notice if live catalog data fails to load, and align both sections with the actual backend rescheduling cutoff.
- **[Low]** (Lines 225-240, 248, 404, 542-557): Nests `<button>` inside `<Link>` on primary CTAs and uses raw `<img>` tags instead of `next/image` (missing `priority` preloading on the above-the-fold hero image). **Suggestion:** Style `<Link>` directly as buttons and use `next/image` with `priority` for the hero image.

### `frontend/src/app/(public)/services/page.tsx`

- **[Medium]** (Lines 141-142, 465-475): When `rawServices.length === 0` (without an error), `services` falls back to `defaultServicesFallback` with synthetic IDs (`'service-extension'`, `'service-gel'`, etc.). Clicking `"Select Treatment"` navigates to `/booking?service=service-extension`, which fails UUID validation (`bookingServiceSchema` in `frontend/src/lib/validations.ts`) and fails to match any live service in `BookingForm`. Also does not filter `s.isActive` (unlike `(public)/page.tsx`). **Suggestion:** Filter `rawServices.filter((s) => s.isActive)` and show an empty catalog state rather than synthetic non-UUID fallback IDs linked into `/booking`.
- **[Medium]** (Lines 273-279): `ServiceCard` does not render `id={service.id}` on its `<Card>`, breaking `/services#${service.id}` anchor navigation from `(public)/page.tsx` line 304. **Suggestion:** Pass `id={service.id}` and `className="scroll-mt-24 ..."` to `<Card>`.
- **[Low]** (Lines 210, 214-221, 242-259, 290, 293-308, 465-475): Error state calls `window.location.reload()` instead of `useQuery`'s `refetch`; `<button>` is nested inside `<Link>` in multiple places; `role="tablist"` lacks `aria-controls` and arrow-key navigation; and line 290 states *"24 hours in advance"*, conflicting with `availability/page.tsx` line 329 (*"12 hours"*). **Suggestion:** Use `refetch()` on retry, style `<Link>` directly, add full tablist ARIA/keyboard support or use filter buttons with `aria-pressed`, and standardize the rescheduling window text.

### `frontend/src/app/(staff)/scanner/page.tsx`

- **[High]** (Lines 1-103): **Missing authentication and role-based access guard.** Neither `scanner/page.tsx`, a `(staff)/layout.tsx`, nor `src/middleware.ts` checks `useAuth()` (`isAuthenticated` / staff or `ADMIN` role). Any anonymous visitor or customer navigating directly to `/scanner` loads the staff scanner page and immediately initializes the camera via `QRScanner`. **Suggestion:** Gate the page (or a shared `(staff)/layout.tsx`) on `useAuth()`, redirecting unauthenticated users to `/login?redirect=/scanner` and denying non-staff/non-admin roles before mounting `<QRScanner />`.
- **[Medium]** (Lines 8-32): **Wake Lock cleanup race & missing re-acquisition:** `requestWakeLock().then(...)` runs asynchronously without a cancellation flag; if the component unmounts before `wakeLock.request('screen')` resolves, `wakeLockInstance` is still `null` during cleanup and the acquired `WakeLockSentinel` is never released. In addition, browsers automatically release screen wake locks when a tab loses visibility, and no `visibilitychange` listener re-acquires the lock when returning. The effect also uses `any` casts (`(navigator as any).wakeLock`, `wakeLockInstance: any`). **Suggestion:** Track an `isMounted` flag, re-acquire on `visibilitychange` when `document.visibilityState === 'visible'`, and type `WakeLockSentinel` properly:
```tsx
let active = true;
let sentinel: WakeLockSentinel | null = null;
const acquire = async () => {
  if (!('wakeLock' in navigator) || !active) return;
  try {
    const lock = await navigator.wakeLock.request('screen');
    if (active) sentinel = lock;
    else await lock.release();
  } catch (err) {
    console.warn('Wake Lock unavailable:', err);
  }
};
```
- **[Medium]** (Lines 85-91): Displays *"Works offline - scans are cached and synced when connection restores"*, which is false: inspecting `frontend/src/components/staff/QRScanner.tsx` confirms scans call `loyaltyApi.addStampAsStaff(decodedText)` directly with no offline queue, local storage cache, or background sync. **Suggestion:** Either implement an offline scan queue with background sync or replace this banner with an accurate online-connection requirement notice.
- **[Low]** (Lines 40-42, 62, 68, 76, 88): The static page header renders `<Loader2 className="h-6 w-6 text-rose-800 dark:text-rose-300 animate-spin" />` unconditionally, making the header look permanently stuck in a loading state; instructions also use raw emojis (`📋`, `📱`) and unescaped apostrophes (`customer's`). **Suggestion:** Replace `Loader2` in the header with a static icon such as `QrCode` or `ScanLine`, use Lucide icons instead of raw emojis, and escape apostrophes or use `&rsquo;`.

---

## 5. Frontend Components — Admin & Auth

This audit covers 27 React client components and barrel/helper modules under `frontend/src/components/admin/` and `frontend/src/components/auth/` (4 barrel files are clean, and 23 files contain findings totaling 0 Critical, 8 High, 18 Medium, 41 Low, and 8 Info issues). The most severe risks are unvalidated `redirect` parameters enabling Open Redirects in auth forms, Stored XSS via unvalidated `inspirationUrl` links, a StrictMode double-verification race condition in email verification, silenced API errors in booking status transitions, and camera/table rendering bugs in the admin UI.

### Findings Summary Table

| File | C / H / M / L / I | Top Issues |
| :--- | :---: | :--- |
| `frontend/src/components/admin/AdminErrorBanner.tsx` | 0 / 0 / 0 / 3 / 0 | Redundant `visibleErrors` state, nested `role="alert"`, icon spacing/class typo |
| `frontend/src/components/admin/BookingDetailsDrawer.tsx` | 0 / 1 / 2 / 3 / 1 | Unvalidated `inspirationUrl` `href` (XSS), `paymentStatus` missing `PENDING`, falsy-zero `downpayment` |
| `frontend/src/components/admin/CompletionQRModal.tsx` | 0 / 0 / 0 / 2 / 0 | Unused `appointmentDate`/`qrRef`, shared `copied` state + uncleaned timeout |
| `frontend/src/components/admin/DashboardStats.tsx` | 0 / 0 / 0 / 1 / 0 | Misleading card labels vs displayed metrics |
| `frontend/src/components/admin/DataTable.tsx` | 0 / 0 / 1 / 2 / 0 | `useState(useMemo(...))` ignores `columns` updates, unused imports/props, dropdown a11y |
| `frontend/src/components/admin/QrScannerModal.tsx` | 0 / 2 / 2 / 3 / 0 | Silent failure without `BarcodeDetector`, `getUserMedia` stream leak, scan loop halts on miss |
| `frontend/src/components/admin/RecentBookings.tsx` | 0 / 0 / 1 / 1 / 1 | Missing `row.services` null guard, generic `/admin/bookings` action link |
| `frontend/src/components/admin/RevenueChart.tsx` | 0 / 0 / 0 / 1 / 1 | Negative left margin clips `YAxis` ticks, duplicate `findIndex` |
| `frontend/src/components/admin/bookings/BookingFilters.tsx` | 0 / 0 / 0 / 2 / 0 | Unconstrained date range inputs, status chips missing `aria-pressed` |
| `frontend/src/components/admin/bookings/BookingsTable.tsx` | 0 / 0 / 2 / 2 / 1 | `paymentStatus` misses `PENDING_VERIFICATION`, falsy-zero `downpayment`, hardcoded page size `10` |
| `frontend/src/components/admin/bookings/StatusAction.tsx` | 0 / 0 / 2 / 2 / 0 | Non-accessible `<Badge onClick>` trigger, missing `type="button"` and menu ARIA |
| `frontend/src/components/admin/bookings/index.ts` | 0 / 0 / 0 / 0 / 0 | Clean |
| `frontend/src/components/admin/bookings/types.ts` | 0 / 1 / 1 / 1 / 0 | Blind `catch {}` masks real API errors, `CANCELLED` drops `reason` |
| `frontend/src/components/admin/customers/CustomerNoteModal.tsx` | 0 / 0 / 1 / 2 / 0 | `nickname` input never sent to `adminApi.addCustomerNote` |
| `frontend/src/components/admin/customers/CustomersTable.tsx` | 0 / 1 / 1 / 1 / 1 | Responsive `hidden` classes on `<td>` only (header misalignment), inconsistent `isBlocked` |
| `frontend/src/components/admin/customers/index.ts` | 0 / 0 / 0 / 0 / 0 | Clean |
| `frontend/src/components/admin/gallery/GalleryForm.tsx` | 0 / 0 / 1 / 1 / 1 | `new URL()` accepts `javascript:`/`data:` schemes, diverges from `gallerySchema` |
| `frontend/src/components/admin/gallery/GalleryGrid.tsx` | 0 / 0 / 1 / 1 / 0 | Card actions hidden behind hover-only overlay (touch/keyboard inaccessible) |
| `frontend/src/components/admin/gallery/index.ts` | 0 / 0 / 0 / 0 / 0 | Clean |
| `frontend/src/components/admin/reports/ReportsView.tsx` | 0 / 0 / 2 / 3 / 1 | CSV formula injection (CWE-1236), `encodeURI` `#` truncation, unguarded nested fields |
| `frontend/src/components/admin/services/ServiceForm.tsx` | 0 / 0 / 1 / 1 / 1 | Duplicate variant tier names allowed, `Modal` closable while submitting |
| `frontend/src/components/admin/services/index.ts` | 0 / 0 / 0 / 0 / 0 | Clean |
| `frontend/src/components/auth/ForgotPasswordForm.tsx` | 0 / 0 / 0 / 3 / 0 | Unused imports, fragile error string matching, OAuth buttons on reset sheet |
| `frontend/src/components/auth/LoginForm.tsx` | 0 / 1 / 0 / 1 / 0 | Open Redirect via unvalidated `redirect` query param (CWE-601) |
| `frontend/src/components/auth/RegisterForm.tsx` | 0 / 1 / 0 / 1 / 0 | Open Redirect via unvalidated `redirect` query param (CWE-601), untrimmed `phone` |
| `frontend/src/components/auth/ResetPasswordForm.tsx` | 0 / 0 / 0 / 2 / 0 | Case-sensitive error string matching, OAuth buttons on token-gated reset page |
| `frontend/src/components/auth/VerifyEmailForm.tsx` | 0 / 1 / 0 / 2 / 0 | `useEffect` double verification race condition on single-use token, dead code |
| **Total (27 files)** | **0 / 8 / 18 / 41 / 8** | **75 total findings across 23 files (4 clean)** |

---

### `frontend/src/components/admin/AdminErrorBanner.tsx`

- **[Low]** (Lines 22-27): `visibleErrors` duplicates the `errors` prop via `useState(errors)` + `useEffect`, triggering an extra render on every prop update without adding local mutations. **Suggestion:** Remove `visibleErrors` and read `errors` directly.
- **[Low]** (Lines 52-53, 64): The outer container sets `role="alert" aria-live="polite"`, and each child banner also sets `role="alert"` (which implies `aria-live="assertive"`), while returning `null` at line 42 unmounts the live region completely. **Suggestion:** Keep a persistent `aria-live="polite"` container mounted and use `role="alert"` only on individual alert items (or drop the inner `role="alert"`).
- **[Low]** (Lines 66, 98): The icon wrapper at line 66 lacks horizontal padding (`pl-3.5 py-3.5`), leaving the `AlertCircle` icon flush against the left border, and line 98 uses non-standard Tailwind classes `h-4.5 w-4.5`. **Suggestion:** Add `pl-3.5 py-3.5` to the icon container and use `h-4 w-4` (or `size-[18px]`).

### `frontend/src/components/admin/BookingDetailsDrawer.tsx`

- **[High]** (Lines 145, 550, 692, 700): `inspirationUrl` (from `booking.inspirationImg` / `booking.inspirationImage`) is passed unvalidated into `<a href={inspirationUrl} target="_blank" rel="noreferrer">` and `<img>`. If a stored URL uses `javascript:` or `data:text/html`, clicking "Open original in new tab" executes script in the admin's session. **Suggestion:** Validate URLs with an allowlist (`http:`/`https:` or single-slash relative paths) before rendering `<a>` / `<img>`, and use `rel="noopener noreferrer"`:
  ```ts
  function getSafeMediaUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
    } catch {
      return null;
    }
  }
  ```
- **[Medium]** (Lines 151, 471-482): `paymentStatus` only renders distinct states for `'PAID'` and `'PENDING_VERIFICATION'`, causing `'PENDING'`, `'FAILED'`, `'REFUNDED'`, and `'FORFEITED'` (all valid `PaymentStatus` values in `types/api.ts`) to fall through to `'Unpaid'`. This also diverges from `BookingsTable.tsx`, which checks `'PENDING'`. **Suggestion:** Map both `'PENDING'` and `'PENDING_VERIFICATION'` to the pending-review badge, and render explicit labels for `'FAILED'`, `'REFUNDED'`, and `'FORFEITED'`.
- **[Medium]** (Line 152): `const downpaymentAmount = booking.downpayment || payment?.amount || 10000;` uses logical OR (`||`), so a `0` downpayment (e.g., loyalty-redeemed or waived deposit) is treated as falsy and rendered as `₱100.00` (`10000`). **Suggestion:** Use nullish coalescing:
  ```ts
  const downpaymentAmount = booking.downpayment ?? payment?.amount ?? 10000;
  ```
- **[Low]** (Lines 93, 162): `copiedRef` and its `setTimeout` reset are not cleaned up on unmount or reset when `booking.id` changes, so switching bookings within 2 seconds carries over `"Copied"`. **Suggestion:** Reset `copiedRef` in a `useEffect` keyed on `booking?.id` and clear the timeout ref on unmount.
- **[Low]** (Lines 50-82, 214-229, 713-790): `getRestrainedStatusBadge`, `getSentenceStatusLabel`, and the Cancel/No-Show reason modal are duplicated across `BookingDetailsDrawer.tsx`, `BookingsTable.tsx`, and `StatusAction.tsx`. **Suggestion:** Extract shared status badge/label helpers and a reusable `BookingReasonModal` component into `admin/bookings/`.
- **[Low]** (Lines 545-548): The inspiration image preview wrapper is a clickable `<div>` with `onClick` and no `role="button"`, `tabIndex={0}`, or `onKeyDown` handler. **Suggestion:** Replace with a `<button type="button">` wrapper (or rely solely on the dedicated button).
- **[Info]** (Line 149): Uses `(booking as unknown as Record<string, unknown>).paymentMethod` instead of adding `paymentMethod?: string` to `BookingDetailsData` in `bookings/types.ts`.

### `frontend/src/components/admin/CompletionQRModal.tsx`

- **[Low]** (Lines 23, 34, 122): `appointmentDate` is declared in `CompletionQRModalProps` but never used, and `qrRef` is created and attached to the QR container without ever being read. **Suggestion:** Either render `appointmentDate` in the metadata card or remove the unused prop and `qrRef`.
- **[Low]** (Lines 33, 46, 57, 153, 217): Both `handleCopyPayload` and `handleCopyManualCode` mutate the same `copied` boolean without tracking which action occurred or clearing `setTimeout` on unmount/booking change, causing the `"Copy"` and `"Copy payload"` buttons to display `"Copied"` even when `"Copy manual code"` was clicked. **Suggestion:** Track `copiedTarget: 'payload' | 'manual' | null` and clear the timer in a cleanup effect.

### `frontend/src/components/admin/DashboardStats.tsx`

- **[Low]** (Lines 25-28, 32-35, 47-51): Card titles do not match the underlying data: `"Monthly revenue"` renders `stats.totalRevenue` (with meta `"All-time studio revenue recorded"`), `"Today's queue"` renders `stats.pendingBookings` (all pending bookings regardless of date), and `"Stamps issued"` falls back to `stats.loyaltyActive` (active card count rather than stamp count). **Suggestion:** Align card labels with the actual DTO fields or pass period-specific stats from the backend.

### `frontend/src/components/admin/DataTable.tsx`

- **[Medium]** (Lines 65-73, 78): `useState<ColumnToggleState>(useMemo(..., [columns]))` only reads `useMemo` on initial mount; if `columns` changes dynamically to add new columns, `columnVisibility[col.key]` is `undefined` (falsy), causing `visibleColumns` to silently hide those columns. **Suggestion:** Sync new column keys into `columnVisibility` via `useEffect` or derive missing keys as `true` (`columnVisibility[col.key] ?? true`):
  ```ts
  const visibleColumns = useMemo(
    () => columns.filter((col) => columnVisibility[col.key] ?? true),
    [columns, columnVisibility]
  );
  ```
- **[Low]** (Lines 4, 6, 18, 20): Imports `EyeOff` and `Badge` without using them, and declares `accessor` and `hidePriority` on `DataTableColumn<T>` where `accessor` is unused and `hidePriority` only gates the toggle menu rather than responsive hiding. **Suggestion:** Remove unused imports/fields or wire them up.
- **[Low]** (Lines 187-233): The column visibility dropdown has no `Escape` key handler and lacks `role="menu"` / keyboard focus management. **Suggestion:** Close the menu on `Escape` and return focus to the trigger button.

### `frontend/src/components/admin/QrScannerModal.tsx`

- **[High]** (Lines 80-90, 115-140, 156-175): `BarcodeDetector` is not supported in Safari, iOS Safari, or Firefox. When `'BarcodeDetector' in window` is false, `barcodeDetectorRef.current` stays `null`, yet `startCamera()` still requests camera permission, displays the live video feed, and `startScanningLoop()` immediately returns at line 158 with no warning or fallback to manual search. **Suggestion:** Check `barcodeDetectorRef.current` (or bundle a JS QR decoder fallback like `jsqr`) before starting the camera, and display a clear `cameraError` message prompting manual search when unsupported.
- **[High]** (Lines 93-103, 115-139): `startCamera` awaits `navigator.mediaDevices.getUserMedia(...)`. If the modal closes or the user switches to `'manual'` while the promise is pending, `stopCamera()` runs while `srcObject` is still `null`, and the resolved stream is later attached without being stopped—leaking an active camera `MediaStream`. **Suggestion:** Track an `isCancelled` / `activeSessionRef` guard across the `await` and immediately stop all tracks if the effect has cleaned up:
  ```ts
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  if (cancelled || !videoRef.current) {
    stream.getTracks().forEach((t) => t.stop());
    return;
  }
  ```
- **[Medium]** (Lines 164-166, 192-194): When a QR code is detected that does not match any card, `handleScannedCode` shows an error toast and `startScanningLoop` exits (`return;` at line 165) without scheduling another frame, permanently freezing scanning while the camera remains open. **Suggestion:** Only stop the loop on a successful match; otherwise throttle errors (e.g., 1.5–2s cooldown) and continue `requestAnimationFrame(detect)`.
- **[Medium]** (Lines 177-186): `cleanCode.includes(c.id.toLowerCase()) || cleanCode.includes(c.userId.toLowerCase())` performs loose substring matching, and scanning only searches the `cards` prop (typically a single paginated page of cards). **Suggestion:** Parse expected QR prefix formats explicitly and query the backend lookup endpoint when a scanned code is not in the loaded page.
- **[Low]** (Lines 10, 13, 17, 18): Unused imports `QrCode`, `AlertCircle`, `Loader2`, and `X`. **Suggestion:** Remove unused imports.
- **[Low]** (Lines 217-252): `handleQuickIssue` and `handleApproveReward` wrap `await onIssueStamps(...)` / `await onRedeemReward(...)` in `try/finally` with no `catch`, producing unhandled promise rejections if the parent callback throws. **Suggestion:** Add a `catch` block that surfaces an error toast.
- **[Low]** (Lines 415-433): The stamp quantity `-` and `+` icon buttons lack `aria-label` attributes. **Suggestion:** Add `aria-label="Decrease stamp quantity"` and `aria-label="Increase stamp quantity"`.

### `frontend/src/components/admin/RecentBookings.tsx`

- **[Medium]** (Lines 23, 54): `row.services[0]?.service?.name` and `row.services.map(...)` assume `row.services` is always defined; if any booking record omits `services`, rendering throws a `TypeError`. **Suggestion:** Guard with `row.services?.[0]` and `(row.services ?? []).map(...)`.
- **[Low]** (Lines 86-93): `renderRowActions` accepts `row: BookingDto` (unused) and links every `"Review"` button to `/admin/bookings` instead of deep-linking to the specific booking. **Suggestion:** Pass `?bookingId=${row.id}` (or omit the unused `row` parameter if intentional).
- **[Info]** (Line 56): Uses array index `i` as React `key` instead of `s.id || i`.

### `frontend/src/components/admin/RevenueChart.tsx`

- **[Low]** (Line 135): `<BarChart margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>` combined with the default `YAxis` width can clip currency labels (`₱...`) on the left edge of the chart. **Suggestion:** Remove the negative `left` margin or set an explicit `YAxis` `width` (e.g., `width={64}`).
- **[Info]** (Lines 114-116): Calls `chartData.findIndex((d) => d.isCurrentPeriod)` twice instead of caching the result in a local variable.

### `frontend/src/components/admin/bookings/BookingFilters.tsx`

- **[Low]** (Lines 90-118): `startDate` and `endDate` date inputs have no `max={endDate || undefined}` / `min={startDate || undefined}` bounds, allowing invalid ranges where `startDate > endDate`. **Suggestion:** Bind `max={endDate || undefined}` on start date and `min={startDate || undefined}` on end date.
- **[Low]** (Lines 129-142): Status toggle chips do not expose `aria-pressed={isSelected}` to assistive technologies. **Suggestion:** Add `aria-pressed={isSelected}` to each chip button.

### `frontend/src/components/admin/bookings/BookingsTable.tsx`

- **[Medium]** (Line 173): `const paymentStatus = payment?.status || (extRow.paymentReference ? 'PENDING' : 'UNPAID');` and line 183 (`paymentStatus === 'PENDING'`) omit `'PENDING_VERIFICATION'`, causing payments with `status: 'PENDING_VERIFICATION'` (and no top-level `paymentReference`) to render as `'Unpaid'`. **Suggestion:** Handle both `'PENDING'` and `'PENDING_VERIFICATION'` consistently with `BookingDetailsDrawer.tsx`.
- **[Medium]** (Line 174): `const depositAmount = row.downpayment || payment?.amount || 10000;` uses `||` instead of `??`, turning a `0` downpayment into `10000` (₱100.00). **Suggestion:** Replace `||` with `??`.
- **[Low]** (Lines 77, 272): Queue numbering hardcodes a page size of `10` (`currentPage * 10 + index + 1`), and `renderMobileCard` runs an O(N) `bookings.indexOf(row)` per card. **Suggestion:** Accept a `pageSize = 10` prop and pass `index` into `renderMobileCard` (or precompute/avoid `indexOf`).
- **[Low]** (Lines 31-63): Duplicates `getRestrainedStatusBadge` and `getSentenceStatusLabel` from `BookingDetailsDrawer.tsx`. **Suggestion:** Share these helpers from `bookings/types.ts` or a dedicated status utility module.
- **[Info]** (Lines 433-434): Passes `mobileCardTitleKey="customer"` and `mobileCardSubtitleKey="datetime"` which are ignored when `renderMobileCard` is provided (and do not exist on `BookingDto`).

### `frontend/src/components/admin/bookings/StatusAction.tsx`

- **[Medium]** (Lines 137-150): Uses `<Badge onClick={...}>` as the interactive dropdown trigger instead of a `<button>`, so keyboard users cannot focus or activate the status menu via `Tab` / `Enter` / `Space`. **Suggestion:** Wrap or render a `<button type="button" aria-haspopup="menu" aria-expanded={isOpen}>` trigger around the badge.
- **[Medium]** (Lines 154-188): Dropdown menu option `<button>` elements lack `type="button"` (risking form submission if placed inside a `<form>`), `role="menu"` / `role="menuitem"`, and `Escape` key dismissal. **Suggestion:** Add `type="button"`, menu ARIA roles, and an `Escape` listener.
- **[Low]** (Lines 20-26, 158-168): Allows selecting any status even from terminal states (`CANCELLED`, `NO_SHOW`, `COMPLETED`), contradicting `BookingDetailsDrawer.tsx` lines 668-675. **Suggestion:** Disable or hide invalid transitions based on `currentStatus`.
- **[Low]** (Lines 28-60, 193-276): Duplicates status styling/label helpers and the Cancel/No-Show reason modal from `BookingDetailsDrawer.tsx`. **Suggestion:** Consolidate with `BookingDetailsDrawer.tsx`.

### `frontend/src/components/admin/bookings/index.ts`

**Status:** Clean — no issues found.

### `frontend/src/components/admin/bookings/types.ts`

- **[High]** (Lines 32-78): `transitionBookingStatus` catches every error (`catch {}`)—including HTTP `400`, `401`, `403`, `409`, and `500` responses—and blindly retries a secondary endpoint (`/bookings/${bookingId}/status`), which is not even defined in `bookingsApi`. This masks the actual backend validation/conflict error message with a secondary 404/405 failure. **Suggestion:** Only fall back on `404`/`405` (or remove the legacy fallback entirely and surface the primary error):
  ```ts
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 404 && status !== 405) throw err;
    ...
  }
  ```
- **[Medium]** (Lines 52-63): When `newStatus === 'CANCELLED'`, `api.put(\`/admin/bookings/\${bookingId}/cancel\`)` omits `{ reason }` in the request body, discarding the cancellation reason collected by `BookingDetailsDrawer` and `StatusAction`. **Suggestion:** Pass `{ reason: reason || undefined }` (or `reason ? { reason } : undefined`) to the `/cancel` endpoint.
- **[Low]** (Line 1): Unused import `CustomerListDto`. **Suggestion:** Remove `CustomerListDto` from the import list.

### `frontend/src/components/admin/customers/CustomerNoteModal.tsx`

- **[Medium]** (Lines 30, 46, 48, 120-131): Renders a `"Customer nickname"` input (`nickname`) and forwards it to `onSaveSuccess`, but `adminApi.addCustomerNote(customer.id, { content: note.trim() })` only sends `content` and never persists `nickname` to the backend. **Suggestion:** Include `nickname` in the API payload (and `CustomerNoteRequest` type) or persist it via the customer/profile update endpoint so edits are not lost on reload.
- **[Low]** (Lines 33-38): `useEffect` resets `note` and `nickname` on `[isOpen, initialNickname]` without `customer?.id`, so switching customers while open retains stale form input. **Suggestion:** Add `customer?.id` to the dependency array.
- **[Low]** (Lines 137-145): `<Textarea>` omits `maxLength={1000}` (unlike `customerNoteSchema` in `lib/validations.ts`). **Suggestion:** Add `maxLength={1000}` and display a character counter or validation error if exceeded.

### `frontend/src/components/admin/customers/CustomersTable.tsx`

- **[High]** (Lines 302, 317, 325, 333): Columns set responsive visibility classes (`hidden sm:table-cell`, `hidden md:table-cell`, `hidden lg:table-cell`) only on `className` (`<td>`) and not on `headerClassName` (`<th>`). Because `DataTable` applies `headerClassName` to `<th>` and `className` to `<td>`, `<th>` headers remain visible while `<td>` cells hide on `sm`/`md` screens, misaligning columns. **Suggestion:** Apply the same responsive `hidden ... table-cell` classes to `headerClassName` for each of those columns.
- **[Medium]** (Lines 44-46, 93-95, 151-155): `renderStatus` uses `blockedCustomerIds ? blockedCustomerIds.has(row.id) : row.role === 'BLOCKED'`, whereas `renderActions` uses `blockedCustomerIds?.has(row.id) || row.role === 'BLOCKED'`. When `blockedCustomerIds` overrides `row.role` (e.g., optimistic unblock), the badge shows `"Active"` while the action button still shows `"Unblock customer"`. **Suggestion:** Extract a single `isCustomerBlocked(row)` helper used by both `renderStatus` and `renderActions`.
- **[Low]** (Lines 5, 44-46): Unused `Skeleton` import on line 5 and unused `isBlocked` variable inside `renderCustomer` (lines 44-46). **Suggestion:** Remove both.
- **[Info]** (Lines 60, 187, 351-352): Uses non-standard `py-0.2` utility class and passes unused `mobileCardTitleKey`/`mobileCardSubtitleKey` props alongside `renderMobileCard`.

### `frontend/src/components/admin/customers/index.ts`

**Status:** Clean — no issues found.

### `frontend/src/components/admin/gallery/GalleryForm.tsx`

- **[Medium]** (Lines 97-104): `validateForm` checks `new URL(formData.imageUrl)`, which succeeds for `javascript:alert(1)` and `data:text/html,...` URLs. **Suggestion:** Restrict `parsed.protocol` to `http:` or `https:` (and ensure relative paths satisfy `startsWith('/') && !startsWith('//')`).
- **[Low]** (Lines 87-118): Custom `validateForm` diverges from `gallerySchema` in `lib/validations.ts` (`STUDIO_CATEGORIES` includes `VELVET_CAT_EYE` and `FRENCH_CONTOUR`, and `title` min-length 2 / `description` max-length 500 validation are omitted); `handleSubmit` also submits untrimmed `title`/`description` and lacks error handling if `onSubmit` rejects. **Suggestion:** Align category enums with the backend/schema, trim string fields before calling `onSubmit`, and handle submission errors cleanly.
- **[Info]** (Line 46): `errors` is typed `Partial<GalleryRequest>` (so `errors.isActive` would be `boolean`) instead of `Partial<Record<keyof GalleryRequest, string>>`.

### `frontend/src/components/admin/gallery/GalleryGrid.tsx`

- **[Medium]** (Lines 251-280): Card actions (`View details`, `Edit design`, `Delete design`) are placed inside an overlay with `opacity-0 group-hover:opacity-100`, making them invisible on touch devices and hidden for keyboard focus navigation. **Suggestion:** Add `group-focus-within:opacity-100` and keep actions accessible on touch viewports (e.g., `opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100`).
- **[Low]** (Lines 132-136, 235-240): `<img>` tags lack an `onError` fallback when an external `imageUrl` fails to load. **Suggestion:** Handle `onError` to display a clean placeholder state.

### `frontend/src/components/admin/gallery/index.ts`

**Status:** Clean — no issues found.

### `frontend/src/components/admin/reports/ReportsView.tsx`

- **[Medium]** (Lines 121-125): CSV export writes `service.serviceName` and `periodLabel` without neutralizing spreadsheet formula prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`), exposing admins who open the file in Excel/Sheets to CSV Formula Injection (CWE-1236). **Suggestion:** Prefix cells starting with `[=+\-@\t\r]` with `'`:
  ```ts
  const sanitizeCsvCell = (val: string | number) => {
    const str = String(val);
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  ```
- **[Medium]** (Lines 121-131): Builds a `data:text/csv;charset=utf-8,` URI using `encodeURI(csvContent)`. `encodeURI` does not escape `#`, so any service name containing `#` truncates the exported CSV at the fragment delimiter. **Suggestion:** Create a `Blob` (`new Blob([csvBody], { type: 'text/csv;charset=utf-8;' })`) and download via `URL.createObjectURL(blob)` + `URL.revokeObjectURL`.
- **[Low]** (Lines 93-95, 111-118, 136-165, 582, 665): Direct access to `reports.loyaltyStats` and `reports.topServices` without nullish fallbacks can crash on partial payloads; line 582 uses a magic fallback `150000` (`₱1,500`) to fabricate redeemed reward value when `avgPerBooking` is 0; and `const isTopRank = index === 0;` (line 665) is dead code. **Suggestion:** Guard `loyaltyStats`/`topServices` with optional chaining/defaults, avoid fabricating monetary totals from magic constants, and remove `isTopRank`.
- **[Low]** (Line 421): `<ResponsiveContainer>` is rendered unconditionally without an `isMounted` client-only guard (unlike `RevenueChart.tsx`), which can trigger Recharts SSR width/height `-1` warnings. **Suggestion:** Guard chart rendering behind an `isMounted` state.
- **[Low]** (Lines 184-209): The period selector uses `role="tablist"` and `role="tab"` without `aria-controls` or arrow-key roving `tabIndex` navigation. **Suggestion:** Switch to a `role="group"` of buttons with `aria-pressed={isActive}` or implement full WAI-ARIA tab keyboard navigation.
- **[Info]** (Line 83): `setTimeout(() => setIsRefreshing(false), 300)` is not cleared on unmount.

### `frontend/src/components/admin/services/ServiceForm.tsx`

- **[Medium]** (Lines 131-142, 250-265): While `addVariantTier` picks an unused tier name, each tier row exposes a `<Select options={VARIANT_OPTIONS}>` allowing admins to change multiple rows to the same tier name (e.g., two `SMALL` tiers), with no uniqueness validation in `serviceSchema` or `ServiceForm`. **Suggestion:** Add a duplicate-variant check in `serviceSchema` / `onFormSubmit` (or filter already-selected tier names in the `<Select>`).
- **[Low]** (Lines 145-155): `<Modal>` does not disable close actions via `showClose={!isSubmitting}` while a save is in progress. **Suggestion:** Pass `showClose={!isSubmitting}` and ignore `onClose` while `isSubmitting` is true.
- **[Info]** (Lines 243-247): Checks `errors.variants?.message` without falling back to `errors.variants?.root?.message` for array-level Zod errors in React Hook Form.

### `frontend/src/components/admin/services/index.ts`

**Status:** Clean — no issues found.

### `frontend/src/components/auth/ForgotPasswordForm.tsx`

- **[Low]** (Line 6): Unused imports `Eye` and `EyeOff` from `lucide-react`. **Suggestion:** Remove unused imports.
- **[Low]** (Lines 45-49): Case-sensitive `message.includes('Invalid') || message.includes('email')` can misclassify unrelated server errors (e.g., `"Failed to send email"`) as an email validation error and may expose whether an email exists. **Suggestion:** Rely on client/server field validation codes and show a generic toast/notice for non-validation failures.
- **[Low]** (Lines 84-105): Renders Google/Facebook OAuth login buttons inside the Forgot Password form (`"Or reset with email"`) without setting `oauth_redirect`, which can confuse users trying to reset a password. **Suggestion:** Remove OAuth sign-in buttons from the password reset form or clearly label them as an alternative sign-in option.

### `frontend/src/components/auth/LoginForm.tsx`

- **[High]** (Lines 23, 54-55, 74, 204): **Open Redirect (CWE-601):** `redirectTo` is taken directly from `searchParams.get('redirect') || '/'` without validating that it is a local path. A crafted link such as `/login?redirect=https://evil.com` or `/login?redirect=//evil.com` redirects the user externally via `router.push(destination)` or `oauth_redirect`. **Suggestion:** Sanitize `redirectTo` before use:
  ```ts
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectTo =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
  ```
- **[Low]** (Lines 61-66, 175-180): Error detection relies on case-sensitive substring matching (`'Invalid'`, `'incorrect'`, `'Authentication failed'`), missing variants like `'Bad credentials'`; additionally, the `Remember me` checkbox is not disabled while `isSubmitting`. **Suggestion:** Check HTTP status `401` (or lowercase matching) and add `disabled={isSubmitting}` to the checkbox.

### `frontend/src/components/auth/RegisterForm.tsx`

- **[High]** (Lines 24, 58, 76, 239): **Open Redirect (CWE-601):** `redirectTo` reads `searchParams.get('redirect') || '/'` directly and passes it to `router.push(redirectTo)` and `sessionStorage.setItem('oauth_redirect', redirectTo)`, allowing external redirects via `https://...` or `//...` payloads. **Suggestion:** Validate `rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')` and default to `'/'`.
- **[Low]** (Lines 49-54): `phone: data.phone` is sent verbatim (potentially `""` or `"0917 123 4567"` with spaces, since `registerSchema` only strips spaces inside `.refine()`). **Suggestion:** Normalize before submitting: `phone: data.phone ? data.phone.replace(/\s/g, '') : undefined`.

### `frontend/src/components/auth/ResetPasswordForm.tsx`

- **[Low]** (Lines 61-67): Case-sensitive checks (`message.includes('Invalid') || message.includes('expired') || message.includes('token')`, `message.includes('Password')`) fail to match messages like `"Token is invalid"` or `"password mismatch"`. **Suggestion:** Normalize `const lower = message.toLowerCase()` or check HTTP status codes (`400`/`410`).
- **[Low]** (Lines 143-164): Displays Google/Facebook OAuth buttons on the password reset page while a sensitive reset `token` is present in the query string. **Suggestion:** Remove OAuth buttons from `ResetPasswordForm` so users complete the password reset flow without navigating away with the token in `Referer`.

### `frontend/src/components/auth/VerifyEmailForm.tsx`

- **[High]** (Lines 26-58): `useEffect` invokes `authApi.verifyEmail(token)` without an abort/deduplication guard or `cancelled` cleanup flag. Under React StrictMode double-invocation in development (or rapid `token` changes), two concurrent verification requests fire; if the backend invalidates single-use tokens on the first call, the second fails and overwrites `status` to `'error'`. **Suggestion:** Guard with a `useRef` tracking the last verified token and a `cancelled` flag:
  ```ts
  const verifiedTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (!token) { ... return; }
    if (verifiedTokenRef.current === token) return;
    verifiedTokenRef.current = token;
    let cancelled = false;
    ...
    return () => { cancelled = true; };
  }, [token]);
  ```
- **[Low]** (Lines 5-13, 18, 78-80): Dead code and unused imports: `useRouter`, `router`, `Chrome`, `Facebook`, `OAUTH_GOOGLE_URL`, `OAUTH_FACEBOOK_URL`, and `handleOAuthLogin` are defined but never used. **Suggestion:** Remove all unused imports, constants, and handlers.
- **[Low]** (Lines 43-50, 60-76, 108, 194): Error handling uses case-sensitive substring matching (`'expired'`, `'invalid'`, `'token'`, `'already verified'`), and the resend `<Input>` omits `required` while `handleResend` sends untrimmed `resendEmail`. **Suggestion:** Use case-insensitive error checks, add `required` on the email input, and pass `resendEmail.trim()`.

---

## 6. Frontend Components — Booking, Customer, Layout, Loyalty, Profile, Staff & UI

This audit covers 34 frontend component files across booking, customer, layout, loyalty, profile, staff, and shared UI primitives. Key systemic risks include broken QR scanner state/DOM deadlocks (`loyalty/QRScanner.tsx`, `staff/QRScanner.tsx`), a static non-functional payment QR graphic (`PaymentQRCode.tsx`), layout/overlay bugs (`AdminLayout.tsx`, `Header.tsx`, `Modal.tsx`), `PhoneInput` native validation failure, and duplicated customer/profile/loyalty components.

| Severity | Count | Key Themes |
| --- | ---: | --- |
| Critical | 1 | Camera video element never mounts in `loyalty/QRScanner.tsx`, leaking `MediaStream` and deadlocking scanner |
| High | 9 | Static payment QR SVG, local-TZ reschedule bug, mobile sidebar overlap, stuck mobile menu animation, stale scanner closures, unclickable overlay button, blocked modal backdrop click, broken `PhoneInput` `pattern` |
| Medium | 26 | Duplicated customer/profile/loyalty forms, `useMutation` dead state, uncancelled async effects, `blob:` URL leaks, missing `useId()` fallbacks, modal a11y gaps, unvalidated image/link URLs |
| Low | 32 | Unused imports/helpers, uncleaned `setTimeout`s, hardcoded `10` stamps, `window.confirm` / `reload()`, duplicated JSX blocks, missing `type="button"` / `htmlFor` |
| Info | 11 | Cross-layer re-export shims, icon shadowing, hoisting static variant maps, skip links, `aria-hidden` polish |

---

### `frontend/src/components/booking/BookingForm.tsx`
- **[Info]** (Lines 1-2): Re-exports `BookingForm` from `@/app/(public)/booking/BookingForm`, coupling `src/components/` back to a Next.js App Router route segment. **Suggestion:** Move the implementation into `src/components/booking/BookingForm.tsx` and import it from the route page instead.

---

### `frontend/src/components/booking/PaymentQRCode.tsx`
- **[High]** (Lines 40-126, 166-168): The QR `<svg>` is a hardcoded static pattern (only the center label `{isGcash ? 'GCASH' : 'MAYA'}` changes) and does not encode a real scannable GCash/Maya QR payload, while line 167 instructs customers to "Scan the QR code". **Suggestion:** Render the studio's verified GCash/Maya QR image asset (or generate a valid EMVCo/QRPh payload with a QR library) per `method` and `amount`.
- **[Medium]** (Lines 19-20): Studio payment numbers (`0917 123 4567`, `0918 987 6543`) and account name are hardcoded placeholders inside the UI component. **Suggestion:** Fetch studio payment details from backend settings/configuration or environment-backed studio constants so updates do not require a code deploy.
- **[Low]** (Lines 22-31): `setTimeout(() => setCopied(false), 2000)` in `copyToClipboard` is not tracked in a ref or cleared on unmount/re-click, so rapid clicks reset `copied` prematurely. **Suggestion:** Store the timeout ID in a `useRef`, clear any existing timeout before scheduling a new one, and clear it in a `useEffect` cleanup.

---

### `frontend/src/components/bookings/BookingCard.tsx`
- **[Info]** (Lines 1-2): Thin compatibility re-export shim pointing to `@/components/customer/BookingCard`, alongside both `components/booking/` and `components/bookings/` directories. **Suggestion:** Consolidate callers to `@/components/customer/BookingCard` (or one `booking/` barrel) and remove redundant shims when safe.

---

### `frontend/src/components/customer/BookingCard.tsx`
- **[High]** (Lines 564-569): Reschedule submission hardcodes a 180-minute duration and computes `endTime` using browser-local `new Date().toTimeString().slice(0, 5)` (which can wrap past midnight and diverge from Asia/Manila time or actual service duration), even though `availableSlots` already provides `slot.endTime`. **Suggestion:** Derive `endTime` from the selected `AvailabilitySlotDto` (or the booking's actual service duration in Manila time) rather than hardcoding `180 * 60 * 1000` with local `Date`:
  ```ts
  const selectedSlot = availableSlots.find((s) => s.startTime === rescheduleTime);
  const endTime = selectedSlot?.endTime;
  ```
- **[Medium]** (Lines 162-172, 210-214): `useMutation` for `bookingsApi.cancelBooking` only destructures `isPending: isCancelling`, while `handleCancel` invokes `await onCancel(booking.id)` directly. As a result, `isCancelling` is always `false` and the `useMutation` `onSuccess`/`onError` toast handlers never execute. **Suggestion:** Remove the unused `useMutation` wrapper and manage loading state around `onCancel`, or invoke the mutation directly if `BookingCard` owns cancellation.
- **[Medium]** (Lines 192-208): The `useEffect` calling `availabilityApi.getSlots(rescheduleDate)` has no cancellation/abort guard, so rapid date changes can let an older request overwrite newer `availableSlots`. **Suggestion:** Track a `cancelled` boolean (or `AbortController`) in the `useEffect` cleanup before calling `setAvailableSlots` / `setIsLoadingSlots`.
- **[Medium]** (Lines 253-256, 272-276, 530-545): `inspirationUrl` is passed directly into `<img src>` and `<a href={inspirationUrl} target="_blank" rel="noreferrer">` without validating the URL protocol (`https:`, `http:`, or relative `/`), and relies on an `as unknown as { inspirationImage?: string }` cast. **Suggestion:** Add a `safeImageUrl` helper permitting only `http(s):` or `/` paths, use `rel="noopener noreferrer"`, and align `BookingDto` field names in `@/types`.
- **[Medium]** (Line 590): `min={new Date().toISOString().split('T')[0]}` uses UTC date rather than Asia/Manila (`UTC+8`), which is off by one day between 00:00 and 07:59 PHT. **Suggestion:** Compute today's date string in `Asia/Manila` (e.g., via `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())`).
- **[Low]** (Line 24): `isPast` is imported from `@/lib/utils` and never used. **Suggestion:** Remove the unused import.
- **[Low]** (Lines 152-156): `paymentMethod` and `reference` state are initialized once from `booking.payment` and never synced when `booking` updates after refetch or when reopening the modal. **Suggestion:** Reset form state from `booking.payment` when opening `showPaymentModal`.
- **[Low]** (Lines 210-214): Uses blocking `window.confirm(...)` for cancellation confirmation. **Suggestion:** Replace with an in-app confirmation `<Modal>` matching the rest of the component.
- **[Low]** (Lines 467-484, 578-617): `<label>` elements in the payment and reschedule modals lack `htmlFor` / matching `id` attributes on their `<input>` and `<select>` controls. **Suggestion:** Wire unique `id`/`htmlFor` pairs (or reuse `<Input>` / `<Select>`).

---

### `frontend/src/components/customer/ChangePasswordForm.tsx`
- **[Medium]** (Lines 1-153): Nearly identical duplicate of `frontend/src/components/profile/ChangePasswordForm.tsx` (sharing identical schema, API call, error handling, and 3 password toggle fields). **Suggestion:** Consolidate into a single shared `ChangePasswordForm` with an optional variant/styling prop if needed.
- **[Low]** (Line 6): `Lock` is imported from `lucide-react` and never used. **Suggestion:** Remove the unused import.
- **[Low]** (Lines 41-49): Matches backend errors via brittle substring checks (`message.includes('Current password is incorrect') || ...`). **Suggestion:** Map on structured HTTP status codes or machine-readable error codes from the API response.
- **[Low]** (Lines 67-137): Repeats the password `<Input>` + show/hide toggle button block three times with a hardcoded `top-[32px]` offset. **Suggestion:** Extract a local `PasswordField` subcomponent and center the icon relative to the input container.

---

### `frontend/src/components/customer/LoyaltyCard.tsx`
- **[Medium]** (Lines 1-272): Duplicated with `frontend/src/components/loyalty/LoyaltyCard.tsx`, with diverging styling and copy for the same `LoyaltyCardDto` domain model. **Suggestion:** Unify into a single `LoyaltyCard` component.
- **[Low]** (Lines 21-32): `LacquerDropMark` is defined and never rendered in this file. **Suggestion:** Remove the dead helper or use it in the card UI.
- **[Low]** (Lines 63, 148, 151): Copy hardcodes `10` stamps (`"All 10 stamps earned"`, `"10-Stamp Complimentary Gel Reward"`) even though `maxStamps` is a configurable prop. **Suggestion:** Interpolate `{maxStamps}` consistently across all copy strings.
- **[Low]** (Lines 163-168): `formatDate(data.expiresAt, ...)` is called without a null/empty guard (unlike `data.lastStampAt` at line 178). **Suggestion:** Guard `data.expiresAt` with a fallback string (e.g. `'No expiration'`).
- **[Low]** (Lines 106-111): The progress bar `<div>` has no `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`. **Suggestion:** Add ARIA progressbar attributes for screen-reader accessibility.

---

### `frontend/src/components/customer/ProfileForm.tsx`
- **[Medium]** (Lines 1-112): Duplicated with `frontend/src/components/profile/ProfileForm.tsx`, and uses a plain `<Input type="tel">` (lines 80-89) instead of `<PhoneInput>`, causing inconsistent phone formatting and digit restrictions between the two forms. **Suggestion:** Consolidate into one `ProfileForm` using `<PhoneInput>` with `Controller`.
- **[Low]** (Line 6): `User` is imported from `lucide-react` and never used. **Suggestion:** Remove the unused import.
- **[Low]** (Lines 31-39): `useEffect` calls `reset(...)` whenever `user` changes, which can overwrite unsaved edits if `user` refreshes in the background. **Suggestion:** Reset only when `!isDirty` (from `formState`) or track initialized `user.id`.

---

### `frontend/src/components/layout/AdminLayout.tsx`
- **[High]** (Lines 20-31): `AdminSidebar` is permanently fixed at `inset-y-0 left-0 w-60`, while the content wrapper only offsets `lg:ml-60`. On screens narrower than `lg` (`<1024px`), the sidebar overlaps the left 240px of `<main>` content and there is no mobile menu toggle button. **Suggestion:** Add responsive mobile drawer state in `AdminLayout` (hide `AdminSidebar` below `lg` unless opened, and render a top mobile bar with a toggle button).
- **[Info]** (Lines 26-27): Defaulting `onDismissError` and `onDismissAllErrors` to `() => {}` makes error banner dismiss buttons appear interactive while doing nothing if handlers are omitted. **Suggestion:** Require handlers when `errors` are passed, or only render dismiss controls when callbacks are provided.

---

### `frontend/src/components/layout/AdminSidebar.tsx`
- **[Medium]** (Lines 21-25, 47-50): Accepts `onClose?: () => void` and wires it to `<Link onClick={onClose}>`, but renders unconditionally as `fixed inset-y-0 left-0 z-40 w-60` with no responsive `hidden lg:flex` or close button (contributing to the mobile overlap in `AdminLayout.tsx`). **Suggestion:** Accept `isOpen?: boolean` (or control visibility from `AdminLayout`) with `hidden lg:flex` on desktop and a slide-over drawer + close button on mobile.
- **[Info]** (Line 5): Importing `Image` from `lucide-react` shadows the global `window.Image` constructor. **Suggestion:** Alias as `Image as ImageIcon`.

---

### `frontend/src/components/layout/CustomerLayout.tsx`
**Status:** Clean — no issues found.

---

### `frontend/src/components/layout/Footer.tsx`
- **[Low]** (Lines 21-26): `footerLinks.support` (containing placeholder `href: '#'` entries for Privacy policy and Terms of service) is defined but never rendered anywhere in JSX. **Suggestion:** Either remove the dead `support` array or render it once real policy routes exist.
- **[Info]** (Lines 55-72, 123): External social links use `rel="noreferrer"` without `noopener` (good defense-in-depth to use `rel="noopener noreferrer"`), and `tel:${contactInfo.phone}` embeds spaces (`tel:+63 977 284 6167`). **Suggestion:** Use `rel="noopener noreferrer"` and strip whitespace from the `tel:` href (`contactInfo.phone.replace(/\s+/g, '')`).

---

### `frontend/src/components/layout/Header.tsx`
- **[High]** (Lines 212-215, 228-231, 243-305): When closing the mobile menu, `setIsMenuAnimating(true)` and `setTimeout(() => setIsMenuOpen(false), 180)` are called, **but `isMenuAnimating` is never reset to `false`**. Because line 228 renders on `(isMenuOpen || isMenuAnimating)`, `#mobile-menu` stays permanently mounted in its exit state after the first close, and subsequent opens continue to apply `animate-dropdown-exit`. **Suggestion:** Use a single shared `closeMobileMenu` helper (clearing timers on unmount) that resets `setIsMenuAnimating(false)` after the exit duration:
  ```ts
  const closeMobileMenu = () => {
    setIsMenuAnimating(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuAnimating(false);
    }, 180);
  };
  ```
- **[Medium]** (Lines 198-205, 302-312): `<button type="button">` is nested inside `<Link href="/booking">`, which is invalid HTML (interactive element inside `<a>`) and creates duplicate tab stops for keyboard/screen-reader users. **Suggestion:** Style the `<Link>` directly as a button (or use `buttonVariants` / `<Button asChild>`) without a nested `<button>`.
- **[Low]** (Lines 45-52, 212-305): `setTimeout` calls in `closeUserMenu` and 6 inline mobile-menu close handlers are never cleared on unmount, and the close logic is duplicated 6 times. **Suggestion:** Consolidate into shared helpers with timeout refs cleaned up on unmount.
- **[Low]** (Lines 133-188): The user dropdown menu lacks an `Escape` key handler, `role="menu"`/`role="menuitem"` semantics, and focus restoration. **Suggestion:** Add a `keydown` listener for `Escape` when `isUserMenuOpen` is true and return focus to the avatar trigger on close.
- **[Info]** (Lines 25-32): `StudioMark` puts `aria-hidden="true"` on the wrapper while the inner `<img>` has non-empty `alt="Pretty Nails by Atasha"`. **Suggestion:** Set `alt=""` on decorative `<img>` elements inside `aria-hidden="true"` containers.

---

### `frontend/src/components/layout/Layout.tsx`
**Status:** Clean — no issues found. *(Info: consider adding a visually-hidden "Skip to main content" link before `<Header />` for keyboard accessibility.)*

---

### `frontend/src/components/layout/index.ts`
**Status:** Clean — no issues found.

---

### `frontend/src/components/loyalty/LoyaltyCard.tsx`
- **[Medium]** (Lines 1-277): Duplicated with `frontend/src/components/customer/LoyaltyCard.tsx` with minor styling differences. **Suggestion:** Consolidate both into a single shared `LoyaltyCard` component.
- **[Low]** (Line 67): Hardcodes `'10 of 10 stamps earned'` when `isComplete` is true, ignoring `maxStamps`. **Suggestion:** Use `` `${maxStamps} of ${maxStamps} stamps earned` ``.
- **[Low]** (Lines 173-178): `formatDate(data.expiresAt, ...)` is unguarded if `data.expiresAt` is null or undefined. **Suggestion:** Guard `data.expiresAt` before formatting.
- **[Low]** (Lines 110-115): Progress bar lacks `role="progressbar"`, `aria-valuenow={stampCount}`, `aria-valuemin={0}`, and `aria-valuemax={maxStamps}`. **Suggestion:** Add ARIA progressbar attributes.

---

### `frontend/src/components/loyalty/QRScanner.tsx`
- **[Critical]** (Lines 108-114, 219-225): In `startCamera`, `if (videoRef.current)` runs before `setHasPermission(true)`, yet `<video ref={videoRef}>` (lines 220-225) only mounts when `hasPermission && videoRef.current` is truthy. Because `videoRef.current` is always `null` initially, `hasPermission` is never set to `true`, the camera preview never renders, and the acquired `MediaStream` is never attached or stopped (leaking camera hardware access). **Suggestion:** Always render `<video ref={videoRef}>` (hiding it visually with CSS until `hasPermission` is true) and store the `MediaStream` in a ref so `stopCamera` always releases tracks.
- **[High]** (Lines 112-113, 138-140, 317-318): `startCamera` and the "Back to Camera" button call `setIsScanning(true)` immediately followed by `startScanning()`, which checks `if (!isScanning || ...)` against the stale closure (`false`) and returns early without ever starting `requestAnimationFrame(detect)`. **Suggestion:** Track scanning state in an `isScanningRef` (or pass a parameter/effect keyed on `isScanning`) so `detect()` sees the updated state immediately.
- **[Medium]** (Lines 171-174): `setTimeout(() => { onScanSuccess(code); onClose(); }, 800)` in `handleScanResult` is not cleared on unmount or early close, risking duplicate callbacks or state updates after unmount. **Suggestion:** Store the timer ID in a ref and clear it on unmount / close.
- **[Medium]** (Lines 184-187, 325-332): `handleManualSubmit` runs an artificial 500ms `setTimeout` inside a `try/catch` that cannot throw, and line 331 renders `<Loader2 className="h-4 w-4 ml-2 animate-spin" />` unconditionally inside `<Button isLoading={isSubmitting}>` — showing a permanent spinning icon when idle and two spinners when submitting. **Suggestion:** Remove the artificial delay and remove the redundant `<Loader2 />` since `Button` already renders a spinner when `isLoading` is true.
- **[Medium]** (Lines 73, 78-85): Relies solely on `window.BarcodeDetector`, which is unavailable in Safari and Firefox, without falling back to `html5-qrcode` (already used in `staff/QRScanner.tsx`). **Suggestion:** Use `html5-qrcode` (or another cross-browser QR decoder) when `BarcodeDetector` is unavailable.
- **[Low]** (Line 49): `canvasRef` is declared and never used. **Suggestion:** Remove the unused ref.
- **[Low]** (Lines 54-70, 197-210): Dynamically appends/removes a `<style>` element in `document.head` per mount and renders a custom backdrop without `role="dialog"`, `aria-modal="true"`, `Escape` key handling, or reusing `<Modal>`. **Suggestion:** Define the keyframes in global CSS and wrap the scanner UI in `<Modal>`.

---

### `frontend/src/components/profile/ChangePasswordForm.tsx`
- **[Medium]** (Lines 1-147): Duplicated with `frontend/src/components/customer/ChangePasswordForm.tsx`. **Suggestion:** Merge into a single shared component.
- **[Low]** (Lines 43-51): Uses brittle substring checks (`message.includes('Current password is incorrect') || ...`) to detect invalid current passwords. **Suggestion:** Rely on HTTP status / structured error codes.
- **[Low]** (Lines 68-138): Duplicates the password input + visibility toggle block three times. **Suggestion:** Extract a reusable `PasswordField` subcomponent.

---

### `frontend/src/components/profile/ProfileForm.tsx`
- **[Medium]** (Lines 1-111): Duplicated with `frontend/src/components/customer/ProfileForm.tsx`. **Suggestion:** Merge into a single shared `ProfileForm` component.
- **[Low]** (Lines 35-43): `useEffect` calls `reset(...)` on every `user` reference change, potentially discarding in-progress edits. **Suggestion:** Only call `reset` if `!formState.isDirty`.

---

### `frontend/src/components/staff/QRScanner.tsx`
- **[High]** (Lines 75-85, 132, 154-158): The decode callback passed to `html5QrCodeRef.current.start(...)` closes over the initial `lastScannedCode` (`null`). Because `startScanning` is only invoked once while `isScanning` is false, `if (lastScannedCode === decodedText) return;` on line 77 **always compares `null === decodedText` (`false`)**, failing to debounce and allowing rapid scans to call `loyaltyApi.addStampAsStaff` repeatedly (awarding duplicate stamps). **Suggestion:** Use refs (`lastScannedCodeRef` and `isProcessingRef`) inside the scan callback instead of React state:
  ```ts
  if (isProcessingRef.current || lastScannedCodeRef.current === decodedText) return;
  lastScannedCodeRef.current = decodedText;
  isProcessingRef.current = true;
  ```
- **[High]** (Lines 191, 203-215): The overlay `<div>` at line 191 sets `pointer-events-none` across the entire overlay, and the child container/button (`Start Scanning` / `Stop Scanning`, line 204) does not restore `pointer-events-auto`, making the toggle button unclickable. **Suggestion:** Add `pointer-events-auto` to the bottom controls wrapper or button, and add `type="button"`.
- **[Medium]** (Lines 27-58): `initScanner` is async with no cancellation flag; if the component unmounts before `import('html5-qrcode')` or `Html5Qrcode.getCameras()` resolves, the scanner instance can be created after cleanup and leak camera state. **Suggestion:** Track `let cancelled = false;` in the effect and abort initialization / stop the instance if unmounted.
- **[Low]** (Lines 15-17, 24, 67, 75, 96-118, 127): Declares unused `router`, `canvasRef`, and `videoRef` (making the border-color feedback in lines 96-118 dead code), dynamically imports `html5-qrcode` a second time on line 67 without using it, and uses `any` in four places. **Suggestion:** Remove unused refs/imports, apply border feedback to `#qr-reader` (or state), and type `Html5Qrcode` / `unknown` errors properly.
- **[Low]** (Line 168): Retry button calls `window.location.reload()` instead of re-invoking scanner initialization. **Suggestion:** Extract `initScanner` and call it directly on retry (with `type="button"`).

---

### `frontend/src/components/ui/Avatar.tsx`
- **[Medium]** (Lines 23, 31-44): `showFallback` contains dead logic (`typeof window !== 'undefined' && false`) and `onError` hides the broken `<img>` via `e.currentTarget.style.display = 'none'` without rendering the initials fallback div, leaving an empty circle on load failure. **Suggestion:** Track `const [hasError, setHasError] = useState(false)` (resetting when `src` changes) and render the initials fallback when `!src || hasError`.

---

### `frontend/src/components/ui/Badge.tsx`
**Status:** Clean — no issues found. *(Info: the static `variants` lookup map can be hoisted outside `Badge` to avoid re-allocation per render.)*

---

### `frontend/src/components/ui/Button.tsx`
- **[Low]** (Lines 35, 45-62): When `size="icon"` and `isLoading={true}` are combined, both the loading spinner and `children` (the icon) render side-by-side inside a fixed `h-9 w-9` container. **Suggestion:** Hide `children` (or replace it with the spinner) when `size === 'icon' && isLoading`.
- **[Info]** (Lines 17-36, 39): `variants` and `sizes` can be hoisted to module scope; also note `<button>` defaults to native `type="submit"` when `type` is omitted inside a `<form>`.

---

### `frontend/src/components/ui/Card.tsx`
**Status:** Clean — no issues found.

---

### `frontend/src/components/ui/FileUpload.tsx`
- **[Medium]** (Lines 160-175, 191, 207): `blob:` object URLs (`localPreview` / `compressedPreview`) are not revoked when compression fails, when upload finishes (`setPreviewUrl(result.url)`), when upload fails (`setPreviewUrl(value || null)`), or when the component unmounts — leaking object URLs in memory. **Suggestion:** Track the active `blob:` URL in a ref and revoke it whenever replaced or on unmount.
- **[Medium]** (Lines 97, 198, 336, 355): Generic UI primitive `ui/FileUpload.tsx` hardcodes domain-specific deposit receipt text (`'Deposit submitted for studio review.'`, `'Deposit proof attached'`, `'Select or drop GCash / Maya deposit receipt'`). **Suggestion:** Parameterize success toast / status labels via props (or let the caller fire domain toasts in `onChange`) so inspiration/gallery uploads do not show deposit-receipt copy.
- **[Low]** (Lines 65-68): `compressImage` converts PNGs to `image/jpeg` via `canvas.toBlob` but constructs `new File([blob], file.name, { type: 'image/jpeg' })`, leaving a `.png` extension on JPEG data. **Suggestion:** Replace the extension with `.jpg` when re-encoding to JPEG.
- **[Low]** (Lines 297-313, 394-406): The `label` has no `htmlFor` association and the dropzone `div[role="button"]` has no `aria-label` or `aria-labelledby`. **Suggestion:** Link `label` via `useId()` and `aria-labelledby` on the dropzone button.

---

### `frontend/src/components/ui/Input.tsx`
- **[Medium]** (Lines 14, 32, 36, 41): `const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')` produces `"undefined-error"` / `"undefined-helper"` when both `id` and `label` are omitted, and generates colliding DOM IDs when two inputs share the same label on a page. **Suggestion:** Fallback to React's `useId()` (`const fallbackId = useId(); const inputId = id || fallbackId;`).

---

### `frontend/src/components/ui/Modal.tsx`
- **[High]** (Lines 39-44): Both the backdrop (`onClick={onClose}`) and the centering wrapper (`<div className="fixed inset-0 z-50 flex ...">`) are `fixed inset-0 z-50`. Because the wrapper appears later in DOM order, it covers the backdrop and intercepts all clicks outside the modal card, making **backdrop click-to-close completely non-functional**. **Suggestion:** Attach `onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}` to the centering wrapper (or place the backdrop click inside it).
- **[Medium]** (Lines 26-87): Missing `Escape` key handler to close the modal, missing focus trap/restoration for keyboard users, and missing body scroll locking when `isOpen` is true. **Suggestion:** Add a `keydown` `Escape` listener, lock `document.body.style.overflow` while open, and move/restore focus (or use a headless dialog primitive like Radix Dialog).

---

### `frontend/src/components/ui/PhoneInput.tsx`
- **[High]** (Lines 39, 101, 107): Sets `pattern="[0-9]*"` on the `<input>` while `displayValue` formats numbers with spaces (`09XX XXX XXXX`) whenever the input is blurred (`!isFocused`). On form submission (when blurred), native HTML5 constraint validation rejects valid formatted phone numbers because spaces fail `[0-9]*`. **Suggestion:** Change `pattern` to `[0-9 ]*` (or `^\d{4}\s?\d{3}\s?\d{4}$`) or rely on schema validation instead of a digits-only `pattern`.
- **[Medium]** (Line 22): `inputId = id || label?.toLowerCase().replace(/\s+/g, '-')` risks `"undefined-error"` and duplicate ID collisions (same issue as `Input.tsx`). **Suggestion:** Use `useId()` as the fallback ID.
- **[Medium]** (Lines 43, 55, 79): Blocks `+` in `handleKeyDown` and unconditionally runs `.replace(/\D/g, '').slice(0, 11)`, which silently corrupts pasted `+639171234567` numbers into `63917123456` instead of normalizing `63`/`+63` to `09...`. **Suggestion:** Normalize leading `639...` (`12` digits) to `09...` before slicing to 11 digits.
- **[Low]** (Lines 86-88): `handleFormData` is defined with `useCallback` and never used. **Suggestion:** Remove the dead callback.

---

### `frontend/src/components/ui/Select.tsx`
- **[Medium]** (Line 22): `selectId = id || label?.toLowerCase().replace(/\s+/g, '-')` produces `"undefined-error"` when unlabelled and causes duplicate ID collisions across forms with matching labels. **Suggestion:** Use `useId()` as the fallback ID.

---

### `frontend/src/components/ui/Skeleton.tsx`
**Status:** Clean — no issues found. *(Info: adding `aria-hidden="true"` to `<Skeleton>` prevents screen readers from traversing empty placeholder blocks.)*

---

### `frontend/src/components/ui/Spinner.tsx`
**Status:** Clean — no issues found.

---

### `frontend/src/components/ui/Stepper.tsx`
**Status:** Clean — no issues found. *(Info: `-z-0` on line 25 can be `z-0`, and using `<ol>`/`<li>` for steps improves screen-reader semantics.)*

---

### `frontend/src/components/ui/Table.tsx`
- **[Low]** (Line 124): `dark:hover:bg-stone-850/60` references `stone-850`, which is not a default Tailwind color shade, causing dark-mode row hover highlighting to fail silently unless custom-configured. **Suggestion:** Replace with `dark:hover:bg-stone-800/60` or `dark:hover:bg-stone-900/60`.
- **[Low]** (Lines 193-232): `Pagination` renders `<button>` elements without `type="button"`, which can accidentally submit an enclosing `<form>` if clicked. **Suggestion:** Add `type="button"` to all three pagination button types.

---

### `frontend/src/components/ui/Textarea.tsx`
- **[Medium]** (Line 14): `textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')` produces `"undefined-error"` when unlabelled and causes duplicate ID collisions across forms with matching labels. **Suggestion:** Use `useId()` as the fallback ID.

---

### `frontend/src/components/ui/index.ts`
**Status:** Clean — no issues found.

---

## 7. Backend Config, Security, Exception Handling, Util & Resources

This batch audits the backend build/container configuration, Spring configuration beans, global exception handling, security filters/OAuth2/JWT utilities, time utilities, application YAML profiles, and SQL seed/migration scripts across 38 files. Several critical and high-severity issues were identified, including a fallback JWT signing key in base `application.yml`, a broken `audit_logs` Flyway schema incompatible with the `AuditLog` JPA entity, missing `V1` Flyway baseline and Actuator dependencies, and multiple security gaps in JWT cookie/filter handling, OAuth2 linking/logging, and rate-limit IP spoofing/memory bounds. Per project constraints, the prototype `admin`/`admin` seed credentials (`DataSeeder`, `AdminProperties`, `data.sql`) are intentionally preserved, and database usage remains PostgreSQL / in-memory H2 (`jdbc:h2:mem:...`) with no Supabase or local H2 file storage.

### Findings Summary

| Severity | Count | Key Themes |
| --- | ---: | --- |
| Critical | 2 | Fallback `jwt.secret` in `application.yml`, `V3` `audit_logs` schema mismatch |
| High | 20 | Missing Actuator/V1 Flyway migrations, empty `ADMIN_EMAIL` seed guard in `DataSeeder`, IP spoofing & unbounded cache in `RateLimitFilter`, JWT exception 500s / cookie mismatch / missing lock check, OAuth2 token leak & unverified email linking, unwired OAuth2 & CORS credential mismatch |
| Medium | 24 | Unbounded `@Async` executor, deprecated Bucket4j API, double-registered `@Component` filters, missing exception handlers, OIDC cast & lazy proxy risks, base config production defaults |
| Low | 24 | Stale `filemap.md`, Maven/Docker caching & H2 scope, null guards, duplicated seed/config values, missing JWT revocation claims |
| Info | 9 | Intentional prototype `admin`/`admin` seeding (`AdminProperties`, `DataSeeder`, `data.sql`), redundant ignore rules, `-DskipTests` in `Dockerfile`, `Clock` injection, seed duplication, local-only dev settings |

---

### `pretty-nails-backend/.dockerignore`
- **[Low]** (Lines 21-23): `application-local.yml` and `application-docker.yml` are listed without path prefixes, so Docker only ignores them at the build-context root rather than `src/main/resources/`, while `.env` / `.env.*` files are not ignored at all.
  **Suggestion:** Add `.env` and `.env.*`, and scope profile exclusions explicitly (e.g., `src/main/resources/application-local.yml`, keeping `application-docker.yml` available if the `docker` profile is used inside the container).
- **[Info]** (Lines 32-33): `target/surefire-reports/` and `target/failsafe-reports/` are redundant because `target/` is already excluded on line 2.

---

### `pretty-nails-backend/.gitignore`
- **[Low]** (Lines 22-26): `.gitignore` ignores `.env`, `.env.local`, and `.env.*.local`, but omits `.env.*` (e.g., `.env.production`, `.env.docker`) as well as the local runtime `uploads/` directory (`app.upload.dir: uploads` in `application.yml`).
  **Suggestion:** Add `.env.*`, `!.env.example`, and `uploads/` to `.gitignore`.

---

### `pretty-nails-backend/Dockerfile`
- **[High]** (Lines 16-17): The `HEALTHCHECK` probes `http://localhost:8080/actuator/health`, and `application-docker.yml` configures `management.endpoints.web.exposure.include: health,info`, but `spring-boot-starter-actuator` is absent from `pom.xml` and `/actuator/health` is not permitted in `SecurityConfig.java`. As a result, `/actuator/health` returns 401/404 and the container will always be marked unhealthy.
  **Suggestion:** Add `org.springframework.boot:spring-boot-starter-actuator` to `pom.xml` and permit `/actuator/health` in `SecurityConfig.java`.
- **[Low]** (Lines 4-6): `COPY src ./src` immediately follows `COPY pom.xml .`, busting the Docker layer cache and forcing Maven to re-download dependencies on every source edit.
  **Suggestion:** Download dependencies in a separate layer before copying `src`:
  ```dockerfile
  COPY pom.xml .
  RUN mvn dependency:go-offline -B
  COPY src ./src
  ```
- **[Info]** (Line 6): `mvn clean package -DskipTests` skips tests during image build; ensure CI runs `mvn test` prior to building the Docker image.

---

### `pretty-nails-backend/filemap.md`
- **[Low]** (Lines 1, 8, 30): Documentation has drifted from the codebase: line 1 states `Java 17 target` whereas `pom.xml` targets Java 21; line 8 places `SecurityConfig` in `config/` instead of `security/`; line 30 omits `AccessDeniedException` and `MaxUploadSizeExceededException` from `GlobalExceptionHandler`; and newly added classes (`LocalApplication`, `AdminProperties`, `AsyncConfig`, `AuditorAwareImpl`, `DataSeeder`, `JpaAuditingConfig`, `OpenApiConfig`, `RateLimitConfig`, `WebMvcConfig`, OAuth2 classes, `RateLimitFilter`, `TimeProvider`, `ManilaTimeProvider`, Flyway migrations) are missing.
  **Suggestion:** Regenerate or remove `filemap.md` if it is no longer maintained.

---

### `pretty-nails-backend/mvnw`
**Status:** Clean — no issues found.

---

### `pretty-nails-backend/mvnw.cmd`
**Status:** Clean — no issues found.

---

### `pretty-nails-backend/pom.xml`
- **[High]** (Lines 41-193): `spring-boot-starter-actuator` is missing despite `Dockerfile` (line 17) and `application-docker.yml` (lines 12-19) relying on `/actuator/health` and `management.endpoints.web.exposure`.
  **Suggestion:** Add `org.springframework.boot:spring-boot-starter-actuator` to `<dependencies>`.
- **[Medium]** (Lines 104-113): Both `bucket4j-spring-boot-starter` (`0.12.10`) and `bucket4j-core` (`8.10.0`) are declared, yet `RateLimitConfig`/`RateLimitFilter` use `bucket4j-core` directly and `LocalApplication` / `application-test.yml` exclude the starter's auto-configurations. `PrettyNailsApplication` (the production `mainClass` on line 201) does not exclude them, risking startup check failures or duplicate filter registration.
  **Suggestion:** Remove `bucket4j-spring-boot-starter` if rate limiting is implemented manually via `bucket4j-core` in `RateLimitFilter`.
- **[Medium]** (Lines 129-132): `spring-boot-starter-webflux` is pulled in alongside `spring-boot-starter-web` (line 45) with the comment `WebFlux for SSE`. Servlet MVC already supports `SseEmitter`, and Spring Boot 3.2+ provides `RestClient` in `spring-boot-starter-web`, so including WebFlux adds unnecessary Netty/reactive dependencies and triggers Bucket4j reactive auto-configuration conflicts.
  **Suggestion:** Remove `spring-boot-starter-webflux` if `SseEmitter` / `RestClient` suffice.
- **[Low]** (Lines 165-170): `org.mockito:mockito-inline:5.2.0` is declared explicitly alongside `spring-boot-starter-test` (Spring Boot 3.4.0 already manages Mockito 5.14+, where inline mocking is built-in and `mockito-inline` is obsolete).
  **Suggestion:** Remove `mockito-inline` and the `-Dmockito.inline.mockmaker=true` / `-Dnet.bytebuddy.experimental=true` surefire flags unless strictly required.
- **[Low]** (Lines 72-76): `com.h2database:h2` uses `<scope>runtime</scope>` rather than `test` (or a `local` Maven profile), bundling an embedded SQL engine inside production artifacts.
  **Suggestion:** Scope H2 to `test` or move it to an optional `local` Maven profile.
- **[Low]** (Lines 230-241): `maven-surefire-plugin` opens numerous internal JDK packages (`java.base/java.lang`, `java.desktop/java.awt`, `java.desktop/javax.swing`, etc.) to `ALL-UNNAMED` for all tests.
  **Suggestion:** Trim `--add-opens` to only the modules actually required by failing tests.

---

### `pretty-nails-backend/src/main/java/com/prettynails/LocalApplication.java`
- **[Medium]** (Lines 11-18): `LocalApplication extends PrettyNailsApplication` and both classes carry `@SpringBootApplication` in the same root package `com.prettynails`. Having two `@SpringBootConfiguration` classes in the component-scan root creates test-context ambiguity (`@SpringBootTest` fails to auto-detect a unique configuration) and exists only to exclude Bucket4j starter auto-configurations.
  **Suggestion:** Remove `LocalApplication` and move `spring.autoconfigure.exclude` into `application-local.yml` (or remove `bucket4j-spring-boot-starter` from `pom.xml`).

---

### `pretty-nails-backend/src/main/java/com/prettynails/PrettyNailsApplication.java`
**Status:** Clean — no issues found.

---

### `pretty-nails-backend/src/main/java/com/prettynails/config/AdminProperties.java`
- **[Info]** (Lines 10-12): **Intentional Prototype Behavior:** Defines default prototype credentials (`email = "admin"`, `password = "admin"`). Keep these defaults intact for prototype usage; if moving beyond prototype later, annotate with `@Validated` and require explicit env-configured credentials.

---

### `pretty-nails-backend/src/main/java/com/prettynails/config/AsyncConfig.java`
- **[Medium]** (Lines 6-8): `@EnableAsync` is declared with no custom `Executor` bean or `AsyncUncaughtExceptionHandler`. Spring defaults to `SimpleAsyncTaskExecutor`, which spawns an unbounded thread per `@Async` call (risking thread/memory exhaustion under load) and silently drops exceptions from `void` async methods.
  **Suggestion:** Implement `AsyncConfigurer` to provide a bounded `ThreadPoolTaskExecutor` and an `AsyncUncaughtExceptionHandler` that logs failures.

---

### `pretty-nails-backend/src/main/java/com/prettynails/config/AuditorAwareImpl.java`
- **[Low]** (Lines 31-37): Extracts user ID for `CustomUserDetails` and `User` principals, but does not handle `CustomOAuth2User`. Audited entities modified during an OAuth2-authenticated request will log a debug warning and leave `createdBy`/`lastModifiedBy` empty.
  **Suggestion:** Add an `if (principal instanceof CustomOAuth2User oAuth2User) { return Optional.ofNullable(oAuth2User.getId()); }` branch.
- **[Low]** (Line 44): Calling `principal.getClass().getName()` will throw `NullPointerException` if an `Authentication` implementation returns a `null` principal.
  **Suggestion:** Check `if (principal == null || "anonymousUser".equals(principal)) { return Optional.empty(); }` before logging.

---

### `pretty-nails-backend/src/main/java/com/prettynails/config/DataSeeder.java`
- **[Info]** (Lines 208-226): **Intentional Prototype Behavior:** Seeds the hardcoded `admin` / `admin` user (`role = "ADMIN"`, `emailVerified = LocalDateTime.now()`) in `!test` profiles so the prototype always has the `Email: admin` / `Password: admin` login available. Preserve this block for prototype runs (and restrict/remove only if ever deploying to live production).
- **[High]** (Lines 229-247): Line 230 checks `!"admin".equalsIgnoreCase(adminEmail)` but never checks `StringUtils.hasText(adminEmail)` or `StringUtils.hasText(adminProperties.getPassword())`. Because `application.yml` (lines 65-66) defaults `ADMIN_EMAIL` and `ADMIN_PASSWORD` to `""`, running with unset env vars creates an extra bogus `ADMIN` user with `email = ""` and an encoded empty password `""`!
  **Suggestion:** Guard with `if (StringUtils.hasText(adminEmail) && StringUtils.hasText(adminProperties.getPassword()) && !"admin".equalsIgnoreCase(adminEmail))`.
- **[Low]** (Lines 216, 223, 237, 244): Uses `LocalDateTime.now()` instead of `TimeProvider.localNow()`, violating the studio Manila timezone convention documented in `TimeProvider.java`, and duplicates `LoyaltyCard` initialization across both blocks.
  **Suggestion:** Inject `TimeProvider` and extract a single `createAdminWithLoyaltyCard(...)` helper.
- **[Info]** (Lines 46-205, 250-301): Duplicates the exact seed data defined in `src/main/resources/data.sql`, creating two sources of truth.

---

### `pretty-nails-backend/src/main/java/com/prettynails/config/JpaAuditingConfig.java`
**Status:** Clean — no issues found.

---

### `pretty-nails-backend/src/main/java/com/prettynails/config/OpenApiConfig.java`
- **[Low]** (Lines 30-37): Hardcodes `http://localhost:8080` as the first OpenAPI server unconditionally and defaults `apiBaseUrl` to placeholder `https://api.prettynails.example.com`.
  **Suggestion:** Configure OpenAPI servers conditionally by profile and disable Swagger/OpenAPI in production (`springdoc.api-docs.enabled=false`).

---

### `pretty-nails-backend/src/main/java/com/prettynails/config/RateLimitConfig.java`
- **[Medium]** (Lines 18-23): Uses deprecated Bucket4j 8.x APIs (`Bandwidth.classic(...)` and `Refill.intervally(...)`). Intervally refill resets the entire quota at window boundaries, allowing 2x burst traffic across boundary edges.
  **Suggestion:** Replace with the non-deprecated builder API and greedy refill:
  ```java
  Bandwidth.builder()
          .capacity(requestsPerMinute)
          .refillGreedy(requestsPerMinute, Duration.ofMinutes(1))
          .build()
  ```
- **[Low]** (Lines 11-16): Missing Bean Validation (`@Validated`, `@Min(1)`) on `requestsPerMinute` and `requestsPerHour`; invalid values (`<= 0`) fail at runtime when `Bandwidth` is constructed.
  **Suggestion:** Add `@Validated` and `@Min(1)` on both fields.

---

### `pretty-nails-backend/src/main/java/com/prettynails/config/WebMvcConfig.java`
- **[Medium]** (Lines 25-26): Exposes the entire `uploadDir` via static resource handlers (`/uploads/**`, `/api/uploads/**`) with no `Content-Disposition`, `X-Content-Type-Options: nosniff`, or separation between public gallery assets and private user uploads (e.g., payment receipts). Combined with `permitAll()` in `SecurityConfig.java`, any uploaded file is publicly readable and potentially vulnerable to stored XSS if HTML/SVG is ever saved.
  **Suggestion:** Store and serve private user uploads (such as payment proofs) behind an authenticated controller with ownership/role verification and safe headers (`Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`).
- **[Low]** (Line 25): Registers two overlapping URL prefixes (`/uploads/**` and `/api/uploads/**`) for the exact same filesystem directory.
  **Suggestion:** Standardize on a single canonical upload path prefix.

---

### `pretty-nails-backend/src/main/java/com/prettynails/exception/BadRequestException.java`
**Status:** Clean — no issues found.

---

### `pretty-nails-backend/src/main/java/com/prettynails/exception/ErrorResponse.java`
**Status:** Clean — no issues found.

---

### `pretty-nails-backend/src/main/java/com/prettynails/exception/GlobalExceptionHandler.java`
- **[High]** (Lines 119-132): `handleGenericException` returns `ex.getMessage()` directly in HTTP 500 responses and **never logs the exception or stack trace**. This leaks internal details (SQL errors, class/table names, file paths) to clients while leaving production logs blind to unhandled errors.
  **Suggestion:** Add `@Slf4j`, log `log.error("Unhandled exception at {}", request.getRequestURI(), ex);`, and return a static generic message (`"An unexpected error occurred. Please try again later."`).
- **[Medium]** (Lines 17-18): Annotated with both `@ControllerAdvice` and `@RestController` instead of `@RestControllerAdvice`.
  **Suggestion:** Replace `@ControllerAdvice` and `@RestController` with `@RestControllerAdvice`.
- **[Medium]** (Lines 51-87): Missing handlers for `AuthenticationException` / `BadCredentialsException` / `LockedException` / `DisabledException` (401/403), `HttpMessageNotReadableException` (400), `MethodArgumentTypeMismatchException` / `MissingServletRequestParameterException` (400), and `DataIntegrityViolationException` (409 Conflict for concurrent unique-slot violations), causing them to fall into the 500 handler.
  **Suggestion:** Add explicit `@ExceptionHandler` methods for these exceptions with appropriate HTTP status codes.
- **[Low]** (Lines 26, 41, 60, 79, 94, 109, 124): Uses `LocalDateTime.now()` instead of `TimeProvider.localNow()`, and returns `400 BAD_REQUEST` rather than `413 PAYLOAD_TOO_LARGE` for `MaxUploadSizeExceededException` (line 110).
  **Suggestion:** Inject `TimeProvider` for timestamps and consider returning `HttpStatus.PAYLOAD_TOO_LARGE` on upload-size violations.

---

### `pretty-nails-backend/src/main/java/com/prettynails/exception/ResourceNotFoundException.java`
**Status:** Clean — no issues found.

---

### `pretty-nails-backend/src/main/java/com/prettynails/security/CustomOAuth2User.java`
- **[Low]** (Lines 22-30): `getAttributes()` returns the mutable map directly without defensive wrapping, and `getAuthorities()` duplicates `"ROLE_" + user.getRole()` without a null guard on `user.getRole()`.
  **Suggestion:** Wrap attributes with `Collections.unmodifiableMap(attributes)` and delegate `getAuthorities()` to `user.getAuthorities()`.

---

### `pretty-nails-backend/src/main/java/com/prettynails/security/CustomOAuth2UserService.java`
- **[High]** (Lines 62-70): **Account takeover via unverified OAuth2 email auto-linking.** `loadUser` automatically links an OAuth2 account to any existing `User` (including `ADMIN` accounts) solely by matching `email` without verifying `email_verified` from the provider claims. An attacker using an OAuth2 provider account with an unverified or unconfirmed email matching a victim's address can gain full access to that account.
  **Suggestion:** Require verified email (`Boolean.TRUE.equals(oAuth2User.getAttributes().get("email_verified"))` for Google; disallow auto-linking for providers without verified email guarantees or for `ADMIN` accounts without explicit confirmation).
- **[Medium]** (Lines 55-60): `existingAccount.get().getUser()` accesses a `FetchType.LAZY` `@ManyToOne` association (`Account.user`). Returning a Hibernate lazy proxy inside `CustomOAuth2User` to `OAuth2AuthenticationSuccessHandler` after the `@Transactional` method finishes risks `LazyInitializationException` if `open-in-view` is disabled.
  **Suggestion:** Load the `User` explicitly via `userRepository.findById(existingAccount.get().getUserId())`.
- **[Medium]** (Lines 149-155, 187-193, 200-206): Persists plaintext OAuth2 `accessToken` values in `accounts.access_token`, overwrites `refreshToken` with `null`, and stores `getScopes().toString()` into a `VARCHAR(255)` column (`Account.scope`), which can fail with data truncation on multi-scope grants.
  **Suggestion:** Avoid storing raw OAuth2 access tokens in the database (rely on `OAuth2AuthorizedClientService` or encrypt at rest) and widen/truncate `scope` if retained.
- **[Medium]** (Line 125): Stores an unencoded `UUID.randomUUID().toString()` directly in `User.password` instead of encoding it or leaving it `null`. If `PasswordEncoder.matches()` is ever invoked against it, BCrypt will fail/warn on an invalid hash format.
  **Suggestion:** Encode the random secret with `PasswordEncoder` or set `password` to `null` for OAuth2-only accounts (handling `null` safely on password login).
- **[Low]** (Lines 12, 20, 77-99, 144-208): `extractEmail` and `extractName` contain identical `google`/`facebook`/fallback branches; token assignment logic is duplicated across `createUser`, `linkOAuth2Account`, and `updateAccountTokens`; `AuthenticationException` (line 12) and `LocalDateTime` (line 20) are unused imports; and `log.info` (lines 158, 196) logs raw user emails (PII).
  **Suggestion:** Deduplicate helper methods, remove unused imports, and log `user.getId()` instead of email addresses.

---

### `pretty-nails-backend/src/main/java/com/prettynails/security/CustomUserDetails.java`
- **[Low]** (Lines 18-63): `CustomUserDetails` implements `UserDetails` while `User` itself also implements `UserDetails` with different account-lock semantics, creating a trap where callers like `OAuth2AuthenticationSuccessHandler` pass `User` directly and bypass `CustomUserDetails`. Also `getAuthorities()` does not null-guard `user.getRole()`.
  **Suggestion:** Remove `UserDetails` from the `User` entity (or unify on a single `UserDetails` adapter) and guard against null `role`.

---

### `pretty-nails-backend/src/main/java/com/prettynails/security/CustomUserDetailsService.java`
**Status:** Clean — no issues found.
- **[Info]** (Lines 20-24): Consider adding `@Transactional(readOnly = true)` and trimming `email` (`email.trim()`) before querying.

---

### `pretty-nails-backend/src/main/java/com/prettynails/security/JwtAuthenticationFilter.java`
- **[High]** (Lines 53-55): `jwtUtil.extractUsername(token)` is called without catching `JwtException` (`ExpiredJwtException`, `MalformedJwtException`, `SignatureException`, etc.) or `IllegalArgumentException`. Any expired or malformed `Bearer` token throws out of the servlet filter and returns **HTTP 500** instead of continuing unauthenticated (`401`), even on public endpoints not listed in `PUBLIC_PATHS` (e.g., `GET /api/services`).
  **Suggestion:** Wrap token parsing/validation in `try { ... } catch (JwtException | IllegalArgumentException e) { SecurityContextHolder.clearContext(); }`.
- **[High]** (Lines 46-51): Only checks the `Authorization: Bearer` header and ignores the `prettynails_token` `HttpOnly` cookie set by `AuthController`. Browser requests relying on `HttpOnly` cookies will fail authentication on all protected endpoints.
  **Suggestion:** Extract the JWT from the `Authorization` header first, falling back to the `prettynails_token` cookie if present.
- **[High]** (Lines 57-67): Authenticates any valid JWT without checking `userDetails.isEnabled()` or `userDetails.isAccountNonLocked()`. Locked or unverified accounts with an existing JWT remain able to access protected endpoints.
  **Suggestion:** Require `jwtUtil.isTokenValid(token, userDetails) && userDetails.isEnabled() && userDetails.isAccountNonLocked()`.
- **[Medium]** (Lines 25-32, 41-44, 73-75): `PUBLIC_PATHS` duplicates `SecurityConfig` `permitAll()` rules and is out of sync (omits `/api/services`, `/api/auth/verify-email`, `/api/auth/forgot-password`, `/api/auth/reset-password`, while prefix-matching `/api/gallery` skips JWT parsing for any `/api/gallery/**` path).
  **Suggestion:** Remove `PUBLIC_PATHS` short-circuiting so valid tokens still populate `SecurityContext` when present, and let `SecurityFilterChain` enforce endpoint access rules.
- **[Medium]** (Lines 18-20): Annotated with `@Component` and added in `SecurityConfig` via `addFilterBefore(...)` without disabling Spring Boot's automatic servlet `FilterRegistrationBean`, registering the filter in the root servlet chain as well as `SecurityFilterChain`.
  **Suggestion:** Define a `FilterRegistrationBean<JwtAuthenticationFilter>` with `registration.setEnabled(false)` (or construct the filter as a non-`@Component` bean inside `SecurityConfig`).

---

### `pretty-nails-backend/src/main/java/com/prettynails/security/JwtUtil.java`
- **[Medium]** (Lines 38, 58): Recomputes `Keys.hmacShaKeyFor(secret.getBytes())` on every token generation and verification using the platform default charset rather than `StandardCharsets.UTF_8`.
  **Suggestion:** Derive and cache `private SecretKey signingKey` once in `@PostConstruct` using `secret.getBytes(StandardCharsets.UTF_8)`.
- **[Medium]** (Lines 66-73): `isTokenValid` calls `extractUsername(token)` and then `isTokenExpired(token)`, parsing and verifying the HMAC signature **twice** per request (and `Jwts.parser().parseSignedClaims(...)` already throws `ExpiredJwtException` on expired tokens). It also compares `username.equals(userDetails.getUsername())` case-sensitively.
  **Suggestion:** Parse `Claims` once, compare `equalsIgnoreCase`, and rely on `parseSignedClaims` expiration checks.
- **[Low]** (Lines 34-46): Issued tokens contain only `sub`, `iat`, and `exp` (with a 30-day default lifetime) and lack a `jti` or `passwordChangedAt` / token-version claim, so compromised tokens or tokens issued prior to a password change/logout cannot be invalidated.
  **Suggestion:** Embed a token-version or `pwdChangedAt` claim and verify it against the `User` record (or maintain a revocation check on sensitive flows).

---

### `pretty-nails-backend/src/main/java/com/prettynails/security/OAuth2AuthenticationSuccessHandler.java`
- **[High]** (Lines 33-37): Appends the raw JWT directly to the redirect query string (`?token=...`) **and logs the entire `redirectUrl` containing the live bearer token at `INFO` level** (line 36). This exposes bearer credentials in application logs, browser history, proxy access logs, and `Referer` headers.
  **Suggestion:** Never log the token or full redirect URL (`log.info("OAuth2 login successful for user ID: {}", user.getId())`). Issue the JWT in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie or redirect with a short-lived one-time code exchanged via `POST`.
- **[Medium]** (Line 33): Reads `FRONTEND_URL` via `System.getenv().getOrDefault(...)` instead of Spring `@Value`, bypassing Spring profile configuration and test overrides.
  **Suggestion:** Inject `@Value("${app.frontend-url:http://localhost:3000}") private String frontendUrl;`.
- **[Medium]** (Line 27): Unchecked cast `(CustomOAuth2User) authentication.getPrincipal()` throws `ClassCastException` for OIDC providers (such as Google with `openid` scope), where Spring Security produces an `OidcUser` via `OidcUserService` instead of `CustomOAuth2UserService`.
  **Suggestion:** Provide an `OidcUserService` adapter (or handle `instanceof OidcUser`) and guard the cast with `instanceof`.
- **[Low]** (Line 4): Redundant self-package import `import com.prettynails.security.JwtUtil;`.
  **Suggestion:** Remove the unused import.

---

### `pretty-nails-backend/src/main/java/com/prettynails/security/RateLimitFilter.java`
- **[High]** (Lines 52-62): `getClientIp` unconditionally trusts client-supplied `X-Forwarded-For` and `X-Real-IP` headers. Any attacker can spoof a different `X-Forwarded-For` value on every request to bypass `/api/auth/` brute-force rate limiting.
  **Suggestion:** Configure Spring Boot's `server.forward-headers-strategy=framework` with `server.tomcat.remoteip.internal-proxies` for trusted proxies and read `request.getRemoteAddr()`.
- **[High]** (Lines 20, 36-38): `buckets` is an unbounded `ConcurrentHashMap<String, Bucket>` that never evicts or expires entries. Spoofed IPs or arbitrary `/api/auth/<random>` paths can grow the map indefinitely until `OutOfMemoryError`.
  **Suggestion:** Replace `ConcurrentHashMap` with a bounded expiring Caffeine `Cache<String, Bucket>` (`maximumSize` + `expireAfterAccess`).
- **[Medium]** (Lines 16-17, 36, 43-45):
  - Keying by `clientIp + ":" + path` grants separate quotas per auth endpoint and trailing-slash variation (`/api/auth/login` vs `/api/auth/login/`).
  - Returns a raw `{"error": ...}` body without `ErrorResponse` fields or `Retry-After` / `X-Rate-Limit-Remaining` headers.
  - Annotated `@Component` without disabling `FilterRegistrationBean`, risking double registration outside `SecurityFilterChain`.
  **Suggestion:** Normalize/group auth endpoints, return structured `ErrorResponse` JSON with `Retry-After`, and disable `FilterRegistrationBean` auto-registration.

---

### `pretty-nails-backend/src/main/java/com/prettynails/security/SecurityConfig.java`
- **[High]** (Lines 41-63): `.oauth2Login(...)` is never configured on `HttpSecurity`, leaving `CustomOAuth2UserService` and `OAuth2AuthenticationSuccessHandler` completely unwired and OAuth2 login non-functional.
  **Suggestion (Confirmed):** Configure `.oauth2Login(oauth2 -> oauth2.userInfoEndpoint(u -> u.userService(customOAuth2UserService)).successHandler(oAuth2AuthenticationSuccessHandler))` and fix the related email-verification/token-redirect issues in `CustomOAuth2UserService` and `OAuth2AuthenticationSuccessHandler`.
- **[High]** (Lines 84-94): `corsConfigurationSource()` sets `configuration.setAllowCredentials(false)`, which prevents cross-origin browser `fetch(..., { credentials: 'include' })` requests from sending or storing the `prettynails_token` `HttpOnly` cookie set by `AuthController`.
  **Suggestion:** Set `configuration.setAllowCredentials(true)`, trim `allowedOrigins`, restrict `allowedHeaders` from `"*"` to explicit headers, and enable CSRF protection (e.g., `CookieCsrfTokenRepository`) if cookie authentication is active.
- **[High]** (Lines 45-55): Permits `/uploads/**` and `/api/uploads/**` publicly (exposing private user uploads such as payment receipts) while blocking `/actuator/health` (needed by `Dockerfile` `HEALTHCHECK`) and enabled Swagger UI paths (`/swagger-ui/**`, `/v3/api-docs/**`).
  **Suggestion:** Require authentication for private upload paths, permit `/actuator/health`, and align Swagger UI security with profile configuration.
- **[Medium]** (Lines 59-60): Both `rateLimitFilter` and `jwtAuthenticationFilter` are `@Component` beans added via `addFilterBefore(...)` without `FilterRegistrationBean.setEnabled(false)`, and `http.exceptionHandling(...)` lacks a custom `AuthenticationEntryPoint` and `AccessDeniedHandler` (causing unauthenticated requests to return empty 403s instead of JSON 401 `ErrorResponse`).
  **Suggestion:** Disable servlet auto-registration for both filters and configure `AuthenticationEntryPoint` / `AccessDeniedHandler` returning `ErrorResponse`.
- **[Low]** (Lines 3, 37-38, 86): Unused import `com.prettynails.config.RateLimitConfig;`; `@Value("${app.cors.allowed-origins}")` lacks a fallback default; and `allowedOrigins.split(",")` does not trim whitespace around comma-separated origins.
  **Suggestion:** Remove the unused import and trim split origins (`Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList()`).

---

### `pretty-nails-backend/src/main/java/com/prettynails/util/ManilaTimeProvider.java`
- **[Low]** (Lines 46-68): `isAtLeast24HoursInFuture`, `startOfDay`, `endOfDay`, `startOfMonth`, and `endOfMonth` do not guard against `null` arguments, and `isAtLeast24HoursInFuture` uses strict `isBefore` (meaning an appointment *exactly* 24 hours from `now()` returns `false`).
  **Suggestion:** Add null guards (e.g., `if (appointmentDateTime == null) return false;`) and verify whether `>= 24h` (`!now().plusHours(24).isAfter(...)`) is intended.
- **[Info]** (Line 18): Injecting a `java.time.Clock` bean (defaulting to `Clock.system(MANILA_ZONE)`) would make time-dependent unit tests cleaner without mocking `TimeProvider` everywhere.

---

### `pretty-nails-backend/src/main/java/com/prettynails/util/TimeProvider.java`
**Status:** Clean — no issues found.

---

### `pretty-nails-backend/src/main/resources/application-docker.yml`
- **[High]** (Lines 12-19): Exposes `management.endpoints.web.exposure.include: health,info` with `management.endpoint.health.show-details: always`. Actuator is missing from `pom.xml` (breaking Docker healthchecks), and once added, `show-details: always` leaks DB and disk internals to unauthenticated callers.
  **Suggestion:** Add `spring-boot-starter-actuator` and set `management.endpoint.health.show-details: when-authorized`.
- **[High]** (Lines 25-31): Does not override `app.cors.allowed-origins`, `app.email.verification-url`, `app.email.reset-url`, or `app.upload.base-url`, so Docker deployments inherit `http://localhost:3000` / `http://localhost:8080` from `application.yml`.
  **Suggestion:** Externalize these URLs via environment variables (e.g., `${CORS_ALLOWED_ORIGINS}`, `${FRONTEND_URL}`, `${API_BASE_URL}`).
- **[Medium]** (Lines 26-29): `ADMIN_EMAIL` and `ADMIN_PASSWORD` default to empty strings `""`, and `application-docker.yml` inherits `spring.jpa.hibernate.ddl-auto: update`, `logging.level.com.prettynails: DEBUG`, and `springdoc.*.enabled: true` from `application.yml`.
  **Suggestion:** Set `spring.jpa.hibernate.ddl-auto: validate`, `logging.level.com.prettynails: INFO`, and `springdoc.api-docs.enabled: false` / `springdoc.swagger-ui.enabled: false` in `application-docker.yml`.

---

### `pretty-nails-backend/src/main/resources/application-local.yml`
- **[Medium]** (Line 10): `spring.jpa.show-sql: true` writes raw SQL directly to stdout instead of routing through the logging framework.
  **Suggestion:** Use `logging.level.org.hibernate.SQL: DEBUG` instead of `show-sql: true`.
- **[Low]** (Lines 41-44): Configures `bucket4j.cache.config.type: caffeine` for `bucket4j-spring-boot-starter`, which is excluded in `LocalApplication` and unused by `RateLimitFilter`.
  **Suggestion:** Remove the unused `bucket4j` YAML block.
- **[Low]** (Lines 53-78): Duplicates numerous default properties identically from `application.yml` (`server.port`, `app.cors`, `app.admin`, `app.upload`, `app.email`, `app.rate-limit`, `app.password-policy`, `app.cookie`, `jwt.secret`), increasing config drift risk.
  **Suggestion:** Keep only `local`-specific overrides in `application-local.yml`.
- **[Info]** (Lines 3, 47, 75): Uses strictly in-memory H2 (`jdbc:h2:mem:prettynails`, no local H2 files and no Supabase), a static dev `jwt.secret` fallback, and `hibp-check-enabled: false`; acceptable for local prototype runs (or point `local` to local PostgreSQL to test Flyway migrations and PostgreSQL-specific SQL such as `JSONB` / partial unique indexes).

---

### `pretty-nails-backend/src/main/resources/application.yml`
- **[Critical]** (Lines 54-56): Base `application.yml` defines a hardcoded fallback `jwt.secret: ${JWT_SECRET:dev-secret-change-in-production-min-32-chars-for-hs256}`. Any non-local deployment where `JWT_SECRET` is accidentally omitted will silently boot with a publicly known signing secret (bypassing `JwtUtil.validateSecret()`), allowing anyone to forge `ADMIN` JWTs.
  **Suggestion:** Change base `application.yml` to `jwt.secret: ${JWT_SECRET}` with no default value, keeping the dev secret exclusively in `application-local.yml`.
- **[High]** (Lines 14-18): Base `application.yml` hardcodes default PostgreSQL credentials (`username: postgres`, `password: password`) instead of requiring environment variables.
  **Suggestion:** Require `${DB_USERNAME}` and `${DB_PASSWORD}` in `application.yml` without hardcoded defaults.
- **[High]** (Lines 20-34): Combines `hibernate.ddl-auto: update` with `flyway.enabled: true` (`baseline-on-migrate: true`), while **no `V1__*.sql` migration exists**. Because Flyway runs before JPA/Hibernate during startup, booting against a fresh PostgreSQL database fails when `V2` and `V3` run against nonexistent `bookings` and `users` tables.
  **Suggestion:** Add a complete `V1__Initial_schema.sql` migration and set `spring.jpa.hibernate.ddl-auto: validate` in `application.yml`.
- **[Medium]** (Lines 10-12): Comment states `Configure JVM default timezone for the studio (Asia/Manila)`, but `spring.jackson.timezone: Asia/Manila` only configures Jackson JSON serialization and does **not** set the JVM or JDBC timezone.
  **Suggestion:** Update the comment, configure `spring.jpa.properties.hibernate.jdbc.time_zone: Asia/Manila`, and set `TimeZone.setDefault(TimeZone.getTimeZone("Asia/Manila"))` at application startup if JVM default timezone is relied upon.
- **[Medium]** (Lines 63, 74-75, 87, 89-108): Base `application.yml` enables Swagger UI/OpenAPI (`enabled: true`), sets `logging.level.com.prettynails: DEBUG`, defaults `app.cookie.secure: false`, and hardcodes `http://localhost:3000` for CORS and email verification/reset URLs.
  **Suggestion:** Use secure production defaults in `application.yml` (`cookie.secure: true`, `INFO` logging, Swagger disabled, env-var URLs) and override them only in `application-local.yml`.

---

### `pretty-nails-backend/src/main/resources/data.sql`
- **[Info]** (Lines 53-57): **Intentional Prototype Behavior:** Seeds the `ADMIN` account (`email = 'admin'`, BCrypt hash for `'admin'`), matching `DataSeeder.java`. Preserve this prototype credential if `data.sql` is executed manually.
- **[Low]** (Lines 4-62): Duplicates `DataSeeder.java` while remaining inactive due to `spring.sql.init.mode: never`.
  **Suggestion:** Consolidate on `DataSeeder.java` or keep `data.sql` synchronized with `DataSeeder.java` as a PostgreSQL reference seed script.

---

### `pretty-nails-backend/src/main/resources/db/migration/V2__Create_partial_unique_index_for_active_bookings.sql`
- **[High]** (Lines 1-3): No `V1__*.sql` migration exists in `db/migration/`. Because Flyway executes before Hibernate `ddl-auto`, running against an empty PostgreSQL database fails at `V2` with `relation "bookings" does not exist`. Additionally, `CREATE UNIQUE INDEX` lacks `IF NOT EXISTS`.
  **Suggestion:** Add `V1__Initial_schema.sql` creating the base tables prior to `V2`, and use `CREATE UNIQUE INDEX IF NOT EXISTS`.

---

### `pretty-nails-backend/src/main/resources/db/migration/V3__Add_oauth2_no_show_audit_notification_tables.sql`
- **[Critical]** (Lines 12-28): The `audit_logs` table created by `V3` (`id UUID`, `admin_id VARCHAR(36) NOT NULL`, `entity_type NOT NULL`, `old_value`, `new_value`, `timestamp`, `user_agent VARCHAR(500)`) is incompatible with the `AuditLog` JPA entity (`id` `String`, `user_id`, `user_email`, `user_role`, `description`, `metadata JSONB`, `created_at`, `user_agent` `2000`), and indexes `idx_audit_log_admin_id` / `idx_audit_log_timestamp` do not match `AuditLog`'s `@Index` definitions (`idx_audit_log_user_id`, `idx_audit_log_action`, `idx_audit_log_created_at`). Inserting an `AuditLog` in PostgreSQL will fail due to missing columns and `NOT NULL` constraints on `admin_id`/`entity_type`/`timestamp`.
  **Suggestion:** Align a new migration (or fix `V3` if not yet applied in production) to match `AuditLog.java` column names, nullability, and types (`VARCHAR(36)` ID or `UUID` consistently, `JSONB` `metadata`, `created_at`, `user_id`, `user_email`, `user_role`, `description`).
- **[High]** (Lines 5-9, 31): `ALTER TABLE users` and `CREATE INDEX ... ON bookings` fail on a fresh PostgreSQL database because no `V1__` baseline migration exists prior to Flyway execution.
  **Suggestion:** Add `V1__Initial_schema.sql` before `V2` and `V3`.
- **[Medium]** (Lines 1, 12-23): `audit_logs` lacks a `FOREIGN KEY` reference to `users(id)`, and the migration filename promises no-show and notification tables that are absent from the SQL script.
  **Suggestion:** Add an appropriate foreign key (e.g., `ON DELETE SET NULL`) and split/complete missing tables or rename the migration accurately.

---

## 8. Backend Controllers & DTOs

This audit covers all 11 REST controllers and 10 DTO container classes in `pretty-nails-backend`, evaluating authorization, Bean Validation, error handling, pagination, and Lombok/Spring Boot idioms. Four critical authorization/business-logic vulnerabilities were identified—missing `@PreAuthorize` on notification send/broadcast endpoints, broken object-level authorization (IDOR) in payment retrieval and creation, and unverified self-stamping via QR codes—alongside widespread gaps in nested `@Valid` annotations, `@Builder.Default` usage, and pagination consistency.

| Severity | Count | Key Themes |
|---|---:|---|
| Critical | 4 | Missing `@PreAuthorize` on `/api/notifications/send` & `/broadcast`; Payment IDOR & overwrite (`GET`/`POST /api/payments`); unverified customer QR self-stamping (`POST /api/loyalty/stamp`) |
| High | 5 | Missing `@Valid` on nested DTO lists (`BookingRequest.services`, `ServiceRequest.variants`); unvalidated notification payloads; missing `@NotNull` on `LoyaltySettingsDto`; SSE sink race/leak |
| Medium | 17 | Dual JWT cookie/body delivery & `Secure=false`; missing `@Builder.Default`; unvalidated date/time/URI strings; `IllegalArgumentException` returning HTTP 500; unpaginated admin bookings; inactive gallery/service exposure |
| Low | 23 | Unused imports; duplicated `getCurrentUser()` & DTOs; inconsistent pagination wrappers; missing `@Size`/`@Max` bounds; internal class name leak |
| Info | 6 | `200 OK` returned instead of `201 Created` on `POST` endpoints; `BaseController` not `abstract`; uploader ownership tracking |

### `pretty-nails-backend/src/main/java/com/prettynails/controller/AdminController.java`

- **[Low]** (Lines 26-39): `getCurrentUser()` duplicates `BaseController.getCurrentUser()` instead of inheriting from `BaseController`. **Suggestion:** Extend `BaseController` and delete the local `getCurrentUser()` method.
- **[Low]** (Lines 46-49): `getReports` accepts an unvalidated `period` query parameter; unrecognized values silently compute `"month"` metrics in `AdminService` while echoing the raw input in `AdminReportsDto.period`. **Suggestion:** Restrict `period` with an enum or `@Pattern(regexp = "week|month|quarter|year")` (with `@Validated` on the controller).
- **[Info]** (Lines 78-85): `addCustomerNote` (`POST /api/admin/customers/{userId}/notes`) returns `200 OK` instead of `201 Created`. **Suggestion:** Return `ResponseEntity.status(HttpStatus.CREATED).body(note)`.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/AuthController.java`

- **[Medium]** (Lines 23-35, 47-65): Dual token delivery and cookie configuration risks: `setAuthCookie` sets `Secure` from `app.cookie.secure` (defaulting to `false`), uses `SameSite=Lax` while CSRF protection is disabled in `SecurityConfig`, and hardcodes 30/90-day `maxAge` independently of JWT expiry—while `register` and `login` also expose the raw JWT in the JSON `AuthResponse` body (making it accessible to XSS if stored client-side). Additionally, `logout` only clears the cookie without server-side token revocation. **Suggestion:** Choose either pure `HttpOnly; Secure; SameSite` cookies (with CSRF protection and filter support) or `Authorization: Bearer` headers, and add a token revocation/blocklist mechanism on logout.
- **[Low]** (Lines 67-71): `getCurrentUserEndpoint()` returns `UserDto` directly instead of `ResponseEntity<UserDto>`, inconsistent with every other endpoint in `AuthController`. **Suggestion:** Return `ResponseEntity.ok(authService.getCurrentUser(user))`.
- **[Low]** (Lines 5-6): Unused imports `com.prettynails.exception.BadRequestException` and `com.prettynails.security.CustomUserDetails`. **Suggestion:** Remove both unused imports.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/AvailabilityController.java`

- **[Medium]** (Lines 34-37): Public endpoint `GET /api/availability/staff/{staffId}` accepts `staffId`, but `AvailabilityService.getStaffSchedule(staffId)` ignores it and returns `availabilityRepository.findAll()` (all dates, past and unavailable, unbounded). **Suggestion:** Either implement staff-filtered, date-bounded queries or remove/restrict this placeholder endpoint until staff entities exist.
- **[Low]** (Lines 4, 11): Unused imports `com.prettynails.entity.User` and `org.springframework.security.core.context.SecurityContextHolder`. **Suggestion:** Remove both unused imports.
- **[Info]** (Lines 24-37, 40-43): Public `GET` endpoints return raw `List<...>` while admin endpoints return `ResponseEntity<...>`, and `createAvailability` returns `200 OK` instead of `201 Created`. **Suggestion:** Standardize on `ResponseEntity` and return `201 Created` on resource creation.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/BaseController.java`

- **[Low]** (Line 29): `throw new AccessDeniedException("Unexpected principal type: " + principal.getClass().getName())` exposes internal Java class names to clients via `GlobalExceptionHandler.handleAccessDeniedException`. **Suggestion:** Log the unexpected type server-side and throw `new AccessDeniedException("Invalid authentication principal")`.
- **[Info]** (Line 9): `BaseController` is declared as a concrete `public class` despite having no endpoints and existing solely for subclassing. **Suggestion:** Declare it `public abstract class BaseController`.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/BookingController.java`

- **[Medium]** (Lines 41-52): `getBookingById` checks `!booking.getUserId().equals(currentUser.getId())` (line 47), which throws `NullPointerException` if `booking.getUserId()` is `null`, and checks `"ADMIN".equals(currentUser.getRole())` manually rather than via Spring Security authorities or service-layer enforcement. **Suggestion:** Use `Objects.equals(booking.getUserId(), currentUser.getId())` and move ownership enforcement into `BookingService` (or `@PostAuthorize`).
- **[Medium]** (Lines 68-82): `updateBookingStatus` throws `IllegalArgumentException` on invalid `status` (line 79), which falls through to `GlobalExceptionHandler.handleGenericException` and returns `500 Internal Server Error` instead of `400 Bad Request`. It also calls `toUpperCase()` without `Locale.ROOT` and duplicates `/admin/bookings/{id}/*` endpoints (lines 84-120). **Suggestion:** Throw `BadRequestException` (or validate `status` with an enum/`@Pattern`), use `Locale.ROOT`, and consolidate the duplicate status endpoints.
  ```java
  default -> throw new BadRequestException("Invalid status: " + request.getStatus());
  ```
- **[Medium]** (Lines 98-106): `GET /api/admin/bookings` (`getAllBookings`) returns an unbounded `List<BookingDto>` without `Pageable`, creating scalability and memory risks as bookings accumulate. **Suggestion:** Accept `Pageable` (`@PageableDefault(size = 20)`) and return a paginated response.
- **[Low]** (Line 5): Unused import `com.prettynails.security.CustomUserDetails`. **Suggestion:** Remove the unused import.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/GalleryController.java`

- **[Medium]** (Lines 32-35): `getPublicGalleryById` (`GET /api/gallery/{id}`) delegates to `galleryService.getGalleryById(id)` (the exact same unfiltered lookup as `getAdminGalleryById` on lines 57-61), exposing inactive/unpublished (`isActive = false`) items to non-admin users. (In addition, `SecurityConfig` only permits `/api/gallery`, not `/api/gallery/**`, blocking unauthenticated public callers.) **Suggestion:** Add a `getActiveGalleryById(id)` method enforcing `isActive = true` for public access and align `SecurityConfig` if `/api/gallery/{id}` is intended to be public.
- **[Low]** (Lines 23-30): `getPublicGallery` returns an unbounded `List<GalleryDto>` without pagination. **Suggestion:** Add `Pageable` or a capped page size.
- **[Info]** (Lines 63-68): `createGallery` returns `200 OK` instead of `201 Created`. **Suggestion:** Return `ResponseEntity.status(HttpStatus.CREATED).body(created)`.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/LoyaltyController.java`

- **[Critical]** (Lines 40-45): `POST /api/loyalty/stamp` (`addStampViaQr`) allows any authenticated customer to self-issue loyalty stamps by submitting an arbitrary string such as `"BOOKING:any-id"`—`LoyaltyService.addStampViaQr` never verifies that the booking exists, belongs to `currentUser`, is completed, or carries a signed QR token. It also returns `200 OK` even when `StampResponse.getSuccess()` is `false`. **Suggestion:** Remove customer self-stamping or require a cryptographically signed/single-use QR token bound to a verified completed booking owned by `currentUser`, and return `400 Bad Request` when stamping fails.
- **[Low]** (Line 5): Unused import `com.prettynails.security.CustomUserDetails`. **Suggestion:** Remove the unused import.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/NotificationController.java`

- **[Critical]** (Lines 125-141): Missing authorization on `POST /api/notifications/send` and `POST /api/notifications/broadcast`. Although their Javadocs state `(admin/staff only)` and `(admin only)`, neither method has `@PreAuthorize` and `SecurityConfig` only restricts `/api/admin/**`, allowing any authenticated customer to push notifications to arbitrary users or broadcast to all connected users. Both methods also omit `@Valid` on `@RequestBody`. **Suggestion:** Add `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")` to `sendNotification`, `@PreAuthorize("hasRole('ADMIN')")` to `broadcastNotification`, and `@Valid` to both request parameters.
  ```java
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/broadcast")
  public ResponseEntity<Void> broadcastNotification(@Valid @RequestBody BroadcastNotificationRequest request)
  ```
- **[High]** (Lines 36-78): SSE sink lifecycle race condition and leak in `streamNotifications()`. `NotificationService.registerSink` overwrites a single `Sinks.Many` per `userId`, so opening a second tab or reconnecting overwrites the first sink, and `.doOnCancel(() -> notificationService.removeSink(userId))` (lines 74-77) removes the *newer* connection's sink when the old stream closes. Error/completion termination also lacks `.doFinally` cleanup, and `sink.tryEmitNext(connectedEvent)` (line 72) ignores emission failures. **Suggestion:** Track sinks per connection ID (or `CopyOnWriteArrayList`/`Set` per user) and remove the specific sink instance in `.doFinally(...)`.
- **[Medium]** (Lines 84-93): `getNotificationHistory` lacks bounds validation on `page` and `size` (`@Min(0)` / `@Max(100)`), allowing `page < 0` or `size < 1` to throw `IllegalArgumentException` (HTTP 500) or huge `size` values to trigger unbounded queries. **Suggestion:** Annotate the controller with `@Validated` and constrain `@RequestParam @Min(0) int page` and `@RequestParam @Min(1) @Max(100) int size`.
- **[Low]** (Lines 98-103): `markAsRead` delegates to `NotificationService.markAsRead`, which throws `IllegalArgumentException("Notification not found")`, resulting in HTTP 500 from `GlobalExceptionHandler` instead of `404 Not Found`. **Suggestion:** Throw `ResourceNotFoundException` in `NotificationService` (or map `IllegalArgumentException` appropriately).
- **[Low]** (Lines 5, 17): Unused imports `com.prettynails.security.CustomUserDetails` and `java.util.List`. **Suggestion:** Remove both unused imports.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/PaymentController.java`

- **[Critical]** (Lines 21-26): Broken Object-Level Authorization (IDOR) in `GET /api/payments/{bookingId}`. As indicated by the `// For now, just return the payment` comment (lines 23-24), neither the controller nor `PaymentService.getPaymentByBookingId` verifies that the booking belongs to `currentUser` or that the caller is `ADMIN`, allowing any authenticated user to read any other user's payment details. **Suggestion:** Extract `currentUser = getCurrentUser()` and verify booking ownership or `ADMIN` role before returning the payment.
- **[Critical]** (Lines 28-32): Broken Object-Level Authorization and payment tampering in `POST /api/payments`. `PaymentService.createPayment(currentUser, request)` never verifies that `request.getBookingId()` belongs to `currentUser`, and when a payment record already exists for that `bookingId` it overwrites `userId`, `amount`, `method`, and `reference` (even if status is already `PAID`). **Suggestion:** Verify `booking.getUserId().equals(currentUser.getId())`, reject modifications to already-`PAID` payments, and derive/validate `amount` server-side from the booking.
- **[Low]** (Lines 41-45): `getAllPayments` (`GET /api/admin/payments`) returns an unpaginated `List<PaymentDto>`. **Suggestion:** Add `Pageable` pagination.
- **[Low]** (Lines 5, 10): Unused imports `com.prettynails.security.CustomUserDetails` and `org.springframework.security.access.AccessDeniedException`. **Suggestion:** Remove unused imports once ownership enforcement is moved cleanly or use `AccessDeniedException` when implementing the check.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/ServiceController.java`

- **[Medium]** (Lines 32-40): Public endpoints `GET /api/services/{id}` and `GET /api/services/{id}/variants` (permitted via `/api/services/**` in `SecurityConfig`) call `serviceService.getServiceById(id)` and `getServiceVariants(id)` without filtering by `isActive = true`, exposing inactive/unpublished services and variants to anonymous users. **Suggestion:** Enforce `isActive = true` on public lookups (returning 404 for inactive services) and keep unfiltered lookups under `/api/admin/services/**`.
- **[Info]** (Lines 48-52): `createService` returns `200 OK` instead of `201 Created`. **Suggestion:** Return `ResponseEntity.status(HttpStatus.CREATED).body(...)`.

### `pretty-nails-backend/src/main/java/com/prettynails/controller/UploadController.java`

- **[Info]** (Lines 21-25): `uploadFile` returns `200 OK` instead of `201 Created` and does not record uploader identity/quotas for stored files (making orphaned upload cleanup and per-user abuse attribution harder). **Suggestion:** Return `201 Created` and track uploader metadata/quotas if user-submitted uploads are retained long-term.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/AdminDtos.java`

- **[High]** (Lines 61-78): `LoyaltySettingsDto` lacks `@NotNull` on `stampsPerService`, `stampsPerAmount`, `amountThreshold`, `cardExpiryMonths`, and `rewardThreshold` (even though `NotNull` is imported on line 5). Bean Validation's `@Min(1)` treats `null` as valid, allowing `null`s to be saved and triggering `NullPointerException` when unboxed (e.g., `LoyaltyService` line 104). `freeServiceReward` also lacks `@NotBlank` and `@Size`. **Suggestion:** Add `@NotNull` (and reasonable `@Max` bounds) to all numeric settings fields and `@NotBlank @Size(max = 200)` to `freeServiceReward`.
- **[Low]** (Lines 99-102): `CustomerNoteRequest.content` has `@NotBlank` but no `@Size(max = ...)` limit, allowing arbitrarily large note strings. **Suggestion:** Add `@Size(max = 2000)`.
- **[Low]** (Lines 121-129): `CustomerPageResponse` uses `pageNumber` and `pageSize`, inconsistent with `number`/`size` in `AdminGalleryPageResponse` and `AdminLoyaltyPageResponse`, and duplicates pagination wrapper boilerplate. **Suggestion:** Replace per-feature page DTOs with a single generic `PageResponse<T>`.
- **[Low]** (Lines 5-6): Unused imports `jakarta.validation.constraints.NotNull` and `jakarta.validation.constraints.PositiveOrZero`. **Suggestion:** Use `@NotNull` on `LoyaltySettingsDto` and remove `PositiveOrZero`.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/AuthDtos.java`

- **[Medium]** (Line 49): `AuthResponse.type` initializes `= "Bearer"` without `@Builder.Default`. Because `AuthResponse` uses `@Builder` (called in `AuthService`), Lombok ignores the field initializer and serializes `"type": null`. **Suggestion:** Add `@Builder.Default` to `type`.
  ```java
  @Builder.Default
  private String type = "Bearer";
  ```
- **[Medium]** (Lines 14-27, 33-41, 82-83, 94-96, 148-150): Input validation gaps across auth DTOs: `RegisterRequest.name` lacks `@NotBlank`; `RegisterRequest.phone` has no `@Size`/`@Pattern` (while `UpdateProfileRequest.phone` has `@Size(max = 20)`); password fields (`RegisterRequest`, `ChangePasswordRequest`, `ResetPasswordRequest`) have `@Size(min = 6)` with no `max` bound (BCrypt truncates at 72 bytes and huge inputs risk CPU DoS); `LoginRequest.email` lacks `@Email`; and `UpdateProfileRequest.image` lacks URI scheme validation (allowing `javascript:` or `data:` URIs). **Suggestion:** Add `@NotBlank`, `@Size(max = ...)` bounds (e.g., `max = 128` on passwords, `max = 255` on emails), `@Email` on `LoginRequest.email`, and safe URL scheme validation on `image`.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/AvailabilityDtos.java`

- **[Medium]** (Line 34): `AvailabilityRequest.isAvailable` initializes `= true` without `@Builder.Default` (unlike `startTime`, `endTime`, and `maxSlots` in the same class) and lacks `@NotNull`. Using `AvailabilityRequest.builder()` leaves `isAvailable` as `null`, risking a `NullPointerException` when unboxed in `AvailabilityService.getAvailableSlots`. **Suggestion:** Add `@Builder.Default` and `@NotNull` to `isAvailable`.
- **[Medium]** (Lines 36-40): `startTime` and `endTime` lack `@NotBlank` and time-format `@Pattern` validation (`HH:mm`), so invalid or `null` values trigger `DateTimeParseException` or `NullPointerException` (HTTP 500) in `AvailabilityService.getAvailableSlots`. **Suggestion:** Add `@NotBlank` and `@Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$")` to both fields.
- **[Low]** (Lines 22-23, 47): `AvailabilityDto.createdAt` and `updatedAt` are `String` while `date` is `LocalDateTime`, and `AvailabilityRequest.note` lacks `@Size(max = ...)`. **Suggestion:** Standardize timestamp types and add `@Size(max = 500)` to `note`.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/BookingDtos.java`

- **[High]** (Lines 52-54): `BookingRequest.services` is missing `@Valid`, so Jakarta Bean Validation does not validate elements inside `List<BookingServiceRequest>` (`@NotBlank serviceId`, `@Min(1) quantity`). **Suggestion:** Add `@Valid` alongside `@NotNull @Size(min = 1)`.
  ```java
  @NotNull
  @Size(min = 1)
  @Valid
  private List<BookingServiceRequest> services;
  ```
- **[Medium]** (Lines 21, 42): `BookingServiceRequest.quantity` (`= 1`) and `BookingRequest.downpayment` (`= 10000`) both omit `@Builder.Default` and `@NotNull`, so builder usage leaves them `null` and explicit `"quantity": null` bypasses `@Min(1)`. **Suggestion:** Add `@Builder.Default` and `@NotNull` (plus reasonable `@Max` bounds).
- **[Medium]** (Lines 29-35, 168-175): `appointmentDate`, `startTime`, and `endTime` in `BookingRequest` and `RescheduleRequest` are unvalidated `String`s without ISO date/time `@Pattern` constraints; malformed values cause uncaught `DateTimeParseException` (HTTP 500) in `BookingService`. **Suggestion:** Use `LocalDate`/`LocalTime` or enforce strict `@Pattern` formats (`yyyy-MM-dd` and `HH:mm`).
- **[Low]** (Lines 44-49, 84-130, 146, 159-162): `notes`, `inspirationImage`, and `paymentReference` lack `@Size` limits; `BookingStatusRequest.status` lacks enum/`@Pattern` validation; `ServiceDto`, `ServiceVariantDto`, `PaymentDto`, and `LoyaltyStampDto` duplicate DTOs in other files; and `BookingRequest.inspirationImage` vs `BookingDto.inspirationImg` uses inconsistent naming. **Suggestion:** Add `@Size` and status validation, reuse shared DTOs, and unify `inspirationImage` naming.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/GalleryDtos.java`

- **[Medium]** (Lines 19-27): `GalleryRequest.imageUrl` lacks URI scheme validation (only `@NotBlank @Size(max = 500)`), `description` and `category` lack `@Size` bounds, and `isActive = true` lacks `@Builder.Default`. **Suggestion:** Validate `imageUrl` against `https?://` or `/uploads/`, add `@Size` constraints, and add `@Builder.Default` to `isActive`.
- **[Low]** (Lines 49-57): `AdminGalleryPageResponse` duplicates pagination wrapper structure found in `AdminLoyaltyPageResponse` and `CustomerPageResponse`. **Suggestion:** Consolidate into a shared `PageResponse<T>` DTO.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/LoyaltyDtos.java`

- **[Medium]** (Lines 83-84): `LoyaltyActionRequest.amount` uses `@PositiveOrZero` (permitting `0`, a no-op for `ADD_STAMP`/`REMOVE_STAMP`/`EXTEND`) and has no `@Max` bound, allowing `Integer.MAX_VALUE` to overflow `stampCount` in `LoyaltyService.adminLoyaltyAction`. **Suggestion:** Replace `@PositiveOrZero` with `@Min(1)` and add an upper bound such as `@Max(1000)`.
- **[Low]** (Lines 42-45, 76-78, 108-116): `StampRequest.qrCode` and `LoyaltyActionRequest.userId` lack `@Size` bounds, and `AdminLoyaltyPageResponse` duplicates pagination wrapper boilerplate. **Suggestion:** Add `@Size` limits and use a shared `PageResponse<T>`.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/NotificationDtos.java`

- **[High]** (Lines 15-24, 60-71): `SendNotificationRequest`, `BroadcastNotificationRequest`, and `NotificationEvent` have zero Bean Validation annotations (`@NotBlank`, `@NotNull`, `@Valid`, `@Size`). Passing a `null` `event` or missing `userId` triggers `NullPointerException` (HTTP 500) in `NotificationService`. **Suggestion:** Add `@NotBlank` on `userId`, `@NotNull @Valid` on `event`, and `@NotBlank`/`@Size`/`@Min(1) @Max(3)` constraints on `NotificationEvent` fields.
- **[Low]** (Lines 46-54): `NotificationHistoryResponse` uses `notifications`/`page`/`size`, adding a third pagination response shape across the API. **Suggestion:** Align with a shared generic `PageResponse<T>`.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/PaymentDtos.java`

- **[Medium]** (Lines 40-41): `PaymentRequest.method` initializes `= "GCASH"` without `@Builder.Default` and lacks `@NotBlank`/`@Pattern` (or enum) validation against allowed methods (`GCASH`, `MAYA`). `PaymentRequest.reference` also lacks `@NotBlank` and `@Size` bounds. **Suggestion:** Add `@Builder.Default`, constrain `method` to an enum or `@Pattern(regexp = "GCASH|MAYA")`, and validate `reference` length/presence.
- **[Low]** (Lines 6, 14-26, 36-38): Unused import `java.time.LocalDateTime`; `PaymentRequest.amount` lacks a `@Max` bound; and `PaymentDto` duplicates `BookingDtos.PaymentDto`. **Suggestion:** Remove the unused import, add `@Max`, and reuse one `PaymentDto`.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/ServiceDtos.java`

- **[High]** (Line 74): `ServiceRequest.variants` is missing `@Valid`, causing Bean Validation to skip `@NotBlank name` and `@NotNull @Min(0) price` on nested `ServiceVariantRequest` objects during service creation and updates. **Suggestion:** Add `@Valid` to `variants`.
  ```java
  @Valid
  private List<ServiceVariantRequest> variants;
  ```
- **[Low]** (Lines 14-34, 41-42, 62): `ServiceVariantRequest.name` and `ServiceRequest.description` lack `@Size` bounds, and `ServiceDto`/`ServiceVariantDto` duplicate classes in `BookingDtos.java`. **Suggestion:** Add `@Size` bounds and remove the duplicate definitions from `BookingDtos`.

### `pretty-nails-backend/src/main/java/com/prettynails/dto/UploadDtos.java`

**Status:** Clean — no issues found.

---

## 9. Backend Services

The backend service layer exhibits severe security and integrity gaps in booking, payment, and loyalty workflows—most notably client-controlled pricing/payment verification in `BookingService` and `PaymentService`, alongside unauthenticated/unverified QR stamp minting in `LoyaltyService`. Additionally, several services suffer from N+1 query patterns, transaction boundary bugs (such as shared rollback on audit logging and pre-commit SSE/email dispatch), and unhandled image decoding/re-encoding edge cases in `FileStorageService`.

| File | Critical | High | Medium | Low | Info |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `pretty-nails-backend/src/main/java/com/prettynails/service/AdminService.java` | 0 | 1 | 2 | 2 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/AuditService.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/AuthService.java` | 0 | 1 | 2 | 1 | 1 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/AvailabilityService.java` | 0 | 1 | 1 | 1 | 1 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/BookingService.java` | 1 | 3 | 2 | 0 | 1 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/EmailService.java` | 0 | 0 | 0 | 0 | 1 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/EmailServiceImpl.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/EmailServiceMock.java` | 0 | 0 | 1 | 0 | 1 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/FileStorageService.java` | 0 | 2 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/GalleryService.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/LoyaltyService.java` | 1 | 2 | 2 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/NoShowPolicyService.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/NotificationService.java` | 0 | 1 | 2 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/PasswordPolicyService.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/PaymentService.java` | 1 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/ServiceService.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/service/UserAccountLockService.java` | 0 | 0 | 0 | 1 | 1 |
| **Total** | **3** | **16** | **20** | **14** | **6** |

### `pretty-nails-backend/src/main/java/com/prettynails/service/AdminService.java`

- **[High]** (Lines 180-197, 260-274): `getCustomers` loads every matching `User` into memory, triggers an N+1 query storm in `mapToCustomerListDto` (`bookingRepository.countByUserId` + `loyaltyCardRepository.findByUserId` per customer), and slices `dtos.subList(start, end)` afterward while ignoring `pageable.getSort()`.
  **Suggestion:** Push pagination, sorting, and filtering into `UserRepository` (returning `Page<User>` or a JPQL projection with aggregated counts/stamps) so only the requested page is queried:
  ```java
  Page<CustomerListDto> page = userRepository.findCustomerSummaries(search, pageable);
  ```

- **[Medium]** (Lines 52, 93-94): `getDashboardStats` unboxes `bookingRepository.sumTotalPriceByStatus("COMPLETED")` directly to primitive `long totalRevenue`, which throws a `NullPointerException` when no `COMPLETED` bookings exist (unlike `getReports`, which assigns to `Long` and checks `revenue == null`).
  **Suggestion:** Use `Long` with a null fallback (or `COALESCE(..., 0)` in the repository query):
  ```java
  Long totalRevenueVal = bookingRepository.sumTotalPriceByStatus("COMPLETED");
  long totalRevenue = totalRevenueVal != null ? totalRevenueVal : 0L;
  ```

- **[Medium]** (Lines 100-122): `getReports` loads all `COMPLETED` bookings for the period into memory and traverses `booking.getServices()` / `bs.getService()`, risking N+1 lazy loads and `LazyInitializationException` because read methods lack `@Transactional(readOnly = true)`; it also echoes an unrecognized `period` parameter in `AdminReportsDto.period` despite falling back to a 1-month window.
  **Suggestion:** Add `@Transactional(readOnly = true)` to read methods, normalize `period` to `"month"` in the `else` branch, and aggregate top-5 services with a single `GROUP BY` repository query.

- **[Low]** (Lines 138-144): `getLoyaltySettings` silently catches `Exception` on `objectMapper.readValue(...)` and falls back to defaults without logging, hiding corrupted JSON data in the `Setting` table.
  **Suggestion:** Add `@Slf4j` and log a warning (`log.warn("Failed to parse loyalty settings JSON, using defaults", e)`).

- **[Low]** (Lines 207-241, 253-255, 276-285): `addCustomerNote` and `updateCustomerNote` load `User admin` and pass it into `mapToCustomerNoteDto(note, admin)`, where `admin` is unused; ownership checks on lines 231 and 253 throw `BadRequestException` (400) instead of a 403/access-denied exception and lack null safety (`Objects.equals(note.getAdminId(), adminId)`).
  **Suggestion:** Remove the unused `admin` query/parameter (or include admin metadata if intended) and throw `AccessDeniedException` on ownership mismatch.

### `pretty-nails-backend/src/main/java/com/prettynails/service/AuditService.java`

- **[High]** (Lines 63-88): `logAction` uses default `@Transactional` (`Propagation.REQUIRED`) and catches `Exception` with the intent to *"Never let audit logging failures affect the main operation"*. If `auditLogRepository.save(auditLog)` triggers a database/JPA exception inside an active caller transaction, Spring marks the shared outer transaction as rollback-only, causing the main operation to fail on commit with `UnexpectedRollbackException`.
  **Suggestion:** Isolate audit persistence in its own transaction:
  ```java
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void logAction(String action, String entityType, String entityId,
                        String description, Map<String, Object> metadata,
                        String ipAddress, String userAgent) { ... }
  ```

- **[Medium]** (Lines 55-56, 162-172): `getClientIp` unconditionally trusts `X-Forwarded-For` and `X-Real-IP` headers, allowing clients to spoof their IP address in audit logs; `userAgent` and header-derived IPs are also persisted without length bounds or control-character sanitization.
  **Suggestion:** Only honor forwarding headers from configured trusted proxies (or use Spring's `ForwardedHeaderFilter` with trusted proxy configuration) and truncate/sanitize `userAgent` and `ipAddress`.

- **[Low]** (Lines 101-133): `getEntityAuditLogs(String entityType, String entityId)` (lines 117-119) returns an unbounded `List<AuditLog>`, and all query methods lack `@Transactional(readOnly = true)`.
  **Suggestion:** Deprecate/cap the unpaginated overload in favor of the `Pageable` variant and annotate query methods with `@Transactional(readOnly = true)`.

### `pretty-nails-backend/src/main/java/com/prettynails/service/AuthService.java`

- **[High]** (Lines 100-134): `login` is not `@Transactional` and performs non-atomic read-modify-write updates on `failedLoginAttempts`, allowing concurrent brute-force attempts to race past `MAX_FAILED_ATTEMPTS`. Additionally, `catch (Exception e)` (line 123) catches infrastructure/unexpected runtime errors and treats them as bad passwords, incrementing the lockout counter and returning `"Invalid email or password"`.
  **Suggestion:** Catch `AuthenticationException` specifically (and propagate/handle `LockedException` / `DisabledException` distinctly), and perform failed-attempt increments atomically in the repository or inside a `@Transactional` boundary with locking.

- **[Medium]** (Lines 103-104, 167-168, 186-187): `login`, `resendVerificationEmail`, and `forgotPassword` throw `ResourceNotFoundException` (404) when an email is missing versus 400/200 for existing accounts, enabling unauthenticated email enumeration.
  **Suggestion:** Return a generic `"Invalid email or password"` on `login` regardless of whether the email exists, and return a generic `200 OK` message on `forgotPassword` / `resendVerificationEmail` without revealing account existence.

- **[Medium]** (Lines 85-93, 174-179, 189-194, 200-231): Email verification and password-reset tokens (`UUID.randomUUID()`) are persisted in plaintext in the database; `register` issues an active JWT before email verification; and `resetPassword` does not clear `failedLoginAttempts`/`lockedUntil` or revoke previously issued JWTs.
  **Suggestion:** Store a SHA-256 hash of `SecureRandom` tokens in the database, reset `failedLoginAttempts` / `lockedUntil` upon `resetPassword`, and record a token-invalidation timestamp/version checked by the JWT filter.

- **[Low]** (Lines 59-63, 250-260, 321-349): Allocates `new ObjectMapper()` repeatedly instead of injecting the Spring-managed `ObjectMapper`; `updatePasswordHistory` silently returns `"[]"` on serialization failure (erasing password history); and `updateProfile` saves `image`, `phone`, and `nickname` without URL-scheme or length validation.
  **Suggestion:** Inject `ObjectMapper`, log/fail safely if serialization fails, and validate `image` (rejecting non-HTTP(S)/relative paths like `javascript:`) and field lengths.

- **[Info]** (Lines 3-4): Duplicate import `import com.fasterxml.jackson.core.JsonProcessingException;`.
  **Suggestion:** Remove the duplicate import on line 4.

### `pretty-nails-backend/src/main/java/com/prettynails/service/AvailabilityService.java`

- **[High]** (Lines 58-83): `getAvailableSlots` suffers from three compounding defects: (1) it executes `bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn` inside the `while` loop (N+1 queries per day); (2) it only checks exact `startTime` equality, so a 3-hour booking at `09:00` leaves `09:30`–`11:30` marked available; and (3) `if (slotCount >= maxSlots) break;` stops generating slots after `maxSlots` intervals (e.g., `4` slots = 2 hours), conflating slot count with `BookingService`'s daily client capacity (`maxSlots`).
  **Suggestion:** Fetch all `PENDING`/`CONFIRMED` bookings for the date in one query, check interval overlap `[slotStart, slotEnd)` against `[bookingStart, bookingEnd)`, and decouple daily client capacity from time-slot generation:
  ```java
  List<Booking> activeBookings = bookingRepository
      .findByAppointmentDateBetweenAndStatusIn(startOfDay, endOfDay, activeStatuses);
  boolean isDayFull = activeBookings.size() >= avail.getMaxSlots();
  ```

- **[Medium]** (Lines 53-60, 100-128): `createAvailability` and `updateAvailability` do not check for duplicate dates (which will break `findByDate` in `getAvailableSlots`), valid `HH:mm` time strings, `startTime < endTime`, or `maxSlots > 0`; null `maxSlots` or malformed times cause unhandled `NullPointerException` or `DateTimeParseException`.
  **Suggestion:** Validate date uniqueness, parseable `LocalTime` ordering, and positive `maxSlots` in `createAvailability` / `updateAvailability`.

- **[Low]** (Lines 146-147): `mapToDto` calls `a.getCreatedAt().toString()` without a null check (unlike `a.getUpdatedAt()`).
  **Suggestion:** Guard `a.getCreatedAt() != null ? a.getCreatedAt().toString() : null`.

- **[Info]** (Lines 91-97): `getStaffSchedule(String staffId)` ignores `staffId` and calls unbounded `availabilityRepository.findAll()`.
  **Suggestion:** Either document/reject unsupported `staffId` filtering or add pagination until staff scheduling is implemented.

### `pretty-nails-backend/src/main/java/com/prettynails/service/BookingService.java`

- **[Critical]** (Lines 152-153, 175-186): `createBooking` persists client-supplied `request.getTotalPrice()` and `request.getDownpayment()` instead of calculating totals from the resolved server-side `Service`/`ServiceVariant` prices, and marks `Payment.status` as `"PAID"` (with `verifiedAt` set) whenever any non-empty `request.getPaymentReference()` is passed or when `redeemLoyaltyReward` is paired with `downpayment = 0`. An attacker can book services for zero cost and self-mark payments as paid.
  **Suggestion:** Compute `totalPrice` strictly on the server from `resolvedServices` (and server-side loyalty discount rules), enforce `DEFAULT_DOWNPAYMENT` from server policy, and always create initial `Payment` records as `"PENDING"` until verified by an admin:
  ```java
  int computedTotal = resolvedServices.stream()
      .mapToInt(rs -> rs.price() * rs.quantity())
      .sum();
  ```

- **[High]** (Lines 55-88, 138-144): `createBooking` injects `NoShowPolicyService` but never checks `noShowPolicyService.isBlocked(user.getId())`; lacks concurrency locking or interval-overlap checks on slot/capacity validation (and does not reject past dates); and checks `loyaltyCard.getStampCount() >= 10` without reserving stamps, allowing a customer with 10 stamps to place multiple concurrent `PENDING` bookings all redeeming the same reward.
  **Suggestion:** Reject blocked users upfront, validate `appointmentDate` is not in the past and within `Availability` working hours, check overlapping time intervals under pessimistic/DB-level locking, and reserve or validate active reward redemptions.

- **[High]** (Lines 94-128): `createBooking` falls back to substring matching (`findServiceByFallbackName`) or an arbitrary first database service/variant (`serviceRepository.findAll().stream().findFirst()`) when a `serviceId` or `variantId` is missing, and does not validate `quantity >= 1`.
  **Suggestion:** Require valid `serviceId` and `variantId` matches (throwing `ResourceNotFoundException` or `BadRequestException` otherwise) and validate `quantity >= 1`.

- **[High]** (Lines 199-212): `completeBooking` updates status to `"COMPLETED"` and awards a loyalty stamp without checking the booking's current status, permitting `"CANCELLED"`, `"NO_SHOW"`, or already `"COMPLETED"` bookings to be completed.
  **Suggestion:** Enforce `"CONFIRMED".equals(booking.getStatus())` before transitioning to `"COMPLETED"`.

- **[Medium]** (Lines 232-281, 393-502): `confirmBooking` hardcodes `10` stamps instead of reading `LoyaltySettingsDto.rewardThreshold`; `cancelBooking` and `cancelBookingByCustomer` neither restore deducted reward stamps nor update the associated `Payment`; `rescheduleBooking` omits future-date/working-hours/overlap checks; and `booking.getStartTime().split(":")` (lines 408-410, 441-443) can throw `NullPointerException` / `ArrayIndexOutOfBoundsException` on malformed values.
  **Suggestion:** Use `LocalTime.parse(booking.getStartTime())`, inject/read `rewardThreshold`, reconcile payments/stamps on cancellation, and share slot-validation logic between `createBooking` and `rescheduleBooking`.

- **[Medium]** (Lines 194-197, 214-230, 321-378): `getAllBookings` executes an unbounded `findAll()` when no filters are supplied, and `mapToBookingDto` traverses lazy relations (`services`, `service`, `variants`, `payment`, `loyaltyStamps`) per booking without `@Transactional(readOnly = true)` or entity-graph fetch joins, causing N+1 queries.
  **Suggestion:** Add pagination to `getAllBookings`, use `@EntityGraph` / `JOIN FETCH` queries, and annotate read methods with `@Transactional(readOnly = true)`.

- **[Info]** (Lines 20-21): Redundant self-package imports for `LoyaltyService` and `NoShowPolicyService`.
  **Suggestion:** Remove lines 20-21.

### `pretty-nails-backend/src/main/java/com/prettynails/service/EmailService.java`

- **[Info]** (Lines 3-10): Interface methods lack Javadoc specifying async execution semantics and whether `sendEmail`'s `message` parameter expects plain text or HTML (handled differently between `EmailServiceImpl` and `EmailServiceMock`).
  **Suggestion:** Add concise Javadoc clarifying the parameter contract and async delivery behavior.

### `pretty-nails-backend/src/main/java/com/prettynails/service/EmailServiceImpl.java`

- **[High]** (Lines 55-77, 126-160, 189-223): User-controlled `name`, `subject`, and `body` values are interpolated directly into HTML via `.formatted(...)` without HTML escaping, allowing HTML injection / phishing payloads in outgoing emails.
  **Suggestion:** Escape dynamic text with `HtmlUtils.htmlEscape(...)` (and URL-encode token parameters) before formatting into HTML:
  ```java
  String safeName = HtmlUtils.htmlEscape(name != null ? name : "");
  ```

- **[Medium]** (Lines 32, 42, 52, 82-98): Public methods are `@Async void` and `sendHtmlEmail` only catches `MessagingException`. `JavaMailSender.send(MimeMessage)` throws unchecked `MailException` on SMTP connection/auth errors, bypassing line 94's logging and wrapping, while any thrown `EmailSendException` is lost on the async worker thread without retries or caller visibility.
  **Suggestion:** Catch `MailException | MessagingException`, configure an `AsyncUncaughtExceptionHandler` / retry policy, and avoid throwing an unconsumed custom exception silently in fire-and-forget `@Async` calls.

- **[Low]** (Lines 100-224): Duplicates the full HTML layout boilerplate across three methods and hardcodes `© 2025 Pretty Nails Salon`.
  **Suggestion:** Extract a shared HTML layout helper (or template engine such as Thymeleaf) and compute the copyright year dynamically.

### `pretty-nails-backend/src/main/java/com/prettynails/service/EmailServiceMock.java`

- **[Medium]** (Lines 15-41): Logs plaintext verification and password-reset tokens and clickable URLs at `INFO` level, and hardcodes `http://localhost:3000` instead of injecting `app.email.verification-url` / `app.email.reset-url`.
  **Suggestion:** Mask or omit raw tokens in logs (or restrict token output to `DEBUG` only when explicitly enabled) and read the configured URL properties.

- **[Info]** (Lines 14, 29, 44): `@Async` on a synchronous logging mock adds unnecessary thread switching and can interleave log lines out of request order.
  **Suggestion:** Remove `@Async` from `EmailServiceMock`.

### `pretty-nails-backend/src/main/java/com/prettynails/service/FileStorageService.java`

- **[High]** (Lines 88-90, 113-143): `processImage` ignores the boolean return value of `ImageIO.write(image, formatName, outputStream)` (line 140). Standard JDK `ImageIO` does not include a `"WEBP"` writer, so WebP uploads can silently return `false` with an empty `ByteArrayOutputStream`, writing a 0-byte corrupt file while returning a success response.
  **Suggestion:** Check the `ImageIO.write` return value; throw an explicit error or fall back to `"PNG"` (and update the stored filename extension to match):
  ```java
  boolean written = ImageIO.write(image, formatName, outputStream);
  if (!written) {
      throw new BadRequestException("Unsupported image output format: " + formatName);
  }
  ```

- **[High]** (Lines 115-127): `ImageIO.read(inputStream)` fully decodes the image into heap memory *before* checking `MAX_DIMENSION` (4000x4000). A small (<5MB) crafted PNG/JPEG with huge header dimensions can trigger an `OutOfMemoryError` decompression bomb.
  **Suggestion:** Use `ImageIO.createImageInputStream` and `ImageReader` (already imported) to read `reader.getWidth(0)` and `reader.getHeight(0)` before decoding pixels via `reader.read(0)`.

- **[Medium]** (Lines 99-103, 145-168): `validateFile` validates client-supplied `Content-Type` and filename extension independently without verifying they match the actual decoded image format, and `storeFile` returns `file.getSize()` (original client upload size) rather than `processedImage.length` (actual stored bytes).
  **Suggestion:** Derive the output format and stored extension from `ImageReader.getFormatName()`, and report `.size((long) processedImage.length)`.

- **[Low]** (Lines 14-26): Unused imports (`ImageReader`, `ImageInputStream`, `ByteArrayInputStream`, `StandardCopyOption`, `Iterator`).
  **Suggestion:** Remove unused imports (or use `ImageReader`/`ImageInputStream` for the pre-decode dimension check).

### `pretty-nails-backend/src/main/java/com/prettynails/service/GalleryService.java`

- **[Medium]** (Lines 28-37): Both `getAdminGallery` overloads call `galleryRepository.searchActive(...)`, the same active-only query as `getPublicGallery`, preventing admins from viewing or re-enabling inactive (`isActive = false`) gallery entries.
  **Suggestion:** Use a repository query that includes inactive items for admin endpoints (e.g., `galleryRepository.searchAll(search, category, pageable)`).

- **[Low]** (Lines 22-43, 89): `mapToDto` calls `g.getCreatedAt().toString()` without a null check (unlike `g.getUpdatedAt()`), read methods lack `@Transactional(readOnly = true)`, and `getPublicGallery` / `getAdminGallery(String, String)` return unpaginated lists.
  **Suggestion:** Add null guarding on `createdAt`, annotate reads with `@Transactional(readOnly = true)`, and prefer paginated queries.

### `pretty-nails-backend/src/main/java/com/prettynails/service/LoyaltyService.java`

- **[Critical]** (Lines 198-217): `addStampViaQr(String userId, String qrCode)` parses `bookingId` and `stampType` from an unsigned client-supplied string and calls `addStampCore(userId, parsed.bookingId(), parsed.stampType(), false)` without verifying that the booking exists, belongs to `userId`, or is `"COMPLETED"`. Any customer can submit `BOOKING:<random-id>` repeatedly to mint unlimited loyalty stamps.
  **Suggestion:** Look up the booking, verify ownership (`booking.getUserId().equals(userId)`), enforce `"COMPLETED".equals(booking.getStatus())`, and require a server-signed/HMAC token or staff-only endpoint:
  ```java
  Booking booking = bookingRepository.findById(parsed.bookingId())
      .orElseThrow(() -> new BadRequestException("Booking not found"));
  if (!booking.getUserId().equals(userId) || !"COMPLETED".equals(booking.getStatus())) {
      throw new BadRequestException("Booking is not eligible for a loyalty stamp");
  }
  ```

- **[High]** (Lines 229-262): `addStampViaQrByBookingId` verifies the booking exists but never checks its status, allowing staff scans to award stamps for `"PENDING"`, `"CANCELLED"`, or `"NO_SHOW"` bookings; it also trusts the QR-embedded `stampType` verbatim in `source`.
  **Suggestion:** Enforce `"COMPLETED".equals(booking.getStatus())` and validate `stampType` against an allowlist.

- **[High]** (Lines 292-295, 374-377): `getAllLoyaltyCards` triggers an N+1 query by calling `userRepository.findById(card.getUserId())` inside `mapToAdminLoyaltyCardDto` for every card in the page.
  **Suggestion:** Batch-fetch users with `findAllById(...)` or return a repository projection joining `LoyaltyCard` and `User`.

- **[Medium]** (Lines 59-88, 157-189, 268-285): Multiple correctness gaps: (1) `addStampCore` blocks if `loyaltyStampRepository.existsByBookingId(bookingId)` is true, while `redeemRewardStamps` also writes a `LoyaltyStamp` with the same `bookingId` (`source = "REWARD_REDEMPTION"`), preventing a reward-redeeming booking from earning a stamp on completion; (2) `getLoyaltyCard` and `getStampHistory` insert new `LoyaltyCard` rows without `@Transactional`; (3) `redeemRewardStamps` silently clamps `stampCount` to `0` if insufficient stamps remain; and (4) `expiresAt` hardcodes 12 months instead of using `adminService.getLoyaltySettings().getCardExpiryMonths()`.
  **Suggestion:** Check `existsByBookingIdAndSourceNot(bookingId, "REWARD_REDEMPTION")` (or separate redemption records), add `@Transactional` to `getLoyaltyCard`/`getStampHistory`, throw `BadRequestException` if `current < stampCountToDeduct`, and read `cardExpiryMonths` from settings.

- **[Medium]** (Lines 301-351): `adminLoyaltyAction` lacks null-safety on `loyaltyCard.getStampCount()` in `ADD_STAMP`, accepts negative `amount` values, refreshes `lastStampAt`/`expiresAt` when removing stamps, and does not write `LoyaltyStamp` audit rows for manual adjustments.
  **Suggestion:** Validate `amount > 0`, handle null `stampCount`, avoid extending expiry on `REMOVE_STAMP`, and persist a `LoyaltyStamp` entry for auditability.

### `pretty-nails-backend/src/main/java/com/prettynails/service/NoShowPolicyService.java`

- **[Medium]** (Lines 35-58, 89-113): `recordNoShow` reuses `user.lockedUntil` (the same column used for temporary failed-login lockouts in `AuthService`), causing login-lock resets or no-show blocks to interfere with each other, and sends an async email inside `@Transactional` before the database commit succeeds; missing users also throw `BadRequestException` instead of `ResourceNotFoundException`.
  **Suggestion:** Separate booking-block status (`bookingBlockedUntil`) from login lockout (`lockedUntil`), dispatch notifications after transaction commit (`TransactionSynchronizationManager.registerSynchronization`), and throw `ResourceNotFoundException`.

- **[Low]** (Lines 72-87): `getNoShowCount`, `isBlocked`, and `getBlockedUntil` lack `@Transactional(readOnly = true)`, and `isBlocked`/`getBlockedUntil` silently return `false`/`null` for unknown `userId`s.
  **Suggestion:** Add `@Transactional(readOnly = true)` and verify user existence when appropriate.

### `pretty-nails-backend/src/main/java/com/prettynails/service/NotificationService.java`

- **[High]** (Lines 95-114): `userSinkMap` holds only one `Sinks.Many` per `userId`: opening a second browser tab overwrites the first tab's sink, and closing one tab removes the active sink for all tabs. Furthermore, `sink.tryEmitNext(event)` ignores `Sinks.EmitResult`, silently dropping concurrent/overflowed events and never cleaning up terminated/cancelled sinks.
  **Suggestion:** Store a `CopyOnWriteArrayList` / `ConcurrentHashMap.newKeySet()` of sinks per `userId`, remove only the specific sink on disconnect/completion, and handle `EmitResult` failures (e.g., `EmitFailureHandler` or pruning non-viable sinks).

- **[Medium]** (Lines 42-90): `sendToUser` pushes to SSE before the `@Transactional` database write commits (risking phantom UI alerts on rollback), while `broadcast` emits only to currently connected SSE sinks without persisting notifications to the database for offline users.
  **Suggestion:** Trigger `pushToSse` in an `afterCommit` callback, and persist broadcast notifications for target users if history consistency is required.

- **[Medium]** (Lines 119-121): `getNotificationHistory` passes unvalidated `page` and `size` directly to `PageRequest.of(page, size)`, allowing `IllegalArgumentException` on negative values or memory exhaustion on large `size` values.
  **Suggestion:** Clamp/validate `page >= 0` and `1 <= size <= 100`.

- **[Low]** (Lines 157-176): `markAsRead` throws `IllegalArgumentException` instead of `ResourceNotFoundException`, and `markAllAsRead` loads all unread entities into memory and updates them one-by-one rather than executing a bulk update.
  **Suggestion:** Throw `ResourceNotFoundException` in `markAsRead` and add a `@Modifying` bulk update query for `markAllAsRead`.

### `pretty-nails-backend/src/main/java/com/prettynails/service/PasswordPolicyService.java`

- **[High]** (Lines 38-40, 170-175): `checkHaveIBeenPwned` calls `.block()` on an inline `WebClient` with no timeout configured, risking thread-pool exhaustion if the HaveIBeenPwned endpoint hangs; constructing `WebClient` directly also bypasses Spring's `WebClient.Builder` configuration and testability.
  **Suggestion:** Inject `WebClient.Builder` and apply a short timeout (e.g., `.timeout(Duration.ofSeconds(3))` before `.block()`).

- **[Medium]** (Line 126): `List.of(userInputs)` throws `NullPointerException` whenever `userInputs` contains a `null` element (for example, if `user.getName()` is `null` during password reset or change).
  **Suggestion:** Filter nulls/blanks before calling `zxcvbn.measure`:
  ```java
  List<String> sanitizedInputs = userInputs == null ? List.of() :
      Arrays.stream(userInputs).filter(s -> s != null && !s.isBlank()).toList();
  Strength strength = zxcvbn.measure(password, sanitizedInputs);
  ```

- **[Low]** (Lines 82-155, 170): No maximum password length is checked before `zxcvbn.measure` and `sha1` (allowing CPU DoS on huge payloads and silent 72-byte BCrypt truncation), and `hibpApiUrl + prefix` assumes a trailing slash in configuration.
  **Suggestion:** Reject passwords exceeding a reasonable maximum (e.g., 128 characters) and normalize trailing slashes on `hibpApiUrl`.

### `pretty-nails-backend/src/main/java/com/prettynails/service/PaymentService.java`

- **[Critical]** (Lines 37-86): `createPayment` (including the unauthenticated `createPayment(PaymentRequest)` overload at line 84) updates an existing `Payment`'s `userId`, `amount`, `method`, and `reference` without verifying booking ownership or checking that the payment is not already `"PAID"`; for new payments, it also fails to verify that `bookingId` exists or that `amount > 0`.
  **Suggestion:** Require an authenticated owner (or admin), verify the `Booking` exists and belongs to `user`, validate `amount > 0`, and reject modifications to `"PAID"` payments:
  ```java
  if ("PAID".equals(payment.getStatus())) {
      throw new BadRequestException("Cannot modify an already paid payment.");
  }
  ```

- **[High]** (Lines 89-113): `verifyPayment` directly mutates `booking.setStatus("CONFIRMED")`, bypassing `BookingService.confirmBooking` validations (allowing `"CANCELLED"` or `"NO_SHOW"` bookings to become `"CONFIRMED"`, skipping slot-conflict checks, and omitting loyalty stamp deduction). It also defaults `verifiedBy` to `"ADMIN"` if `admin` is `null` and throws `IllegalStateException` instead of `BadRequestException`.
  **Suggestion:** Delegate booking confirmation to `BookingService.confirmBooking(payment.getBookingId())`, require a non-null authenticated `admin`, and throw `BadRequestException`.

- **[Medium]** (Lines 115-119): `getAllPayments` calls `paymentRepository.findAll()` unbounded without pagination.
  **Suggestion:** Accept a `Pageable` parameter and return `Page<PaymentDto>`.

- **[Low]** (Lines 15, 28-34): Unused import `java.time.LocalDateTime` and missing `@Transactional(readOnly = true)` / ownership check on `getPaymentByBookingId`.
  **Suggestion:** Remove the unused import, add `@Transactional(readOnly = true)`, and enforce ownership/admin authorization.

### `pretty-nails-backend/src/main/java/com/prettynails/service/ServiceService.java`

- **[High]** (Lines 40-95): Both `createService` and `updateService` save `service` into the JPA persistence context before modifying `ServiceVariant` rows via `variantRepository`, then call `serviceRepository.findById(...)` to build the DTO. Because `findById` hits the L1 cache, the returned `Service` can retain stale/null `variants` (and `mapToServiceDto` line 123 invokes `entity.getVariants().stream()` without a null check). Furthermore, `variantRepository.deleteByServiceId(id)` + recreating variants in `updateService` regenerates all variant UUIDs, breaking references from existing `BookingService` records.
  **Suggestion:** Manage variants through the parent entity (or update existing variants in place by ID rather than deleting/recreating all of them), guard `entity.getVariants() != null`, and populate the DTO from the current saved variants.

- **[Medium]** (Lines 97-103): `deleteService` hard-deletes the `Service` and its `ServiceVariant`s, which can cause foreign-key constraint failures or broken `BookingService` references in historical bookings and reports.
  **Suggestion:** Perform a soft delete (`service.setIsActive(false)`) when bookings reference the service.

- **[Low]** (Lines 22-38, 105-120): Read methods lack `@Transactional(readOnly = true)` and risk N+1 queries when `mapToServiceDto` accesses `entity.getVariants()` for each service.
  **Suggestion:** Annotate read methods with `@Transactional(readOnly = true)` and use `@EntityGraph` / `JOIN FETCH` for listing services with variants.

### `pretty-nails-backend/src/main/java/com/prettynails/service/UserAccountLockService.java`

- **[Low]** (Lines 26-32): `isAccountNonLocked(User user)` calls `user.getLockedUntil()` without checking if `user` is `null`.
  **Suggestion:** Add a null guard (`if (user == null) return false;`).

- **[Info]** (Lines 16-43): Account-lock checks (`lockedUntil != null && lockedUntil.isAfter(timeProvider.localNow())`) are duplicated in `AuthService.login` and `NoShowPolicyService.isBlocked` instead of delegating to `UserAccountLockService`.
  **Suggestion:** Reuse `UserAccountLockService` across services to keep lock-evaluation logic in one place.

---

## 10. Backend Entities & Repositories

This audit covers all 17 JPA entity classes and 17 Spring Data JPA repositories in `pretty-nails-backend`, uncovering critical schema/constraint mismatches with Flyway migrations (`AuditLog`, `Booking`), destructive cascade rules on `User`, and widespread Lombok `@Builder` missing `@Builder.Default` bugs across 9 entities. Repository queries also contain a broken loyalty redemption filter (`'REDEEM'` vs `'REWARD_REDEMPTION'`), PostgreSQL null-parameter inference hazards in optional-filter JPQL queries, missing database indexes on hot foreign keys, and unbounded list/row-by-row delete methods.

| File | Critical | High | Medium | Low | Info |
| --- | :---: | :---: | :---: | :---: | :---: |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/Account.java` | 0 | 1 | 1 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/AuditLog.java` | 1 | 0 | 1 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/Availability.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/Booking.java` | 1 | 1 | 2 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/BookingService.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/CustomerNote.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/Gallery.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/LoyaltyCard.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/LoyaltyStamp.java` | 0 | 0 | 2 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/Notification.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/Payment.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/Service.java` | 0 | 1 | 2 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/ServiceVariant.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/Session.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/Setting.java` | 0 | 0 | 0 | 1 | 1 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/User.java` | 1 | 2 | 1 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/entity/VerificationToken.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/AccountRepository.java` | 0 | 0 | 0 | 0 | 1 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/AuditLogRepository.java` | 0 | 1 | 1 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/AvailabilityRepository.java` | 0 | 0 | 1 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/BookingRepository.java` | 0 | 1 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/BookingServiceRepository.java` | 0 | 0 | 0 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/CustomerNoteRepository.java` | 0 | 0 | 1 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/GalleryRepository.java` | 0 | 0 | 1 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/LoyaltyCardRepository.java` | 0 | 2 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/LoyaltyStampRepository.java` | 0 | 0 | 1 | 0 | 1 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/NotificationRepository.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/PaymentRepository.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/ServiceRepository.java` | 0 | 0 | 0 | 0 | 1 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/ServiceVariantRepository.java` | 0 | 0 | 1 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/SessionRepository.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/SettingRepository.java` | 0 | 0 | 0 | 0 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/UserRepository.java` | 0 | 0 | 1 | 1 | 0 |
| `pretty-nails-backend/src/main/java/com/prettynails/repository/VerificationTokenRepository.java` | 0 | 0 | 1 | 0 | 0 |
| **Total** | **3** | **15** | **32** | **20** | **4** |

### `pretty-nails-backend/src/main/java/com/prettynails/entity/Account.java`
- **[High]** (Lines 36-40, 51-52): `refreshToken`, `accessToken`, and `idToken` are persisted as plaintext `VARCHAR(4000)` columns without encryption at rest, and `4000` characters can truncate large OAuth2/OIDC JWTs. **Suggestion:** Apply a JPA `AttributeConverter<String, String>` (e.g., AES-GCM encryption using a managed key) and switch to `columnDefinition = "TEXT"` for token columns.
- **[Medium]** (Lines 11, 24-25, 57-59): `user_id` lacks a database index for `AccountRepository.findByUserId`, and dual-mapping `userId` alongside `@ManyToOne` `user` (`insertable = false, updatable = false`) can leave the association `null`/stale in the persistence context if only one field is set. **Suggestion:** Add `@Index(name = "idx_account_user_id", columnList = "user_id")` on `@Table` and standardize on either `userId` or a single `@ManyToOne` association.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/AuditLog.java`
- **[Critical]** (Lines 17-68): `AuditLog` does not match the Flyway migration `V3__Add_oauth2_no_show_audit_notification_tables.sql` (`audit_logs` defines `admin_id VARCHAR(36) NOT NULL`, `entity_type VARCHAR(50) NOT NULL`, `old_value TEXT`, `new_value TEXT`, `timestamp TIMESTAMP NOT NULL`, and `user_agent VARCHAR(500)`). With `ddl-auto: update`, Hibernate adds `AuditLog`'s columns (`user_id`, `user_email`, `user_role`, `description`, `metadata`, `created_at`) alongside V3's `NOT NULL` columns, causing inserts to fail on `admin_id` / `timestamp` constraints and risking `user_agent` truncation (`2000` vs `500`). **Suggestion:** Align `AuditLog` and a new Flyway migration into a single canonical `audit_logs` schema.
- **[Medium]** (Lines 23-28, 38-64): Exposing `@Setter` allows in-memory or accidental mutation of historical audit records, and `userEmail`, `ipAddress`, `userAgent`, and `metadata` have no redaction contract. **Suggestion:** Annotate the entity with Hibernate `@Immutable`, remove `@Setter` (keep `@Getter` + `@Builder`), and ensure callers sanitize/redact secrets before storing `metadata`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/Availability.java`
- **[High]** (Lines 16, 27-38): `@Builder` ignores Java field initializers without `@Builder.Default`, so `Availability.builder().date(...).build()` leaves `isAvailable`, `startTime`, `endTime`, and `maxSlots` as `null`, violating `nullable = false`. **Suggestion:** Annotate each initialized field with `@Builder.Default`:
  ```java
  @Builder.Default
  @Column(name = "is_available", nullable = false)
  private Boolean isAvailable = true;
  ```
- **[Medium]** (Lines 11, 24-25): `date` uses `LocalDateTime` with `@UniqueConstraint(columnNames = {"date"})` for a calendar-day schedule. Two `LocalDateTime` values on the same day with different times bypass the unique constraint and break `findByDate`. **Suggestion:** Change `date` to `LocalDate` (with a matching DB column type `DATE`).
- **[Low]** (Lines 30-38): `startTime` and `endTime` are stored as unvalidated `String` (`HH:mm`), and `maxSlots` lacks `@Min(0)`. **Suggestion:** Use `LocalTime` for `startTime`/`endTime` and add `@Min(0)` on `maxSlots`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/Booking.java`
- **[Critical]** (Line 12): `@Table(name = "bookings", uniqueConstraints = @UniqueConstraint(name = "uk_booking_slot_active", columnNames = {"appointment_date", "start_time"}))` generates a **non-partial** unique constraint across all booking statuses. This conflicts with `V2__Create_partial_unique_index_for_active_bookings.sql` (`WHERE status IN ('PENDING', 'CONFIRMED')`) and permanently blocks rebooking any cancelled or `NO_SHOW` slot if Hibernate creates the table before Flyway runs. **Suggestion:** Remove `@UniqueConstraint(name = "uk_booking_slot_active", ...)` from `@Table` and manage the partial unique index solely via Flyway.
- **[High]** (Lines 17, 29, 44): `status = "PENDING"` and `downpayment = 10000` lack `@Builder.Default` (unlike `redeemLoyaltyReward` on line 53). Calling `Booking.builder()` without explicitly setting both leaves them `null` and fails `nullable = false`. **Suggestion:** Add `@Builder.Default` to both `status` and `downpayment`.
- **[Medium]** (Lines 28-44): `status` is a raw `String` instead of a `BookingStatus` enum, `startTime`/`endTime` are `String`s split from `LocalDateTime appointmentDate`, `totalPrice`/`downpayment` lack `@Min(0)`, and `Booking` has no `@Version` field for optimistic locking against concurrent status updates (e.g., customer cancel vs admin confirm). **Suggestion:** Introduce a `BookingStatus` enum with `@Enumerated(EnumType.STRING)`, use `LocalDate` + `LocalTime`, add `@Min(0)`, and add `@Version private Long version;`.
- **[Medium]** (Lines 68-75): `@OneToMany` collections (`services`, `loyaltyStamps`) are uninitialized (`null` on new instances) and share `CascadeType.ALL, orphanRemoval = true` with `payment`, risking `NullPointerException` on collection access and accidental deletion of financial/stamp records. **Suggestion:** Initialize collections with `@Builder.Default private List<BookingService> services = new ArrayList<>();` and restrict cascades on `payment` / `loyaltyStamps`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/BookingService.java`
- **[High]** (Lines 16, 33-34): `quantity = 1` lacks `@Builder.Default`, so `BookingService.builder()` leaves `quantity` as `null` and violates `nullable = false`. **Suggestion:** Add `@Builder.Default` on `quantity`.
- **[Medium]** (Lines 11, 24-31, 39-45): Missing DB indexes on `booking_id` and `service_id`, `variantId` has no foreign key / `@ManyToOne` mapping to `ServiceVariant` (allowing dangling IDs), and dual-mapped `bookingId`/`serviceId` can desync from `booking`/`service`. **Suggestion:** Add `@Index` definitions on `booking_id` and `service_id`, and map `variantId` with a proper foreign key or `@ManyToOne`.
- **[Low]** (Lines 33-37): `quantity` and `price` lack `@Min(1)` / `@Min(0)` Bean Validation annotations. **Suggestion:** Add `@Min(1)` on `quantity` and `@Min(0)` on `price`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/CustomerNote.java`
- **[Medium]** (Lines 11, 24-28): Missing `@Index` definitions on `user_id` and `admin_id`, even though `CustomerNoteRepository` queries by both columns. **Suggestion:** Add `@Index(name = "idx_customer_note_user_id", columnList = "user_id")` and `@Index(name = "idx_customer_note_admin_id", columnList = "admin_id")` to `@Table`.
- **[Low]** (Lines 24-31, 44-50): Dual-mapped `userId`/`user` and `adminId`/`admin` (`insertable = false, updatable = false`) risk stale associations in the persistence context, and `content` lacks `@NotBlank`. **Suggestion:** Add `@NotBlank` on `content` and avoid dual-mapping if direct associations are used.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/Gallery.java`
- **[High]** (Lines 16, 36-37): `isActive = true` lacks `@Builder.Default`, causing `Gallery.builder()` without `.isActive(...)` to produce `null` and violate `nullable = false`. **Suggestion:** Add `@Builder.Default` to `isActive`.
- **[Medium]** (Lines 11, 33-37): Missing index for `GalleryRepository.searchActive` (`is_active`, `category`, `created_at`), and `category` is an unvalidated `String` instead of an enum. **Suggestion:** Add `@Index(name = "idx_gallery_active_cat_created", columnList = "is_active, category, created_at")` and replace `category` with an enum.
- **[Low]** (Lines 24-31): `title` and `imageUrl` lack `@NotBlank` validation. **Suggestion:** Add `@NotBlank` annotations on `title` and `imageUrl`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/LoyaltyCard.java`
- **[High]** (Lines 17, 28-29): `stampCount = 0` lacks `@Builder.Default`. Calling `LoyaltyCard.builder().userId(...).expiresAt(...).build()` sets `stampCount` to `null`, failing `nullable = false` or throwing a `NullPointerException` when unboxed. **Suggestion:** Add `@Builder.Default` on `stampCount`.
- **[Medium]** (Lines 18-50): `LoyaltyCard` has no `@Version` field for optimistic locking, exposing `stampCount` read-modify-write increments and reward redemptions to lost updates under concurrent requests. **Suggestion:** Add `@Version @Column(name = "version", nullable = false) @Builder.Default private Long version = 0L;`.
- **[Low]** (Lines 25-26, 45-50): Dual-mapped `userId`/`user` (`insertable = false, updatable = false`) can desync in memory, and `stamps` is uninitialized (`null`) on newly built instances. **Suggestion:** Initialize `stamps` with `@Builder.Default private List<LoyaltyStamp> stamps = new ArrayList<>();`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/LoyaltyStamp.java`
- **[Medium]** (Lines 11, 24-28, 30-31): Missing `@Index` annotations on `card_id`, `booking_id`, and `earned_at`, which are queried by `LoyaltyStampRepository` and `LoyaltyCardRepository`. **Suggestion:** Add `@Index` annotations on `card_id`, `booking_id`, and `earned_at` in `@Table`.
- **[Medium]** (Lines 33-34): `source` is an unvalidated `String` (comment documents `SERVICE or AMOUNT`, while `LoyaltyService` writes `"REWARD_REDEMPTION"` and `LoyaltyCardRepository` queries `'REDEEM'`). **Suggestion:** Replace `String source` with a `StampSource` enum (`@Enumerated(EnumType.STRING)`).
- **[Low]** (Lines 27-28, 39-45): No uniqueness guard prevents duplicate earning stamps for the same `booking_id` under concurrent completion requests; `cardId`/`bookingId` are dual-mapped alongside `card`/`booking`. **Suggestion:** Enforce a partial unique index on `(booking_id)` where `source = 'SERVICE'` via Flyway.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/Notification.java`
- **[High]** (Lines 28, 54-58): `priority = 2` and `read = false` lack `@Builder.Default`. Omitting `.read(false)` in `Notification.builder()` sets `read` to `null`, violating `nullable = false`. **Suggestion:** Add `@Builder.Default` to both `priority` and `read`.
- **[Medium]** (Lines 31-33, 63-65): `id` lacks `@GeneratedValue(strategy = GenerationType.UUID)` (unlike all other entities), failing persistence if a caller does not assign an ID; additionally, `@CreationTimestamp` on `createdAt` overwrites any value passed via `Notification.builder().createdAt(...)` (such as `event.getTimestamp()` in `NotificationService`). **Suggestion:** Add `@GeneratedValue(strategy = GenerationType.UUID)` or `@PrePersist` UUID fallback, and remove `@CreationTimestamp` if callers supply `createdAt` (or set it via `@PrePersist` only when `null`).
- **[Low]** (Lines 38-39, 57-58): `type` is an unvalidated `String`, and column name `read` is a reserved SQL keyword in several databases. **Suggestion:** Use an enum for `type` and rename the column to `is_read`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/Payment.java`
- **[High]** (Lines 16, 33-34, 56-58): `status = "PENDING"` and `@Version Long version = 0L` lack `@Builder.Default`. Any `Payment.builder()` call omitting `status` or `version` initializes them to `null` despite `nullable = false`. **Suggestion:** Add `@Builder.Default` to both `status` and `version`.
- **[Medium]** (Lines 11, 27-28, 39-43): Missing `@Index` on `user_id` (`findByUserId`) and `(status, verified_at)` (`sumPaidAmountSince`), and `reference` lacks a uniqueness constraint (allowing the same GCash reference number to be reused across bookings). **Suggestion:** Add indexes on `user_id` and `(status, verified_at)`, plus a partial unique index on `reference` where `reference IS NOT NULL AND method = 'GCASH'`.
- **[Low]** (Lines 30-38): `status` and `method` are raw `String`s (comment states `// GCASH` while `BookingService` writes `"LOYALTY_REWARD"`), and `amount` lacks `@Min(0)`. **Suggestion:** Convert `status` and `method` to enums and add `@Min(0)` on `amount`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/Service.java`
- **[High]** (Lines 17, 40-41): `isActive = true` lacks `@Builder.Default`, causing `Service.builder()` without `.isActive(...)` to yield `null` and fail `nullable = false`. **Suggestion:** Add `@Builder.Default` to `isActive`.
- **[Medium]** (Lines 54-55): `bookings` (`List<BookingService>`) uses `cascade = CascadeType.ALL, orphanRemoval = true`. Deleting a `Service` silently cascades and deletes historical `BookingService` line items from existing bookings. **Suggestion:** Remove `CascadeType.ALL` and `orphanRemoval = true` from `bookings` (keep soft-deletion via `isActive = false` or restrict deletes when referenced).
- **[Medium]** (Lines 12, 28-29, 40-41): Missing `@Index` on `(is_active, category, created_at)` for `ServiceRepository` queries, and `category` is a raw `String` instead of an enum. **Suggestion:** Add a composite index on `(is_active, category, created_at)` and use a `ServiceCategory` enum.
- **[Low]** (Lines 34-38): `basePrice` and `duration` lack `@Min(0)` / `@Min(1)` validation. **Suggestion:** Add Bean Validation constraints on `basePrice` and `duration`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/ServiceVariant.java`
- **[Medium]** (Lines 11, 24-28): Missing `@Index` on `service_id` and missing `@UniqueConstraint(columnNames = {"service_id", "name"})` to enforce uniqueness for `ServiceVariantRepository.findByServiceIdAndName`. **Suggestion:** Add `@UniqueConstraint(name = "uk_variant_service_name", columnNames = {"service_id", "name"})` on `@Table`.
- **[Low]** (Lines 27-35): `price` lacks `@Min(0)`, and `serviceId` is dual-mapped alongside `service`. **Suggestion:** Add `@Min(0)` on `price`.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/Session.java`
- **[Medium]** (Lines 11, 27-31): Missing `@Index` on `user_id` (`findByUserId`, `deleteByUserId`) and `expires` (for expired session pruning). **Suggestion:** Add `@Index` definitions for `user_id` and `expires` on `@Table`.
- **[Low]** (Lines 24-35): `sessionToken` is stored unhashed (DB read exposure grants direct session hijacking), and `userId`/`user` are dual-mapped. **Suggestion:** Store a SHA-256 hash of `sessionToken` rather than the raw token.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/Setting.java`
- **[Low]** (Lines 24-28): Column names `"key"` and `"value"` require quoted SQL identifiers because both are SQL reserved words. **Suggestion:** Rename columns to `setting_key` and `setting_value` in a migration.
- **[Info]** (Lines 24-28): `key` and `value` lack `@NotBlank` Bean Validation annotations.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/User.java`
- **[Critical]** (Lines 91-110): `User` defines `cascade = CascadeType.ALL, orphanRemoval = true` on `bookings`, `payments`, `loyaltyCard`, `notes`, and `adminNotes`. Deleting a `User` (or clearing a collection) destroys historical `Booking`, `Payment`, and admin-authored `CustomerNote` records (`adminNotes`). **Suggestion:** Remove `CascadeType.ALL` and `orphanRemoval = true` from `bookings`, `payments`, `notes`, and `adminNotes`; use soft deletion/anonymization or `ON DELETE SET NULL`/restricted foreign keys for financial and audit history.
- **[High]** (Lines 21, 48, 66): `failedLoginAttempts = 0` and `role = "CUSTOMER"` lack `@Builder.Default`. Calling `User.builder()` without `.role(...)` sets `role = null` (violating `nullable = false`), and omitting `.failedLoginAttempts(0)` leaves it `null`. **Suggestion:** Add `@Builder.Default` to both `failedLoginAttempts` and `role`.
- **[High]** (Lines 113-115, 128-133): `UserDetails.isAccountNonLocked()` hardcodes `return true`, ignoring `lockedUntil`. Any Spring Security code path using `User` directly as `UserDetails` silently bypasses account lockout. Additionally, `getAuthorities()` builds `"ROLE_" + role` without guarding against `role == null`. **Suggestion:** Either stop implementing `UserDetails` directly on the JPA entity (preferring `CustomUserDetails` exclusively) or evaluate `lockedUntil` safely in `isAccountNonLocked()` and guard `role != null` in `getAuthorities()`.
- **[Medium]** (Lines 16, 35-45, 65-66, 71-75, 80): Missing indexes on `email_verification_token`, `password_reset_token`, `role`, and `(oauth2_provider, oauth2_provider_id)`; `emailVerificationToken` and `passwordResetToken` are stored unhashed; `role` is an unvalidated `String`; and `passwordHistory` uses `VARCHAR(2000)` instead of `TEXT` or a child table. **Suggestion:** Add indexes for token/role/OAuth2 lookups, hash reset/verification tokens before persisting, convert `role` to an enum, and store `passwordHistory` in `TEXT` or a normalized table.

### `pretty-nails-backend/src/main/java/com/prettynails/entity/VerificationToken.java`
- **[Medium]** (Lines 10, 26-30): Missing `@Index` on `expires` (needed by `VerificationTokenRepository.deleteByExpiresBefore`), and `@UniqueConstraint(columnNames = {"identifier", "token"})` is redundant because `token` already has `unique = true`. **Suggestion:** Add `@Index(name = "idx_verification_token_expires", columnList = "expires")` and drop the redundant composite constraint (or remove `unique = true` on `token` if uniqueness is scoped per identifier).
- **[Low]** (Lines 26-27): `token` is stored in plaintext rather than a cryptographic hash. **Suggestion:** Persist a SHA-256 digest of the token and hash incoming tokens before lookup.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/AccountRepository.java`
- **[Info]** (Lines 11-16): Repository methods are clean; `findByUserId` relies on adding an index to `accounts.user_id` (tracked in `Account.java`).

### `pretty-nails-backend/src/main/java/com/prettynails/repository/AuditLogRepository.java`
- **[High]** (Lines 29-42): `findAuditLogs` uses `(:userId IS NULL OR a.userId = :userId)` and `(:startDate IS NULL OR a.createdAt >= :startDate)` in JPQL. In PostgreSQL + Hibernate 6, binding `null` to optional parameters inside `(:param IS NULL OR ...)` frequently triggers `ERROR: could not determine data type of parameter`. **Suggestion:** Replace this query with `JpaSpecificationExecutor<AuditLog>` so predicates are only added for non-null filters.
- **[Medium]** (Lines 17, 21, 27): Unbounded `List<AuditLog>` methods (`findByUserIdOrderByCreatedAtDesc`, `findByActionOrderByCreatedAtDesc`, `findByEntityTypeAndEntityIdOrderByCreatedAtDesc`) load entire audit histories into memory even though `Pageable` overloads already exist. **Suggestion:** Remove the unpaginated `List` overloads and standardize on `Page<AuditLog>`.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/AvailabilityRepository.java`
- **[Medium]** (Lines 16, 20-21): `findAvailableDatesFrom` has no `ORDER BY a.date ASC` and no pagination/upper date bound, and `findByDate(LocalDateTime date)` relies on exact timestamp equality that breaks if `date` has non-midnight time components. **Suggestion:** Switch `Availability.date` to `LocalDate`, add `ORDER BY a.date ASC`, and bound the date range.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/BookingRepository.java`
- **[High]** (Lines 25-45): `findAdminBookings` (which also appears unused) has multiple flaws: (1) nullable `:date`, `:start`, `:end`, and `:search` parameters in `(:param IS NULL OR ...)` trigger PostgreSQL parameter type inference errors; (2) `b.status IN :statusList` fails if `statusList` is `null` or empty; (3) the 6-branch `ORDER BY CASE WHEN :sortDirection ...` ignores `Pageable`'s `Sort` and prevents index usage; and (4) `b.user` is joined for filtering without `JOIN FETCH` / `@EntityGraph`. **Suggestion:** Remove dead code or replace with `JpaSpecificationExecutor<Booking>` + `@EntityGraph(attributePaths = {"user", "services", "payment"})`.
- **[Medium]** (Lines 17, 47, 49-56, 74-75): Unbounded `List<Booking>` queries (`findByUserIdOrderByAppointmentDateDesc`, `findByStatus`, `findByAppointmentDateBetweenAndStatus`, `findByStatusAndAppointmentDateBetween`) lack pagination and eager-fetch hints (`@EntityGraph` for `services` and `payment`), risking memory bloat and N+1 queries during DTO mapping. **Suggestion:** Add `Pageable` overloads and `@EntityGraph` on read queries used for `BookingDto` mapping.
- **[Low]** (Lines 68-75, 81): `sumTotalPriceByStatus`, `sumTotalPriceByStatusAndDateBetween`, and `findByStatusAndAppointmentDateBetween` are missing `@Param` annotations; `existsByAppointmentDateAndStartTimeAndStatusIn` only checks exact `startTime` equality rather than overlapping `[startTime, endTime)` intervals. **Suggestion:** Add explicit `@Param` annotations and validate interval overlap where multi-slot durations apply.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/BookingServiceRepository.java`
- **[Low]** (Line 12): `findByBookingId` does not fetch the associated `Service`, which causes N+1 queries whenever callers read `bookingService.getService()`. **Suggestion:** Add `@EntityGraph(attributePaths = "service")` on `findByBookingId` (and add a batch `findByBookingIdIn` method for list endpoints).

### `pretty-nails-backend/src/main/java/com/prettynails/repository/CustomerNoteRepository.java`
- **[Medium]** (Lines 12, 16): `findByUserIdOrderByCreatedAtDesc` and `findByAdminIdOrderByCreatedAtDesc` return unbounded `List<CustomerNote>` without `Pageable` and omit `@EntityGraph` for `admin`/`user`, risking N+1 loads when rendering author details. **Suggestion:** Add `Pageable` parameters and `@EntityGraph(attributePaths = {"admin"})`.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/GalleryRepository.java`
- **[Medium]** (Lines 15-25): Both `searchActive` queries use `(:search IS NULL OR ...)` and `(:category IS NULL OR ...)` (PostgreSQL null-parameter type inference hazard), omit `@Param` annotations, and expose an unbounded `List<Gallery>` overload alongside the `Page<Gallery>` overload. **Suggestion:** Remove the unpaginated overload, add `@Param` annotations, or migrate filtering to `JpaSpecificationExecutor<Gallery>`.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/LoyaltyCardRepository.java`
- **[High]** (Lines 40-41): `countRedeemedStampsSince` filters `ls.source = 'REDEEM'`, whereas `LoyaltyService` creates redemption stamps with `.source("REWARD_REDEMPTION")`. As a result, `AdminService` always gets `0` for redeemed stamps. **Suggestion:** Align the query and service on a shared `StampSource` enum value (e.g., `REWARD_REDEMPTION`).
- **[High]** (Lines 19-21): `findCustomerCards()` hardcodes business/seed exclusions (`lc.user.email != 'owner@prettynails.com' AND lc.user.name NOT LIKE '%Atasha%'`), returns an unbounded `List<LoyaltyCard>`, and does not fetch `user`. **Suggestion:** Remove hardcoded email/name literals (filter by `role` only) and deprecate/remove in favor of paginated queries.
- **[Medium]** (Lines 27-33): `findCustomerCardsWithSearch` uses inconsistent SpEL `:#{#search}` without `@Param("search")`, relies on `:#{#search} IS NULL` (PostgreSQL null-parameter hazard), and omits `@EntityGraph(attributePaths = "user")` / `countQuery`, leaving DTO mapping susceptible to N+1 user lookups. **Suggestion:** Use `@Param("search")`, normalize empty search in the service or via `Specification`, and add `@EntityGraph(attributePaths = "user")`.
- **[Low]** (Lines 37-41): `countStampsSince` and `countRedeemedStampsSince` query `LoyaltyStamp` rather than `LoyaltyCard`, duplicate `LoyaltyStampRepository.countStampsSince`, and omit `@Param("since")`. **Suggestion:** Move both stamp-counting methods to `LoyaltyStampRepository` with `@Param("since")`.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/LoyaltyStampRepository.java`
- **[Medium]** (Lines 17-19): `findByCardId` and `findByCardIdOrderByEarnedAtDesc` return unbounded `List<LoyaltyStamp>` without pagination, and `findByCardId` is redundant with the ordered query. **Suggestion:** Keep a paginated `Page<LoyaltyStamp> findByCardIdOrderByEarnedAtDesc(String cardId, Pageable pageable)` or a bounded limit.
- **[Info]** (Lines 21-22): `countStampsSince` duplicates `LoyaltyCardRepository.countStampsSince`.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/NotificationRepository.java`
- **[Medium]** (Lines 18, 22, 26, 30, 41-42): Five unbounded `List<Notification>` query methods risk loading large notification histories into memory, and `findByUserIdAndCreatedAtAfter` omits `ORDER BY n.createdAt DESC` and `@Param` annotations. **Suggestion:** Prefer the `Page<Notification>` overloads and add `ORDER BY n.createdAt DESC` plus `@Param` to `findByUserIdAndCreatedAtAfter`.
- **[Low]** (Lines 34-35): The explicit `@Query` on `findByIdAndUserId` duplicates Spring Data JPA's derived query resolution; also, a bulk `@Modifying @Query` to mark all notifications read for a user is missing. **Suggestion:** Remove the redundant `@Query` and add a bulk `markAllAsReadByUserId` `@Modifying` query.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/PaymentRepository.java`
- **[Medium]** (Lines 24-25): `sumPaidAmountSince` uses `SUM(p.amount)` without `COALESCE(..., 0)`, returning `null` instead of `0L` when no paid rows match (unlike `BookingRepository`), which risks `NullPointerException` on unboxing. **Suggestion:** Wrap with `COALESCE(SUM(p.amount), 0)`.
- **[Low]** (Line 27): `findByUserId` returns an unbounded, unordered `List<Payment>`. **Suggestion:** Order by `createdAt DESC` and add a `Pageable` overload.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/ServiceRepository.java`
- **[Info]** (Lines 15-17): Clean and concise; consider adding `@EntityGraph(attributePaths = "variants")` on `findByIsActiveTrue*` if catalog callers read `variants` for every returned service.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/ServiceVariantRepository.java`
- **[Medium]** (Line 17): Derived `deleteByServiceId` triggers a `SELECT` followed by row-by-row `DELETE` statements rather than a single SQL `DELETE`. **Suggestion:** Replace with a bulk query:
  ```java
  @Modifying
  @Query("DELETE FROM ServiceVariant sv WHERE sv.serviceId = :serviceId")
  void deleteByServiceId(@Param("serviceId") String serviceId);
  ```

### `pretty-nails-backend/src/main/java/com/prettynails/repository/SessionRepository.java`
- **[Medium]** (Line 17): Derived `deleteByUserId` loads all user sessions and deletes them one-by-one; additionally, there is no `deleteByExpiresBefore` method to prune expired sessions. **Suggestion:** Use a bulk `@Modifying @Query("DELETE FROM Session s WHERE s.userId = :userId")` and add a bulk `deleteByExpiresBefore(@Param("now") LocalDateTime now)` method.
- **[Low]** (Line 15): `findByUserId` returns an unbounded `List<Session>`. **Suggestion:** Add ordering/bounds if exposed to user session management endpoints.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/SettingRepository.java`
**Status:** Clean — no issues found.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/UserRepository.java`
- **[Medium]** (Lines 15, 25-27): `findByEmailIgnoreCase` applies `LOWER(email)` which bypasses a standard B-tree unique index unless a PostgreSQL functional index on `LOWER(email)` exists; `searchCustomers` returns an unbounded `List<User>` with leading-wildcard `LIKE` and no null guard on `:search`. **Suggestion:** Add a Flyway functional index `CREATE INDEX idx_users_email_lower ON users (LOWER(email))` (or store normalized lowercase emails), and paginate `searchCustomers` with `Pageable`.
- **[Low]** (Line 23): `findByRole(String role)` returns an unbounded `List<User>`. **Suggestion:** Add a `Pageable` overload or use projection/role-specific queries where appropriate.

### `pretty-nails-backend/src/main/java/com/prettynails/repository/VerificationTokenRepository.java`
- **[Medium]** (Line 16): Derived `deleteByExpiresBefore` loads all expired tokens into memory and deletes them individually rather than executing a single bulk `DELETE`. **Suggestion:** Replace with `@Modifying @Query("DELETE FROM VerificationToken vt WHERE vt.expires < :expires")`.

---

## 11. Backend Unit & Integration Tests

The backend test suite exhibits several systemic reliability and coverage gaps, including a broken unit test (`BookingServiceTest`) missing a required `@Mock LoyaltyService`, integration tests that bypass real infrastructure by disabling Flyway (`IntegrationTestBase`) or mocking core services (`AdminControllerIntegrationTest`, `AuthControllerIntegrationTest`, `BookingControllerIntegrationTest`, `AuthServiceIntegrationTest`), and time-dependent assertions that risk flakiness across clock boundaries. Additionally, `BookingRepositoryTest` asserts an unconditional `(appointment_date, start_time)` constraint that permanently blocks rebooking cancelled slots, and several controller/service tests omit key authorization, cookie, and edge-case validations.

### Findings Summary

| Severity | Count | Key Highlights |
| --- | ---: | --- |
| **Critical** | 1 | `BookingServiceTest` omits `@Mock LoyaltyService`, causing `NullPointerException` in `completeBooking` |
| **High** | 10 | Hardcoded local Postgres + Flyway disabled; `@MockBean` defeating integration tests; L1-cache/flush-dependent repo tests; time-flaky booking cutoff tests; broken cancelled-slot uniqueness expectation |
| **Medium** | 28 | Duplicated test config; missing endpoint/method coverage (cookies, logout, admin booking endpoints, password history, search); vacuous/redundant mocks (`lenient()`, `anyList()`, tautological assertions) |
| **Low** | 18 | Unused imports/fields, redundant `@Transactional`, empty `tearDown()`, `SecurityContext` cleanup hygiene, non-email test admin placeholder |
| **Info** | 0 | — |

---

### `pretty-nails-backend/src/test/java/com/prettynails/IntegrationTestBase.java`

- **[High]** (Lines 10-17, 51): Integration tests hardcode `jdbc:postgresql://localhost:5432/testdb` with `@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)` and disable Flyway (`spring.flyway.enabled=false`, `spring.jpa.hibernate.ddl-auto=create`). Tests fail without a manually started local PostgreSQL instance and never validate Flyway SQL migrations or PostgreSQL-specific partial indexes. **Suggestion:** Use Testcontainers (`PostgreSQLContainer` with `@ServiceConnection` or `@DynamicPropertySource`) and enable Flyway (`spring.flyway.enabled=true`, `spring.jpa.hibernate.ddl-auto=validate`).
  ```java
  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
  ```
- **[Medium]** (Lines 10-49): All 39 properties in `@SpringBootTest(properties = {...})` duplicate `src/test/resources/application-test.yml`, and `IntegrationTestBase` lacks `@ActiveProfiles("test")` so `application-test.yml` is ignored by default. **Suggestion:** Annotate `IntegrationTestBase` with `@ActiveProfiles("test")` and remove the inline `properties = {...}` block so `application-test.yml` is the single source of truth.
- **[Low]** (Lines 52-53): Combining `@Transactional` with `@TestInstance(TestInstance.Lifecycle.PER_CLASS)` shares one class instance across test methods and increases the risk of stale state or poisoned persistence contexts when flushing constraint violations. **Suggestion:** Remove `@TestInstance(TestInstance.Lifecycle.PER_CLASS)` to use JUnit 5's default `PER_METHOD` isolation.

---

### `pretty-nails-backend/src/test/java/com/prettynails/TestApplication.java`

- **[Medium]** (Lines 10-16): `@EnableAutoConfiguration(exclude = {...})` duplicates the Bucket4j exclusions in `IntegrationTestBase` and `application-test.yml`, omits `Bucket4jAutoConfiguration.class` (which is excluded in the other two places), and prevents any integration test from exercising `RateLimitFilter` / Bucket4j. **Suggestion:** Remove `@EnableAutoConfiguration(exclude = ...)` from `TestApplication` and manage test-specific exclusions in `application-test.yml`, adding a dedicated test profile/class where rate limiting remains enabled.

---

### `pretty-nails-backend/src/test/java/com/prettynails/controller/AdminControllerIntegrationTest.java`

- **[High]** (Lines 54-55): The test boots the full `@SpringBootTest` + PostgreSQL context and persists real `User` records, yet mocks `@MockBean private AdminService adminService`. No `AdminService` business logic, queries, or persistence paths are actually integration-tested. **Suggestion:** Convert this class to a fast `@WebMvcTest(AdminController.class)` slice test for controller/security routing, or remove `@MockBean AdminService` and seed database fixtures to test end-to-end.
- **[Medium]** (Lines 127-133, 327-354): Missing authorization, validation, and exception-handling coverage: unauthenticated access is only checked on `/api/admin/stats` (not `/reports`, `/settings`, `/customers`, or `/notes`), `updateCustomerNote` has no `CUSTOMER`-forbidden test, invalid `@Valid` DTO payloads (`400`) are untested, and `404`/`403` responses from `AdminService` are untested. **Suggestion:** Add tests for `PUT /api/admin/customers/notes/{noteId}` as `CUSTOMER`, `@Valid` rejection on `LoyaltySettingsDto` and `CustomerNoteRequest`, and service-thrown `ResourceNotFoundException`/`AccessDeniedException`.
- **[Low]** (Lines 14, 21, 36): Unused imports (`SpringBootTest`, `TestPropertySource`) and redundant `@Transactional` (inherited from `IntegrationTestBase`). **Suggestion:** Remove the unused imports and redundant `@Transactional`.
- **[Low]** (Lines 127-130): `getDashboardStats_whenNotAuthenticated_shouldReturnForbidden` expects `403 Forbidden` for an unauthenticated request because `SecurityConfig` lacks an `AuthenticationEntryPoint`. **Suggestion:** Configure `HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)` in `SecurityConfig` so unauthenticated calls return `401` and role mismatches return `403`, then update this assertion to `isUnauthorized()`.

---

### `pretty-nails-backend/src/test/java/com/prettynails/controller/AuthControllerIntegrationTest.java`

- **[High]** (Lines 54-58): Extending `IntegrationTestBase` (full DB context) while mocking `@MockBean private AuthService authService` and `@MockBean private EmailService emailService` bypasses all real authentication, password policy, JWT generation, and `CustomUserDetailsService` behavior. **Suggestion:** Remove `@MockBean AuthService` (and unused `@MockBean EmailService`) to test the real stack end-to-end, or migrate this to `@WebMvcTest(AuthController.class)`.
- **[Medium]** (Lines 84-167): `AuthController` sets/clears the `HttpOnly` `prettynails_token` cookie on `register`, `login`, and `logout`, yet no test asserts `cookie().exists("prettynails_token")`, `cookie().httpOnly("prettynails_token", true)`, tests `POST /api/auth/logout`, or tests `@Valid` request validation failures (`400 Bad Request`). **Suggestion:** Add cookie assertions to `register`/`login`, add a `logout` test checking `Max-Age=0`, and add invalid DTO payload tests.
- **[Low]** (Lines 16, 20, 33, 51-52, 57-58, 79-80): Unused imports (`SpringBootTest`, `TestPropertySource`), redundant `@Transactional`, unused `@Autowired TimeProvider`, and unused `@MockBean EmailService` with `lenient()` stubbings. **Suggestion:** Remove all dead fields, mocks, stubbings, and imports.

---

### `pretty-nails-backend/src/test/java/com/prettynails/controller/AuthControllerTest.java`

- **[Medium]** (Lines 64-72): `authenticateUser()` sets `SecurityContextHolder.getContext().setAuthentication(auth)` without an `@AfterEach` cleanup, risking `ThreadLocal` context leakage across tests in the same runner thread. **Suggestion:** Add an `@AfterEach` hook calling `SecurityContextHolder.clearContext()`.
- **[Medium]** (Lines 74-209): Only 3 of `AuthController`'s 10 endpoints (`/me`, `/profile`, `/change-password`) are unit-tested; `register`, `login` (including `rememberMe` cookie `Max-Age` 90d vs 30d), `logout`, `verify-email`, `resend-verification`, `forgot-password`, `reset-password`, and `@Valid` failures are uncovered. **Suggestion:** Add unit tests for the remaining endpoints, cookie attributes, and bean validation errors.
- **[Low]** (Lines 29-30): Duplicate static import `status` on line 30 (already covered by `MockMvcResultMatchers.*` on line 29). **Suggestion:** Remove line 30.

---

### `pretty-nails-backend/src/test/java/com/prettynails/controller/BookingControllerIntegrationTest.java`

- **[High]** (Lines 71-72, 93-130): `@BeforeEach` seeds `LoyaltyCard`, `Service`, `ServiceVariant`, and `Availability` rows into PostgreSQL, but `@MockBean private BookingService bookingService` mocks out the entire service layer so none of that DB state is exercised. **Suggestion:** Either remove `@MockBean BookingService` to run real integration tests against PostgreSQL, or convert this to `@WebMvcTest(BookingController.class)` without repository seeding.
- **[Medium]** (Lines 132-358): Missing tests for all admin-restricted endpoints in `BookingController` (`PUT /api/bookings/{id}/status`, `GET /api/admin/bookings`, `PUT /api/admin/bookings/{id}/confirm`, `/cancel`, `/complete`, `/no-show`, and `NoShowPolicyService` endpoints) as well as admin access to `GET /api/bookings/{id}` for another user's booking. **Suggestion:** Add tests verifying both `ADMIN` success paths and `CUSTOMER` `403 Forbidden` enforcement on admin booking endpoints.
- **[Low]** (Lines 6, 19, 23, 38): Unused imports (`Booking`, `SpringBootTest`, `TestPropertySource`) and redundant `@Transactional`. **Suggestion:** Remove unused imports and `@Transactional`.

---

### `pretty-nails-backend/src/test/java/com/prettynails/controller/UploadControllerTest.java`

- **[Medium]** (Lines 33-79): Standalone `MockMvc` setup skips Spring Security, so authentication enforcement on `POST /api/upload` is untested; missing multipart part (`file` omitted) and `MaxUploadSizeExceededException` handling are also untested. **Suggestion:** Add a `@WebMvcTest` or integration test verifying unauthenticated upload requests are rejected, and add a unit test for missing `"file"` parameter (`400 Bad Request`).
- **[Low]** (Lines 57-61): The happy-path test never verifies delegation via `verify(fileStorageService).storeFile(any())`. **Suggestion:** Add `verify(fileStorageService).storeFile(any());` at the end of `uploadFile_whenValid_shouldReturnOkAndResponse`.

---

### `pretty-nails-backend/src/test/java/com/prettynails/repository/BookingRepositoryTest.java`

- **[High]** (Lines 190-223): `uniqueConstraint_shouldPreventAnyDuplicateBookingForSameSlot` asserts that inserting a `PENDING` booking for a slot with an existing `CANCELLED` booking throws `DataIntegrityViolationException` (`uk_booking_slot_active`). Because Hibernate generates an unconditional unique constraint on `(appointment_date, start_time)` in `Booking`, cancelled/completed bookings permanently block slots from rebooking, contradicting `BookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn` (`PENDING`/`CONFIRMED`) and `AvailabilityService`. **Suggestion:** Replace the entity `@UniqueConstraint` with a Flyway PostgreSQL partial unique index (`WHERE status IN ('PENDING', 'CONFIRMED')`), enable Flyway in tests, and assert that a new `PENDING` booking succeeds after a `CANCELLED` booking while duplicate `PENDING`/`CONFIRMED` bookings fail.
- **[Medium]** (Lines 129-170): Both `countByAppointmentDateAndStartTimeAndStatusInAndIdNot_whenOtherBookingExists_shouldReturnOne` and `..._whenOtherBookingSameSlot_shouldReturnOne` are named `_shouldReturnOne` yet assert `isEqualTo(0)` because they use two different start times (`"10:00"` and `"14:00"`). The non-zero conflict path is never tested. **Suggestion:** Rename these tests accurately (`_whenDifferentSlot_shouldReturnZero`) and add a test case that returns `1` (e.g., two `CANCELLED` bookings or testing alongside the partial unique index fix).
- **[Medium]** (Lines 16-245): Custom queries in `BookingRepository` — including `findAdminBookings` (filtering, search, dynamic sorting), `findCompletedBookingsWithoutStamps`, `sumTotalPriceByStatus`, `sumTotalPriceByStatusAndDateBetween`, and `countByUserIdAndStatus` — have no repository tests. **Suggestion:** Add tests for each custom JPQL query in `BookingRepository`.

---

### `pretty-nails-backend/src/test/java/com/prettynails/repository/LoyaltyCardRepositoryTest.java`

- **[High]** (Lines 36, 68, 93, 117): Four tests reuse the same hardcoded email `"user123@example.com"`, and `stampCounting_*` / `stampExpiry_*` tests call `save(...)` and `findByUserId(...)` without flushing and clearing the JPA `EntityManager`, so `findByUserId` reads from Hibernate's L1 cache rather than verifying database persistence. **Suggestion:** Generate unique emails per test (`UUID.randomUUID()`), and inject `TestEntityManager` (or `EntityManager`) to `flush()` and `clear()` before querying back.
- **[Medium]** (Lines 66-132): `stampCounting_whenIncrementingStamps_shouldUpdateCount`, `stampCounting_whenRedeemingStamps_shouldDeductCount`, and `stampExpiry_whenCardExpires_shouldHavePastExpiryDate` only test in-memory JPA getter/setter persistence rather than repository query behavior, and `findCustomerCardsWithSearch` / `countByStampCountGreaterThan` boundary equality (`== 5`) are untested. **Suggestion:** Focus tests on repository queries (`findCustomerCardsWithSearch`, boundary values on `countByStampCountGreaterThan`, and unique `userId` constraint).

---

### `pretty-nails-backend/src/test/java/com/prettynails/repository/UserRepositoryTest.java`

- **[Medium]** (Lines 367-409): `searchCustomers_shouldSearchByNameAndEmail` only searches by `"maria"`, `"santos"` (both in `name`), and `"juan"`. It does not test email-only matches (e.g., searching by email prefix/domain not in `name`), mixed-case queries (`"MARIA"`), `ADMIN` exclusion, or unique search tokens (asserting `hasSize(1)` for `"maria"` is brittle if another test inserts a `"Maria"`). **Suggestion:** Use unique suffix tokens in test names/emails, add an email-only match assertion, test uppercase input, and verify an `ADMIN` user matching the term is excluded.
- **[Low]** (Lines 208-283): `isEnabled_*` and `isAccountNonLocked_*` save entities to PostgreSQL only to call plain Java methods on the in-memory `User` object without invoking `UserRepository`. **Suggestion:** Move `UserDetails` method assertions to a fast `UserTest` unit test.

---

### `pretty-nails-backend/src/test/java/com/prettynails/service/AuthServiceIntegrationTest.java`

- **[High]** (Lines 51-55, 130-240): Mocking `@MockBean private AuthenticationManager` and `@MockBean private Authentication` bypasses `CustomUserDetailsService`, `DaoAuthenticationProvider`, `BCryptPasswordEncoder` verification, and `User.isEnabled()` checks. In fact, `login_whenCredentialsValid_shouldReturnAuthResponse` (line 132) encodes `"password123"` while `loginRequest` sends `"Password123!"` (line 74), yet passes solely because `AuthenticationManager` is mocked. **Suggestion:** Remove `@MockBean AuthenticationManager` and `@MockBean Authentication`, align the test password to `"Password123!"`, and add integration tests verifying wrong-password failure and unverified-email login rejection against the real security stack.
- **[Medium]** (Lines 429-449): Missing integration tests for password history reuse rejection (`changePassword` / `resetPassword` against `app.password-policy.history-size=5`) and password policy validation during `register`. **Suggestion:** Add integration tests verifying password reuse rejection and weak-password rejection on `register`.
- **[Low]** (Lines 15, 21-22, 25, 45-46): Unused imports (`SpringBootTest`, `TestPropertySource`, `Transactional`, `Optional`) and unused `@Autowired JwtUtil jwtUtil` field. **Suggestion:** Remove the unused imports and field.

---

### `pretty-nails-backend/src/test/java/com/prettynails/service/AuthServiceTest.java`

- **[Medium]** (Lines 100-150, 278): `AuthServiceTest` lacks unit tests for `login` lockout/attempt-reset behavior, `verifyEmail`, `resendVerificationEmail`, `forgotPassword`, `resetPassword`, and password reuse checks (`passwordPolicyService.isPasswordReused`). Line 278 also uses `lenient().doReturn(...)` on a stub that is directly invoked in that test. **Suggestion:** Add unit tests for all token/email/lockout flows and password-history rejection, and remove `lenient()` on line 278.
- **[Low]** (Lines 105, 129-140): Line 105 stubs `loyaltyCardRepository.save` to return `null` instead of returning the saved argument, and `login_whenCredentialsValid_shouldReturnAuthResponse` does not verify `authenticationManager.authenticate(...)` was called with the normalized email. **Suggestion:** Return `invocation.getArgument(0)` from `save` and verify `authenticationManager.authenticate(...)`.

---

### `pretty-nails-backend/src/test/java/com/prettynails/service/AvailabilityServiceTest.java`

- **[Medium]** (Lines 88-180): `getAvailableSlots_whenSlotHasCancelledBooking_shouldMarkSlotAvailable`, `_whenSlotHasCompletedBooking_`, and `_whenSlotHasNoShowBooking_` are redundant copies that stub `bookingRepository.existsByAppointmentDateAndStartTimeAndStatusIn(eq(testDateTime), anyString(), anyList()).thenReturn(false)` using `anyList()`, never asserting that `AvailabilityService` passes `List.of("PENDING", "CONFIRMED")`. **Suggestion:** Replace `anyList()` with `eq(List.of("PENDING", "CONFIRMED"))` and consolidate these into a single test verifying the active status filter.
- **[Medium]** (Lines 62-63, 89-247): Excessive `lenient()` stubbing on nearly every stub hides unused stubbings, and `createAvailability`, `updateAvailability`, `deleteAvailability`, and `getStaffSchedule` are completely untested. **Suggestion:** Remove `lenient()` from per-test stubs and add unit tests for CRUD methods on `AvailabilityService`.
- **[Low]** (Line 17): Unused import `java.time.LocalTime`. **Suggestion:** Remove the unused import.

---

### `pretty-nails-backend/src/test/java/com/prettynails/service/BookingServiceIntegrationTest.java`

- **[High]** (Lines 262-307): In `confirmBooking_whenAnotherPendingBookingExistsForSameSlot_shouldThrowDataIntegrityViolation`, `booking2` is saved via `bookingRepository.save(booking2)` (without flushing) for the exact same slot as `booking1`. Because of Hibernate's unconditional `(appointment_date, start_time)` constraint, the `INSERT` for `booking2` only executes when `bookingService.confirmBooking(booking1.getId())` triggers an auto-flush — meaning the test passes due to deferred `booking2` persistence rather than `confirmBooking` itself. **Suggestion:** Fix the DB constraint to a partial unique index via Flyway and call `saveAndFlush` explicitly at the setup step so tests fail fast on setup mistakes.
- **[High]** (Lines 376-405, 489-523, 663): `cancelBookingByCustomer_whenWithin24Hours_shouldThrowBadRequestException` and `rescheduleBooking_whenWithin24Hours_shouldThrowBadRequestException` compute `timeProvider.localNow().plusHours(12)` for the date while hardcoding `.startTime("10:00")`, producing time deltas ranging from `-14h` to `+22h` depending on wall-clock execution time (and creating appointments in the past if run after 10:00 AM). Multiple tests also hardcode `"2025-12-25"` / `"2025-12-26"`, which are past dates. **Suggestion:** Use a fixed `Clock` / test `TimeProvider` and compute future dates and `startTime` consistently relative to the test clock.
- **[Medium]** (Lines 640-693): Missing integration tests for `markNoShow`, admin `cancelBooking`, and `getAllBookings` date/status filtering. **Suggestion:** Add integration tests covering those admin booking lifecycle methods.
- **[Low]** (Lines 11, 18-20, 24, 26, 60): Unused imports (`ResourceNotFoundException`, `SpringBootTest`, `TestPropertySource`, `Transactional`, `LocalTime`, `Optional`) and unused `@Autowired LoyaltyService loyaltyService`. **Suggestion:** Remove unused imports and field.

---

### `pretty-nails-backend/src/test/java/com/prettynails/service/BookingServiceTest.java`

- **[Critical]** (Lines 36-64, 217-225): `BookingService` requires `LoyaltyService` and `NoShowPolicyService` via constructor injection and calls `loyaltyService.addStampOnBookingCompletion(bookingId, booking.getUserId())` inside `completeBooking()`. `BookingServiceTest` omits `@Mock private LoyaltyService loyaltyService;` (and `@Mock private NoShowPolicyService noShowPolicyService;`), so Mockito injects `null` and `completeBooking_shouldUpdateStatusToCompleted()` fails with a `NullPointerException`. **Suggestion:** Add `@Mock private LoyaltyService loyaltyService;` and `@Mock private NoShowPolicyService noShowPolicyService;`, and verify `loyaltyService.addStampOnBookingCompletion(...)` is invoked.
  ```java
  @Mock
  private LoyaltyService loyaltyService;

  @Mock
  private NoShowPolicyService noShowPolicyService;
  ```
- **[High]** (Lines 230-357, 431-459, 594-632): Widespread `lenient()` stubbing masks dead stubs and flawed test setups: duplicate slot-conflict tests (`_Pending_` / `_Confirmed_`) stub `any()` instead of `List.of("PENDING", "CONFIRMED")`; `rescheduleBooking_usesTimeProviderForNewDate` declares unused `BookingRequest rescheduleRequest` (lines 431-437) and asserts `verify(timeProvider, times(2)).startOfDay(...)` (an internal call-count detail); and `rescheduleBooking_whenMovingToSameSlot_shouldAllow` declares unused `appointmentLater` (line 598) and relies on unstubbed `countByAppointmentDateAndStartTimeAndStatusInAndIdNot` defaulting to `0L`. **Suggestion:** Remove duplicate tests and dead variables, drop `lenient()`, stub `countByAppointmentDateAndStartTimeAndStatusInAndIdNot` explicitly, and verify exact status lists.
- **[Low]** (Lines 7, 12, 21, 23, 24): Unused imports (`ServiceVariant`, `BookingService`, `LocalDate`, `LocalTime`, `ZoneId`). **Suggestion:** Remove unused imports.

---

### `pretty-nails-backend/src/test/java/com/prettynails/service/FileStorageServiceTest.java`

- **[Medium]** (Lines 110-129, 279-296, 316-345): `storeFile_whenWebpImage_shouldProcessAndSave` duplicates `storeFile_whenValidWebp_shouldStoreAndReturnResponse` and silently returns (`return;`) instead of using `assumeTrue(...)` when WebP is unavailable. In addition, `storeFile_whenJpegWithExif_shouldStripExifMetadata` creates a plain JPEG with no EXIF data and only asserts `Files.exists(...)`, never verifying that EXIF segments are actually stripped. **Suggestion:** Delete the duplicate WebP test, inject an APP1/EXIF marker into the input JPEG bytes, and assert the stored file bytes no longer contain it.
- **[Medium]** (Lines 148-217): Missing tests for path-traversal filenames (e.g., `../../evil.png`), filenames with no extension, uppercase extensions (`.PNG`), and `ServletUriComponentsBuilder` URL generation when a `MockHttpServletRequest` is bound to `RequestContextHolder`. **Suggestion:** Add tests for traversal/extension edge cases and `RequestContextHolder` URL building.
- **[Low]** (Lines 36-39): Empty `@AfterEach void tearDown()` method. **Suggestion:** Remove `tearDown()`.

---

### `pretty-nails-backend/src/test/java/com/prettynails/service/LoyaltyServiceIntegrationTest.java`

- **[Medium]** (Lines 159-160, 218-219, 237-238): Asserting `loyaltyStampRepository.findAll()` has size `1` assumes an empty `loyalty_stamps` table across the entire database. **Suggestion:** Query with `loyaltyStampRepository.findByCardIdOrderByEarnedAtDesc(testLoyaltyCard.getId())` instead of `findAll()`.
- **[Medium]** (Lines 104-340): Integration tests do not cover `addStampOnBookingCompletion`, `addStampViaQrByBookingId` (staff QR scan with `_STAFF` suffix and `requiredStamps`), `getStampHistory`, `getAllLoyaltyCards`, `Action.EXTEND`, or expiry reset behavior on `ADD_STAMP`. **Suggestion:** Add integration test coverage for those methods and assertions.
- **[Low]** (Lines 8-9, 19-20, 24, 78, 92): Unused imports (`BadRequestException`, `ResourceNotFoundException`, `TestPropertySource`, `Transactional`, `Optional`) and `LocalDate.now()` used instead of `timeProvider.today()` in `setUp()`. **Suggestion:** Remove unused imports and use `timeProvider.today()`.

---

### `pretty-nails-backend/src/test/java/com/prettynails/service/LoyaltyServiceTest.java`

- **[Medium]** (Lines 71-211): Missing unit tests for `addStampOnBookingCompletion`, `addStampViaQrByBookingId` (including missing booking and `rewardThreshold < 1` fallback), `getStampHistory`, `getAllLoyaltyCards`, `Action.EXTEND`, `REMOVE_STAMP` clamping to `0`, missing user/card `ResourceNotFoundException`, and blank/malformed `"BOOKING:"` QR codes. **Suggestion:** Add unit tests for these branches.
- **[Medium]** (Lines 101, 136, 149): Stubbing `loyaltyStampRepository.save(any(LoyaltyStamp.class))` to return `null` is fragile if `LoyaltyService` later uses the returned entity. **Suggestion:** Use `thenAnswer(inv -> inv.getArgument(0))`.
- **[Low]** (Lines 7-8, 19-21, 24, 54): Unused imports (`BadRequestException`, `ResourceNotFoundException`, `Page`, `PageImpl`, `PageRequest`, `List`) and global `lenient()` on `timeProvider.localNow()`. **Suggestion:** Remove unused imports and move `timeProvider.localNow()` stubbing into the tests that require it.

---

### `pretty-nails-backend/src/test/java/com/prettynails/service/PaymentServiceTest.java`

- **[Medium]** (Lines 217-239): `verifyPayment_whenConcurrentVerificationAttempt_shouldHandleGracefully` claims to test concurrent verification but executes two sequential single-threaded calls with `testPayment.setStatus("PAID")` manually mutated in between, duplicating `verifyPayment_whenPaymentAlreadyVerified_shouldThrowIllegalStateException`. **Suggestion:** Rename it to reflect sequential idempotency/re-verification rejection and test real multi-threaded `PESSIMISTIC_WRITE` locking in an integration test.
- **[Medium]** (Lines 81-267): Missing unit tests for `getPaymentByBookingId` (found & not-found), `getAllPayments`, `createPayment(PaymentRequest)`, and `verifyPayment` with `null` admin or missing booking; meanwhile, four tests duplicate the `verifyPayment` happy path. **Suggestion:** Consolidate the overlapping `verifyPayment` happy-path tests and cover the untested service methods.
- **[Low]** (Line 49): Global `lenient().when(timeProvider.localNow())` in `setUp()`. **Suggestion:** Stub `timeProvider.localNow()` only in tests that invoke `verifyPayment`.

---

### `pretty-nails-backend/src/test/java/com/prettynails/util/TimeProviderTest.java`

- **[Medium]** (Lines 26-59, 106-113): `today`, `localNow`, `startOfToday`, and `endOfToday` call `timeProvider` and `ZonedDateTime.now(ZoneId.of("Asia/Manila"))` separately, risking flaky failures across millisecond or midnight boundaries. In `isAtLeast24HoursInFuture_whenAppointmentIsExactly24HoursAway_returnsFalse`, `now` is captured *before* `timeProvider` calls `ZonedDateTime.now()`, so the internal clock is slightly later and the test tests `< 24h` rather than exact `== 24h` equality. **Suggestion:** Inject a `java.time.Clock` into `ManilaTimeProvider` and test against a fixed `Clock`.
- **[Medium]** (Lines 136-146): `isAtLeast24HoursInFuture_usesManilaTimezoneNotSystemDefault` asserts `assertThat(result).isIn(true, false)`, a tautology that always passes and verifies nothing. **Suggestion:** Replace with a deterministic test using a fixed `Clock` or `TimeZone` offset comparison.

---

### `pretty-nails-backend/src/test/resources/application-test.yml`

- **[Medium]** (Lines 1-76): Duplicates all properties from `IntegrationTestBase`, disables Flyway (`spring.flyway.enabled: false`, `ddl-auto: create`), and points to an external `localhost:5432/testdb` PostgreSQL server. **Suggestion:** Make `application-test.yml` the single source of test configuration (via `@ActiveProfiles("test")`), enable Flyway with `ddl-auto: validate`, and let Testcontainers supply the JDBC URL/credentials dynamically.
- **[Low]** (Lines 50-52, 75): `app.admin.email: admin` is not a valid email format, and `logging.level.org.testcontainers: INFO` is configured even though Testcontainers is not currently used. **Suggestion:** Use a valid test email (e.g., `admin@prettynails.example.com`) and align logging with the adopted test DB setup.

---

## 12. E2E Tests, Frontend Unit Tests & Mocks

Frontend Jest unit tests and mocks contain tautological API-mock tests, local-timezone flakiness, and global warning suppression, while the `tests/e2e` suite relies almost entirely on static source-code substring/regex checks rather than executing real browser, component, or database workflows. Several E2E tests also include unchecked `indexOf` slices that can pass vacuously and placeholder `assert.ok(true)` checks that report compliance without performing verification.

| Severity | Count | Key Themes |
| --- | ---: | --- |
| **Critical** | 0 | — |
| **High** | 5 | Tautological unit tests (`BookingForm.test.tsx`), timezone-dependent and non-assertive `BookingCard.test.tsx` tests, placebo `assert.ok(true)` / mis-scoped checks (`studio-identity.test.mjs`, `constraint-boundaries.test.mjs`) |
| **Medium** | 15 | Shared mutable mock state, missing `Html5QrcodeScanner.render`, `console.error` warning masking, UTC+8 rollover bug, AST/regex extraction gaps, shell/reporter parsing fragility, static-only "E2E/integration" suites, CSS-vs-JSX icon check bug |
| **Low** | 23 | Dead imports/helpers, `any` casts, `process.cwd()` coupling, unchecked `indexOf` slices, duplicate `tsc` runs, white-box implementation string assertions |
| **Info** | 4 | Jest setup registration, emoji scanner directory/extension exclusions, static-only theme/typography assertions |

### `frontend/src/__mocks__/@hooks/useApi.ts`

- **[Medium]** (Lines 1-18): `useMutation` returns a single module-level `mockMutationResult` reference across all calls and tests, and `useQuery` has no default return object (`undefined`). Mutating properties on `mockMutationResult` leaks state across tests, while calling `const { data } = useQuery(...)` in an unconfigured test throws a `TypeError`. **Suggestion:** Return a fresh object per call from `useMutation` and give `useQuery` a safe default implementation:
  ```ts
  export const useQuery = jest.fn(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }));
  export const useMutation = jest.fn(() => ({ ...mockMutationResult, mutate: jest.fn(), mutateAsync: jest.fn().mockResolvedValue(undefined), reset: jest.fn() }));
  ```
- **[Low]** (Lines 13-18): The manual mock directory is named `@hooks` (without a slash) rather than matching the `@/hooks/useApi` import alias used in `BookingForm.test.tsx` (line 14), forcing tests to redeclare inline `jest.mock('@/hooks/useApi', ...)`. **Suggestion:** Align the mock directory or `jest.config` `moduleNameMapper` so `@/hooks/useApi` resolves to this manual mock automatically.

### `frontend/src/__mocks__/html5-qrcode.ts`

- **[Medium]** (Lines 18-22): `Html5QrcodeScanner` returns `mockHtml5Qrcode` (`start`, `stop`, `clear`) and omits the `render(successCallback, errorCallback)` method expected on `Html5QrcodeScanner`, which causes `TypeError: scanner.render is not a function` in component tests using `Html5QrcodeScanner`. **Suggestion:** Give `Html5QrcodeScanner` its own mock implementation with `render: jest.fn()` and `clear: jest.fn().mockResolvedValue(undefined)` instead of reusing `mockHtml5Qrcode`.

### `frontend/src/__mocks__/recharts.ts`

- **[Low]** (Lines 5-7, 53-55): `createMockComponent` and `ResponsiveContainer` spread all Recharts-specific props (`...props`, e.g., `dataKey`, `tickFormatter`, `isAnimationActive`, `contentStyle`) directly onto a native `<div>`, triggering React invalid-DOM-attribute warnings (currently hidden by `jest.setup.ts`). **Suggestion:** Extract only `children`, `className`, `id`, and `data-*` attributes onto the mock `<div>` instead of spreading `...props`.

### `frontend/src/app/(public)/booking/BookingForm.test.tsx`

- **[High]** (Lines 254-334): All four tests in `BookingForm - Slot Re-validation Logic (Item 10)` are tautological: they configure `mockAvailabilityApi` and call `await availabilityApi.getAvailable()` / `await availabilityApi.getSlots(dateStr)` directly from the test body without rendering `<BookingForm />` or triggering any form action, providing zero verification of `BookingForm`'s re-validation logic. **Suggestion:** Render `<BookingForm />`, drive user interactions through service, date, and time selection, and assert UI error toasts and slot-reset behavior when re-validation fails.
- **[Medium]** (Lines 23-35, 220-229): Mocking `react-hook-form`'s `useForm` to always resolve `trigger()` as `true` disables all client-side form/Zod validation, and `useQuery.mockImplementation` routes responses via `queryFn?.toString().includes(...)`, which breaks silently under refactoring or instrumentation. **Suggestion:** Keep the real `react-hook-form` implementation in tests and configure `useQuery` via structured query keys or explicit API-mock return values instead of `Function.prototype.toString()`.
- **[Low]** (Lines 3-4, 34, 46, 99, 113-169, 220): Unused imports/variables (`fireEvent`, `waitFor`, `userEvent`, `mockToast`), unused helper functions (`createMockBookingResponse`, `createMockPaymentResponse`, `createMockLoyaltyResponse`), and `any` casts (`config: {} as any`, `schema: any`, `queryFn: any`). **Suggestion:** Remove dead imports/helpers and replace `any` casts with proper Axios/TypeScript types.

### `frontend/src/components/customer/BookingCard.test.tsx`

- **[High]** (Lines 122-235): `createManilaDateTime` uses local-timezone getters (`getFullYear`, `getHours`, `getMinutes`) on `new Date()` while assuming the host OS is in `Asia/Manila`. On any CI runner or developer machine in UTC or another timezone, the 24-hour cutoff tests shift by the timezone difference and fail or test the wrong boundary. **Suggestion:** Use `jest.useFakeTimers()` with a fixed UTC timestamp and format Manila `dateStr`/`timeStr` using `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', ... })` or explicit `UTC+8` arithmetic.
- **[High]** (Lines 348-384): The `isWithin24HoursManila` and `isPastManila` tests only assert `expect(typeof result).toBe('boolean')` instead of verifying `true`/`false` outcomes, and mix `toISOString()` (UTC date) with `toTimeString()` (local OS time). **Suggestion:** Set deterministic fake system time (`jest.useFakeTimers()` + `jest.setSystemTime(...)`), compute consistent Manila date/time strings, and assert exact `true`/`false` results (or remove the duplicate tests since `utils.test.ts` covers them).
- **[Low]** (Lines 4, 7, 17, 81, 91, 101, 107, 117, 232): Unused imports/variables (`userEvent`, `BookingServiceDto`, `ServiceDto`, `PaymentDto`, `mockPaymentsApi`, `mockOnPaymentSubmitted`), `config: {} as any`, un-restored `global.confirm` mutation, and brittle Tailwind class selector `[class*="bg-stone-100"][class*="border-stone-200"]`. **Suggestion:** Clean up unused symbols, restore `global.confirm` in `afterEach`, and query the status badge by accessible text or `data-testid`.

### `frontend/src/jest.setup.ts`

- **[Medium]** (Lines 52-65): Overriding `console.error` to suppress every message containing `'Warning:'` or `'act(...)'` masks genuine React runtime errors (missing `key` props, invalid DOM attributes, uncontrolled-to-controlled warnings, and real async state leaks). **Suggestion:** Remove the global `'Warning:'` filter and address any underlying `act(...)` or DOM warnings directly in the tests/mocks.
- **[Info]** (Lines 1-13): `jest.setup.ts` calls `jest.mock('sonner', ...)` and is also imported directly (`import '@/jest.setup'`) inside test files rather than relying exclusively on Jest's `setupFilesAfterEnv`. Ensure `jest.config` registers this file in `setupFilesAfterEnv` and remove duplicate per-file imports.

### `frontend/src/lib/utils.test.ts`

- **[Medium]** (Lines 20-37): `createManilaDateTimeFromUTC` computes `const manilaHours = (base.getUTCHours() + 8) % 24;` without carrying over the day/month/year when `base.getUTCHours() >= 16`. This only passes today because `REFERENCE_UTC` is `10:00Z`; changing it to an evening UTC time produces a date 24 hours off. **Suggestion:** Shift the timestamp in milliseconds instead of manual modulo math:
  ```ts
  const targetManila = new Date(base.getTime() + (8 + offsetHours) * 60 * 60 * 1000);
  ```
- **[Low]** (Lines 16-17, 39-64): Contains two leftover `debug:` tests with `console.log` calls, a placeholder `expect(true).toBe(true)` assertion, unguarded `jest.useRealTimers()` calls (leaking fake timers on failure), and unused constants `REFERENCE_MANILA_DATE` and `REFERENCE_MANILA_TIME`. **Suggestion:** Delete the two `debug:` tests and unused constants.

### `tests/e2e/helpers/component-analyzer.mjs`

- **[Medium]** (Lines 55-68, 98-114): `extractClassTokens` stops matching `cn(...)` at the first `)` via `/cn\(([\s\S]*?)\)/g` (truncating nested calls like `cn('a', fn() && 'b')`), and `extractAstClassTokens` ignores `span.expression` inside `ts.isTemplateExpression`, as well as `ParenthesizedExpression`, `ArrayLiteralExpression`, and `ObjectLiteralExpression` nodes. **Suggestion:** Recurse into `span.expression` and container expressions in `extractStringsFromExpression`, and prefer AST extraction over regex scanning.
- **[Medium]** (Lines 176-181): `extractNamedImports` records `el.name.text` (the local alias) instead of `(el.propertyName ?? el.name).text` (the imported symbol name). An aliased import such as `import { Search as SearchIcon } from 'lucide-react'` evades forbidden-icon checks in Tier 1. **Suggestion:** Record `(el.propertyName ?? el.name).text` so exported symbol checks remain accurate under aliasing.
- **[Low]** (Lines 6, 15-16): Resolves `frontend/package.json` and source files against `process.cwd()`, failing if tests are executed from a subdirectory such as `tests/e2e`. **Suggestion:** Resolve repository root relative to `import.meta.dirname` (or `fileURLToPath(import.meta.url)`).

### `tests/e2e/helpers/emoji-detector.mjs`

- **[Low]** (Lines 47-57): `line.match(EMOJI_PATTERN)` without the `g` flag stops at the first match per line, under-reporting multiple emojis on the same line. **Suggestion:** Use `line.matchAll(new RegExp(EMOJI_PATTERN, 'gu'))` to capture every occurrence.
- **[Info]** (Lines 7-35): `IGNORED_DIRECTORIES` omits `dist`/`build`/`coverage` and `BINARY_EXTENSIONS` omits `.avif`, `.pdf`, `.zip`, and `.wasm`, which could cause false positives if those files are placed in scanned directories.

### `tests/e2e/helpers/seed-asset-verifier.mjs`

- **[Low]** (Lines 21-23): `verifyLocalImage` reads the entire image file into memory (`fs.readFileSync`) solely to check the first 3 JPEG magic bytes, and hardcodes JPEG SOI bytes despite its generic name. **Suggestion:** Read only the header bytes using `fs.openSync`/`fs.readSync` (and support PNG/WebP signatures if needed).

### `tests/e2e/helpers/type-checker.mjs`

- **[Low]** (Lines 9-16): Executes `npx tsc --noEmit` without `--no-install` (or `node_modules/.bin/tsc`), which can hang or attempt network resolution if local `typescript` is absent, and relies on `process.cwd()`. **Suggestion:** Use `npx --no-install tsc --noEmit` (or `node_modules/.bin/tsc`) and resolve `frontend` relative to `import.meta.dirname`.

### `tests/e2e/run-all.mjs`

- **[Medium]** (Lines 58-84): `runSuite` uses shell `execSync(\`node --test ${filePath}\`)` and parses stdout with `/\bpass (\d+)/` and `/\bfail (\d+)/` without fixing `--test-reporter`. If the Node test reporter output format differs, `failMatch` misses and `failed` defaults to `0`, falsely reporting `[PASS]` with 0 tests. **Suggestion:** Use `execFileSync('node', ['--test', '--test-reporter=tap', filePath])` (or the programmatic `run()` API from `node:test`) and fail if `passed === 0`.
- **[Low]** (Lines 175-180): Unconditionally prints hardcoded policy compliance claims (`"Zero emojis detected, zero git commits executed, zero npm run build executed."`) whenever `grandTotalFailed === 0`, even though `T1-78` and `T2-80` perform no actual checks. **Suggestion:** Report only measured test execution results rather than hardcoded compliance statements.

### `tests/e2e/tier1-feature-coverage/empty-states.test.mjs`

- **[Medium]** (Lines 1-183): All 20 tests perform static source-text/AST checks rather than rendering components or running browser tests; `T1-18` and `T1-19` only assert strings exist somewhere in the file without checking they are inside the empty-state branch. **Suggestion:** Add runtime component/browser tests verifying that empty states render when data arrays are empty.
- **[Low]** (Lines 7, 59-61, 90, 109): Unused import `extractAstClassTokens`; `content.slice(emptyBlockIndex, content.indexOf('gallery.map', emptyBlockIndex))` passes `-1` to `slice` if `'gallery.map'` is missing; and fixed `+ 600` / `+ 800` character slices in `T1-09` and `T1-11` are brittle to formatting edits. **Suggestion:** Remove the unused import, assert end-marker indices are `!== -1`, and inspect JSX AST branches instead of fixed offsets.

### `tests/e2e/tier1-feature-coverage/receipt-upload.test.mjs`

- **[Medium]** (Lines 60-65, 86-91): `T1-41` and `T1-45` slice `BookingForm.tsx` using the source comment `'Structured Atelier Receipt Card'` and `'BookingSummarySidebar'` without checking `indexOf(...) !== -1`. If the comment is removed or edited, `slice(-1, ...)` returns `""` and `!receiptSection.includes('border-dashed')` passes vacuously. **Suggestion:** Assert both slice indices are `>= 0` and verify upload limits, MIME checks, preview, replace, and remove via component/browser tests.
- **[Low]** (Lines 5, 7, 75): Unused imports `parseTsxAst` and `extractAstClassTokens`, plus `T1-43` asserts exact JS source expression syntax (`"file.type !== 'image/jpeg' && file.type !== 'image/png'"`). **Suggestion:** Remove unused imports and test runtime file validation behavior directly.

### `tests/e2e/tier1-feature-coverage/seed-data.test.mjs`

- **[Low]** (Lines 33-35, 92-97): `T1-58` repeats the 50KB check already enforced by `verifyLocalImage(img, 50000)` with a slightly inconsistent strict inequality (`> 50000` vs `>= 50000`), and `T1-65` matches raw `'50000'`/`'80000'`/`'30000'` anywhere in `data.sql` rather than inside `INSERT INTO services` price columns. **Suggestion:** Validate parsed `INSERT INTO services` rows and test `data.sql` execution against a database.

### `tests/e2e/tier1-feature-coverage/studio-identity.test.mjs`

- **[High]** (Lines 122-144): `T1-77`, `T1-78`, and `T1-79` are placeholder or misleading checks: `T1-77` only checks `.git/logs/HEAD` is non-empty and ends with `assert.ok(true)`, `T1-78` executes only `assert.ok(true)` without checking build artifacts, and `T1-79` claims to verify ASD-STE100 compliance in handoff reports while only checking `component-analyzer.mjs` for `TODO`/`FIXME`. **Suggestion:** Replace these with real checks (or remove them so they do not report false assurance).
- **[Low]** (Lines 13, 29, 75, 117-120): Unchecked `indexOf` in `T1-69`, single-match `:focus-visible` regex in `T1-26`/`T1-28`, and redundant `tsc --noEmit` + emoji scans duplicated in `T2-76`, `T4-07`, and `T4-09`. **Suggestion:** Assert `indexOf !== -1`, match all `:focus-visible` blocks, and deduplicate repository-wide `tsc`/emoji runs.

### `tests/e2e/tier1-feature-coverage/toast-notifications.test.mjs`

- **[Low]** (Lines 47-53, 75-82): `T1-52` asserts exact template-literal expression syntax (`${getSentenceLabel(status)}`), and `T1-55` checks only single-quoted `"toast.success('Success!')"` in `BookingForm.tsx` and `layout.tsx` (which does not trigger toasts), missing double quotes and other components. **Suggestion:** Test toast calls at runtime with mocked `sonner` in React Testing Library tests.

### `tests/e2e/tier1-feature-coverage/ui-primitives.test.mjs`

- **[Low]** (Lines 85-126): `T1-31`..`T1-33` rely on `indexOf` over a flat list of JSX element names rather than verifying DOM hierarchy, and `T1-34` checks raw string presence of `'Full Name'`, `'Mobile Number'`, and `'Consultation Notes'` anywhere in `BookingForm.tsx` rather than `<label>` bindings. **Suggestion:** Render the form primitives and `BookingForm` in JSDOM and verify `getByLabelText(...)`, `aria-invalid`, and `role="alert"`.

### `tests/e2e/tier2-boundary-corner/constraint-boundaries.test.mjs`

- **[High]** (Lines 11-28, 69-72): `T2-71`..`T2-73` inline-duplicate the emoji regex literal instead of importing/testing `emoji-detector.mjs` (so regressions in `emoji-detector.mjs` are never caught), and `T2-80` is a no-op `assert.ok(true, ...)` assertion. **Suggestion:** Test `scanFileForEmojis` / exported `EMOJI_PATTERN` from `emoji-detector.mjs` directly and remove the no-op `T2-80` test.
- **[Low]** (Lines 46-55): `T2-76` duplicates `tsc --noEmit` from `T1-76`, and `T2-77` asserts exact JSON formatting (`'"exclude": ["node_modules"]'`) instead of parsing `frontend/tsconfig.json`. **Suggestion:** Parse `tsconfig.json` with `JSON.parse` to check `compilerOptions.strict` and `exclude`.

### `tests/e2e/tier2-boundary-corner/empty-state-boundaries.test.mjs`

- **[Low]** (Lines 5-9, 23, 74, 109-113): Unused helper imports (`parseTsxAst`, `extractAstClassTokens`, `assertExcludesTokens`); `T2-15` claims `"from text-2xl to text-3xl"` but asserts only `text-2xl`; and `T2-02`/`T2-10` couple to exact JS syntax rather than rendered empty states. **Suggestion:** Remove unused imports, align the assertion with the test description, and verify empty-state boundaries in component tests.

### `tests/e2e/tier2-boundary-corner/focus-boundaries.test.mjs`

- **[Low]** (Lines 9, 65-87, 99-121): Unused import `assertExcludesTokens`; `T2-27`..`T2-29` check `globals.css` file-wide rather than scoping to `:focus-visible` (unlike `T2-26`); and `T2-31`..`T2-33` assert exact inline JS ID-generation code instead of rendered DOM `id`/`htmlFor` attributes. **Suggestion:** Scope CSS checks to `:focus-visible` blocks and verify generated `id`/`htmlFor` attributes in component tests.

### `tests/e2e/tier2-boundary-corner/seed-boundaries.test.mjs`

- **[Medium]** (Lines 17-23, 73-77): Unchecked `indexOf` calls in `T2-57` and `T2-64` silently produce empty/wrong slices if `'sampleGallery = ['`, `'for (const item of sampleGallery)'`, or `'INSERT INTO gallery'` change, allowing negative assertions such as `!sampleGalleryBlock.includes('.png')` to pass vacuously. **Suggestion:** Assert all `indexOf` markers are `!== -1` before slicing.
- **[Low]** (Lines 57-70): `T2-62` and `T2-63` check raw SQL value fragments (`'60, true, NOW()'`, `'50000'`), verifying only a single matching substring rather than all seeded rows. **Suggestion:** Parse every `INSERT INTO services` row and validate durations and positive prices across all entries.

### `tests/e2e/tier2-boundary-corner/theme-boundaries.test.mjs`

- **[Info]** (Lines 1-47): Tests only verify static presence of `media` queries, `themeColor:`, `rose:`, `display: 'swap'`, and `subsets: ['latin']` in source files without checking the actual `themeColor` hex values or rendered light/dark styling.

### `tests/e2e/tier2-boundary-corner/toast-boundaries.test.mjs`

- **[Low]** (Lines 7-76): Couples assertions to exact Tailwind class ordering (`"error: 'border-rose-300 dark:border-rose-900"` on line 73) and exact error copy strings without rendering `<Toaster />` or simulating failed API calls. **Suggestion:** Add component/E2E tests that trigger error responses and assert `toast.error` / rendered toast output.

### `tests/e2e/tier2-boundary-corner/upload-boundaries.test.mjs`

- **[Low]** (Lines 5-9, 14-28, 50-98): Unused imports (`parseTsxAst`, `extractAstClassTokens`, `assertExcludesTokens`) and white-box assertions on internal React state setter names (`setInternalError(null)`, `setPreviewUrl(null)`, `setReceiptFile(null)`, `setReceiptPreview(null)`). **Suggestion:** Remove unused imports and replace implementation-detail checks with component tests uploading invalid-size, invalid-MIME, and valid `File` objects.

### `tests/e2e/tier3-cross-feature/booking-flow-integration.test.mjs`

- **[Medium]** (Lines 1-38): Named `booking-flow-integration.test.mjs`, yet every test only runs `content.includes(...)` on `BookingForm.tsx` (e.g., `T3-05` checks substrings `'currentStep'`, `'onBack'`, and `'onNext'` as proof that step transitions preserve state). **Suggestion:** Implement true multi-step integration or browser E2E tests that navigate forward/backward through `BookingForm` and verify preserved selections, calculations, and submission payloads.

### `tests/e2e/tier3-cross-feature/design-system-consistency.test.mjs`

- **[Info]** (Lines 29-52): `T3-08` and `T3-09` check file-wide presence of `'font-serif'` and `'font-sans'` rather than verifying those classes on the empty-state headlines and descriptions specifically.

### `tests/e2e/tier3-cross-feature/theme-toggle-interactions.test.mjs`

- **[Medium]** (Lines 1-40): Named `theme-toggle-interactions.test.mjs`, yet performs zero theme-toggle interactions—it never renders or clicks a theme toggle, verifies `dark` class toggling on `<html>`, or checks computed styles, asserting only static `dark:` class tokens across 3 files. **Suggestion:** Add browser or DOM tests that toggle the theme control and assert `document.documentElement` class updates and dark-mode styles.

### `tests/e2e/tier4-workload-scenarios/admin-audit-walkthrough.test.mjs`

- **[Medium]** (Lines 5-10): In `T4-04`, `!content.includes('lucide-users')` checks for a CSS-style lowercase string `'lucide-users'` rather than the PascalCase `Users` component/import from `lucide-react`, so it would pass even if `<Users />` were rendered. Additionally, all 3 tests duplicate static file checks from Tiers 1–2 with no runtime admin walkthrough. **Suggestion:** Check `extractNamedImports(sf, 'lucide-react')` (or render `<CustomersTable />`) and add runtime admin workflow tests.

### `tests/e2e/tier4-workload-scenarios/customer-booking-journey.test.mjs`

- **[Medium]** (Lines 1-28): Executes no runtime customer booking journey (no navigation, slot selection, receipt upload, or API calls)—all 3 tests duplicate static substring checks on `services/page.tsx` and `BookingForm.tsx`. **Suggestion:** Implement a browser-based (e.g., Playwright) end-to-end journey test covering service selection through booking submission.

### `tests/e2e/tier4-workload-scenarios/repository-integrity-audit.test.mjs`

- **[Low]** (Lines 16-21, 35-39, 42-45): `T4-07` relies on `scanDirectoryForEmojis`, which silently returns `[]` if a directory path is missing/renamed; `T4-08` redundantly re-checks `result.size > 50000` after `verifyLocalImage(sample, 50000)`; and `T4-09` triggers a third duplicate `tsc --noEmit` run across the suite. **Suggestion:** Assert `fs.existsSync(fullPath)` for each directory in `dirsToScan`, remove the redundant size check, and run `tsc --noEmit` once in the suite.
