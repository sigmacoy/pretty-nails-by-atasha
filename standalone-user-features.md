# Standalone USER Features (one module per developer)

## Dev 1: Booking & Scheduling (Mr. Ambe)
- Date/time slot selection (tomorrow to 1 month ahead) with real-time availability
- Inspiration photo upload
- Downpayment/reservation fee proof upload (e.g. GCash screenshot)
- Appointment status tracking & booking history (Pending/Confirmed/Completed)
- Reschedule or cancellation requests

## Dev 2: Digital Loyalty (Mr. Bacalla)
- Digital stamp card view & balance
- Personal customer QR code presentation for scanning
- Reward progress tracking (e.g., progress toward free gel set)
- Voucher redemption (discount/freebie)
- Stamp/reward history

## Dev 3: Gallery + Services/Price Menu (Mr. Bacus)
- Full service menu browsing with tiered pricing (length, add-ons)
- Interactive nail design gallery browsing
- Style/color/shape search and filters
- Favoriting/saving designs
- "Book this design" direct action from the gallery

# Shared Features (agree on these first)
- User Authentication & Roles: Facebook/Gmail login, Owner/Admin vs. Customer roles
- Database Models: User, Appointment, Service, Payment, Stamp (fixed fields agreed by all three)
- Core UI/Theme: responsive layout (separate PC and phone views), navbar, light yellow to pinkish theme (more pink), no emojis

# To Avoid Merge Conflicts
- Agree on the shared table fields before coding.
- Each developer works only in their own folder or module.
- Modules talk to each other only through the shared models (for example, Loyalty reads a completed Appointment to give a stamp).
