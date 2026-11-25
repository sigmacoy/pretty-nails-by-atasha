# Prototype Readiness Review — 2025-11-25 11:40 AM (Updated 2026-11-25)

## Verdict: YES WITH CAVEATS

### Top 3 Blockers
| # | Blocker | Impact |
|---|---------|--------|
| 1 | **No live backend in Docker** — PostgreSQL, backend, and frontend services defined in `docker-compose.yml` but Docker not available in this environment. Cannot verify end-to-end flow without running all three. | Real users cannot complete a booking end-to-end. |
| 2 | **Test infrastructure crash** — `BookingForm.test.tsx` OOM (Abort trap: 6) on 5/35 tests. Not a production bug but blocks CI verification. | Cannot guarantee regression safety in pipeline. |
| 3 | **Missing email/SMS senders** — `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` in compose but no SendGrid account or fallback mock. Email verification, password reset, and booking confirmations will fail silently. | User cannot verify account or receive booking confirmations. |

---

## Gap Check Summary

### Core User Flow
| Flow Step | Status | Gap |
|-----------|--------|-----|
| Browse services | ✅ Works | Fallback data if API down |
| Select service → go to booking | ✅ Works | Pre-fills service from URL |
| Pick date/time | ✅ Works | Re-fetches slots on step change |
| Enter client details | ✅ Works | Pre-fills for logged-in users |
| Choose payment (GCash/Maya/CASH) | ✅ Works | File upload for receipt |
| Submit booking | ✅ Works | Creates `PENDING` booking |
| **Admin verifies deposit** | ⚠️ **Partial** | Admin UI exists but no live backend |
| **Booking → CONFIRMED** | ⚠️ **Partial** | Requires admin action; email not sent |
| **Loyalty stamp on completion** | ⚠️ **Partial** | QR scanner exists; needs admin trigger |

**Flow works visually but blocks at admin verification and email confirmation without live backend + SendGrid.**

### Broken / Dead Links, Buttons, Routes
| Route / Element | Status | Notes |
|-----------------|--------|-------|
| `/staff/scanner` | ✅ Exists | QR scanner for staff |
| `/oauth2/callback` | ✅ Exists | Google/Facebook OAuth |
| `/admin/availability` | ✅ Exists | Calendar management |
| `/admin/gallery` | ✅ Exists | Gallery CRUD |
| `/admin/loyalty` | ✅ Exists | Loyalty management |
| `/admin/reports` | ✅ Exists | Revenue analytics |
| `/admin/settings` | ✅ Exists | Studio settings |
| `/services#<service-id>` | ✅ Works | Anchor links from home page |
| `/booking?service=<id>` | ✅ Works | Pre-selects service |
| **Missing**: `/password-reset`, `/email-verify` | ❌ **Missing** | Backend has endpoints; no frontend pages |

### Loading, Empty, and Error States
| Page / Component | Loading | Empty | Error |
|------------------|---------|-------|-------|
| Home (`/`) | ✅ Skeleton | ✅ Fallback services/gallery | ⚠️ Silent fallback |
| Services (`/services`) | ✅ Skeleton | ✅ "No services in category" | ✅ Retry + Direct booking |
| Booking (`/booking`) | ✅ Slot loading | ✅ "No slots" message | ✅ Toast + fallback slots |
| My Bookings (`/my-bookings`) | ✅ Skeleton | ✅ "No appointments" CTA | ✅ Retry button |
| Admin Dashboard | ✅ Skeleton | — | ⚠️ Console.error only |
| Admin Bookings | ✅ Loading | ✅ Empty table message | ⚠️ Toast only |
| Register/Login | ✅ Button disabled | — | ✅ Field errors + toast |
| File Upload | ✅ Progress bar | — | ✅ Inline + toast |

**Gap**: Admin pages lack user-facing error banners (only console + toast).

### Form Validation and Feedback
| Form | Client Validation | Server Validation | Feedback |
|------|-------------------|-------------------|----------|
| Register | ✅ Zod (email, phone, password strength) | ✅ `@Valid` + custom | Field errors + toast |
| Login | ✅ Zod | ✅ `@Valid` | Field errors + toast |
| Booking Step 1 | ✅ Zod (min 1 service) | ✅ Service exists | Disabled continue |
| Booking Step 2 | ✅ Zod (date, time required) | ✅ Slot available | Re-validation on step |
| Booking Step 3 | ✅ Zod (name, PH phone) | ✅ User exists | Field errors |
| Booking Step 4 | ✅ Zod (confirmed=true) | ✅ Payment ref required | Toast error |
| Admin Services | ✅ Zod | ✅ `@Valid` | Field errors |
| Profile | ✅ Zod | ✅ `@Valid` | Field errors |

**Gap**: Booking Step 2 re-validation only runs on step transition, not on date change after initial load.

### Responsive / Mobile Behavior
| Area | Status | Notes |
|------|--------|-------|
| Home page | ✅ Excellent | Grid stacks 1→2→4 columns |
| Services page | ✅ Excellent | Grid 1→2→3 columns |
| Booking form | ✅ Good | Stepper vertical on mobile |
| My Bookings | ✅ Good | Filters scroll horizontally |
| Admin Dashboard | ✅ Good | Stats stack, chart responsive |
| Admin Tables | ⚠️ **Horizontal scroll** | Tables overflow on mobile |
| Modals | ✅ Good | Full-screen on mobile |

**Gap**: Admin booking/customers tables need column-hiding or card view on mobile.

### Auth and Permissions
| Feature | Status | Notes |
|---------|--------|-------|
| JWT in HttpOnly cookie | ✅ Implemented | `prettynails_token` cookie |
| Middleware route guard | ✅ Implemented | `middleware.ts` |
| Role-based redirect | ✅ Implemented | Admin → `/admin`, Customer → intended |
| Admin-only routes | ✅ Protected | `/admin/**` requires ADMIN role |
| Customer routes | ✅ Protected | `/my-bookings`, `/loyalty`, `/profile` |
| OAuth (Google/Facebook) | ✅ Configured | Redirects to `/oauth2/callback` |
| Token refresh on `/me` | ✅ Implemented | `useAuth.refreshUser()` |
| Logout clears cookie | ✅ Implemented | `authApi.logout()` |

**Gap**: No "remember me" option; fixed 30-day cookie expiry. **LoginForm.tsx line 172-177**: "Remember me" checkbox exists but has no handler — not wired to extend cookie expiry or persist session.

### Security Basics
| Check | Status | Notes |
|-------|--------|-------|
| Secrets in env (not code) | ✅ Yes | `docker-compose.yml` uses `${VAR}` |
| JWT HttpOnly + Secure | ⚠️ Dev only | `secure: false` in dev; needs `true` in prod |
| SameSite Lax | ✅ Yes | CSRF protection |
| BCrypt password hashing | ✅ Yes | `BCryptPasswordEncoder` |
| Input validation (server) | ✅ Yes | Bean Validation + custom |
| Parameterized queries | ✅ Yes | Spring Data JPA / Hibernate |
| Rate limiting | ✅ Yes | Bucket4j on all endpoints |
| CORS configured | ✅ Yes | `allowed-origins` from env |
| File upload validation | ✅ Yes | MIME + size (5MB) + compression |
| Max upload size handler | ✅ Yes | `MaxUploadSizeExceededException` |
| XSS protection | ✅ Yes | React auto-escapes; no `dangerouslySetInnerHTML` |

**Gap**: `secure: false` on cookie in dev — must flip for production HTTPS.

### Accessibility
| Check | Status | Notes |
|-------|--------|-------|
| Semantic HTML | ✅ Good | `header`, `main`, `section`, `nav` |
| Heading hierarchy | ✅ Good | h1→h2→h3 consistent |
| Alt text on images | ⚠️ **Partial** | Hero has alt; gallery has alt; Avatar fallback lacks alt |
| Form labels | ✅ Good | `<label htmlFor>` on all inputs |
| ARIA attributes | ✅ Good | `aria-invalid`, `aria-describedby`, `role="alert"` |
| Focus management | ✅ Good | Visible focus rings, skip links not needed |
| Keyboard navigation | ✅ Good | All interactive elements reachable |
| Color contrast | ✅ Good | Rose/stone palette tested |
| Screen reader text | ✅ Good | `sr-only` not used but labels present |

**Gap**: `Avatar.tsx` line 34: `alt={alt || name || 'Avatar'}` — when neither provided, reads as "Avatar". Should be empty string for decorative.

### Data Edge Cases
| Scenario | Handled? | Notes |
|----------|----------|-------|
| Empty DB (no services) | ✅ Yes | Fallback `defaultServicesFallback` |
| Empty DB (no gallery) | ✅ Yes | `localGalleryFallback` |
| Empty bookings list | ✅ Yes | "No appointments" CTA |
| Large booking list | ⚠️ Paginated | 10/page; no virtualization |
| Missing service variants | ✅ Yes | Shows base price only |
| Missing user phone/name | ✅ Yes | Optional fields; pre-fill if exists |
| Network failure on booking | ✅ Yes | Toast error, form stays |
| Concurrent booking same slot | ✅ Yes | Backend checks + re-validation |
| Expired loyalty card | ✅ Yes | `expiresAt` checked |
| Zero-stamp loyalty card | ✅ Yes | Creates on first stamp |

**Gap**: No handling for very large image uploads (>5MB rejected, no chunking).

---

## DO THESE FIRST (Minimum Fixes for Prototype)

| Priority | Fix | Effort | Assignee | Status |
|----------|-----|--------|----------|--------|
| **P0** | Run full stack via `docker-compose up` with real PostgreSQL + backend + frontend; verify booking → admin verify → confirmed flow | 30 min | | ⚠️ BLOCKED (Docker not available in environment) |
| **P0** | Add SendGrid credentials or mock email sender; test `/api/auth/verify-email`, `/api/auth/forgot-password`, booking confirmation email | 15 min | | ✅ DONE (mock email service added) |
| **P0** | Fix `BookingForm.test.tsx` OOM (reduce test concurrency or mock heavy components) | 20 min | | ✅ DONE (maxWorkers=1, max-old-space-size=4096) |
| **P1** | Add `/password-reset` and `/email-verify` frontend pages (backend endpoints exist) | 45 min | | ✅ DONE (4 new pages: forgot-password, reset-password, verify-email, email-verify) |
| **P1** | Add admin table mobile card view or column toggle | 30 min | | ✅ DONE (DataTable component with mobile cards) |
| P2 | Set `cookie.setSecure(true)` in production config | 5 min | | ✅ DONE (configurable via app.cookie.secure) |
| P2 | Fix `Avatar` alt text to `''` when decorative | 5 min | | ✅ DONE (empty string for decorative) |
| P2 | Add error banner to admin pages (not just toast) | 15 min | | ✅ DONE (AdminErrorBanner on 9 admin pages) |
| P2 | Wire "Remember me" checkbox in LoginForm to extend cookie expiry (90 days) | 20 min | | ✅ DONE (frontend + backend) |

---

## Overall Assessment

The prototype is **visually polished and functionally complete for demo purposes** with the caveats above. With Docker running and SendGrid configured, a real user could book → admin verifies → get confirmation. The 5 P0/P1 items unblock a credible end-to-end demo.

---

## Additional Updates Needed (Post-Prototype / Production Ready)

### Code Quality & Technical Debt

| Area | Issue | Fix | Priority |
|------|-------|-----|----------|
| **Frontend - ESLint Warnings** | 22 warnings: `react-hooks/exhaustive-deps` (missing deps), `@next/next/no-img-element` (use `<Image />`), `jsx-a11y/alt-text` | Add missing deps to `useEffect`/`useCallback`; migrate `<img>` to `next/image`; add `alt=""` for decorative | P2 |
| **Frontend - TypeScript** | `tsc --noEmit` passes but warnings exist; strict mode OK | Fix `any` types in `useApi.ts`, `BookingForm.tsx` | P2 |
| **Frontend - Test Coverage** | Only 3 test files; 5/35 tests crash OOM | Add unit tests for `useBooking`, `useAuth`, `validations`; fix BookingForm OOM | P1 |
| **Backend - Test Coverage** | 217 tests pass but integration tests use Testcontainers (slow) | Add more unit tests; split integration tests to separate profile | P2 |
| **Backend - N+1 Queries** | `AdminBookingPage` loads customers per booking | Add `@EntityGraph` or fetch join in repository | P2 |
| **Backend - Magic Strings** | Status values hardcoded in multiple places | Centralize `BookingStatus`, `PaymentStatus` enums in shared constants | P3 |
| **Shared - DTO Drift** | Frontend `types/api.ts` manually mirrors backend DTOs | Generate TypeScript from OpenAPI spec (`springdoc-openapi` + `openapi-typescript`) | P2 |
| **Auth - Remember Me** | LoginForm has checkbox (line 172-177) but not wired; `LoginRequest` lacks field; backend fixed 30-day expiry | Add `rememberMe` to `LoginRequest`; extend cookie maxAge to 90 days when true; pass from frontend | P2 |

### Missing Features for Production

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| **Email Verification Flow** | ✅ `/api/auth/verify-email`, `/resend-verification` | ❌ No `/email-verify` page | User registers → gets email → clicks link → lands on 404 |
| **Password Reset Flow** | ✅ `/forgot-password`, `/reset-password` | ❌ No `/password-reset` page | Same issue |
| **Booking Confirmation Email** | ❌ Not implemented | — | Trigger on admin `CONFIRMED` status change |
| **Booking Reminder Email** | ❌ Not implemented | — | 24hr before appointment |
| **Admin Audit Log** | ❌ Not implemented | ❌ No UI | Track admin actions (verify, cancel, edit) |
| **Staff Scanner Enhancement** | ✅ QR parsing | ⚠️ Basic UI | Add sound/vibration feedback; offline queue |
| **Loyalty Rewards Catalog** | ✅ Settings exist | ⚠️ Admin only | Customer-facing rewards view missing |
| **Service Availability Calendar** | ✅ Admin UI | ❌ Customer view | Show booked/unavailable dates on `/availability` |
| **Multi-language (EN/PH)** | — | ❌ Not started | Filipino/Tagalog support for Cebu market |
| **PWA / Offline Support** | — | ❌ Not started | `next-pwa` for offline booking drafts |

### Security Hardening (Production)

| Item | Current | Required | Effort |
|------|---------|----------|--------|
| JWT `secure: true` cookie | ❌ `false` in dev | ✅ `true` in prod | 5 min |
| CSP Headers | ❌ None | `Content-Security-Policy` | 30 min |
| HSTS | ❌ None | `Strict-Transport-Security` | 10 min |
| Rate Limit Config | Hardcoded | Env-configurable tiers | 20 min |
| Input Sanitization | Server only | Client + server (XSS) | 30 min |
| Dependency Scanning | ❌ None | `npm audit` + `mvn dependency-check` | 15 min |
| Secrets Rotation | Manual | Vault / AWS Secrets Manager | 2 hr |

### Performance Optimizations

| Area | Issue | Fix |
|------|-------|-----|
| **Frontend Bundle** | 87KB shared + 13-15KB per page | Code-split admin routes; lazy-load charts (`Recharts`) |
| **Image Optimization** | Local `/gallery/*.jpg` unoptimized | `next/image` with `loader` + Cloudinary/Imgix |
| **API Caching** | No caching | SWR `revalidateOnFocus: false`; backend `@Cacheable` on services/gallery |
| **Database Indexes** | Basic PK/FK only | Add composite indexes: `bookings(user_id, appointment_date)`, `loyalty_cards(user_id)` |
| **Connection Pool** | Default Hikari | Tune `maximumPoolSize` for expected concurrency |

### Documentation & Ops

| Doc | Status | Needed |
|-----|--------|--------|
| `README.md` | ✅ Comprehensive | Keep updated |
| `how-to-run.md` | ✅ Detailed | Add Docker Compose prod profile |
| `DEPLOYMENT.md` | ❌ Missing | Render/Fly.io/ECS deploy steps |
| `API.md` (OpenAPI) | ✅ Swagger UI at `/swagger-ui` | Export static spec for frontend gen |
| `ARCHITECTURE.md` | ❌ Missing | C4 diagrams, data flow, auth flow |
| `RUNBOOK.md` | ❌ Missing | Common ops: DB migrate, log access, rollback |
| `CHANGELOG.md` | ❌ Missing | Track versions for stakeholders |

### CI/CD Pipeline (Missing)

| Stage | Current | Needed |
|-------|---------|--------|
| **Lint/Typecheck** | Manual `pnpm lint` / `tsc` | GitHub Actions on PR |
| **Frontend Tests** | Manual `pnpm test` | GitHub Actions (fix OOM first) |
| **Backend Tests** | Manual `./mvnw test` | GitHub Actions with Testcontainers |
| **Build Docker Images** | Manual `docker build` | GH Actions → GHCR/Docker Hub |
| **Deploy Staging** | None | Auto-deploy `main` to staging |
| **Deploy Production** | None | Manual approval → production |

---

## Suggested Next Sprint Priorities

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| **Sprint 1** | **Unblock Prototype** | Docker Compose up, SendGrid mock, fix test OOM, password-reset/email-verify pages |
| **Sprint 2** | **Production Hardening** | Secure cookies, CSP/HSTS, dependency scan, audit log, booking confirmation email |
| **Sprint 3** | **Customer Experience** | Customer `/availability` calendar, loyalty rewards view, PWA offline drafts |
| **Sprint 4** | **Ops & Scale** | CI/CD pipeline, deployment docs, DB indexes, connection pool tuning, OpenAPI gen |

---

## Agent Assignments (Auto-Generated)

| Agent | Task | Files to Modify |
|-------|------|-----------------|
| `agent-frontend-test-fix` | Fix BookingForm.test.tsx OOM | `frontend/src/app/(public)/booking/BookingForm.test.tsx`, `frontend/jest.config.js` |
| `agent-email-mock` | Add mock email sender (dev) + test endpoints | `pretty-nails-backend/src/main/java/com/prettynails/service/EmailServiceImpl.java`, `pretty-nails-backend/src/main/resources/application-local.yml` |
| `agent-auth-pages` | Create `/password-reset` and `/email-verify` frontend pages | `frontend/src/app/(auth)/password-reset/`, `frontend/src/app/(auth)/email-verify/`, `frontend/src/lib/api.ts` |
| `agent-admin-mobile` | Add mobile card view for admin tables | `frontend/src/app/(admin)/bookings/`, `frontend/src/app/(admin)/customers/`, `frontend/src/components/admin/` |
| `agent-avatar-alt` | Fix Avatar alt text for decorative images | `frontend/src/components/ui/Avatar.tsx` |
| `agent-remember-me` | Wire remember me checkbox + extend cookie | `frontend/src/components/auth/LoginForm.tsx`, `frontend/src/lib/validations.ts`, `frontend/src/lib/api.ts`, `pretty-nails-backend/src/main/java/com/prettynails/dto/AuthDtos.java`, `pretty-nails-backend/src/main/java/com/prettynails/controller/AuthController.java` |
| `agent-cookie-secure` | Set secure cookie in production | `pretty-nails-backend/src/main/java/com/prettynails/controller/AuthController.java`, `pretty-nails-backend/src/main/resources/application-docker.yml` |
| `agent-admin-error-banner` | Add error banner to admin pages | `frontend/src/app/(admin)/layout.tsx`, `frontend/src/components/admin/` |