# Pretty Nails Frontend - Implementation Plan

## Task List

### Phase 1: Project Setup (Scaffold)
**Task 1: Initialize Next.js Project** — **Tier: Light**
- Create Next.js 14+ project in `frontend/` directory with App Router, TypeScript, Tailwind CSS
- Configure ESLint, Prettier, pnpm
- Set up path aliases (`@/*`)
- Verify: `pnpm dev` runs, `pnpm build` passes, `pnpm lint` passes

**Task 2: Project Structure & Config** — **Tier: Light**
- Create folder structure: `app/(public)`, `app/(auth)`, `app/(customer)`, `app/(admin)`, `components`, `lib`, `hooks`, `types`, `styles`
- Configure `next.config.js` (API proxy to Spring Boot, image domains)
- Set up Tailwind config with design system colors/fonts
- Create global CSS with CSS variables
- Verify: Build passes, dev server starts

**Task 3: API Client & Auth Foundation** — **Tier: Medium**
- Create `lib/api.ts` with Axios instance, interceptors for JWT, error handling
- Create `lib/auth.ts` with token storage (localStorage), auth state context
- Create `types/api.ts` with all TypeScript interfaces from SPEC.md
- Create `hooks/useAuth.ts` for auth state management
- Create `components/auth/AuthProvider.tsx` wrapping app
- Verify: Can register/login via API, token persisted, protected routes work

### Phase 2: Public Pages
**Task 4: Layout & Navigation** — **Tier: Medium**
- Create `components/layout/Header.tsx` with logo, nav links, auth buttons/user menu
- Create `components/layout/Footer.tsx`
- Create `components/layout/Layout.tsx` wrapper
- Create `components/ui/*` base components: Button, Input, Card, Badge, Avatar, Modal, Toast
- Verify: Header/footer render, navigation works, responsive

**Task 5: Home Page** — **Tier: Medium**
- Create `app/(public)/page.tsx` with hero, services preview, gallery preview, CTA
- Use `components/home/Hero.tsx`, `components/home/ServicesPreview.tsx`, `components/home/GalleryPreview.tsx`
- Fetch services and gallery from API
- Verify: Page loads, data displays, links navigate correctly

**Task 6: Services Page** — **Tier: Medium**
- Create `app/(public)/services/page.tsx` with category tabs, service cards
- Create `components/services/ServiceCard.tsx`, `components/services/CategoryTabs.tsx`
- Display variants with pricing (centavos → PHP format)
- Verify: All services load, categories filter, pricing displays correctly

**Task 7: Gallery Page** — **Tier: Medium**
- Create `app/(public)/gallery/page.tsx` with search, category filter, image grid
- Create `components/gallery/GalleryGrid.tsx`, `components/gallery/GalleryFilters.tsx`
- Implement modal for full-size image view
- Verify: Images load, filters work, modal opens

**Task 8: Availability Page** — **Tier: Medium**
- Create `app/(public)/availability/page.tsx` with calendar view
- Create `components/availability/AvailabilityCalendar.tsx`, `components/availability/TimeSlots.tsx`
- Fetch available dates from API, show available time slots on date click
- Verify: Calendar renders, dates marked available/unavailable, slots show

**Task 9: Booking Flow** — **Tier: Heavy**
- Create `app/(public)/booking/page.tsx` with multi-step stepper
- Step 1: `components/booking/StepServiceSelection.tsx` - select services/variants
- Step 2: `components/booking/StepDateTime.tsx` - pick date/time from availability
- Step 3: `components/booking/StepDetails.tsx` - name, phone, notes, inspiration image URL
- Step 4: `components/booking/StepConfirm.tsx` - summary, submit
- Create `hooks/useBooking.ts` for booking state management
- Handle auth redirect: if not logged in, redirect to login with return URL
- Verify: Complete booking flow works, creates booking via API, shows confirmation

**Task 10: Auth Pages** — **Tier: Medium**
- Create `app/(auth)/login/page.tsx` with email/password form, validation
- Create `app/(auth)/register/page.tsx` with name, email, phone, password, confirm
- Create `components/auth/LoginForm.tsx`, `components/auth/RegisterForm.tsx`
- Use React Hook Form + Zod for validation
- On success: store token, redirect to intended page or home
- Verify: Register creates account, login returns token, protected routes accessible

### Phase 3: Customer Protected Pages
**Task 11: Route Protection & Customer Layout** — **Tier: Medium**
- Create `app/(customer)/layout.tsx` with auth check redirect
- Create `components/layout/CustomerLayout.tsx` with user menu
- Create middleware `middleware.ts` for route protection (public, customer, admin)
- Verify: Unauthenticated users redirected to login with return URL

**Task 12: My Bookings Page** — **Tier: Medium**
- Create `app/(customer)/my-bookings/page.tsx` with booking list
- Create `components/bookings/BookingList.tsx`, `components/bookings/BookingCard.tsx`
- Show status badges, cancel button for pending/confirmed bookings
- Implement cancel booking mutation
- Verify: Bookings load, status displays, cancel works

**Task 13: Loyalty Card Page** — **Tier: Medium**
- Create `app/(customer)/loyalty/page.tsx` with digital card display
- Create `components/loyalty/LoyaltyCard.tsx` with stamp visualization
- Create `components/loyalty/QRScanner.tsx` for camera-based QR scanning
- Fetch loyalty card, implement stamp via QR code
- Verify: Card displays stamps, QR scanner works, stamp API called

**Task 14: Profile Page** — **Tier: Light**
- Create `app/(customer)/profile/page.tsx` with user info display
- Create `components/profile/ProfileForm.tsx` for name, phone, nickname
- Create `components/profile/ChangePasswordForm.tsx`
- Verify: Profile updates, password changes

### Phase 4: Admin Pages
**Task 15: Admin Route Protection & Layout** — **Tier: Medium**
- Create `app/(admin)/layout.tsx` with admin role check redirect
- Create `components/layout/AdminSidebar.tsx` with navigation
- Create `components/layout/AdminLayout.tsx` with sidebar + header
- Extend middleware for admin role check
- Verify: Non-admin users redirected, admin sidebar navigates

**Task 16: Admin Dashboard** — **Tier: Medium**
- Create `app/(admin)/page.tsx` with stats cards, recent bookings table, chart
- Create `components/admin/DashboardStats.tsx`, `components/admin/RecentBookings.tsx`
- Create `components/admin/RevenueChart.tsx` (simple bar/line with Recharts)
- Fetch stats and reports from API
- Verify: Stats load, chart renders, recent bookings link to admin bookings

**Task 17: Admin Bookings Management** — **Tier: Heavy**
- Create `app/(admin)/bookings/page.tsx` with paginated, filterable, sortable table
- Create `components/admin/bookings/BookingsTable.tsx` with columns: customer, date, time, services, status, actions
- Create `components/admin/bookings/BookingFilters.tsx` (date range, status, search)
- Create `components/admin/bookings/StatusBadge.tsx`, `components/admin/bookings/StatusAction.tsx`
- Implement status update (PENDING→CONFIRMED→COMPLETED/CANCELLED/NO_SHOW)
- Verify: Table loads, filters work, pagination works, status updates via API

**Task 18: Admin Services Management** — **Tier: Medium**
- Create `app/(admin)/services/page.tsx` with service list + create/edit modal
- Create `components/admin/services/ServicesTable.tsx`, `components/admin/services/ServiceForm.tsx`
- ServiceForm handles variants (dynamic add/remove)
- Implement CRUD: create, read, update, delete services
- Verify: Services list, create works, edit works, delete works, variants managed

**Task 19: Admin Gallery Management** — **Tier: Medium**
- Create `app/(admin)/gallery/page.tsx` with gallery grid + create/edit modal
- Create `components/admin/gallery/GalleryGrid.tsx`, `components/admin/gallery/GalleryForm.tsx`
- GalleryForm: title, description, image URL, category, active toggle
- Implement CRUD for gallery items
- Verify: Gallery loads, create/edit/delete work, image preview works

**Task 20: Admin Loyalty Management** — **Tier: Medium**
- Create `app/(admin)/loyalty/page.tsx` with customer loyalty cards table
- Create `components/admin/loyalty/LoyaltyTable.tsx`, `components/admin/loyalty/LoyaltyActionModal.tsx`
- Actions: add stamp, remove stamp, reset, extend expiry
- Verify: Table loads, actions work via API

**Task 21: Admin Availability Management** — **Tier: Medium**
- Create `app/(admin)/availability/page.tsx` with calendar view
- Create `components/admin/availability/AdminCalendar.tsx`, `components/admin/availability/AvailabilityForm.tsx`
- Calendar shows blocked/available dates, click to add/edit
- Form: date, available toggle, start/end time, max slots, note
- Verify: Calendar renders, create/edit/delete availability works

**Task 22: Admin Settings & Customers** — **Tier: Light**
- Create `app/(admin)/settings/page.tsx` with loyalty settings form
- Create `app/(admin)/customers/page.tsx` with customer list + notes modal
- Create `components/admin/SettingsForm.tsx`, `components/admin/CustomersTable.tsx`
- Implement settings CRUD, customer search, add note
- Verify: Settings load/save, customers list, notes add

**Task 23: Admin Reports** — **Tier: Light**
- Create `app/(admin)/reports/page.tsx` with period selector, stats display
- Create `components/admin/ReportsView.tsx` with revenue, bookings, top services, loyalty stats
- Verify: Reports load for different periods

### Phase 5: Polish & Integration
**Task 24: Error Handling & Loading States** — **Tier: Medium**
- Add global error boundary
- Add skeleton loaders for all data-fetching components
- Add empty states for lists
- Standardize toast notifications for success/error
- Verify: No uncaught errors, loading states visible, toasts appear

**Task 25: Responsive Testing & Fixes** — **Tier: Medium**
- Test all pages at mobile (375px), tablet (768px), desktop (1440px)
- Fix layout issues, touch targets, text sizing
- Verify: All pages usable on all breakpoints

**Task 26: Build & Production Check** — **Tier: Light**
- Run `pnpm build` - fix any TypeScript/ESLint errors
- Run `pnpm start` - verify production build works
- Test full user flows: register → book → view bookings → loyalty
- Test admin flows: login → manage services/bookings/gallery/loyalty/availability
- Verify: Clean build, all flows work end-to-end

## Dependencies Summary
```
Task 1 (scaffold) → Task 2 (structure) → Task 3 (api/auth)
                                              ↓
                    Task 4 (layout) ← Task 3
                    ↓
        Task 5 (home) ← Task 4
        Task 6 (services) ← Task 4
        Task 7 (gallery) ← Task 4
        Task 8 (availability) ← Task 4
        Task 9 (booking) ← Task 4, Task 3, Task 8
        Task 10 (auth) ← Task 4, Task 3
                    ↓
        Task 11 (customer layout) ← Task 3, Task 10
                    ↓
        Task 12 (my-bookings) ← Task 11
        Task 13 (loyalty) ← Task 11
        Task 14 (profile) ← Task 11
                    ↓
        Task 15 (admin layout) ← Task 3, Task 10
                    ↓
        Task 16 (dashboard) ← Task 15
        Task 17 (admin bookings) ← Task 15
        Task 18 (admin services) ← Task 15
        Task 19 (admin gallery) ← Task 15
        Task 20 (admin loyalty) ← Task 15
        Task 21 (admin availability) ← Task 15
        Task 22 (admin settings/customers) ← Task 15
        Task 23 (admin reports) ← Task 15
                    ↓
        Task 24 (polish) ← all above
        Task 25 (responsive) ← all above
        Task 26 (build) ← all above
```

## Verification Commands
- `cd frontend && pnpm dev` - Start dev server
- `cd frontend && pnpm build` - Production build
- `cd frontend && pnpm lint` - Lint check
- `cd frontend && pnpm type-check` - TypeScript check (if script added)

## Notes
- Spring Boot backend must be running on `http://localhost:8080` (profile: local for H2)
- Next.js dev server runs on `http://localhost:3000`
- API calls proxied via `next.config.js` rewrites to avoid CORS
- Use `pnpm` for package management (faster, disk-efficient)