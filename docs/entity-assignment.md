# Entity Assignment per Developer

Based on the feature breakdown, here's the division of the 17 entities:

---

## Dev 1: Booking & Scheduling (Mr. Ambe)
**Features**: Date/time slot selection, real-time availability, inspiration photo upload, downpayment/reservation fee proof, appointment status tracking, booking history, reschedule/cancellation

| Entity | Purpose |
|--------|---------|
| **Booking.java** | Core appointment entity (maps to "Appointment" in shared models) |
| **BookingService.java** | Links bookings to services (many-to-many) |
| **Availability.java** | Time slot management for real-time availability |
| **Payment.java** | Downpayment/reservation fee proof (GCash screenshot), payment status |
| **Notification.java** | Appointment status updates (Pending/Confirmed/Completed), reminders |

---

## Dev 2: Digital Loyalty (Mr. Bacalla)
**Features**: Digital stamp card, personal QR code, reward progress tracking, voucher redemption, stamp/reward history

| Entity | Purpose |
|--------|---------|
| **LoyaltyCard.java** | Digital stamp card view & balance |
| **LoyaltyStamp.java** | Individual stamps (maps to "Stamp" in shared models) |
| **CustomerNote.java** | Staff notes per customer (preferences, allergies, etc.) |
| **User.java** *(customer fields)* | Customer profile, QR code data, loyalty tier |
| **Account.java** *(customer fields)* | Customer account linkage, login methods |

---

## Dev 3: Gallery + Services/Price Menu (Mr. Bacus)
**Features**: Full service menu with tiered pricing, interactive gallery, search/filters, favoriting designs, "Book this design"

| Entity | Purpose |
|--------|---------|
| **Gallery.java** | Nail design gallery with images, style/color/shape tags |
| **Service.java** | Service menu items (manicure, gel, extensions, etc.) |
| **ServiceVariant.java** | Tiered pricing (length, add-ons, shapes) |
| **Setting.java** | Pricing rules, salon config, theme settings |

---

## Shared Entities (Agreed by All Three)
**Core models with fixed fields agreed upon before coding**

| Entity | Owner | Shared Fields |
|--------|-------|---------------|
| **User.java** | Dev 2 (customer) / Dev 1,3 (auth) | `id`, `email`, `name`, `role`, `provider`, `providerId`, `createdAt` |
| **Account.java** | Dev 2 (customer) / Dev 1,3 (auth) | `id`, `userId`, `provider`, `accessToken`, `refreshToken` |
| **AuditLog.java** | All | `id`, `entityType`, `entityId`, `action`, `oldValue`, `newValue`, `userId`, `timestamp` |
| **VerificationToken.java** | All (auth) | `id`, `userId`, `token`, `type`, `expiresAt` |
| **Session.java** | All (auth) | `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent` |

---

## Key Agreements Before Coding

### Shared Model Fields (Must Agree First)

**User.java** (minimal shared fields):
```java
- id: Long
- email: String
- name: String
- role: Enum (CUSTOMER, OWNER, ADMIN)
- provider: Enum (FACEBOOK, GOOGLE)
- providerId: String
- createdAt: LocalDateTime
- updatedAt: LocalDateTime
```

**Account.java** (minimal shared fields):
```java
- id: Long
- userId: Long (FK to User)
- provider: Enum (FACEBOOK, GOOGLE)
- accessToken: String
- refreshToken: String
- expiresAt: LocalDateTime
```

**Booking.java** (shared with Dev 2 for loyalty stamps):
```java
- id: Long
- customerId: Long (FK to User)
- status: Enum (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- appointmentDate: LocalDateTime
- totalAmount: BigDecimal
- downpaymentAmount: BigDecimal
- downpaymentProofUrl: String
- inspirationPhotoUrl: String
- createdAt: LocalDateTime
- updatedAt: LocalDateTime
```

**Payment.java** (shared with Dev 1):
```java
- id: Long
- bookingId: Long (FK to Booking)
- amount: BigDecimal
- method: Enum (GCASH, CASH, CARD)
- proofUrl: String
- status: Enum (PENDING, VERIFIED, REJECTED)
- verifiedAt: LocalDateTime
- verifiedBy: Long (FK to User)
```

**LoyaltyStamp.java** (shared with Dev 1 for auto-stamp on completed booking):
```java
- id: Long
- loyaltyCardId: Long (FK to LoyaltyCard)
- bookingId: Long (FK to Booking, nullable for manual stamps)
- stampType: Enum (SERVICE, REFERRAL, BIRTHDAY, MANUAL)
- createdAt: LocalDateTime
```

---

## Module Boundaries (To Avoid Merge Conflicts)

| Developer | Package/Module Path | Owns Entities |
|-----------|---------------------|---------------|
| Dev 1 (Ambe) | `com.prettynails.booking` | Booking, BookingService, Availability, Payment, Notification |
| Dev 2 (Bacalla) | `com.prettynails.loyalty` | LoyaltyCard, LoyaltyStamp, CustomerNote, User (cust fields), Account (cust fields) |
| Dev 3 (Bacus) | `com.prettynails.gallery` | Gallery, Service, ServiceVariant, Setting |
| Shared | `com.prettynails.shared` | User (core), Account (core), AuditLog, VerificationToken, Session |

---

## Cross-Module Communication (Via Shared Models Only)

```
Dev 1 (Booking) ──completes──► Booking.status = COMPLETED
                                    │
                                    ▼
Dev 2 (Loyalty) ──reads──► Booking ──creates──► LoyaltyStamp
                                    │
                                    ▼
Dev 3 (Gallery) ──reads──► Service/ServiceVariant (for "Book this design")
```

**Rule**: Modules only talk through shared model fields agreed above. No direct service calls across modules.