# Standalone USER Features (one module per developer)

## Dev 1: Booking & Scheduling (Mr. Ambe)
- Customer date/time selection (tomorrow to 1 month ahead)
- Inspiration photo upload
- Owner approve/reject workflow
- Owner queue view (top is first, bottom is last) and monthly day-by-day view
- Owner availability: edit working days, block holidays and breaks 
- Downpayment/reservation fee tracking, no-show flagging, and blocking of repeat offenders

## Dev 2: Digital Loyalty (Mr. Bacalla)
- QR code generation and scanning
- Stamp logic (1 stamp per nail set, or per ₱500 paid; over ₱1000 gives 2 stamps)
- Free or discounted reward at the stamp target
- 12-month stamp expiration
- Customer stamp dashboard

## Dev 3: Gallery + Services/Price Menu (Mr. Bacus)
- Owner-only nail design gallery (post, edit, delete) with a public view for customers
- Services CRUD (BIAB gel, soft gel extension, pedicure, cleaning)
- Prices by nail length and per-nail add-on prices, editable by the owner

# Final Layer: Reporting & Customer Notes (not standalone, read-only)
- Monthly customer count and earnings
- Customer visit history
- Owner notes and custom nicknames per customer
- This module reads Booking and Loyalty data, so build it last. Assign it to whoever finishes first.

# Shared Features (agree on these first)
- User Authentication & Roles: Facebook/Gmail login, Owner/Admin vs. Customer roles
- Database Models: User, Appointment, Service, Payment, Stamp (fixed fields agreed by all three)
- Core UI/Theme: responsive layout (separate PC and phone views), navbar, light yellow to pinkish theme (more pink), no emojis

# To Avoid Merge Conflicts
- Agree on the shared table fields before coding.
- Each developer works only in their own folder or module.
- Modules talk to each other only through the shared models (for example, Loyalty reads a completed Appointment to give a stamp).