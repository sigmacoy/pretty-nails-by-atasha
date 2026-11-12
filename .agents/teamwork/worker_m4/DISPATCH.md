# Task Assignment: Milestone 4 - Class Diagram & ERD Fixes

## Working Directory
`/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone`

## State Folder
`/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m4`

## Mandatory Reference Documents
- `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/ORIGINAL_REQUEST.md` (MUST read before starting)
- `/Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/fix_diagrams_plan.md`
- `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/orchestrator/PROJECT.md`
- Backend entities: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/backend/src/main/java/com/prettynails/entity/`

## Exclusive Write Boundaries
- Files:
  - `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/class-diagram.txt`
  - `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/ERD.txt`
- State folder: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m4/`

## Objective & Requirements
Eliminate duplicate relations, standardize data types to UUID, resolve cardinality conflicts, and add missing associations across `class-diagram.txt` and `ERD.txt`:

### In `ERD.txt`:
1. Align Primary & Foreign Key Types to `UUID`:
   - Change `Long id PK` to `UUID id PK` across all entities (`User`, `Account`, `Service`, `ServiceVariant`, `Booking`, `BookingService`, `Payment`, `Availability`, `LoyaltyCard`, `LoyaltyStamp`, `CustomerNote`, `Session`, `VerificationToken`, `Gallery`, `Setting`).
   - Change corresponding FK fields (`userId`, `serviceId`, `variantId`, `bookingId`, `cardId`, `adminId`) to `UUID`.
2. Add missing association to `ServiceVariant`:
   `ServiceVariant ||--o{ BookingService : "bookingServices"`
3. Adjust Cardinality on `User` to `LoyaltyCard`:
   Change `User ||--|| LoyaltyCard` to `User ||--o| LoyaltyCard : "loyaltyCard"` (matching `class-diagram.txt`).
4. Link `Payment.verifiedBy`:
   Add relationship `User ||--o{ Payment : "verifiedPayments"` or annotate as admin FK.

### In `class-diagram.txt`:
1. Remove duplicate reverse association lines (Lines 630–658). Keep only one canonical association definition per pair:
   - Keep `User "1" *-- "0..*" Account : accounts` (remove duplicate)
   - Keep `User "1" *-- "0..*" Session : sessions` (remove duplicate)
   - Keep `User "1" *-- "0..*" Booking : bookings` (remove duplicate)
   - Keep `User "1" -- "0..1" LoyaltyCard : loyaltyCard` (remove duplicate)
   - Keep `Service "1" *-- "0..*" ServiceVariant : variants` (remove duplicate)
   - Keep `Service "1" *-- "0..*" BookingService : bookings` (remove duplicate)
   - Keep `Booking "1" *-- "0..*" BookingService : services` (remove duplicate)
   - Keep `Booking "1" -- "0..1" Payment : payment` (remove contradictory `Payment 0..* -- 1 Booking`)
   - Keep `Booking "1" *-- "0..*" LoyaltyStamp : loyaltyStamps` (remove duplicate)
   - Keep `LoyaltyCard "1" *-- "0..*" LoyaltyStamp : stamps` (remove duplicate)
2. Add missing association to `ServiceVariant`:
   `ServiceVariant "1" -- "0..*" BookingService : bookingServices`
3. Sanitize generic types for Mermaid compatibility:
   - Fix `Map~String, Object~` to `Map~String,Object~` (remove inner space).
   - Simplify nested generics in controller returns if needed to prevent renderer crashes.

5. Verify changes (syntax check and cross-file consistency).
6. Write completion report to `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m4/handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-11-12T01:30:01Z
Received message from a12f049c-3a98-425c-8af1-9e1a74e62c21:
You are Worker M4 assigned to fix and standardize `DIAGRAMS/class-diagram.txt` and `DIAGRAMS/ERD.txt`.
