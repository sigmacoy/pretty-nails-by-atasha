# Missing Features Task List

**Project:** Pretty Nails by Atasha  
**Status:** Prototype — ~70% complete  
**Generated:** 2026-11-13  
**Purpose:** Track gaps between current implementation and full requirements for future development.

---

## 📋 Task Categories

| Priority | Category | Tasks |
|----------|----------|-------|
| **P0** | Authentication | NextAuth + Social Login |
| **P0** | Booking & Payments | GCash Reservation Fee Flow |
| **P0** | Booking & Payments | Fixed Shop QR Payment Linking |
| **P1** | Scheduling | Hard Limits: 4 Clients/Day, 8AM–10PM |
| **P1** | Scheduling | 1-Day to 1-Month Advance Window |
| **P1** | Cancellation Policy | 8PM Cutoff + Fee Preservation |
| **P1** | No-Show Penalties | Auto-Forfeit + Account Blocking |
| **P1** | Loyalty Engine | Exact Stamp Calculation Rules |
| **P1** | Loyalty Engine | 9-Stamp Milestone → Free Nail Set |
| **P2** | Booking UX | Inspiration Photo Upload |
| **P2** | Services | Rename Categories to BIAB/Soft Gel/etc. |

---

## 🔴 P0 — Critical (Blockers for Real Operations)

### 1. NextAuth + Google/Facebook Social Login
- [ ] Add NextAuth v5 to frontend (`frontend/`)
- [ ] Configure Google & Facebook OAuth providers
- [ ] Replace JWT email/password flow with NextAuth session
- [ ] Map OAuth accounts to existing `User` + `Account` entities
- [ ] Preserve ADMIN/CUSTOMER role enforcement
- [ ] Update middleware/route guards for NextAuth session

**Files to touch:**
- `frontend/package.json` (add `next-auth`)
- `frontend/src/lib/auth.ts` (NextAuth config)
- `frontend/src/middleware.ts` (route protection)
- `pretty-nails-backend/src/main/java/com/prettynails/entity/Account.java` (OAuth mapping)

---

### 2. ₱100 GCash Reservation Fee + Proof Upload
- [ ] Add `reservationFeeProofUrl` field to `Booking` entity
- [ ] Add `reservationFeeStatus` enum: `PENDING`, `VERIFIED`, `REJECTED`, `FORFEITED`
- [ ] Create `/api/bookings/{id}/reservation-fee` endpoint (upload proof)
- [ ] Admin: verify/reject proof in `/admin/bookings`
- [ ] Customer: upload GCash screenshot in booking flow (Step 4)
- [ ] Frontend: image upload component (drag-drop, preview, compress)

**Files to touch:**
- `pretty-nails-backend/src/main/java/com/prettynails/entity/Booking.java`
- `pretty-nails-backend/src/main/java/com/prettynails/controller/BookingController.java`
- `pretty-nails-backend/src/main/java/com/prettynails/service/BookingService.java`
- `frontend/src/app/(customer)/booking/page.tsx` (add upload step)

---

### 3. Fixed Shop QR Code for Payment Linking
- [ ] Generate static GCash QR code (owner's GCash account)
- [ ] Store QR image in `frontend/public/qr/gcash-qr.png`
- [ ] Display QR in:
  - `/admin/bookings` (for walk-in verification)
  - `/loyalty` (existing stamp QR — separate from payment QR)
  - Booking confirmation page
- [ ] Admin: "Verify Payment" button links QR scan → booking record
- [ ] Backend: endpoint to record payment linked via QR scan

**Files to touch:**
- `frontend/public/qr/gcash-qr.png` (add asset)
- `frontend/src/components/PaymentQR.tsx` (new component)
- `pretty-nails-backend/src/main/java/com/prettynails/controller/PaymentController.java`

---

## 🟠 P1 — High (Core Business Rules)

### 4. Hard Limits: Max 4 Clients/Day, 8AM–10PM
- [ ] Add `MAX_CLIENTS_PER_DAY = 4` constant (configurable via settings)
- [ ] Add `OPERATING_HOURS_START = 8:00`, `OPERATING_HOURS_END = 22:00`
- [ ] Enforce in `AvailabilityService` / `BookingService`:
  - Reject booking if day already has 4 confirmed bookings
  - Reject slots outside 8AM–10PM
- [ ] Admin availability UI: show remaining slots per day
- [ ] Frontend: disable dates at capacity in calendar picker

**Files to touch:**
- `pretty-nails-backend/src/main/java/com/prettynails/service/AvailabilityService.java`
- `pretty-nails-backend/src/main/java/com/prettynails/service/BookingService.java`
- `frontend/src/app/(customer)/booking/page.tsx`
- `frontend/src/app/(admin)/admin/availability/page.tsx`

---

### 5. 1-Day to 1-Month Advance Booking Window
- [ ] Add validation: `appointmentDate >= tomorrow` AND `appointmentDate <= today.plusMonths(1)`
- [ ] Apply in both frontend calendar and backend `BookingService.create()`
- [ ] Show helper text: "Book 1 day to 1 month in advance"

**Files to touch:**
- `pretty-nails-backend/src/main/java/com/prettynails/service/BookingService.java`
- `frontend/src/app/(customer)/booking/page.tsx`

---

### 6. Cancellation Policy: 8PM Cutoff + Fee Preservation
- [ ] Add `cancellationDeadline` field to `Booking` (8PM prior evening)
- [ ] Customer cancel endpoint: check `now < cancellationDeadline`
  - If before: `reservationFeeStatus = PRESERVED` (refundable/usable)
  - If after: `reservationFeeStatus = FORFEITED`
- [ ] Admin override: "Force Cancel" bypasses deadline
- [ ] Email/notification on cancellation outcome

**Files to touch:**
- `pretty-nails-backend/src/main/java/com/prettynails/entity/Booking.java`
- `pretty-nails-backend/src/main/java/com/prettynails/controller/BookingController.java`
- `frontend/src/app/(customer)/my-bookings/page.tsx`

---

### 7. No-Show Penalties: Auto-Forfeit + Account Blocking
- [ ] Scheduled job (daily 8AM): find `PENDING`/`CONFIRMED` bookings for yesterday with no check-in
- [ ] Auto-transition to `NO_SHOW`
- [ ] Apply penalties:
  - `reservationFeeStatus = FORFEITED`
  - `totalBalanceDue = serviceTotal` (demand full payment)
  - `user.accountStatus = BLOCKED` after 2 no-shows (configurable)
- [ ] Admin: "Unblock Account" action in `/admin/customers`
- [ ] Customer: see blocked status, appeal via Facebook chat link

**Files to touch:**
- `pretty-nails-backend/src/main/java/com/prettynails/service/NoShowService.java` (new)
- `pretty-nails-backend/src/main/java/com/prettynails/scheduler/NoShowScheduler.java` (new)
- `pretty-nails-backend/src/main/java/com/prettynails/entity/User.java` (add `accountStatus`, `noShowCount`)
- `frontend/src/app/(admin)/admin/customers/page.tsx`

---

### 8. Exact Stamp Calculation Rules
**Business Logic:**
```
IF service_category IN (BIAB, SOFT_GEL_EXTENSION, GEL_PEDICURE) → 1 stamp per set
ELSE IF total_amount >= 1000 → 2 stamps
ELSE IF total_amount >= 500 → 1 stamp
ELSE → 0 stamps
```
- [ ] Create `StampCalculationService` with above logic
- [ ] Trigger on `Booking` status → `COMPLETED`
- [ ] Store breakdown: `stampsFromSets`, `stampsFromAmount`, `bonusStamps`
- [ ] Admin: test calculator in `/admin/loyalty`

**Files to touch:**
- `pretty-nails-backend/src/main/java/com/prettynails/service/StampCalculationService.java` (new)
- `pretty-nails-backend/src/main/java/com/prettynails/service/BookingService.java` (call on completion)
- `pretty-nails-backend/src/main/java/com/prettynails/entity/LoyaltyStamp.java` (add breakdown fields)

---

### 9. 9-Stamp Milestone → Free Nail Set
- [ ] Add `REWARD_STAMPS_REQUIRED = 9` constant
- [ ] Add `freeServiceReward` field to `LoyaltyCard` (service ID of free set)
- [ ] On stamp earn: if `stampCount >= 9` AND `freeServiceReward == null`:
  - Auto-assign highest-value eligible service as free reward
  - Notify customer (toast/email)
- [ ] Customer loyalty page: show "Free Nail Set Unlocked!" badge
- [ ] Admin: manual reward assignment override

**Files to touch:**
- `pretty-nails-backend/src/main/java/com/prettynails/entity/LoyaltyCard.java`
- `pretty-nails-backend/src/main/java/com/prettynails/service/LoyaltyService.java`
- `frontend/src/app/(customer)/loyalty/page.tsx`

---

## 🟡 P2 — Medium (UX Polish)

### 10. Inspiration Photo Upload at Booking
- [ ] Add `inspirationPhotos` array field to `Booking` (max 3, max 5MB each)
- [ ] Frontend: image upload in booking Step 3 (drag-drop, preview, compress)
- [ ] Backend: store in `uploads/booking-inspiration/{bookingId}/`
- [ ] Admin: view photos in `/admin/bookings/{id}`
- [ ] Customer: see uploaded photos in `/my-bookings`

**Files to touch:**
- `pretty-nails-backend/src/main/java/com/prettynails/entity/Booking.java`
- `pretty-nails-backend/src/main/java/com/prettynails/controller/UploadController.java`
- `frontend/src/app/(customer)/booking/page.tsx`
- `frontend/src/components/ImageUploader.tsx` (new/reuse)

---

### 11. Rename Service Categories to Match Requirements
| Current | Target |
|---------|--------|
| `CLEANING` | `Nail Cleaning` |
| `GEL` | `BIAB / Gel` |
| `EXTENSION` | `Soft Gel Extension` |
| `PEDICURE` | `Nail Gel Pedicure` |
| `ADDON` | `Add-ons` |

- [ ] Update `ServiceCategory` enum in backend
- [ ] Update seeded data (`DataSeeder`)
- [ ] Update frontend service display names
- [ ] Update admin service editor dropdown

**Files to touch:**
- `pretty-nails-backend/src/main/java/com/prettynails/entity/ServiceCategory.java`
- `pretty-nails-backend/src/main/java/com/prettynails/service/DataSeeder.java`
- `frontend/src/lib/constants.ts` (service categories)
- `frontend/src/app/(admin)/admin/services/page.tsx`

---

## 📦 Suggested Implementation Order

| Sprint | Focus | Tasks |
|--------|-------|-------|
| **1** | Auth & Payment Foundation | 1, 2, 3 |
| **2** | Scheduling Hard Limits | 4, 5 |
| **3** | Cancellation & No-Show Engine | 6, 7 |
| **4** | Loyalty Engine Core | 8, 9 |
| **5** | UX Polish | 10, 11 |

---

## 🔗 Related Files

- `README.md` — Project overview
- `how-to-run.md` — Local setup guide
- `docs/standalone-user-features.md` — User-facing features
- `docs/standalone-admin-features.md` — Admin features

---

## ✅ Completion Criteria

A task is **Done** when:
1. Backend implementation + unit test exists
2. Frontend integration works end-to-end
3. Admin can configure/verify in UI
4. Customer flow tested on `localhost:3000`
5. Documented in relevant `docs/*.md`

---

*This list will be updated as tasks are completed. Check off `[x]` when done.*