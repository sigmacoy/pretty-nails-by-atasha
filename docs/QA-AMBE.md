# QA Validation Guide — Mr. Ambe
## Booking & Scheduling + Loyalty Stamp/Notes + Shared Auth

**Project**: Pretty Nails Salon Booking System  
**Domain Owner**: Mr. Ambe  
**Total Flows**: 10 | **Total Steps**: 50  
**Environment**: Local PostgreSQL, Manila Timezone (Asia/Manila), Seeded Test Data  
**Test Accounts**: `customer@test.com` (CUSTOMER), `admin@test.com` (OWNER), `staff@test.com` (ADMIN)

---

## Flow 1: Customer Books Appointment (Happy Path)

| Step | Type | Verification |
|------|------|--------------|
| 1.1 | **Precondition** | Seeded: 3 services (Manicure ₱500, Gel ₱800, Extensions ₱1500), availability for next 7 days, 30-min slots 09:00–18:00. Test customer logged in. Manila timezone active. |
| 1.2 | **Action** | Navigate to `/booking` → Select service "Gel" → Pick tomorrow date → Choose 10:00 slot → Upload inspiration photo (optional) → Click "Book Appointment" → Confirm modal. |
| 1.3 | **Expected Visualization** | ✅ Loading spinner on submit → Success toast "Appointment booked!" → Redirect to `/my-bookings` → New row appears: Service=Gel, Date=tomorrow, Time=10:00, Status=PENDING, Downpayment=₱400 (50%). |
| 1.4 | **Expected API/DB** | `POST /api/bookings` → 201 Created → `{id, status:"PENDING", appointmentDate:"2026-11-26T10:00:00", totalAmount:800, downpaymentAmount:400}` → `booking` table: row inserted with `customer_id=test_customer`, `status=PENDING`, `downpayment_amount=400`. |
| 1.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 2: Customer Reschedules Appointment (≥24 Hours Before)

| Step | Type | Verification |
|------|------|--------------|
| 2.1 | **Precondition** | Existing booking: ID=101, tomorrow 10:00, status=PENDING. Target slot: day after tomorrow 14:00 available. Customer logged in. |
| 2.2 | **Action** | Go to `/my-bookings` → Click "Reschedule" on booking #101 → Select new date/time → Confirm. |
| 2.3 | **Expected Visualization** | ✅ Modal opens with current booking details → Calendar shows available slots → Success toast "Rescheduled successfully" → Row updates: new date/time, status remains PENDING. |
| 2.4 | **Expected API/DB** | `PUT /api/bookings/101/reschedule` → 200 OK → `{id:101, appointmentDate:"2026-11-27T14:00:00", status:"PENDING"}` → `booking` table: `appointment_date` updated, `updated_at` refreshed. |
| 2.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 3: Customer Cancels Appointment (≥24 Hours Before)

| Step | Type | Verification |
|------|------|--------------|
| 3.1 | **Precondition** | Existing booking: ID=102, day after tomorrow 10:00, status=CONFIRMED, downpayment paid. Customer logged in. |
| 3.2 | **Action** | Go to `/my-bookings` → Click "Cancel" on booking #102 → Confirm cancellation in modal. |
| 3.3 | **Expected Visualization** | ✅ Confirmation modal shows "Cancel appointment? Downpayment will be refunded." → Success toast "Appointment cancelled, refund initiated" → Row status changes to CANCELLED, disabled actions. |
| 3.4 | **Expected API/DB** | `POST /api/bookings/102/cancel` → 200 OK → `{id:102, status:"CANCELLED", refundStatus:"INITIATED"}` → `booking` table: `status=CANCELLED`, `payment` table: new row `status=REFUNDED`. |
| 3.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 4: Admin Manages Availability (Add Blocked Day + Custom Interval)

| Step | Type | Verification |
|------|------|--------------|
| 4.1 | **Precondition** | Admin logged in. No existing blocked days. Default schedule: Mon–Sat 09:00–18:00, 30-min slots. |
| 4.2 | **Action** | Navigate to `/admin/availability` → Click "Add Blocked Day" → Select 2026-12-25 (Christmas) → Save → Click "Add Custom Interval" → Date=2026-12-24, Start=09:00, End=13:00 → Save. |
| 4.3 | **Expected Visualization** | ✅ Blocked day appears in red on calendar grid → Custom interval shows as shortened day (09:00–13:00 only) → Toast "Availability updated" → Customer `/availability` page reflects changes immediately. |
| 4.4 | **Expected API/DB** | `POST /api/admin/availability/blocked` → 201 → `{id, date:"2026-12-25", reason:"Christmas"}` → `POST /api/admin/availability/intervals` → 201 → `{id, date:"2026-12-24", startTime:"09:00", endTime:"13:00"}` → `availability` table: 2 new rows, `type=BLOCKED` and `type=CUSTOM`. |
| 4.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 5: Admin Verifies Deposit Proof & Confirms Booking

| Step | Type | Verification |
|------|------|--------------|
| 5.1 | **Precondition** | Booking ID=103, status=PENDING, downpayment proof uploaded (GCash screenshot). Admin logged in. |
| 5.2 | **Action** | Go to `/admin/bookings` → Click "View Proof" on booking #103 → Image modal opens → Click "Verify Deposit" → Confirm. |
| 5.3 | **Expected Visualization** | ✅ Proof image loads in modal (zoomable) → Success toast "Deposit verified, booking confirmed" → Row status: PENDING → CONFIRMED → "Verify" button replaced with "Confirmed" badge. |
| 5.4 | **Expected API/DB** | `POST /api/admin/bookings/103/verify-deposit` → 200 → `{id:103, status:"CONFIRMED", payment:{status:"VERIFIED", verifiedAt:"2026-11-25T...", verifiedBy:admin_id}}` → `booking.status=CONFIRMED`, `payment.status=VERIFIED`, `payment.verified_by=admin_id`. |
| 5.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 6: Customer Uploads Deposit Proof (GCash Screenshot)

| Step | Type | Verification |
|------|------|--------------|
| 6.1 | **Precondition** | Booking ID=104, status=PENDING, downpayment ₱400 due. Customer logged in. Valid GCash screenshot file (<5MB, JPG/PNG). |
| 6.2 | **Action** | Go to `/my-bookings` → Click "Upload Proof" on booking #104 → Select file → Upload. |
| 6.3 | **Expected Visualization** | ✅ File picker opens → Upload progress bar → Success toast "Proof uploaded, awaiting verification" → Row shows "Proof Uploaded" badge, "Upload Proof" button disabled. |
| 6.4 | **Expected API/DB** | `POST /api/bookings/104/deposit-proof` (multipart) → 200 → `{bookingId:104, proofUrl:"/uploads/deposits/...", status:"PENDING_VERIFICATION"}` → `booking.downpayment_proof_url` populated, `payment.proof_url` populated, `payment.status=PENDING_VERIFICATION`. |
| 6.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 7: Negative — Double-Booking Attempt (Same Slot)

| Step | Type | Verification |
|------|------|--------------|
| 7.1 | **Precondition** | Slot: 2026-11-26 10:00, Service=Gel. Booking #105 already CONFIRMED for this slot. Second customer logged in. |
| 7.2 | **Action** | Second customer goes to `/booking` → Selects Gel → Picks 2026-11-26 → Tries to select 10:00 slot. |
| 7.3 | **Expected Visualization** | ✅ Slot 10:00 shows as "Booked" (disabled, grayed out) → Cannot be selected → Toast "This slot is no longer available" if attempted via API. |
| 7.4 | **Expected API/DB** | `POST /api/bookings` with same slot → 409 Conflict → `{error:"SLOT_UNAVAILABLE", message:"Slot already booked"}` → No new row in `booking` table. |
| 7.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 8: Negative — Cancel <24 Hours Before Appointment

| Step | Type | Verification |
|------|------|--------------|
| 8.1 | **Precondition** | Booking ID=106, tomorrow 10:00 (within 24h), status=CONFIRMED. Customer logged in. |
| 8.2 | **Action** | Go to `/my-bookings` → Click "Cancel" on booking #106 → Confirm. |
| 8.3 | **Expected Visualization** | ❌ Modal shows "Cannot cancel: less than 24 hours before appointment. Downpayment will be forfeited." → Cancel button disabled or shows warning → No status change. |
| 8.4 | **Expected API/DB** | `POST /api/bookings/106/cancel` → 400 Bad Request → `{error:"CUTOFF_VIOLATION", message:"Cancellation not allowed within 24 hours"}` → `booking` table unchanged. |
| 8.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 9: Edge — Manila Timezone Boundary (Midnight Booking)

| Step | Type | Verification |
|------|------|--------------|
| 9.1 | **Precondition** | Server time: 2026-11-25 23:30 UTC (2026-11-26 07:30 Manila). Availability for 2026-11-26 exists. Customer logged in. |
| 9.2 | **Action** | Navigate to `/availability` → Verify date shows "Tomorrow, Nov 26" → Select 09:00 slot → Book. |
| 9.3 | **Expected Visualization** | ✅ Date label shows "Tomorrow, November 26, 2026" (Manila date) → Slot grid shows 09:00 available → Booking succeeds with `appointmentDate="2026-11-26T09:00:00+08:00"`. |
| 9.4 | **Expected API/DB** | `GET /api/availability?date=2026-11-26` → 200 → slots for Manila 2026-11-26 → `POST /api/bookings` → 201 → `appointment_date` stored as `2026-11-26 09:00:00` (Asia/Manila). |
| 9.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 10: Shared Auth — Customer Login + Profile View

| Step | Type | Verification |
|------|------|--------------|
| 10.1 | **Precondition** | Test customer exists: `customer@test.com` / `password123`. Manila timezone. |
| 10.2 | **Action** | Go to `/login` → Enter credentials → Submit → Redirected to `/my-bookings` → Click profile avatar → Navigate to `/profile`. |
| 10.3 | **Expected Visualization** | ✅ Login form → Success toast "Welcome back!" → Redirect → Profile page shows: Name, Email, Role=CUSTOMER, Loyalty Card link, no admin links. |
| 10.4 | **Expected API/DB** | `POST /api/auth/login` → 200 → `{accessToken, refreshToken, user:{id, email, name, role:"CUSTOMER"}}` → `session` table: new row `user_id=customer_id`, `ip_address`, `user_agent`. |
| 10.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 11: Loyalty — Auto-Stamp on Booking Completion

| Step | Type | Verification |
|------|------|--------------|
| 11.1 | **Precondition** | Booking ID=107, status=CONFIRMED, appointment date today. Customer has LoyaltyCard (stamps=4/10). Admin logged in. |
| 11.2 | **Action** | Admin goes to `/admin/bookings` → Click "Complete" on booking #107 → Confirm. |
| 11.3 | **Expected Visualization** | ✅ Toast "Appointment completed, stamp added" → Booking status: COMPLETED → Customer `/loyalty` page shows stamps=5/10, progress bar 50%. |
| 11.4 | **Expected API/DB** | `POST /api/admin/bookings/107/complete` → 200 → `{booking:{status:"COMPLETED"}, loyaltyStamp:{id, stampType:"SERVICE", loyaltyCardId}}` → `booking.status=COMPLETED`, `loyalty_stamp` table: new row `loyalty_card_id=customer_card`, `booking_id=107`, `stamp_type=SERVICE`. |
| 11.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 12: Loyalty — Staff Adds Customer Note During Appointment

| Step | Type | Verification |
|------|------|--------------|
| 12.1 | **Precondition** | Booking ID=108, status=CONFIRMED, customer has profile. Admin/Staff logged in. |
| 12.2 | **Action** | Admin goes to `/admin/bookings` → Click "View" on booking #108 → "Add Note" → Enter: "Prefers rounded shape, allergic to acetone" → Save. |
| 12.3 | **Expected Visualization** | ✅ Note modal saves → Toast "Customer note added" → Note appears in booking detail → Customer `/profile` shows "Staff Notes" section with entry. |
| 12.4 | **Expected API/DB** | `POST /api/admin/customers/{customerId}/notes` → 201 → `{id, customerId, note:"Prefers rounded shape...", createdBy:admin_id}` → `customer_note` table: new row. |
| 12.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 13: Admin Views Audit Log (Shared Auth)

| Step | Type | Verification |
|------|------|--------------|
| 13.1 | **Precondition** | Multiple actions performed: booking created, deposit verified, note added. Admin logged in. |
| 13.2 | **Action** | Navigate to `/admin/settings` → "Audit Log" tab → Filter by entity "Booking", action "CREATED". |
| 13.3 | **Expected Visualization** | ✅ Table shows: Timestamp, Entity=Booking, Action=CREATED, User=customer@test.com, OldValue=null, NewValue={...} → Pagination works → Export CSV button. |
| 13.4 | **Expected API/DB** | `GET /api/admin/audit-logs?entityType=Booking&action=CREATED` → 200 → `[{id, entityType:"Booking", entityId:101, action:"CREATED", userId:customer_id, timestamp}]` → `audit_log` table rows match. |
| 13.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 14: Negative — Reschedule to Past Date

| Step | Type | Verification |
|------|------|--------------|
| 14.1 | **Precondition** | Booking ID=109, status=PENDING, appointment tomorrow. Customer logged in. |
| 14.2 | **Action** | Go to `/my-bookings` → Click "Reschedule" → Use browser dev tools to force date picker to yesterday → Submit. |
| 14.3 | **Expected Visualization** | ❌ Date picker disables past dates → If bypassed: toast "Cannot reschedule to past date" → Modal stays open. |
| 14.4 | **Expected API/DB** | `PUT /api/bookings/109/reschedule` with past date → 400 → `{error:"INVALID_DATE", message:"Appointment date must be in future"}` → No DB change. |
| 14.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 15: Negative — Upload Invalid Deposit Proof (Wrong File Type)

| Step | Type | Verification |
|------|------|--------------|
| 15.1 | **Precondition** | Booking ID=110, status=PENDING. Customer logged in. Test file: `document.pdf` (5MB). |
| 15.2 | **Action** | Go to `/my-bookings` → Click "Upload Proof" → Select `document.pdf` → Upload. |
| 15.3 | **Expected Visualization** | ❌ File input rejects .pdf (accept="image/*") → If forced via API: toast "Invalid file type. Only JPG/PNG allowed" → No upload progress. |
| 15.4 | **Expected API/DB** | `POST /api/bookings/110/deposit-proof` → 400 → `{error:"INVALID_FILE_TYPE", message:"Only image files allowed"}` → No file stored, `booking.downpayment_proof_url` remains null. |
| 15.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 16: Edge — Concurrent Reschedule Attempts (Two Admins)

| Step | Type | Verification |
|------|------|--------------|
| 16.1 | **Precondition** | Booking ID=111, status=CONFIRMED. Two admin browsers open. Target slot: 2026-11-27 15:00 (available). |
| 16.2 | **Action** | Admin A opens reschedule modal for #111 → Admin B opens same → Admin A submits 15:00 → Admin B submits 15:00 (1 second later). |
| 16.3 | **Expected Visualization** | ✅ Admin A: Success toast → Admin B: Error toast "Slot just booked by another admin" → Booking shows Admin A's new time. |
| 16.4 | **Expected API/DB** | Admin A: `PUT /api/admin/bookings/111/reschedule` → 200 → Admin B: same → 409 → `{error:"SLOT_TAKEN"}` → Only one `booking` row updated. |
| 16.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 17: Edge — Booking on Last Day of Availability Window

| Step | Type | Verification |
|------|------|--------------|
| 17.1 | **Precondition** | Availability seeded until 2026-12-31. Today: 2026-12-30. Customer logged in. |
| 17.2 | **Action** | Go to `/booking` → Calendar shows Dec 30, 31 only → Select Dec 31 17:00 (last slot) → Book. |
| 17.3 | **Expected Visualization** | ✅ Calendar ends at Dec 31 → Slot 17:00 available → Booking succeeds → `/my-bookings` shows Dec 31 appointment. |
| 17.4 | **Expected API/DB** | `GET /api/availability?date=2026-12-31` → 200 → slots → `POST /api/bookings` → 201 → `appointment_date=2026-12-31T17:00:00`. |
| 17.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 18: Admin Sends Notification (Reminder/Status Update)

| Step | Type | Verification |
|------|------|--------------|
| 18.1 | **Precondition** | Booking ID=112, status=CONFIRMED, appointment in 2 hours. Admin logged in. |
| 18.2 | **Action** | Go to `/admin/bookings` → Click "Notify" on #112 → Select "Reminder: 2 hours before" → Send. |
| 18.3 | **Expected Visualization** | ✅ Toast "Notification sent" → Notification icon shows on customer header → Customer `/my-bookings` shows bell badge. |
| 18.4 | **Expected API/DB** | `POST /api/admin/notifications/send` → 201 → `{id, bookingId:112, type:"REMINDER_2H", sentAt}` → `notification` table: new row `user_id=customer_id`, `type=REMINDER_2H`, `read=false`. |
| 18.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 19: Negative — Unauthorized Access to Admin Booking Management

| Step | Type | Verification |
|------|------|--------------|
| 19.1 | **Precondition** | Customer logged in (no admin role). Direct URL access attempt. |
| 19.2 | **Action** | Navigate directly to `/admin/bookings` via browser address bar. |
| 19.3 | **Expected Visualization** | ❌ Redirect to `/login` or `/403` → Toast "Access denied: Admin privileges required" → No admin UI elements visible. |
| 19.4 | **Expected API/DB** | `GET /api/admin/bookings` → 403 Forbidden → `{error:"FORBIDDEN", message:"Requires ADMIN role"}` → No data returned. |
| 19.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 20: Edge — Expired JWT Token During Booking Flow

| Step | Type | Verification |
|------|------|--------------|
| 20.1 | **Precondition** | Customer logged in, JWT expired (manually set expiry to past). Mid-booking on `/booking` page. |
| 20.2 | **Action** | Try to submit booking form with expired token. |
| 20.3 | **Expected Visualization** | ❌ API returns 401 → Frontend intercepts → Redirects to `/login` with `?redirect=/booking` → Preserves form data in sessionStorage. |
| 20.4 | **Expected API/DB** | `POST /api/bookings` → 401 Unauthorized → `{error:"TOKEN_EXPIRED"}` → No booking created. |
| 20.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Summary Checklist

| Flow | Description | Steps | Status |
|------|-------------|-------|--------|
| 1 | Customer Books Appointment | 5 | ☐ |
| 2 | Customer Reschedules (≥24h) | 5 | ☐ |
| 3 | Customer Cancels (≥24h) | 5 | ☐ |
| 4 | Admin Manages Availability | 5 | ☐ |
| 5 | Admin Verifies Deposit | 5 | ☐ |
| 6 | Customer Uploads Deposit Proof | 5 | ☐ |
| 7 | Double-Booking Attempt | 5 | ☐ |
| 8 | Cancel <24h (Cutoff) | 5 | ☐ |
| 9 | Manila Timezone Boundary | 5 | ☐ |
| 10 | Customer Login + Profile | 5 | ☐ |
| 11 | Auto-Stamp on Completion | 5 | ☐ |
| 12 | Staff Adds Customer Note | 5 | ☐ |
| 13 | Admin Views Audit Log | 5 | ☐ |
| 14 | Reschedule to Past Date | 5 | ☐ |
| 15 | Invalid Deposit File Type | 5 | ☐ |
| 16 | Concurrent Reschedule | 5 | ☐ |
| 17 | Last Day Availability Window | 5 | ☐ |
| 18 | Admin Sends Notification | 5 | ☐ |
| 19 | Unauthorized Admin Access | 5 | ☐ |
| 20 | Expired JWT During Booking | 5 | ☐ |

**Total: 20 Flows × 5 Steps = 100 Verification Steps**  
**Note**: Flows 11–12 cover Loyalty (Bacalla split: stamp-on-complete + customer notes). Flows 10, 13, 19–20 cover Shared Auth (User, Account, AuditLog, Session).

---

**QA Engineer**: _______________  
**Date**: _______________  
**Overall Result**: ☐ PASS / ☐ FAIL