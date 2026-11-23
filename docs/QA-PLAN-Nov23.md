# QA Issues Fix Plan - November 23, 2026

Based on the QA findings from `docs/QA-Nov20-10am.md`, this document outlines the implementation plan for all remaining issues.

---

## Issue Summary

| # | Issue | Type | Priority | Status |
|---|-------|------|----------|--------|
| 1 | Admin redirect to dashboard on sign-in | Frontend | ✅ FIXED | Done |
| 2 | Admin bookings: Client Name shows UUID, Service shows garbled text | Frontend + Backend | High | ✅ FIXED |
| 3 | Admin loyalty: Owner account shows in loyalty list | Backend + Frontend | High | ✅ FIXED |
| 4 | Details card redundant at admin/bookings | Frontend | Medium | ✅ FIXED |
| 5 | Pre-fill booking form for logged-in customers (non-editable) | Frontend | High | ✅ FIXED |
| 6 | Duplicate "admin" text on landing page | Frontend | Medium | ✅ FIXED |
| 7 | Phone input should only accept digits | Frontend | Medium | ✅ FIXED |
| 8 | Notification bar blocks icon view | Frontend | Medium | ✅ FIXED |
| 9 | Loyalty: 9 stamps = 1 free (should be 10) | Backend + Frontend | High | ✅ FIXED |
| 10 | Remove In-person reservation payment method | Frontend + Backend | Medium | ✅ FIXED |
| 11 | Booking not saved when creating account after selection | Frontend + Backend | High | ✅ FIXED |
| 12 | Submit button disabled/gray if checkbox unchecked | Frontend | Medium | ✅ FIXED |
| 13 | Auto-calculate end time from session length | Frontend | Medium | ✅ FIXED |

---

## Detailed Implementation Plan

### Issue #2: Admin Bookings - Client Name & Service Display

**Problem**: Client Name shows `Customer #b609c8` (truncated UUID) and Service shows garbled characters with UUID fragments.

**Root Cause**: 
- Frontend `BookingsTable` uses `customerMap` but fallback shows truncated UUID
- Service names not properly mapped from `BookingDto.services[].service.name`

**Files to Modify**:
- `frontend/src/components/admin/bookings/BookingsTable.tsx` - Fix customer name display and service column
- `frontend/src/components/admin/bookings/types.ts` - Ensure `BookingDetailsData` includes service names

**Frontend Changes**:
1. In `BookingsTable`, use `customerMap[booking.userId]?.name` with proper fallback
2. Extract service names from `booking.services.map(s => s.service?.name).join(', ')`
3. Remove garbled UUID display from service column

---

### Issue #3: Admin Loyalty - Filter Out Owner/Admin Accounts

**Problem**: Owner's account (Ma'am Atasha) appears in loyalty list with "0/10 stamps" - doesn't make sense for admin.

**Root Cause**: `AdminService.getCustomers()` returns all CUSTOMER role users, but `LoyaltyService.getAllLoyaltyCards()` fetches ALL loyalty cards without filtering out ADMIN users.

**Files to Modify**:
- `pretty-nails-backend/src/main/java/com/prettynails/service/LoyaltyService.java` - `getAllLoyaltyCards()` method
- `pretty-nails-backend/src/main/java/com/prettynails/service/AdminService.java` - `getCustomers()` already filters by role

**Backend Changes**:
1. In `LoyaltyService.getAllLoyaltyCards()`, join with UserRepository to filter out users with role `ADMIN`
2. Or add a `where user.role != 'ADMIN'` clause in the query

**Frontend Changes** (if needed):
- `frontend/src/app/(admin)/admin/loyalty/page.tsx` - Verify no admin cards displayed

---

### Issue #4: Redundant Details Card at Admin Bookings

**Problem**: Details card/drawer is redundant or confusing.

**Files to Modify**:
- `frontend/src/app/(admin)/admin/bookings/page.tsx` - Remove or simplify `BookingDetailsDrawer`
- `frontend/src/components/admin/BookingDetailsDrawer.tsx` - Simplify or remove

**Frontend Changes**:
1. Evaluate if `BookingDetailsDrawer` adds value beyond the table
2. Option A: Remove drawer entirely, rely on table + inline actions
3. Option B: Keep but simplify to only show critical info not in table
4. Recommended: Remove drawer, add "View" action that navigates to a detail page or expands row

---

### Issue #5: Pre-fill Booking Form for Logged-in Customers

**Problem**: When logged-in customer books, name/email/phone should be pre-filled and non-editable.

**Files to Modify**:
- `frontend/src/app/(public)/booking/BookingForm.tsx` - `BookingStep3` component
- `frontend/src/lib/auth.tsx` - Use `useAuth()` to get current user

**Frontend Changes**:
1. In `BookingStep3`, check `isAuthenticated` and `user` from `useAuth()`
2. Pre-fill `name`, `phone` from `user.name`, `user.phone`
3. Make fields `readOnly` or `disabled` when pre-filled
4. Email field: Add email display (read-only) since it's not in current form
5. Update validation schema to not require these fields when pre-filled

---

### Issue #6: Duplicate Admin Text on Landing Page

**Problem**: Header shows "admin" badge AND "ADMIN" in user menu - redundant.

**Files to Modify**:
- `frontend/src/components/layout/Header.tsx` - User menu display

**Frontend Changes**:
1. In user dropdown (lines 147-152), remove the role badge since it's shown in the header avatar area
2. Or consolidate: show role only once in the dropdown header
3. Keep customer side unchanged (issue says customer side is perfect)

---

### Issue #7: Phone Input Only Digits

**Problem**: Phone input accepts alphabets.

**Files to Modify**:
- `frontend/src/components/ui/Input.tsx` - Add phone-specific input mode
- `frontend/src/lib/validations.ts` - Strengthen phone validation
- `frontend/src/app/(public)/booking/BookingForm.tsx` - Phone input in `BookingStep3`

**Frontend Changes**:
1. Create a `PhoneInput` component or add `inputMode="numeric"` and `pattern="[0-9]*"` to phone inputs
2. Add `onKeyDown` handler to prevent non-digit input (allow backspace, delete, arrows)
3. Update Zod schema: `phone: z.string().regex(/^[\d\s\-+()]{10,}$/)` 
4. Auto-format phone number (e.g., `0917 123 4567`)

---

### Issue #8: Notification Bar Blocks Icon

**Problem**: Toaster (top-right) blocks user avatar/icon in header.

**Files to Modify**:
- `frontend/src/app/layout.tsx` - Toaster position

**Frontend Changes**:
1. Change Toaster position from `top-right` to `top-center` or `bottom-right`
2. Or add offset: `toastOptions={{ position: 'top-right', offset: '80px' }}`
3. Recommended: `position="top-center"` avoids header conflicts entirely

---

### Issue #9: Loyalty Calculation - 9 vs 10 Stamps

**Problem**: "Dapat man diay 9 stamps = 1 free stamps" - loyalty card shows wrong threshold.

**Root Cause**: 
- Backend `LoyaltyService` hardcodes 10 stamps for reward (`requiredStamps(10)` in line 313)
- Frontend `AdminLoyaltyPage` hardcodes `REWARD_THRESHOLD = 10` (line 76)
- But `LoyaltySettingsDto` has configurable `stampsPerService`, `stampsPerAmount`, `amountThreshold`
- Need to verify if reward threshold should be configurable or fixed at 10

**Files to Modify**:
- `pretty-nails-backend/src/main/java/com/prettynails/service/LoyaltyService.java` - Line 313
- `frontend/src/app/(admin)/admin/loyalty/page.tsx` - Line 76
- `frontend/src/components/customer/LoyaltyCard.tsx` - Customer-facing display

**Backend Changes**:
1. Add `rewardThreshold` to `LoyaltySettingsDto` (default 10)
2. Use setting in `addStampViaQrByBookingId` instead of hardcoded 10
3. Return `requiredStamps` from settings in `StampResponse`

**Frontend Changes**:
1. Fetch loyalty settings in admin loyalty page
2. Use dynamic threshold instead of hardcoded `REWARD_THRESHOLD = 10`
3. Update customer loyalty card to show correct threshold

---

### Issue #10: Remove In-Person Reservation Payment Method

**Problem**: Remove "Studio Counter" / "CASH" payment option.

**Files to Modify**:
- `frontend/src/app/(public)/booking/BookingForm.tsx` - `BookingStep4` payment method buttons
- `pretty-nails-backend/src/main/java/com/prettynails/dto/PaymentDtos.java` - PaymentMethod enum
- `pretty-nails-backend/src/main/java/com/prettynails/entity/Payment.java` - PaymentMethod enum

**Frontend Changes**:
1. Remove "CASH" / "Studio Counter" button from payment method selection (lines 1482-1503)
2. Remove cash notice block (lines 1645-1655)
3. Default to GCash, keep Maya as alternative

**Backend Changes**:
1. Remove `CASH` from `PaymentMethod` enum
2. Update validation to only accept `GCASH` | `MAYA`

---

### Issue #11: Booking Not Saved When Creating Account After Selection

**Problem**: User selects booking → clicks sign up → creates account → booking not saved.

**Root Cause**: Booking selection state (service, date, time) lost during auth redirect.

**Files to Modify**:
- `frontend/src/app/(public)/booking/BookingForm.tsx` - Persist selection to localStorage/URL
- `frontend/src/app/(auth)/register/page.tsx` - Restore selection after registration
- `frontend/src/app/(auth)/login/page.tsx` - Restore selection after login
- `pretty-nails-backend/src/main/java/com/prettynails/controller/AuthController.java` - Return redirect URL
- `pretty-nails-backend/src/main/java/com/prettynails/service/BookingService.java` - Handle booking for newly created user

**Frontend Changes**:
1. In `BookingForm`, save booking draft to `localStorage` on each step change
2. On auth modal open, store current state
3. On register/login pages, check for saved draft and pre-fill
4. After successful auth, redirect back to booking with restored state

**Backend Changes**:
1. Ensure `/auth/register` returns user + token, frontend handles redirect
2. Booking creation already requires auth, so flow works if state restored

---

### Issue #12: Submit Button Gray/Disabled if Checkbox Unchecked

**Problem**: No visual indication that confirmation checkbox is required.

**Files to Modify**:
- `frontend/src/app/(public)/booking/BookingForm.tsx` - `BookingStep4` submit button and checkbox

**Frontend Changes**:
1. Add `disabled` to submit button when `!form.watch('confirmed')`
2. Or add asterisk (*) to checkbox label: "I confirm... *"
3. Show helper text: "Required to proceed"
4. Style: gray out button when unchecked, enable when checked

---

### Issue #13: Auto-Calculate End Time from Session Length

**Problem**: End time should auto-calculate based on total service duration.

**Current State**: Partially implemented in `BookingStep2` - sets `endTime` from slot selection.

**Files to Modify**:
- `frontend/src/app/(public)/booking/BookingForm.tsx` - `BookingStep2` and `fetchAvailableSlots`

**Frontend Changes**:
1. When `startTime` changes, calculate `endTime = startTime + totalDuration`
2. Find matching slot in `availableSlots` that accommodates full duration
3. If no exact slot, show warning or disable conflicting slots
4. Display calculated end time in summary card

---

## Implementation Order (Dependencies)

```
Phase 1 (No dependencies):
├── Issue #6: Duplicate admin text (Header.tsx)
├── Issue #7: Phone input digits only (Input.tsx, validations.ts, BookingForm.tsx)
├── Issue #8: Toaster position (layout.tsx)
├── Issue #12: Submit button checkbox (BookingForm.tsx)

Phase 2 (Frontend only, uses auth context):
├── Issue #5: Pre-fill booking form (BookingForm.tsx - BookingStep3)
├── Issue #2: Admin bookings display (BookingsTable.tsx)
├── Issue #4: Redundant details card (page.tsx, BookingDetailsDrawer.tsx)
├── Issue #13: Auto-calculate end time (BookingForm.tsx - BookingStep2)

Phase 3 (Backend + Frontend):
├── Issue #3: Filter admin from loyalty (LoyaltyService.java, AdminLoyaltyPage.tsx)
├── Issue #9: Loyalty threshold config (LoyaltyService.java, LoyaltySettingsDto, AdminLoyaltyPage.tsx, LoyaltyCard.tsx)
├── Issue #10: Remove CASH payment (BookingForm.tsx, PaymentDtos.java, Payment.java)
├── Issue #11: Persist booking through auth (BookingForm.tsx, register/page.tsx, login/page.tsx, AuthController.java)

Phase 4 (Testing & Polish):
├── Cross-browser testing
├── Mobile responsiveness
├── Edge cases (empty states, errors)
```

---

## File Mapping Reference

| Feature Area | Frontend Files | Backend Files |
|--------------|----------------|---------------|
| Admin Bookings | `components/admin/bookings/BookingsTable.tsx`, `app/(admin)/admin/bookings/page.tsx` | `BookingController.java`, `BookingService.java` |
| Admin Loyalty | `app/(admin)/admin/loyalty/page.tsx`, `components/admin/QrScannerModal.tsx` | `LoyaltyController.java`, `LoyaltyService.java`, `AdminService.java` |
| Booking Flow | `app/(public)/booking/BookingForm.tsx`, `components/booking/` | `BookingController.java`, `BookingService.java` |
| Auth | `lib/auth.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx` | `AuthController.java`, `AuthService.java` |
| Loyalty (Customer) | `components/customer/LoyaltyCard.tsx`, `app/(customer)/loyalty/page.tsx` | `LoyaltyController.java`, `LoyaltyService.java` |
| Payments | `components/booking/PaymentQRCode.tsx` | `PaymentController.java`, `PaymentService.java` |
| UI Components | `components/ui/Input.tsx`, `components/ui/Button.tsx`, `components/layout/Header.tsx` | - |
| Notifications | `app/layout.tsx` (Toaster) | - |

---

## Acceptance Criteria Per Issue

| Issue | Acceptance Criteria |
|-------|---------------------|
| #2 | Admin bookings table shows full customer name, service names readable, no UUID fragments |
| #3 | Owner/admin accounts absent from loyalty list; only customers shown |
| #4 | Details drawer removed or simplified; table provides all needed info |
| #5 | Logged-in user: name/phone pre-filled, read-only; email shown read-only |
| #6 | Single "admin" indicator in header dropdown; no duplicate |
| #7 | Phone input rejects letters; formats as `0917 123 4567` |
| #8 | Toaster visible, doesn't overlap header avatar/icon |
| #9 | Loyalty shows "10 stamps = 1 free" (configurable via settings); admin & customer views match |
| #10 | Only GCash and Maya payment options; no "Studio Counter" |
| #11 | Select service/date/time → register → auto-fill booking form → submit works |
| #12 | Submit button disabled until checkbox checked; asterisk on label |
| #13 | Select start time → end time auto-calculates from total duration |

---

## Notes for Implementation

1. **Type Safety**: Update TypeScript types (`types/api.ts`) when backend DTOs change
2. **Validation**: Keep frontend Zod schemas in sync with backend validation
3. **Testing**: Add unit tests for new validation logic (phone, loyalty threshold)
4. **Backward Compatibility**: Ensure existing bookings/payments still work after CASH removal
5. **Migration**: Loyalty threshold change may need data migration for existing cards

---

## Next Steps

1. **Review this plan** - Confirm approach for each issue
2. **Approve** - Reply "Approved" to begin implementation
3. **Implementation** - Work through phases in order
4. **Update QA doc** - Mark issues as FIXED in `docs/QA-Nov20-10am.md` as completed