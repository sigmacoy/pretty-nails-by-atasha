# Pretty Nails - Detailed Use Case Specifications

*Derived from Use-Case-D.txt diagram, SPEC.md, and PLAN.md*

---

## UC1: Register Account

| Field | Details |
|-------|---------|
| **Use Case Number** | UC1 |
| **Use Case Name** | Register Account |
| **Purpose** | Allow unauthenticated users to create a new customer account in the system |
| **Primary Actor** | Public (Unauthenticated User) |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `name` (string), `email` (string, unique), `phone` (string, optional), `password` (string, min 8 chars) |
| **Output Parameter/s** | `token` (JWT string), `user` (UserDto: id, name, email, role, nickname, phone, image, createdAt) |
| **Pre-condition/s** | User is not logged in; email not already registered; backend API accessible at `http://localhost:8080/api` |
| **Post-condition** | New user account created in database; JWT token issued and stored in localStorage; user authenticated as CUSTOMER role |
| **Successful Scenario** | 1. User navigates to `/register`<br>2. User fills registration form with valid data<br>3. Form validation passes (React Hook Form + Zod)<br>4. System sends POST `/auth/register` with payload<br>5. Backend creates user, returns JWT + UserDto<br>6. Frontend stores token in localStorage, sets auth context<br>7. User redirected to intended page or home (`/`) |
| **Exceptions** | E1: Email already registered → Show "Email already in use" error<br>E2: Weak password → Show password requirements<br>E3: Network error → Show "Unable to connect to server" toast<br>E4: Validation error → Highlight invalid fields inline |
| **Additional Remarks** | Auto-creates loyalty card (UC16) on successful registration; uses Zod schema from `lib/validations.ts`; rate-limited on backend |

---

## UC2: Login

| Field | Details |
|-------|---------|
| **Use Case Number** | UC2 |
| **Use Case Name** | Login |
| **Purpose** | Authenticate existing users and issue JWT token for subsequent authorized requests |
| **Primary Actor** | Public (Unauthenticated User) |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `email` (string), `password` (string) |
| **Output Parameter/s** | `token` (JWT string), `user` (UserDto: id, name, email, role, nickname, phone, image, createdAt) |
| **Pre-condition/s** | User has a registered account; user is not currently logged in; backend API accessible |
| **Post-condition** | JWT token issued and stored; auth context updated; user redirected based on role (CUSTOMER → `/`, ADMIN → `/admin`) |
| **Successful Scenario** | 1. User navigates to `/login`<br>2. User enters email and password<br>3. Form validation passes<br>4. System sends POST `/auth/login`<br>5. Backend validates credentials, returns JWT + UserDto<br>6. Frontend stores token, sets auth context with role<br>7. Middleware redirects to appropriate dashboard based on role |
| **Exceptions** | E1: Invalid credentials → Show "Invalid email or password"<br>E2: Account not verified (future) → Redirect to verification<br>E3: Network error → Show "Unable to connect to server" toast<br>E4: Token expired mid-session → Auto-redirect to login with return URL |
| **Additional Remarks** | JWT stored in localStorage; token refreshed on `/auth/me` call; middleware protects routes; "Remember me" not implemented in MVP |

---

## UC3: View Profile

| Field | Details |
|-------|---------|
| **Use Case Number** | UC3 |
| **Use Case Name** | View Profile |
| **Purpose** | Allow authenticated customers to view and manage their personal profile information |
| **Primary Actor** | Customer |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | None (uses JWT from auth context) |
| **Output Parameter/s** | `user` (UserDto: id, name, email, role, nickname, phone, image, createdAt) |
| **Pre-condition/s** | User is authenticated (valid JWT in localStorage); user has CUSTOMER or ADMIN role |
| **Post-condition** | Profile data displayed; user can edit name, phone, nickname; user can change password |
| **Successful Scenario** | 1. Authenticated user navigates to `/profile`<br>2. Middleware validates JWT via GET `/auth/me`<br>3. Backend returns UserDto<br>4. Frontend displays profile form pre-filled with user data<br>5. User optionally edits fields and submits<br>6. System sends PUT `/auth/me` (or equivalent) with updates<br>7. Backend updates user, returns updated UserDto<br>8. Frontend updates auth context and shows success toast |
| **Exceptions** | E1: JWT expired → Redirect to login with return URL<br>E2: Network error → Show cached profile data with "Offline" indicator<br>E3: Email change conflict → Show "Email already in use"<br>E4: Password change fails → Show "Current password incorrect" |
| **Additional Remarks** | Profile image upload not in MVP (placeholder only); nickname optional for staff reference; change password uses separate form with current password verification |

---

## UC4: View Available Dates

| Field | Details |
|-------|---------|
| **Use Case Number** | UC4 |
| **Use Case Name** | View Available Dates |
| **Purpose** | Allow users (public and customers) to view available appointment dates and time slots for booking |
| **Primary Actor** | Public / Customer |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | None (optional query params for date range) |
| **Output Parameter/s** | List of `AvailabilityDto`: id, date, isAvailable, startTime, endTime, maxSlots, note |
| **Pre-condition/s** | Backend API accessible; availability data exists in system (admin may have configured it) |
| **Post-condition** | Calendar view displays available/unavailable dates; clicking a date shows time slots |
| **Successful Scenario** | 1. User navigates to `/availability` or booking Step 2<br>2. System sends GET `/availability`<br>3. Backend returns list of availability records<br>4. Frontend renders calendar with available dates highlighted<br>5. User clicks a date → System shows TimeSlotPicker with available slots<br>6. User selects a time slot for booking |
| **Exceptions** | E1: No availability configured → Show "No available dates yet" empty state<br>E2: All slots booked for selected date → Show "Fully booked" with option to pick another date<br>E3: Network error → Show cached availability with stale indicator<br>E4: Date in past → Disable past dates in calendar |
| **Additional Remarks** | Calendar uses date-fns for formatting; availability managed by admin (UC13); real-time slot availability checked on booking confirm; public page and booking flow share same component |

---

## UC5: View Active Services

| Field | Details |
|-------|---------|
| **Use Case Number** | UC5 |
| **Use Case Name** | View Active Services |
| **Purpose** | Display all active nail services with categories, variants, and pricing for customers to choose from |
| **Primary Actor** | Public / Customer |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | None |
| **Output Parameter/s** | List of `ServiceDto`: id, name, category, description, basePrice, duration, isActive, variants[] |
| **Pre-condition/s** | Backend API accessible; at least one active service exists in database |
| **Post-condition** | Services page displays categorized service cards with variant pricing; user can select services for booking |
| **Successful Scenario** | 1. User navigates to `/services` or booking Step 1<br>2. System sends GET `/services`<br>3. Backend returns active services with variants<br>4. Frontend renders CategoryTabs and ServiceCard components<br>5. Services grouped by category (e.g., Gel, Acrylic, Spa)<br>6. Each card shows name, description, base price, variants with prices<br>7. User selects service(s) and variant(s) for booking |
| **Exceptions** | E1: No active services → Show "No services available" empty state<br>E2: Service has no variants → Show base price only<br>E3: Network error → Show skeleton loaders then error toast<br>E4: Price in centavos → Format to PHP (divide by 100) for display |
| **Additional Remarks** | Prices stored as centavos (int) in backend; variants dynamic (add/remove in admin); category tabs filter client-side; service selection persists in booking flow state (useBooking hook) |

---

## UC6: Create Booking

| Field | Details |
|-------|---------|
| **Use Case Number** | UC6 |
| **Use Case Name** | Create Booking |
| **Purpose** | Enable customers to book nail services by selecting services, date/time, and providing details |
| **Primary Actor** | Customer |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `serviceIds` (string[]), `variantIds` (string[], optional), `appointmentDate` (ISO string), `startTime` (string), `notes` (string, optional), `inspirationImg` (string URL, optional) |
| **Output Parameter/s** | `BookingDto`: id, userId, status, appointmentDate, startTime, endTime, totalPrice, downpayment, notes, inspirationImg, createdAt, services[] |
| **Pre-condition/s** | User authenticated (CUSTOMER role); selected date/time is available; services exist and are active |
| **Post-condition** | Booking created with PENDING status; downpayment calculated; booking appears in user's My Bookings; availability slot reserved |
| **Successful Scenario** | 1. Customer completes multi-step booking flow (Service Selection → Date/Time → Details → Confirm)<br>2. Step 1: Select services/variants from UC5<br>3. Step 2: Pick available date/time from UC4<br>4. Step 3: Enter name, phone, notes, optional inspiration image URL<br>5. Step 4: Review summary, confirm<br>6. System sends POST `/bookings` with BookingRequest<br>7. Backend validates availability, calculates price/downpayment, creates booking<br>8. Backend returns BookingDto with PENDING status<br>9. Frontend shows confirmation, redirects to `/my-bookings` |
| **Exceptions** | E1: Slot no longer available → Show "Slot just booked, please select another"<br>E2: Not authenticated → Redirect to login with return URL to booking<br>E3: Validation error → Highlight invalid step, prevent progression<br>E4: Downpayment calculation error → Show "Unable to calculate price" |
| **Additional Remarks** | Multi-step form uses useBooking hook for state; inspirationImg is URL (no upload in MVP); downpayment = 30% of total (backend logic); booking confirmation email/SMS not in MVP |

---

## UC7: View My Bookings

| Field | Details |
|-------|---------|
| **Use Case Number** | UC7 |
| **Use Case Name** | View My Bookings |
| **Purpose** | Allow customers to view their booking history with status and manage upcoming appointments |
| **Primary Actor** | Customer |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | None (uses JWT from auth context) |
| **Output Parameter/s** | List of `BookingDto`: id, status, appointmentDate, startTime, endTime, totalPrice, downpayment, notes, inspirationImg, createdAt, services[] |
| **Pre-condition/s** | User authenticated (CUSTOMER role); user has existing bookings (or empty state) |
| **Post-condition** | Booking list displayed with status badges; cancel option available for PENDING/CONFIRMED bookings |
| **Successful Scenario** | 1. Customer navigates to `/my-bookings`<br>2. System sends GET `/bookings` with JWT<br>3. Backend returns user's bookings ordered by date desc<br>4. Frontend renders BookingList with BookingCard for each<br>5. Each card shows: service names, date/time, status badge, total price<br>6. For PENDING/CONFIRMED: Cancel button visible<br>7. Customer clicks Cancel → Confirm modal → System sends DELETE/PUT to cancel<br>8. Status updated to CANCELLED, UI refreshed |
| **Exceptions** | E1: No bookings → Show empty state with "Book your first appointment" CTA<br>E2: Cancel not allowed (COMPLETED/NO_SHOW) → Disable cancel button<br>E3: Network error → Show cached bookings with refresh button<br>E4: Booking deleted by admin → Show "Booking cancelled by salon" |
| **Additional Remarks** | Status badges: PENDING (yellow), CONFIRMED (blue), COMPLETED (green), CANCELLED (red), NO_SHOW (gray); cancel triggers PUT to update status; inspiration image shown as thumbnail if present |

---

## UC8: View All Bookings

| Field | Details |
|-------|---------|
| **Use Case Number** | UC8 |
| **Use Case Name** | View All Bookings |
| **Purpose** | Allow admins to view, filter, and paginate all customer bookings across the system |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `page` (int), `size` (int), `status` (string, optional), `dateFrom` (ISO string, optional), `dateTo` (ISO string, optional), `search` (string, optional) |
| **Output Parameter/s** | Paginated `BookingDto[]`: id, userId, status, appointmentDate, startTime, endTime, totalPrice, downpayment, createdAt, services[], userName, userEmail |
| **Pre-condition/s** | User authenticated with ADMIN role; backend API accessible |
| **Post-condition** | Admin bookings table displayed with filters, pagination, sortable columns; status actions available per row |
| **Successful Scenario** | 1. Admin navigates to `/admin/bookings`<br>2. System sends GET `/admin/bookings` with query params<br>3. Backend returns paginated bookings with customer info<br>4. Frontend renders BookingsTable with columns: Customer, Date, Time, Services, Status, Actions<br>5. Admin applies filters (date range, status, search by name/email)<br>6. Admin sorts columns, navigates pages<br>7. Admin clicks status action → triggers UC9 |
| **Exceptions** | E1: No bookings match filters → Show empty state with "Clear filters" button<br>E2: Network error → Show error toast, retry button<br>E3: Large dataset → Server-side pagination (default 10/page)<br>E4: Status transition invalid → Disable invalid status options in dropdown |
| **Additional Remarks** | Table uses TanStack Table or custom DataTable; filters debounced; column sorting server-side; row click → view details modal; export to CSV not in MVP |

---

## UC9: Update Booking Status

| Field | Details |
|-------|---------|
| **Use Case Number** | UC9 |
| **Use Case Name** | Update Booking Status |
| **Purpose** | Allow admins to update booking status through the workflow (PENDING → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW) |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `bookingId` (string, path), `status` (string: PENDING/CONFIRMED/COMPLETED/CANCELLED/NO_SHOW) |
| **Output Parameter/s** | Updated `BookingDto` with new status |
| **Pre-condition/s** | User authenticated with ADMIN role; booking exists; valid status transition |
| **Post-condition** | Booking status updated in database; customer sees updated status in My Bookings; availability slot freed if cancelled |
| **Successful Scenario** | 1. Admin views bookings table (UC8)<br>2. Admin clicks status dropdown/action button for a booking<br>3. Admin selects new status (e.g., CONFIRMED)<br>4. System sends PUT `/admin/bookings/{id}/status` with `{status}`<br>5. Backend validates transition, updates booking<br>6. Backend returns updated BookingDto<br>7. Frontend updates table row, shows success toast<br>8. If CANCELLED/NO_SHOW: availability slot released |
| **Exceptions** | E1: Invalid transition (e.g., COMPLETED → PENDING) → Show "Invalid status change"<br>E2: Booking not found → Show "Booking no longer exists"<br>E3: Concurrent modification → Show "Booking updated by another admin, refresh"<br>E4: Network error → Show "Failed to update, retry" |
| **Additional Remarks** | Status workflow: PENDING → CONFIRMED → COMPLETED; PENDING/CONFIRMED → CANCELLED/NO_SHOW; no backward transitions; audit log not in MVP; customer not notified in MVP |

---

## UC10: Manage Services (CRUD)

| Field | Details |
|-------|---------|
| **Use Case Number** | UC11 |
| **Use Case Name** | Manage Services (CRUD) |
| **Purpose** | Allow admins to create, read, update, and delete nail services and their variants |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | **Create/Update**: `name`, `category`, `description`, `basePrice` (centavos), `duration` (minutes), `variants[]` ({name, price}), `isActive` (boolean)<br>**Delete**: `serviceId` (string) |
| **Output Parameter/s** | `ServiceDto` (created/updated), or success confirmation (deleted) |
| **Pre-condition/s** | User authenticated with ADMIN role; category exists or is new |
| **Post-condition** | Service created/updated/deleted; reflected in public services page (UC5) and booking flow (UC6) |
| **Successful Scenario** | 1. Admin navigates to `/admin/services`<br>2. System sends GET `/admin/services` (or `/services`)<br>3. Frontend renders ServicesTable with CRUD actions<br>4. **Create**: Admin clicks Add → fills ServiceForm (name, category, description, basePrice, duration, dynamic variants) → submits → POST `/admin/services` → table refreshes<br>5. **Edit**: Admin clicks Edit → pre-filled form → updates → PUT `/admin/services/{id}` → table refreshes<br>6. **Delete**: Admin clicks Delete → confirms → DELETE `/admin/services/{id}` → row removed<br>7. Public services page (UC5) immediately reflects changes |
| **Exceptions** | E1: Service has existing bookings → Prevent delete, show "Cannot delete: has bookings"<br>E2: Duplicate service name → Show "Service name already exists"<br>E3: Variant price < basePrice → Warning but allow<br>E4: Network error → Form retains data, show retry |
| **Additional Remarks** | Variants managed as dynamic array in form; basePrice in centavos; category free-text (no enum); isActive toggles visibility on public page; image upload not in MVP |

---

## UC11: Manage Availability (CRUD)

| Field | Details |
|-------|---------|
| **Use Case Number** | UC13 |
| **Use Case Name** | Manage Availability (CRUD) |
| **Purpose** | Allow admins to configure available dates, time slots, and capacity for bookings |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | **Create/Update**: `date` (ISO string), `isAvailable` (boolean), `startTime` (HH:mm), `endTime` (HH:mm), `maxSlots` (int), `note` (string, optional)<br>**Delete**: `availabilityId` (string) |
| **Output Parameter/s** | `AvailabilityDto` (created/updated), or success confirmation (deleted) |
| **Pre-condition/s** | User authenticated with ADMIN role; date not in past (for new entries) |
| **Post-condition** | Availability configured; reflected in public availability page (UC4) and booking Step 2 (UC6) |
| **Successful Scenario** | 1. Admin navigates to `/admin/availability`<br>2. System sends GET `/admin/availability`<br>3. Frontend renders AdminCalendar with colored dates (available/blocked)<br>4. **Create**: Admin clicks date → fills AvailabilityForm (date, toggle, start/end time, max slots, note) → POST `/admin/availability` → calendar updates<br>5. **Edit**: Admin clicks existing date → modifies form → PUT `/admin/availability/{id}`<br>6. **Delete**: Admin clicks date → Delete → DELETE `/admin/availability/{id}`<br>7. Public availability (UC4) and booking flow (UC6) reflect changes in real-time |
| **Exceptions** | E1: Date in past → Disable past dates, show "Cannot modify past dates"<br>E2: Overlapping time slots → Show "Time overlaps with existing availability"<br>E3: maxSlots < 1 → Show "Minimum 1 slot required"<br>E4: Date has existing bookings → Warn "Bookings exist for this date" but allow block |
| **Additional Remarks** | Calendar color-coded: green=available, red=blocked, gray=past; note field for admin reference (e.g., "Staff meeting"); bulk actions not in MVP; timezone handled by backend |

---

## UC12: View Public Gallery

| Field | Details |
|-------|---------|
| **Use Case Number** | UC14 |
| **Use Case Name** | View Public Gallery |
| **Purpose** | Display nail art gallery images with filtering for customer inspiration |
| **Primary Actor** | Public / Customer |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `category` (string, optional), `search` (string, optional) |
| **Output Parameter/s** | List of `GalleryDto`: id, title, description, imageUrl, category, isActive, createdAt |
| **Pre-condition/s** | Backend API accessible; gallery images exist in database |
| **Post-condition** | Gallery grid displayed with category filter, search, and image modal view |
| **Successful Scenario** | 1. User navigates to `/gallery`<br>2. System sends GET `/gallery` with optional filters<br>3. Backend returns active gallery items<br>4. Frontend renders GalleryGrid with GalleryFilters (category tabs, search input)<br>5. User filters by category (e.g., Gel, French, Chrome)<br>6. User clicks image → modal opens with full-size view, title, description<br>7. Customer can use "Book This Design" (UC6) from gallery |
| **Exceptions** | E1: No gallery images → Show empty state with "No designs yet"<br>E2: Image URL broken → Show placeholder image with "Image unavailable"<br>E3: Category filter returns no results → Show "No designs in this category"<br>E4: Network error → Show skeleton grid then error toast |
| **Additional Remarks** | Images loaded from external URLs (no upload in MVP); category tabs from distinct categories in data; modal uses next/image for optimization; "Book This Design" pre-selects service in booking flow |

---

## UC13: Manage Gallery (CRUD)

| Field | Details |
|-------|---------|
| **Use Case Number** | UC15 |
| **Use Case Name** | Manage Gallery (CRUD) |
| **Purpose** | Allow admins to manage gallery images (create, update, delete, toggle active) |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | **Create/Update**: `title`, `description`, `imageUrl`, `category`, `isActive`<br>**Delete**: `galleryId` (string) |
| **Output Parameter/s** | `GalleryDto` (created/updated), or success confirmation (deleted) |
| **Pre-condition/s** | User authenticated with ADMIN role; imageUrl accessible |
| **Post-condition** | Gallery item created/updated/deleted; reflected in public gallery (UC14) |
| **Successful Scenario** | 1. Admin navigates to `/admin/gallery`<br>2. System sends GET `/admin/gallery`<br>3. Frontend renders GalleryGrid with CRUD actions<br>4. **Create**: Admin clicks Add → fills GalleryForm (title, description, imageUrl, category, active toggle) → POST `/admin/gallery` → grid refreshes<br>5. **Edit**: Admin clicks Edit → pre-filled form → PUT `/admin/gallery/{id}`<br>6. **Delete**: Admin clicks Delete → confirms → DELETE `/admin/gallery/{id}`<br>7. **Toggle Active**: Admin clicks status badge → PATCH → grid updates<br>8. Public gallery (UC14) reflects changes |
| **Exceptions** | E1: Invalid image URL → Show "Please enter a valid image URL"<br>E2: Delete confirmation → Modal "This will remove from public gallery"<br>E3: Duplicate title → Allow (title not unique)<br>E4: Network error → Form retains data |
| **Additional Remarks** | Image preview in form before submit; category free-text; isActive controls public visibility; drag-drop reorder not in MVP; image upload to CDN not in MVP |

---

## UC14: View My Loyalty Card

| Field | Details |
|-------|---------|
| **Use Case Number** | UC16 |
| **Use Case Name** | View My Loyalty Card |
| **Purpose** | Display customer's digital loyalty card with stamp count, progress, and QR code for stamping |
| **Primary Actor** | Customer |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | None (uses JWT from auth context) |
| **Output Parameter/s** | `LoyaltyCardDto`: id, userId, stampCount, lastStampAt, expiresAt |
| **Pre-condition/s** | User authenticated (CUSTOMER role); loyalty card exists (auto-created on first booking or registration) |
| **Post-condition** | Digital stamp card displayed with visual stamps, progress to next reward, QR code for in-salon scanning |
| **Successful Scenario** | 1. Customer navigates to `/loyalty`<br>2. System sends GET `/loyalty/card` with JWT<br>3. Backend returns LoyaltyCardDto<br>4. Frontend renders LoyaltyCard component:<br>   - Visual stamp circles (filled/empty based on stampCount)<br>   - Progress ring (e.g., "3/10 stamps to Free Gel Set")<br>   - QR code with customer ID for staff scanning<br>   - Expiry date display<br>   - Stamp history link<br>5. Customer shows QR code to staff for stamping (UC17) |
| **Exceptions** | E1: No loyalty card → Auto-create on first visit (backend handles)<br>E2: Card expired → Show "Card expired, visit salon to renew"<br>E3: QR code generation fails → Show "Unable to generate QR, try again"<br>E4: Network error → Show cached card with stale indicator |
| **Additional Remarks** | QR contains userId for staff scanning; stamp threshold from settings (UC22); expiry = cardExpiryMonths from last stamp; progress ring animated; stamp history shows last 10 stamps |

---

## UC15: Earn Stamps via QR Code

| Field | Details |
|-------|---------|
| **Use Case Number** | UC17 |
| **Use Case Name** | Earn Stamps via QR Code |
| **Purpose** | Allow customers to earn loyalty stamps by scanning QR code after completed service |
| **Primary Actor** | Customer |
| **Secondary Actor** | System (Spring Boot Backend), Salon Staff (scans QR) |
| **Input Parameter/s** | `qrCode` (string - contains booking/appointment verification data) |
| **Output Parameter/s** | `StampResponse`: success (boolean), stampCount (int), message (string) |
| **Pre-condition/s** | User authenticated (CUSTOMER role); has loyalty card; completed a qualifying service; staff scans QR |
| **Post-condition** | Stamp added to loyalty card; stampCount incremented; progress updated; reward unlocked if threshold reached |
| **Successful Scenario** | 1. Customer completes service at salon<br>2. Staff scans customer's QR code from `/loyalty` page<br>3. Customer taps "Scan QR" or staff enters code → System sends POST `/loyalty/stamp` with `{qrCode}`<br>4. Backend validates QR, checks booking completion, adds stamp<br>5. Backend returns StampResponse with new stampCount<br>6. Frontend updates LoyaltyCard: new stamp filled, progress ring advances<br>7. If stampCount reaches reward threshold (e.g., 10): "Reward Unlocked!" toast shown<br>8. Customer can now redeem (UC19) |
| **Exceptions** | E1: QR already used → Show "This QR has already been scanned"<br>E2: No qualifying booking → Show "No completed service found for stamping"<br>E3: Card expired → Show "Loyalty card expired, cannot earn stamps"<br>E4: Network error → Show "Unable to process stamp, try again" |
| **Additional Remarks** | Stamps per service/amount from settings (UC22); QR scanned by staff device (not customer camera in MVP); prevents duplicate stamps per booking; real-time UI update |

---

## UC16: View All Loyalty Cards

| Field | Details |
|-------|---------|
| **Use Case Number** | UC18 |
| **Use Case Name** | View All Loyalty Cards |
| **Purpose** | Allow admins to view all customer loyalty cards with stamp counts and status |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `page`, `size`, `search` (name/email), `minStamps`, `maxStamps` |
| **Output Parameter/s** | Paginated `AdminLoyaltyCardDto[]`: id, userId, userName, userEmail, stampCount, lastStampAt, expiresAt |
| **Pre-condition/s** | User authenticated with ADMIN role |
| **Post-condition** | Admin loyalty table displayed with customer info, stamp counts, and action buttons |
| **Successful Scenario** | 1. Admin navigates to `/admin/loyalty`<br>2. System sends GET `/admin/loyalty` with query params<br>3. Backend returns paginated loyalty cards with customer details<br>4. Frontend renders LoyaltyTable: Customer Name, Email, Stamps, Last Stamp, Expiry, Actions<br>5. Admin searches/filters by name, email, stamp range<br>6. Admin clicks action button → triggers UC19 (Redeem) or UC22 (Manual Adjust) |
| **Exceptions** | E1: No loyalty cards → Show empty state<br>E2: Network error → Show error toast, retry<br>E3: Large dataset → Server-side pagination<br>E4: Customer deleted → Show "Customer account deleted" in row |
| **Additional Remarks** | Table sortable by stamps, last stamp, expiry; filter by active/expired cards; manual stamp adjust in UC22; export not in MVP |

---

## UC17: Redeem Stamps

| Field | Details |
|-------|---------|
| **Use Case Number** | UC19 |
| **Use Case Name** | Redeem Stamps |
| **Purpose** | Allow customers to redeem earned stamps for rewards (free service, discount) |
| **Primary Actor** | Customer |
| **Secondary Actor** | System (Spring Boot Backend), Salon Staff |
| **Input Parameter/s** | `rewardType` (string: FREE_SERVICE/DISCOUNT), `serviceId` (string, optional for free service) |
| **Output Parameter/s** | Updated `LoyaltyCardDto` with reduced stampCount, reward voucher details |
| **Pre-condition/s** | User authenticated (CUSTOMER role); sufficient stamps for chosen reward; reward configured in settings |
| **Post-condition** | Stamps deducted; reward voucher issued; loyalty card updated; staff can verify redemption |
| **Successful Scenario** | 1. Customer views loyalty card (UC16) → sees "Redeem Reward" button (enabled at threshold)<br>2. Customer clicks Redeem → selects reward (e.g., "Free Gel Set" for 10 stamps)<br>3. System sends POST `/loyalty/redeem` with `{rewardType, serviceId}`<br>4. Backend validates stamp count, deducts stamps, creates voucher<br>5. Backend returns updated LoyaltyCardDto + voucher info<br>6. Frontend shows voucher code, updates stamp visualization<br>7. Customer shows voucher to staff at next booking<br>8. Staff verifies via admin loyalty management |
| **Exceptions** | E1: Insufficient stamps → Show "Not enough stamps for this reward"<br>E2: Reward not configured → Show "Reward unavailable"<br>E3: Voucher already used → Show "Voucher already redeemed"<br>E4: Network error → Show "Redemption failed, try again" |
| **Additional Remarks** | Free service reward from settings (UC22); voucher code generated backend; staff verifies via admin table; redemption history in stamp history; partial redemption not in MVP |

---

## UC18: View Dashboard Stats

| Field | Details |
|-------|---------|
| **Use Case Number** | UC20 |
| **Use Case Name** | View Dashboard Stats |
| **Purpose** | Provide admins with key business metrics overview on the admin dashboard |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | None |
| **Output Parameter/s** | `AdminStatsDto`: totalCustomers, totalBookings, totalRevenue, pendingBookings, completedThisMonth, loyaltyActive |
| **Pre-condition/s** | User authenticated with ADMIN role |
| **Post-condition** | Dashboard displays stat cards, recent bookings table, revenue chart |
| **Successful Scenario** | 1. Admin navigates to `/admin` (dashboard)<br>2. System sends GET `/admin/stats`<br>3. Backend returns aggregated statistics<br>4. Frontend renders DashboardStats: 6 stat cards with icons/numbers<br>5. RecentBookings table shows latest 5 bookings with status<br>6. RevenueChart (Recharts) displays monthly revenue trend<br>7. Admin clicks "View All" on bookings → navigates to UC8 |
| **Exceptions** | E1: No data (new salon) → Show zeros with "No data yet"<br>E2: Network error → Show cached stats with refresh button<br>E3: Chart render error → Show table fallback<br>E4: Stats stale → Auto-refresh every 5 minutes |
| **Additional Remarks** | Revenue in centavos, formatted to PHP; chart uses Recharts line/bar; recent bookings link to UC8; loyaltyActive = cards with stamps > 0; real-time not in MVP |

---

## UC19: View Reports

| Field | Details |
|-------|---------|
| **Use Case Number** | UC21 |
| **Use Case Name** | View Reports |
| **Purpose** | Allow admins to generate detailed business reports for selected periods |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `period` (string: DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM), `dateFrom` (optional), `dateTo` (optional) |
| **Output Parameter/s** | `AdminReportsDto`: period, revenue, bookingsCount, topServices[], loyaltyStats (issued, redeemed) |
| **Pre-condition/s** | User authenticated with ADMIN role |
| **Post-condition** | Report displayed with revenue, booking counts, top services, loyalty statistics |
| **Successful Scenario** | 1. Admin navigates to `/admin/reports`<br>2. Admin selects period (dropdown) or custom date range<br>3. System sends GET `/admin/reports` with period param<br>4. Backend returns report data for period<br>5. Frontend renders ReportsView:<br>   - Revenue summary card<br>   - Total bookings count<br>   - TopServices table (service name, count)<br>   - LoyaltyStats (stamps issued, rewards redeemed)<br>6. Admin can export or print report |
| **Exceptions** | E1: No data for period → Show "No bookings in this period"<br>E2: Invalid date range → Show "End date must be after start date"<br>E3: Network error → Show error, allow retry<br>E4: Export fails → Show "Export unavailable" |
| **Additional Remarks** | Period presets: Today, This Week, This Month, This Year, Custom; topServices limited to 10; loyaltyStats from stamp/redeem events; print uses window.print(); PDF export not in MVP |

---

## UC20: Manage Loyalty Settings

| Field | Details |
|-------|---------|
| **Use Case Number** | UC22 |
| **Use Case Name** | Manage Loyalty Settings |
| **Purpose** | Allow admins to configure loyalty program rules (stamps per service, stamps per amount, rewards, expiry) |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `stampsPerService` (int), `stampsPerAmount` (int), `amountThreshold` (int, centavos), `freeServiceReward` (string), `cardExpiryMonths` (int) |
| **Output Parameter/s** | `LoyaltySettingsDto` (updated settings) |
| **Pre-condition/s** | User authenticated with ADMIN role |
| **Post-condition** | Loyalty program rules updated; affects stamp earning (UC17) and redemption (UC19) |
| **Successful Scenario** | 1. Admin navigates to `/admin/settings`<br>2. System sends GET `/admin/settings`<br>3. Backend returns current LoyaltySettingsDto<br>4. Frontend renders SettingsForm with current values:<br>   - Stamps per service visit<br>   - Stamps per ₱X amount spent<br>   - Amount threshold (₱)<br>   - Free service reward name<br>   - Card expiry (months)<br>5. Admin modifies values → submits → POST `/admin/settings`<br>6. Backend validates, updates settings<br>7. Frontend shows success toast; new rules apply to future stamps/redemptions |
| **Exceptions** | E1: Invalid values (negative) → Show "Values must be positive"<br>E2: amountThreshold = 0 with stampsPerAmount > 0 → Show "Threshold required"<br>E3: freeServiceReward empty → Show "Reward name required"<br>E4: Network error → Form retains values, show retry |
| **Additional Remarks** | Settings affect UC17 (earning) and UC19 (redemption); changes not retroactive; stampsPerService + stampsPerAmount both apply; cardExpiryMonths from lastStampAt; validation on backend |

---

## UC21: Manage Customers

| Field | Details |
|-------|---------|
| **Use Case Number** | UC23 |
| **Use Case Name** | Manage Customers |
| **Purpose** | Allow admins to view customer list with booking/loyalty stats and search |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `page`, `size`, `search` (name/email/phone), `role` (filter) |
| **Output Parameter/s** | Paginated `CustomerListDto[]`: id, name, email, phone, role, createdAt, bookingCount, loyaltyStamps |
| **Pre-condition/s** | User authenticated with ADMIN role |
| **Post-condition** | Customer table displayed with stats; admin can view details, add notes (UC24) |
| **Successful Scenario** | 1. Admin navigates to `/admin/customers`<br>2. System sends GET `/admin/customers` with query params<br>3. Backend returns paginated customers with aggregated stats<br>4. Frontend renders CustomersTable: Name, Email, Phone, Role, Joined, Bookings, Stamps, Actions<br>5. Admin searches by name/email/phone<br>6. Admin clicks "Add Note" → triggers UC24<br>7. Admin can view customer's bookings/loyalty details |
| **Exceptions** | E1: No customers → Show empty state<br>E2: Search returns no results → Show "No customers match"<br>E3: Network error → Show error toast<br>E4: Customer role change → Not in MVP (role fixed at registration) |
| **Additional Remarks** | bookingCount and loyaltyStamps aggregated backend; search debounced 300ms; role column shows CUSTOMER/ADMIN; click row → expand for details; bulk actions not in MVP |

---

## UC22: Manage Customer Notes

| Field | Details |
|-------|---------|
| **Use Case Number** | UC24 |
| **Use Case Name** | Manage Customer Notes |
| **Purpose** | Allow admins to add private notes/nicknames to customer profiles for internal reference |
| **Primary Actor** | Admin |
| **Secondary Actor** | System (Spring Boot Backend) |
| **Input Parameter/s** | `userId` (string, path), `content` (string), `nickname` (string, optional) |
| **Output Parameter/s** | `CustomerNoteDto`: id, userId, adminId, content, nickname, createdAt |
| **Pre-condition/s** | User authenticated with ADMIN role; customer exists |
| **Post-condition** | Note saved to customer profile; visible in admin customers table; not visible to customer |
| **Successful Scenario** | 1. Admin views customers table (UC23)<br>2. Admin clicks "Add Note" button for a customer<br>3. Modal opens with NoteForm: content (textarea), nickname (optional)<br>4. Admin fills form → submits → POST `/admin/customers/{userId}/notes`<br>5. Backend creates note with adminId, timestamp<br>6. Backend returns CustomerNoteDto<br>7. Frontend shows success toast; note appears in customer row (expandable)<br>8. Admin can add multiple notes per customer; notes persist |
| **Exceptions** | E1: Empty content → Show "Note content required"<br>E2: Customer not found → Show "Customer no longer exists"<br>E3: Network error → Modal retains data, show retry<br>E4: Note too long (>1000 chars) → Show "Note too long" |
| **Additional Remarks** | Notes private (admin only); nickname shows in customers table; multiple notes per customer; notes timestamped with admin name; rich text not in MVP |

---

## Summary Table

| UC#  | Use Case Name | Primary Actor | Package | API Endpoint(s) |
|------|---------------|---------------|---------|-----------------|
| UC1  | Register Account | Public | Authentication | POST `/auth/register` |
| UC2  | Login | Public | Authentication | POST `/auth/login` |
| UC3  | View Profile | Customer | Authentication | GET/PUT `/auth/me` |
| UC4  | View Available Dates | Public/Customer | Availability | GET `/availability` |
| UC5  | View Active Services | Public/Customer | Service | GET `/services` |
| UC6  | Create Booking | Customer | Booking | POST `/bookings` |
| UC7  | View My Bookings | Customer | Booking | GET `/bookings` |
| UC8  | View All Bookings | Admin | Booking | GET `/admin/bookings` |
| UC9  | Update Booking Status | Admin | Booking | PUT `/admin/bookings/{id}/status` |
| UC10 | Manage Services (CRUD) | Admin | Service | GET/POST/PUT/DELETE `/admin/services` |
| UC11 | Manage Availability (CRUD) | Admin | Availability | GET/POST/PUT/DELETE `/admin/availability` |
| UC12 | View Public Gallery | Public/Customer | Gallery | GET `/gallery` |
| UC13 | Manage Gallery (CRUD) | Admin | Gallery | GET/POST/PUT/DELETE `/admin/gallery` |
| UC14 | View My Loyalty Card | Customer | Loyalty | GET `/loyalty/card` |
| UC15 | Earn Stamps via QR Code | Customer | Loyalty | POST `/loyalty/stamp` |
| UC16 | View All Loyalty Cards | Admin | Loyalty | GET `/admin/loyalty` |
| UC17 | Redeem Stamps | Customer | Loyalty | POST `/loyalty/redeem` |
| UC18 | View Dashboard Stats | Admin | Admin Dashboard | GET `/admin/stats` |
| UC19 | View Reports | Admin | Admin Dashboard | GET `/admin/reports` |
| UC20 | Manage Loyalty Settings | Admin | Admin Dashboard | GET/POST `/admin/settings` |
| UC21 | Manage Customers | Admin | Admin Dashboard | GET `/admin/customers` |
| UC22 | Manage Customer Notes | Admin | Admin Dashboard | POST `/admin/customers/{userId}/notes` |

---

**Note**: The Use-Case-D.txt diagram shows 22 use cases (UC1–UC24, with UC10 and UC12 not defined in the diagram). This document covers all 22 use cases present in the diagram. If UC10 and UC12 need to be defined, they would require additional requirements gathering.