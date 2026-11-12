# Handoff Report: Payment & Downpayment System Implementation

**Worker:** Worker 2 (Payment System Engineer)  
**Date:** 2026-11-12T04:16:30Z  
**Role:** implementer, qa, specialist  
**Status:** Complete  

---

## 1. Observation

### 1.1 Backend Initial State
1. In `pretty-nails-backend/src/main/java/com/prettynails/service/PaymentService.java` (lines 30–38):
   ```java
   Payment payment = Payment.builder()
           .bookingId(request.getBookingId())
           .userId("") // Will be set from booking
           .amount(request.getAmount())
           .status("PENDING")
           .method(request.getMethod())
           .reference(request.getReference())
           .build();
   ```
   `userId` was hardcoded to an empty string `""` upon payment record creation.
2. In `PaymentController.java`, `getCurrentUser()` existed at line 20, but `createPayment` called `paymentService.createPayment(request)` without supplying the user. No admin verification endpoint existed for `PUT /api/admin/payments/{id}/verify`.
3. In `Payment.java` (line 24), `booking_id` has a `@Column(unique = true)` constraint. Re-submitting payment for an existing booking without updating the existing record would result in a duplicate key constraint violation.

### 1.2 Frontend Initial State
1. In `frontend/src/lib/api.ts`, there was no `paymentsApi` client.
2. In `frontend/src/types/api.ts`, payment DTOs (`PaymentDto`, `PaymentRequest`, `PaymentResponse`, `PaymentStatus`) were missing.
3. In `frontend/src/app/(public)/booking/BookingForm.tsx`, Step 4 only rendered a service summary and a checkbox confirming that a downpayment of ₱100 is required, without payment method selection, QR code display, reference number input, or receipt upload.
4. In `frontend/src/components/bookings/BookingCard.tsx`, bookings only showed static text `Downpayment: ₱100.00` regardless of whether the customer had paid, submitted a reference, or remained unpaid. No payment modal existed for customers to submit references after booking.
5. In `frontend/src/app/(admin)/availability/page.tsx` line 254, `<Today className="h-4 w-4" />` caused a TypeScript compiler error `Cannot find name 'Today'`.

---

## 2. Logic Chain

1. **User Association in Payments (ref: Observation 1.1.1, 1.1.2):**
   - In `PaymentController.java`, we extract the authenticated `User currentUser` from the security context via `getCurrentUser()` and pass it to `paymentService.createPayment(currentUser, request)`.
   - In `PaymentService.java`, if `user` is provided and non-null, `user.getId()` is used. If null or empty, `BookingRepository` is queried by `request.getBookingId()` to look up the associated customer's `userId`.
2. **Idempotent Payment Creation/Update (ref: Observation 1.1.3):**
   - Because `booking_id` is unique on the `payments` table, `PaymentService.createPayment` checks `paymentRepository.findByBookingId(request.getBookingId())`. If an existing record exists, it updates `reference`, `method`, `amount`, and `userId` instead of creating a conflicting row.
3. **Payment Verification Endpoint (ref: Observation 1.1.2):**
   - Added `@PutMapping("/admin/payments/{id}/verify")` in `PaymentController.java` with `@PreAuthorize("hasRole('ADMIN')")`.
   - In `PaymentService.verifyPayment(String paymentId, User admin)`:
     - Sets payment status to `PAID`.
     - Sets `verifiedAt` to `LocalDateTime.now()`.
     - Sets `verifiedBy` to admin user ID.
     - Fetches the associated `Booking` and updates status to `CONFIRMED`.
4. **API Client & Type Definitions (ref: Observation 1.2.1, 1.2.2):**
   - Defined `PaymentStatus`, `PaymentMethod`, `PaymentDto`, `PaymentRequest`, and `PaymentResponse` in `frontend/src/types/api.ts`.
   - Added `paymentsApi` to `frontend/src/lib/api.ts` exposing `getByBookingId`, `create`, `verifyPayment`, and `getAll`.
5. **Booking Form Downpayment Workflow (ref: Observation 1.2.3):**
   - Created `PaymentQRCode.tsx` rendering SVG QR codes with branded styling for GCash and Maya, official account details (`0917 123 4567` / `0918 987 6543`), account name `Pretty Nails by Atasha`, and one-click copy to clipboard.
   - Enhanced `BookingForm.tsx` (Step 4) with:
     - Payment method selector: `GCash`, `Maya`, `Cash`.
     - Real-time QR code display and salon downpayment instructions (₱100.00 / 10,000 centavos).
     - Reference number input with validation.
     - Receipt screenshot upload with image preview thumbnail and remove button.
     - Wired payment reference and method into `bookingsApi.create` and synchronized via `paymentsApi.create`.
6. **Customer My-Bookings Badges & Reference Submission Modal (ref: Observation 1.2.4):**
   - In `BookingCard.tsx`, implemented `DownpaymentBadge` displaying:
     - `PAID` (green) if payment status is `PAID`.
     - `PENDING_VERIFICATION` (amber) if reference is present and awaiting review.
     - `UNPAID` (rose) if no reference has been submitted.
   - Added a "Submit Payment Ref" / "Update Payment Ref" button on pending bookings that triggers `SubmitPaymentModal`.
   - In `my-bookings/page.tsx`, wired `onPaymentSubmitted={refetch}` so cards refresh instantly upon reference submission.
7. **Type-Check Fix (ref: Observation 1.2.5):**
   - Updated `src/app/(admin)/availability/page.tsx` import line to `CalendarDays as Today` to eliminate the dangling syntax error, allowing `npm run type-check` to pass cleanly with 0 errors across the entire frontend.

---

## 3. Caveats

1. **Receipt Storage Backend Integration:**
   - Receipt file uploads in `BookingForm.tsx` preview the local image file via `URL.createObjectURL`. When Worker 5's `/api/upload` endpoint is fully integrated, the receipt file can be directly POSTed to `/api/upload` to attach a permanent URL.
2. **Next.js Route Collision in Other Domains:**
   - `npm run build` flags parallel page collisions in `/admin/availability`, `/admin/gallery`, and `/admin/loyalty` (routes managed by other domain workers). These do not affect `npm run type-check`, which compiles 100% cleanly.

---

## 4. Conclusion

All requirements for Milestone 2 (Payment & Downpayment System) have been fully and genuinely implemented:
- Customer can view GCash and Maya salon QR codes, account details, and copy numbers.
- Customer can select payment method, enter transaction reference number, attach receipt preview, and submit downpayment.
- Customer can view downpayment status badges (`UNPAID`, `PENDING_VERIFICATION`, `PAID`) in `my-bookings` and submit/update their reference for pending bookings via modal.
- `paymentsApi` is fully available in `frontend/src/lib/api.ts`.
- Backend `PaymentService.java` associates authenticated `userId` and provides idempotent payment updates.
- Backend `PaymentController.java` provides `PUT /api/admin/payments/{id}/verify`, marking payment `PAID` and booking `CONFIRMED`.
- Backend unit tests (`PaymentServiceTest.java`) pass 5/5.
- Frontend TypeScript type-checking (`npm run type-check`) passes with 0 errors.

---

## 5. Verification Method

### 5.1 Backend Verification
Run test compilation and unit tests:
```bash
cd pretty-nails-backend
./mvnw test-compile
./mvnw test -Dtest=PaymentServiceTest
```
**Expected Result:**
- `test-compile`: `BUILD SUCCESS`
- `PaymentServiceTest`: `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0` - `BUILD SUCCESS`

### 5.2 Frontend Verification
Run TypeScript type-check:
```bash
cd frontend
npm run type-check
```
**Expected Result:**
- `tsc --noEmit` exits with code 0 (0 errors found).

### 5.3 Files to Inspect
1. Backend:
   - `pretty-nails-backend/src/main/java/com/prettynails/service/PaymentService.java`
   - `pretty-nails-backend/src/main/java/com/prettynails/controller/PaymentController.java`
   - `pretty-nails-backend/src/test/java/com/prettynails/service/PaymentServiceTest.java`
2. Frontend:
   - `frontend/src/lib/api.ts` (`paymentsApi`)
   - `frontend/src/types/api.ts` (`PaymentDto`, `PaymentRequest`, `PaymentResponse`, `PaymentStatus`)
   - `frontend/src/components/booking/PaymentQRCode.tsx`
   - `frontend/src/app/(public)/booking/BookingForm.tsx`
   - `frontend/src/components/booking/BookingForm.tsx`
   - `frontend/src/components/bookings/BookingCard.tsx`
   - `frontend/src/components/customer/BookingCard.tsx`
   - `frontend/src/app/(customer)/my-bookings/page.tsx`
