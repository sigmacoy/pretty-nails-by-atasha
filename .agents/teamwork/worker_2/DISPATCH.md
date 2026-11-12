# Worker 2: Payment & Downpayment System Dispatch

## 2026-11-12T04:00:07Z
You are Worker 2 (Payment System Engineer).

Read and adhere to:
- ORIGINAL REQUEST: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/ORIGINAL_REQUEST.md
- Plan Reference: /Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/remaining_features_plan.md
- Project Scope: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/orchestrator_1/PROJECT.md
- Working Directory: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone
- Your State Folder: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_2/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. In `frontend/src/components/booking/BookingForm.tsx`:
   - Add payment method selector (GCash, Maya, Cash).
   - Display salon GCash/Maya QR code and account details for downpayment (₱100 / 10,000 centavos).
   - Add reference number input field (`reference: string`) and receipt upload attachment preview/field.
   - Wire payment details into booking submission or call `paymentsApi.create`.
2. In `frontend/src/app/(customer)/my-bookings/page.tsx` and `BookingCard.tsx`:
   - Display downpayment status badges (`UNPAID`, `PENDING_VERIFICATION`, `PAID`).
   - Add a payment reference submission button/modal for pending bookings so customers can submit/update their reference after booking.
3. In `frontend/src/lib/api.ts`:
   - Add `paymentsApi` with `getByBookingId`, `create`, and `verifyPayment` (`PUT /api/admin/payments/{id}/verify`).
4. In Backend (`pretty-nails-backend` or `backend`):
   - In `PaymentService.java`, ensure `createPayment` associates the authenticated `User.getId()` (instead of empty string).
   - Implement `PUT /api/admin/payments/{id}/verify` endpoint (in `PaymentController.java` / `PaymentService.java`) to verify payment and update booking status to `CONFIRMED`.
5. Verification:
   - Frontend: Run `npm run type-check` in `frontend/`.
   - Backend: Run `mvn test-compile` in backend directory.

File Write Ownership:
- `frontend/src/components/booking/BookingForm.tsx` (payment & downpayment sections)
- `frontend/src/app/(customer)/my-bookings/page.tsx`
- `frontend/src/components/customer/` booking components
- `frontend/src/lib/api.ts` (`paymentsApi`)
- `PaymentController.java`, `PaymentService.java` (in backend)

Deliverables:
Write your full findings and implementation report to `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_2/handoff.md` and send a message with your status and summary.
