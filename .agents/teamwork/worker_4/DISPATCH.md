## 2026-11-12T04:17:08Z
You are Worker 4 (Loyalty & QR Engineer).

Read and adhere to:
- ORIGINAL REQUEST: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/ORIGINAL_REQUEST.md
- Plan Reference: /Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/remaining_features_plan.md
- Project Scope: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/orchestrator_1/PROJECT.md
- Working Directory: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone
- Your State Folder: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_4/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context:
Worker 1 completed the Admin Bookings page (`frontend/src/app/(admin)/admin/bookings/page.tsx` and `BookingDetailsDrawer.tsx`), and Worker 2 completed the Payment System in `BookingForm.tsx`.
Now you will implement the QR Stamping and Loyalty Redemption lifecycle.

Your Tasks:
1. Admin Completion QR Code Modal:
   - Create `frontend/src/components/admin/CompletionQRModal.tsx` (using `qrcode.react` or SVG QR renderer, displaying payload `BOOKING:<bookingId>`).
   - When an appointment is marked `COMPLETED` in Admin Bookings (`frontend/src/app/(admin)/admin/bookings/page.tsx` and `BookingDetailsDrawer.tsx`), automatically display the Completion QR Code modal (or provide an explicit "Show Completion QR" button for completed bookings).
   - Display clear instructions for the customer to scan the QR code with their `/loyalty` scanner to claim their visit stamp.
2. Loyalty Reward Redemption in Booking Form:
   - In `frontend/src/components/booking/BookingForm.tsx` (and `frontend/src/app/(public)/booking/BookingForm.tsx` if mirrored):
     - Query customer loyalty card status (using `loyaltyApi.getMyCard()` or equivalent if user is authenticated).
     - If customer has >= 10 stamps, display a prominent redemption toggle: "Redeem 10 Stamps for a Free Service Discount".
     - When toggled, apply the loyalty discount to the total price / downpayment and pass `redeemLoyaltyReward: true` (or discount breakdown) to the booking submission.
     - Ensure the backend handles or preserves the loyalty discount / redemption on booking creation and confirmation (e.g. In `BookingService.java` or `LoyaltyService.java` when booking is confirmed).
3. Verification:
   - Run `npm run type-check` in `frontend/`.
   - Run `mvn test-compile` in backend directory (`pretty-nails-backend/`).
   - Run loyalty and booking backend tests if applicable.

File Write Ownership:
- `frontend/src/components/admin/CompletionQRModal.tsx`
- Hooking into `frontend/src/app/(admin)/admin/bookings/page.tsx` & `BookingDetailsDrawer.tsx`
- `frontend/src/components/booking/BookingForm.tsx` (loyalty redemption section)
- Backend loyalty/booking service if redemption parameter handling is needed

Deliverables:
Write your full findings and implementation report to `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_4/handoff.md` and send a message with your status and summary.
