# Basis on CODE-REVIEW.md — Terminal 2 (Sonnet, Medium Effort)

## Terminal 2 Launch Instructions (Parallel Worktree)

Run this in **Terminal 2** from the repository root so it works in an isolated worktree without colliding with Terminal 1 (`pretty-nails-backend/`):

```bash
cd /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone
claude -w fix-frontend --model sonnet
```

Inside Claude Code CLI, set effort to medium:
```text
/effort medium
```

> **Alternative manual git worktree (if you prefer explicit branches):**
> ```bash
> git worktree add ../app-dev-wt-frontend -b fix/frontend
> cd ../app-dev-wt-frontend
> claude --model sonnet
> ```

---

## Prompt to Paste into Terminal 2 (Sonnet — Medium Effort)

```text
Read `docs/CODE-REVIEW.md` first — specifically the **Prototype & Database Constraints**, **Implementation Decisions (Confirmed)**, and **Sections 2, 3, 4, 5, 6, and 12** (Frontend Configuration, Lib, Hooks, Types, Pages, Components, Frontend Unit Tests, and E2E Tests).

Your job is to implement ALL `Critical`, `High`, `Medium`, and `Low` fixes in `frontend/` and `tests/e2e/` ONLY.
DO NOT modify `pretty-nails-backend/` (that is being handled in parallel in Terminal 1).

---

### 1. Mandatory Constraints & Decisions (Do Not Violate)
1. **Prototype Credentials:** Keep `admin` / `admin` login working in `LoginForm.tsx` and `validations.ts` (`loginSchema` must continue accepting username `"admin"` without requiring `@`).
2. **Prototype Registration & Login Smoothness:**
   - Check `RegisterForm.tsx` and `src/lib/auth.tsx`: after successful `register`, store the returned JWT token (`localStorage`) and user state (or redirect smoothly to `/my-bookings` / `/`), so a newly registered customer is logged in right away and can sign out and log back in cleanly.
3. **JWT Auth Delivery:** Keep **`Authorization: Bearer` header + `localStorage`** for prototype simplicity (`src/lib/api.ts`, `src/lib/auth.tsx`). Move `src/app/middleware.ts` to `src/middleware.ts` and handle route protection cleanly.
4. **Booking Slot Capacity:** **1 active booking per time slot**. In `BookingForm.tsx` and `useBooking.ts`, use `availabilityApi.getSlots(date)` / slot availability directly and fix the 60–90m service duration filtering bug so longer services are not rejected against 30m slot `endTime`.
5. **OAuth2 Login:** Ensure `frontend/src/app/(auth)/oauth2/callback/page.tsx` validates any `sessionStorage` redirect target (prevent open redirects) and handles token exchange/storage cleanly.
6. **Admin UI Features:**
   - **Dashboard Revenue Chart (`admin/page.tsx`):** Replace hardcoded `dailyRevenueData` mock values by wiring it to `reportsApi.getRevenue(...)` / `GET /api/admin/reports/revenue`.
   - **Customer Blocking (`admin/customers/page.tsx`):** Replace client-only blocking simulation with a real API call (`PATCH /api/admin/customers/${id}/block` or `adminApi.toggleCustomerBlock(id)`), and add matching TypeScript types in `src/types/` and `src/lib/api.ts`.

---

### 2. Detailed Execution Plan by Section

#### Phase A — Frontend Core, Config, Hooks & Utils (Section 2)
1. **Middleware & Next Config:**
   - Move `frontend/src/app/middleware.ts` to `frontend/src/middleware.ts` (currently completely disabled!). Fix unverified JWT decoding / missing `exp` check in middleware.
   - Fix `next.config.js`: add `output: 'standalone'` (required by Dockerfile) and replace hardcoded `http://localhost:8080` rewrite with an env-driven backend URL.
2. **Hooks, API Client & Utils:**
   - Fix `src/hooks/useApi.ts`: `useQuery` currently only runs on mount, so filter/search/pagination/period updates in Bookings, Customers, Gallery, Loyalty, and Reports never re-fetch. Add dependency/query-key support so `useQuery` re-fetches when parameters change.
   - Fix `src/hooks/useBooking.ts`: fix variant pricing and catalog race-condition bugs.
   - Fix `src/lib/utils.ts`: fix Asia/Manila date parsing and timezone bugs.
   - Replace isolated `useAdminErrors()` local `useState` with a shared React Context in `src/app/(admin)/layout.tsx` so `AdminErrorBanner` actually displays errors from child pages.

#### Phase B — Admin, Auth, Customer, Public & Staff Pages (Sections 3 & 4)
1. **Admin Pages (Section 3):**
   - `admin/page.tsx`: wire Dashboard revenue chart to `reportsApi.getRevenue(...)` instead of hardcoded `dailyRevenueData`.
   - `admin/customers/page.tsx`: wire customer blocking to `PATCH /api/admin/customers/${id}/block` instead of client-only state.
   - Ensure `Bookings`, `Customers`, `Gallery`, `Loyalty`, and `Reports` pages re-fetch on filter/search/pagination/period changes via the updated `useQuery`.
2. **Auth Pages (Sections 3 & 5):**
   - Validate `redirect` query params and `sessionStorage` redirect targets in `LoginForm.tsx`, `RegisterForm.tsx`, and `(auth)/oauth2/callback/page.tsx` to prevent Open Redirects (only allow relative `/` paths).
   - Ensure `RegisterForm.tsx` + `src/lib/auth.tsx` log the user in smoothly on registration.
3. **Customer, Public & Staff Pages (Section 4):**
   - `BookingForm.tsx`:
     - Upload Step 4 payment receipt files on submit (currently silently discarded) and revoke object URLs to prevent memory leaks.
     - Fix `filteredSlots` rejecting 60–90m services when comparing full duration `endTime` against 30m slot `endTime`.
     - Fix circular `fetchAvailableSlots`/`startTime` re-fetch overwriting user selections.
     - Support variant-less service selection and preserve form state across auth redirects.
   - `loyalty/page.tsx`: remove `adminApi.getSettings()` call (causes 401/403 for customers).
   - `gallery/page.tsx`: re-fetch on search/category changes.
   - `(staff)/scanner/page.tsx`: add auth/RBAC guard so unauthenticated/unauthorized users cannot access the staff scanner.

#### Phase C — Components & UI Primitives (Sections 5 & 6)
1. **Admin & Auth Components (Section 5):**
   - `BookingDetailsDrawer.tsx`: validate `inspirationUrl` scheme (`http:`/`https:` only) to block `javascript:` Stored XSS.
   - `VerifyEmailForm.tsx`: guard against React StrictMode double-verification race condition on single-use tokens.
   - `QrScannerModal.tsx`: add `BarcodeDetector` fallback and clean up `getUserMedia` stream on unmount/close.
   - `bookings/types.ts`: fix blind error-swallowing fallback in `transitionBookingStatus`.
   - `CustomersTable.tsx`: add responsive `hidden` classes to `headerClassName` to match cell visibility.
2. **Booking, Customer, Layout, Loyalty, Staff & UI Components (Section 6):**
   - `loyalty/QRScanner.tsx`: fix `<video ref={videoRef}>` conditional mount deadlock (mount video element or attach stream in `useEffect` after `hasPermission`), clean up `MediaStream` on unmount, and fix stale `isScanning` closure.
   - `staff/QRScanner.tsx`: fix stale `lastScannedCode` closure (debounce duplicate QR scans) and remove `pointer-events-none` blocking Start/Stop Scanning clicks.
   - `PaymentQRCode.tsx`: render real GCash/Maya QR data instead of a static decorative SVG.
   - `customer/BookingCard.tsx`: fix hardcoded 3h browser-local-TZ reschedule `endTime` calculation (use Asia/Manila + actual service duration).
   - `Header.tsx`: reset `isMenuAnimating` on mobile menu close.
   - `AdminLayout.tsx` / `AdminSidebar.tsx`: fix sidebar overlapping main content below `lg` breakpoint.
   - `Modal.tsx`: fix overlapping `z-50` wrapper blocking backdrop clicks.
   - `PhoneInput.tsx`: fix `pattern="[0-9]*"` failing native validation when formatted with spaces.

#### Phase D — Frontend Unit Tests, Mocks & E2E Tests (Section 12)
1. **Frontend Unit Tests & Mocks:**
   - `BookingForm.test.tsx`: replace tautological API-mock tests with real `BookingForm` component rendering tests.
   - `BookingCard.test.tsx`: fix local-OS timezone getters for Asia/Manila 24h cutoff tests and replace non-assertive `typeof ... === 'boolean'` checks with real assertions.
   - `utils.test.ts`: fix UTC+8 day-rollover bug in `createManilaDateTimeFromUTC` and remove leftover debug tests.
   - `jest.setup.ts`: stop masking all React `Warning:` console errors.
   - Fix `useApi.ts` and `html5-qrcode.ts` mocks (shared mutable state / missing `Html5QrcodeScanner.render`).
2. **E2E Tests (`tests/e2e/`):**
   - Replace placeholder `assert.ok(true)` checks (`T1-77`, `T1-78`, `T2-80`).
   - Test `emoji-detector.mjs` directly instead of inline-duplicate regexes.
   - Fix `lucide-users` vs PascalCase `Users` check (`T4-04`) and unchecked `indexOf` slices that can pass vacuously.

---

### 3. Verification
Run frontend typecheck, unit tests, and production build after your edits:
```bash
cd frontend && pnpm tsc --noEmit && pnpm test && pnpm build
```
And if applicable:
```bash
cd .. && node tests/e2e/run-all.mjs
```
Do not finish until typecheck, unit tests, and build pass cleanly.
```
