-- V2: Create partial unique index to prevent double-booking for active slots only
-- Only one PENDING or CONFIRMED booking per date/time slot
CREATE UNIQUE INDEX uk_booking_slot_active ON bookings (appointment_date, start_time) WHERE status IN ('PENDING', 'CONFIRMED');