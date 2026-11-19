Identified Gaps and Missing Features

1. Date String Mismatch in Availability Lookups

Problem: The backend serializes availability date as ISO-8601 LocalDateTime (e.g., "2026-11-20T00:00:00"). The frontend compares this with YYYY-MM-DD using exact string equality (a.date === dateStr) in BookingForm.tsx, availability/page.tsx, and admin/availability/page.tsx.
Impact: Custom availability intervals, blocked days, and studio vacation dates fail to match on the client calendar, causing inaccurate schedule displays.
Fix: Normalize the comparison using a.date.split('T')[0] === dateStr across all availability lookups.
Status: ⏳ PENDING

2. Concurrent Slot Booking Race Condition

Problem: When two clients book the same date and time slot simultaneously, BookingService.java validates existing bookings using count checks before executing bookingRepository.save(booking). No unique database constraint or pessimistic lock exists for (appointmentDate, startTime) where status is PENDING or CONFIRMED.
Impact: Double-booking of identical 30-minute time slots can occur during peak traffic.
Fix: Add slot concurrency validation checking existsByAppointmentDateAndStartTimeAndStatusIn inside BookingService.java and enforce a transactional lock. Add DB-level partial unique index for (appointment_date, start_time) WHERE status IN ('PENDING','CONFIRMED').
Status: ⏳ PENDING (code-level check exists, DB constraint missing)

3. Timezone Discrepancy (Asia/Manila vs Server UTC)

Problem: The backend entity maps timestamps using LocalDateTime and LocalDate.parse() without specifying the studio timezone (ZoneId.of("Asia/Manila")). Server deployments running in UTC will evaluate "today" and "tomorrow" 8 hours behind local studio time.
Impact: Appointment cutoff dates, 24-hour cancellation windows, and slot availability boundaries misalign with Manila standard time.
Fix: Explicitly configure the JVM timezone and wrap current time calculations with ZonedDateTime.now(ZoneId.of("Asia/Manila")).
Status: ⚠️ PARTIAL - ManilaTimeProvider exists but User.isAccountNonLocked() uses LocalDateTime.now() (server timezone)

4. Missing Client Self-Service Reschedule Endpoint

Problem: Customer portal copy states that clients can reschedule appointments up to 24 hours in advance. However, the backend exposes only cancel (/api/bookings/{id}/cancel), with no customer reschedule endpoint.
Impact: Clients cannot change appointment dates directly through the interface; they must cancel and recreate bookings, losing their deposit link.
Fix: Add a PUT /api/bookings/{id}/reschedule endpoint with a 24-hour cutoff validation check and update the customer appointment card UI.
Status: ⏳ PENDING

5. Customer Cancellation Missing 24-Hour Cutoff Enforcement

Problem: BookingService.cancelBookingByCustomer checks that status is PENDING or CONFIRMED, but does not verify whether the appointment is at least 24 hours in the future.
Impact: Clients can cancel minutes before a reserved session, causing unfillable studio vacancy.
Fix: Add validation ensuring LocalDateTime.now().plusHours(24).isBefore(appointmentDateTime) before allowing customer cancellation.
Status: ⏳ PENDING

6. Deposit Image Upload Memory and Size Limits

Problem: FileStorageService.java validates MIME types and file extensions, but does not sanitize EXIF metadata or enforce dimension ceilings. Very large mobile camera photos (e.g., 10MB+) can exhaust server memory during upload.
Impact: Upload failures or server latency when uploading payment proof images.
Fix: Enforce explicit request size limits (max 5MB) in application.yml and add client-side image compression in FileUpload.tsx before transmission.
Status: ⏳ PENDING
