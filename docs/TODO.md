# Pretty Nails Salon Booking System - TODO

> **Note:** This project is currently in **prototype stage** using a local PostgreSQL database. The items below are organized by category for a fully functional production deployment (Supabase + Render).

---

## 🐛 Category 1: Core Bug Fixes (Prototype Blockers)

### 1. Date String Mismatch in Availability Lookups
**Problem:** Backend serializes availability date as ISO-8601 LocalDateTime (e.g., "2026-11-20T00:00:00"). Frontend compares with YYYY-MM-DD using exact string equality (`a.date === dateStr`) in `BookingForm.tsx`, `availability/page.tsx`, and `admin/availability/page.tsx`.  
**Impact:** Custom availability intervals, blocked days, and studio vacation dates fail to match on the client calendar.  
**Fix:** Normalize comparison using `a.date.split('T')[0] === dateStr` across all availability lookups.  
**Status:** ⏳ PENDING

### 2. Concurrent Slot Booking Race Condition
**Problem:** No unique database constraint or pessimistic lock for `(appointmentDate, startTime)` where status is `PENDING` or `CONFIRMED`.  
**Impact:** Double-booking of identical 30-minute time slots during peak traffic.  
**Fix:** Add `existsByAppointmentDateAndStartTimeAndStatusIn` validation in `BookingService.java` + transactional lock. Add DB-level partial unique index for `(appointment_date, start_time) WHERE status IN ('PENDING','CONFIRMED')`.  
**Status:** ⏳ PENDING (code-level check exists, DB constraint missing)

### 3. Timezone Discrepancy (Asia/Manila vs Server UTC)
**Problem:** Backend uses `LocalDateTime` and `LocalDate.parse()` without `ZoneId.of("Asia/Manila")`. Server deployments in UTC evaluate "today"/"tomorrow" 8 hours behind Manila time.  
**Impact:** Appointment cutoff dates, 24-hour cancellation windows, and slot availability boundaries misalign.  
**Fix:** Configure JVM timezone; wrap time calculations with `ZonedDateTime.now(ZoneId.of("Asia/Manila"))`.  
**Status:** ⚠️ PARTIAL - `ManilaTimeProvider` exists but `User.isAccountNonLocked()` uses `LocalDateTime.now()`

### 4. Missing Client Self-Service Reschedule Endpoint
**Problem:** Customer portal states clients can reschedule up to 24 hours in advance, but backend only exposes `POST /api/bookings/{id}/cancel`.  
**Impact:** Clients must cancel and recreate bookings, losing deposit link.  
**Fix:** Add `PUT /api/bookings/{id}/reschedule` with 24-hour cutoff validation; update customer appointment card UI.  
**Status:** ⏳ PENDING

### 5. Customer Cancellation Missing 24-Hour Cutoff Enforcement
**Problem:** `BookingService.cancelBookingByCustomer` checks status but not whether appointment is ≥24 hours in future.  
**Impact:** Last-minute cancellations cause unfillable studio vacancies.  
**Fix:** Add validation: `ZonedDateTime.now(Manila).plusHours(24).isBefore(appointmentDateTime)` before allowing cancellation.  
**Status:** ⏳ PENDING

### 6. Deposit Image Upload Memory and Size Limits
**Problem:** `FileStorageService.java` validates MIME/extensions but no EXIF sanitization or dimension ceilings. Large photos (10MB+) exhaust server memory.  
**Impact:** Upload failures or server latency for payment proof images.  
**Fix:** Enforce 5MB request size limit in `application.yml`; add client-side compression in `FileUpload.tsx`.  
**Status:** ⏳ PENDING

---

## 🔐 Category 2: Authentication & Security Hardening

### 7. JWT Token Refresh & Rotation
**Problem:** Access tokens lack refresh mechanism; long-lived tokens increase attack surface.  
**Fix:** Implement short-lived access tokens (15min) + rotating refresh tokens stored in HttpOnly cookies; add token blacklist for logout.  
**Status:** ⏳ PENDING

### 8. Password Reset Flow
**Problem:** No "Forgot Password" endpoint or email-based reset flow.  
**Fix:** Add `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` with time-limited, single-use tokens; integrate with email service.  
**Status:** ⏳ PENDING

### 9. Rate Limiting & Brute-Force Protection
**Problem:** Auth endpoints (`/login`, `/register`) have no rate limiting.  
**Fix:** Add Spring Boot `Bucket4j` or Redis-based rate limiting (e.g., 5 req/min per IP for auth); implement account lockout after 5 failed attempts.  
**Status:** ⏳ PENDING

### 10. CORS & Security Headers Hardening
**Problem:** Current CORS config may be permissive; missing CSP, HSTS, X-Frame-Options headers.  
**Fix:** Restrict CORS to production frontend domain; add `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.  
**Status:** ⏳ PENDING

### 11. Input Validation & XSS Prevention
**Problem:** Some DTOs lack `@Valid` + bean validation; frontend may render unsanitized user input.  
**Fix:** Add `@NotNull`, `@Size`, `@Pattern` on all DTOs; sanitize HTML in admin-facing fields (e.g., salon announcements).  
**Status:** ⏳ PENDING

---

## ☁️ Category 3: Production Infrastructure (Supabase + Render)

### 12. Supabase PostgreSQL Migration
**Problem:** Prototype uses local PostgreSQL; production needs managed Postgres with connection pooling, backups, and SSL.  
**Tasks:**
- Provision Supabase project; run Flyway migrations against Supabase
- Configure `spring.datasource.url` with `sslmode=require` and connection pooler (PgBouncer) port 6543
- Enable Supabase Point-in-Time Recovery (PITR) and daily backups
- Set up Supabase Row Level Security (RLS) policies for multi-tenancy if needed  
**Status:** ⏳ PENDING

### 13. Supabase Auth Integration (Optional - Replace Custom Auth)
**Problem:** Custom JWT auth duplicates effort; Supabase Auth provides OAuth, MFA, email verification out of the box.  
**Decision:** Evaluate migrating to Supabase Auth vs keeping custom. If migrating: remove `JwtFilter`, `AuthService`, `UserDetailsServiceImpl`; use Supabase JWT verification.  
**Status:** 🔄 UNDER REVIEW

### 14. Supabase Storage for Deposit Images
**Problem:** Local file storage (`FileStorageService`) doesn't scale; uploads lost on deploy.  
**Fix:** Migrate to Supabase Storage bucket `deposit-proofs`; generate signed URLs for upload/download; set bucket policies (max 5MB, image/*).  
**Status:** ⏳ PENDING

### 15. Render Backend Deployment
**Problem:** No production deployment pipeline for Spring Boot API.  
**Tasks:**
- Create `render.yaml` Blueprint with `web` service (Docker) + `cron` job for cleanup tasks
- Configure environment variables: `SPRING_PROFILES_ACTIVE=prod`, `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- Enable Render auto-deploy on `main` branch; set health check path `/actuator/health`
- Configure Render disk for temporary file uploads (if not using Supabase Storage)  
**Status:** ⏳ PENDING

### 16. Render Frontend Deployment (Static Site)
**Problem:** Next.js frontend needs production hosting with edge caching.  
**Tasks:**
- Create `render.yaml` static site service pointing to `frontend/out` (or use Next.js standalone output)
- Configure `RENDER_EXTERNAL_URL` for canonical URLs; set up custom domain + TLS
- Add `next.config.js` `output: 'standalone'` for Docker deployment option  
**Status:** ⏳ PENDING

### 17. Environment Variable Management
**Problem:** Secrets committed in `.env` files; no secret rotation strategy.  
**Fix:** Use Render Secret Files / Supabase Vault for: `JWT_SECRET`, `DB_PASSWORD`, `EMAIL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Document required vars in `.env.example`.  
**Status:** ⏳ PENDING

### 18. Database Connection Pooling & SSL
**Problem:** Direct connections exhaust Postgres max_connections; no SSL in prototype.  
**Fix:** Configure HikariCP with `maximumPoolSize=20` (adjust for Render plan); use Supabase PgBouncer (port 6543) with `sslmode=require`.  
**Status:** ⏳ PENDING

---

## 📧 Category 4: Email & Notifications

### 19. Transactional Email Service Integration
**Problem:** No email sending for booking confirmations, cancellations, reminders, password resets.  
**Fix:** Integrate Resend / SendGrid / Supabase Email (via Edge Functions); create templates for: booking confirmed, cancelled, rescheduled, 24hr reminder, deposit received, password reset.  
**Status:** ⏳ PENDING

### 20. Booking Reminder Cron Job
**Problem:** No automated 24-hour and 2-hour reminders before appointments.  
**Fix:** Render Cron Job (daily at 08:00 Manila) → calls `POST /api/admin/notifications/send-reminders`; checks appointments in next 24h and 2h windows.  
**Status:** ⏳ PENDING

### 21. Admin Notification for New Bookings
**Problem:** Admins don't get real-time alerts for new bookings.  
**Fix:** Email/webhook to admin on `BookingStatus.PENDING`; optionally Slack/Discord webhook.  
**Status:** ⏳ PENDING

---

## 💳 Category 5: Payments & Deposits

### 22. Payment Gateway Integration (GCash / Maya / Stripe)
**Problem:** Deposit proof is manual image upload; no automated payment verification.  
**Fix:** Integrate PayMongo (PH) or Stripe for: GCash, Maya, Card payments; create `PaymentIntent` on booking; webhook to auto-confirm deposit; fallback to manual proof upload.  
**Status:** ⏳ PENDING

### 23. Deposit Refund / Forfeiture Logic
**Problem:** No automated logic for deposit handling on cancellation/no-show.  
**Fix:** Implement: full refund if cancelled >24h; forfeit if <24h or no-show; admin override in dashboard.  
**Status:** ⏳ PENDING

### 24. Invoice / Receipt Generation
**Problem:** No PDF receipts for customers or accounting.  
**Fix:** Generate PDF on payment confirmation (iText / Flying Saucer); email attachment + download in customer portal.  
**Status:** ⏳ PENDING

---

## 📊 Category 6: Observability & Operations

### 25. Structured Logging & Log Aggregation
**Problem:** Logs are unstructured; no central log store.  
**Fix:** Add Logback JSON encoder; ship to Render Logs / Datadog / Loki; add correlation IDs (MDC) for request tracing.  
**Status:** ⏳ PENDING

### 26. Application Metrics & Alerting
**Problem:** No visibility into error rates, latency, booking conversion.  
**Fix:** Enable Micrometer + Prometheus endpoint (`/actuator/prometheus`); Grafana dashboards for: booking success rate, API latency (p50/p95/p99), active slots, DB pool usage. Alert on error rate >1% or p95 >2s.  
**Status:** ⏳ PENDING

### 27. Distributed Tracing
**Problem:** No trace context across frontend → backend → DB.  
**Fix:** Add OpenTelemetry Java agent; propagate `traceparent` header; visualize in Jaeger / Tempo.  
**Status:** ⏳ PENDING

### 28. Health Checks & Readiness Probes
**Problem:** Only basic `/actuator/health`; no DB connectivity, Supabase, email service checks.  
**Fix:** Custom `HealthIndicator` beans for: PostgreSQL, Supabase Storage, Email API, Payment Gateway. Configure Render health check path.  
**Status:** ⏳ PENDING

### 29. Error Tracking (Sentry / Rollbar)
**Problem:** Unhandled exceptions not captured; no frontend error visibility.  
**Fix:** Add Sentry SDK to Spring Boot (`sentry-spring-boot-starter`) and Next.js (`@sentry/nextjs`); configure release tracking, source maps.  
**Status:** ⏳ PENDING

---

## 🧪 Category 7: Testing & Quality Gates

### 30. Integration Test Suite (Testcontainers)
**Problem:** CI uses service container; no isolated integration tests for booking flows.  
**Fix:** Add Testcontainers for PostgreSQL + Redis in `src/test`; cover: double-booking race, cancellation cutoff, reschedule, deposit upload. Run in CI on PR.  
**Status:** ⏳ PENDING

### 31. End-to-End Tests (Playwright)
**Problem:** No automated browser tests for critical user journeys.  
**Fix:** Playwright tests for: customer booking flow, admin availability management, deposit upload, cancellation/reschedule. Run on staging deploy.  
**Status:** ⏳ PENDING

### 32. Contract Testing (Pact)
**Problem:** Frontend/backend API contract drift risk.  
**Fix:** Consumer-driven contracts with Pact; verify on each PR.  
**Status:** ⏳ PENDING

### 33. Load Testing (k6 / Gatling)
**Problem:** No capacity planning for peak booking periods.  
**Fix:** k6 script simulating 100 concurrent users booking slots; measure p95 latency, error rate, DB connection pool saturation.  
**Status:** ⏳ PENDING

---

## ♿ Category 8: Accessibility & UX Polish

### 34. WCAG 2.1 AA Compliance
**Problem:** Unknown accessibility gaps in customer portal.  
**Fix:** Audit with axe-core; fix: color contrast, focus indicators, ARIA labels, keyboard navigation, screen reader announcements for calendar.  
**Status:** ⏳ PENDING

### 35. Mobile-First Responsive Fixes
**Problem:** Calendar and admin tables may not work well on <480px.  
**Fix:** Test on iPhone SE / Android small; ensure touch targets ≥44px; horizontal scroll for tables with sticky first column.  
**Status:** ⏳ PENDING

### 36. Internationalization (i18n) - English / Tagalog
**Problem:** Hardcoded English strings; Manila salon needs Tagalog.  
**Fix:** Add `next-i18next` / `i18next` to frontend; Spring `MessageSource` for backend validation messages; locale switcher in header.  
**Status:** ⏳ PENDING

---

## 📋 Category 9: Documentation & Developer Experience

### 37. API Documentation (OpenAPI / Swagger)
**Problem:** No living API docs for frontend team or third-party integrators.  
**Fix:** Add `springdoc-openapi-starter-webmvc-ui`; annotate controllers with `@Operation`, `@Parameter`; publish at `/swagger-ui.html`; export OpenAPI JSON for Postman/TypeScript client generation.  
**Status:** ⏳ PENDING

### 38. Architecture Decision Records (ADRs)
**Problem:** Key decisions (auth, timezone, storage) undocumented.  
**Fix:** Create `docs/adr/` with records for: custom JWT vs Supabase Auth, Manila timezone strategy, Supabase Storage vs local, Render vs Railway vs Fly.io.  
**Status:** ⏳ PENDING

### 39. Runbook / Incident Response Guide
**Problem:** No ops guide for on-call.  
**Fix:** Document: common alerts & runbooks (DB pool exhausted, email failed, payment webhook down), how to scale Render, how to rollback, Supabase PITR restore steps.  
**Status:** ⏳ PENDING

### 40. Contributing Guide & Code Style
**Problem:** No `CONTRIBUTING.md`; inconsistent formatting.  
**Fix:** Add Spotless (Gradle) / Prettier (frontend) + Husky pre-commit; document branch naming, commit conventions (Conventional Commits), PR template.  
**Status:** ⏳ PENDING

---

## 🚀 Category 10: Launch Checklist (Pre-Go-Live)

| Item | Description | Status |
|------|-------------|--------|
| SSL/TLS | Custom domain + valid cert (Render auto) | ⏳ |
| DNS | `api.pretty-nails.ph` → Render; `pretty-nails.ph` → Render Static | ⏳ |
| Email | Verified sender domain (Resend/SendGrid); SPF/DKIM/DMARC | ⏳ |
| Payment | PayMongo/Stripe live mode; webhook endpoints registered | ⏳ |
| Backup | Supabase PITR enabled; test restore documented | ⏳ |
| Monitoring | Grafana dashboards + alert routes (Slack/Email/PagerDuty) | ⏳ |
| Error Tracking | Sentry DSN configured; source maps uploaded | ⏳ |
| Load Test | k6 script passes 100 VU target | ⏳ |
| Security Scan | OWASP ZAP / Trivy scan clean | ⏳ |
| Accessibility | axe-core CI gate passes | ⏳ |
| GDPR/PDPA | Data export/delete endpoints; privacy policy published | ⏳ |

---

## 📌 Legend
- ⏳ **PENDING** — Not started
- 🔄 **IN PROGRESS** — Actively working
- ⚠️ **PARTIAL** — Some work done, gaps remain
- ✅ **DONE** — Verified in production
- 🔄 **UNDER REVIEW** — Awaiting decision

---

*Last updated: 2026-11-19 | Prototype DB: Local PostgreSQL → Target: Supabase + Render*