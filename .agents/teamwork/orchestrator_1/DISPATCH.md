## 2026-11-12T03:58:05Z

Execute the approved implementation plan in `remaining_features_plan.md` across parallel domain workers to implement all remaining core salon features:

- **Worker 1 (Admin Bookings Management):** Move `frontend/src/app/(admin)/bookings/page.tsx` to `frontend/src/app/(admin)/admin/bookings/page.tsx` to resolve the 404 route error. Implement the Booking Details Drawer/Modal (customer info, selected variants, notes, inspiration preview, and payment reference), status transition actions (Confirm, Complete, Cancel), and quick filter tabs.
- **Worker 2 (Payment & Downpayment System):** Add GCash/Maya QR display, payment method selector, and reference number input to `BookingForm.tsx`. In `my-bookings`, add downpayment status badges and a payment reference submission button for pending bookings. Add `paymentsApi` to `frontend/src/lib/api.ts`, associate authenticated `userId` in `PaymentService.java`, and implement `PUT /api/admin/payments/{id}/verify`.
- **Worker 3 (Auth & Profile Backend APIs):** Implement `PUT /api/auth/profile` (name, phone, nickname, image) and `POST /api/auth/change-password` (with BCrypt password verification) in `AuthController.java` and `AuthService.java` to connect the existing frontend `/profile` forms.
- **Worker 4 (QR Stamping & Loyalty Redemption):** In Admin Bookings, add a Completion QR Code modal (`BOOKING:<bookingId>`) displayed when an appointment is marked COMPLETED so customers can scan with `/loyalty`. In `BookingForm.tsx`, add a loyalty reward redemption toggle (10 stamps = free service) that discounts the booking.
- **Worker 5 (File & Image Upload):** Implement a file upload endpoint `POST /api/upload` (multipart/form-data with size/format validation) for booking inspiration photos and payment receipt uploads.

**Final Verification:** Verify frontend build (`npm run type-check` and `npm run build`), verify backend compilation (`mvn test-compile`), and validate the full customer booking -> payment reference -> admin confirmation -> QR stamping workflow.
