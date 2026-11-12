# Project: Remaining Core Salon Features Implementation

## Architecture
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide icons, Axios/Fetch API client (`frontend/src/lib/api.ts`).
- **Backend**: Spring Boot 3 Java application (`pretty-nails-backend/` / `backend/`), Spring Security, Spring Data JPA, BCrypt password encoder, REST controllers.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Admin Bookings Route & UI | Move `bookings/page.tsx` to `admin/bookings/page.tsx`, details modal, status transitions, quick filter tabs | M1 | `remaining_features_plan.md` |
| 2 | Payment & Downpayment System | GCash/Maya QR display, payment selector, reference input, status badges, `PaymentService.java` auth user association, `PUT /api/admin/payments/{id}/verify`, `paymentsApi` | M2 | `remaining_features_plan.md` |
| 3 | Auth & Profile Backend APIs | `PUT /api/auth/profile` and `POST /api/auth/change-password` in `AuthController.java` and `AuthService.java` | M3 | `remaining_features_plan.md` |
| 4 | QR Stamping & Loyalty Redemption | `CompletionQRModal.tsx` in Admin Bookings (`BOOKING:<bookingId>`), 10-stamp redemption toggle in `BookingForm.tsx` | M4 | `remaining_features_plan.md` |
| 5 | Image & Receipt Upload | `POST /api/upload` endpoint (multipart/form-data with size/format validation) and frontend upload component/client | M5 | `remaining_features_plan.md` |
| 6 | System Review, Challenge & Audit | Review correctness, challenger verification, forensic integrity audit | M6 | `remaining_features_plan.md` |
| 7 | Full System Verification | Frontend build & backend compile verification, E2E flow validation | M7 | `remaining_features_plan.md` |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Admin Bookings Management | Move page to `admin/bookings/`, booking drawer/modal, status transitions, filter tabs | none | DONE |
| M2 | Payment & Downpayment System | `BookingForm.tsx` payment fields, `my-bookings` payment badges/ref submission, `PaymentController.java`, `PaymentService.java`, `paymentsApi` | none | DONE |
| M3 | Auth & Profile Backend APIs | `PUT /api/auth/profile`, `POST /api/auth/change-password` in Spring Boot backend | none | DONE |
| M4 | QR Stamping & Loyalty Redemption | Admin completion QR code modal, customer loyalty redemption discount in `BookingForm.tsx` | M1, M2 | IN_PROGRESS |
| M5 | File & Image Upload Support | `POST /api/upload` multipart endpoint, frontend upload integration | none | DONE |
| M6 | Review, Challenge & Audit | High-reliability review, challenger verification, and forensic integrity audit | M1, M2, M3, M4, M5 | PLANNED |
| M7 | Full System Verification | Frontend build & backend compile verification, E2E flow validation | M6 | PLANNED |

## Code Layout & Write Boundaries
- **Worker 1** (COMPLETED):
  - `frontend/src/app/(admin)/admin/bookings/page.tsx`
  - `frontend/src/components/admin/BookingDetailsDrawer.tsx`
  - `frontend/src/app/(admin)/bookings/page.tsx` (forwards cleanly)
- **Worker 2** (COMPLETED):
  - `frontend/src/components/booking/BookingForm.tsx` (payment section)
  - `frontend/src/app/(customer)/my-bookings/page.tsx`
  - `frontend/src/components/customer/` booking components
  - `pretty-nails-backend/src/main/java/.../PaymentController.java` & `PaymentService.java`
  - `frontend/src/lib/api.ts` (add `paymentsApi`)
- **Worker 3** (COMPLETED):
  - `pretty-nails-backend/src/main/java/.../AuthController.java`
  - `pretty-nails-backend/src/main/java/.../AuthService.java`, `AuthDtos.java`, `SecurityConfig.java`, `JwtAuthenticationFilter.java`
- **Worker 4** (IN PROGRESS):
  - `frontend/src/components/admin/CompletionQRModal.tsx`
  - Hooking into `frontend/src/app/(admin)/admin/bookings/page.tsx` & `BookingDetailsDrawer.tsx`
  - Loyalty discount toggle in `frontend/src/components/booking/BookingForm.tsx`
  - Backend loyalty/booking service integration for reward redemption
- **Worker 5** (COMPLETED):
  - `pretty-nails-backend/src/main/java/.../UploadController.java`, `FileStorageService.java`, `WebMvcConfig.java`
  - `frontend/src/components/ui/FileUpload.tsx` and `frontend/src/lib/upload.ts`
