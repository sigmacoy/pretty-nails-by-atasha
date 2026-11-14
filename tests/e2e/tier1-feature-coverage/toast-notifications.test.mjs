import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile } from '../helpers/component-analyzer.mjs';

// Feature 10: R4.1 Sonner Warm Stone Theme (layout.tsx)

test('T1-46: Sonner Toaster configuration specifies warm stone background for light mode', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('bg-[#FFF0F3]'), 'Toaster toast class must specify bg-[#FFF0F3]');
});

test('T1-47: Sonner Toaster configuration specifies rose-200 border for light mode', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('border-rose-200'), 'Toaster toast class must specify border-rose-200');
});

test('T1-48: Sonner Toaster configuration specifies warm dark stone background for dark mode', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('dark:bg-[#160D12]'), 'Toaster toast class must specify dark:bg-[#160D12]');
});

test('T1-49: Sonner Toaster configuration specifies rose-950 border for dark mode', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('dark:border-rose-950'), 'Toaster toast class must specify dark:border-rose-950');
});

test('T1-50: Sonner Toaster typography inherits Instrument Sans with rounded-xl border radius', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('font-sans rounded-xl'), 'Toaster toast class must specify font-sans rounded-xl');
  assert.ok(content.includes('text-xs sm:text-sm'), 'Toaster text sizing must specify text-xs sm:text-sm');
});

// Feature 11: R4.2 Operational Toast Copy

test('T1-51: BookingForm submission toast copy reflects manual studio review policy', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(
    content.includes('Atasha will review your downpayment reference to confirm your slot'),
    'Submission toast must state manual downpayment review policy'
  );
  assert.ok(
    !content.includes('instantly confirmed'),
    'Submission toast must never state instant confirmation'
  );
});

test('T1-52: Admin booking status update toast uses operational appointment status copy', () => {
  const content = readSourceFile('frontend/src/components/admin/bookings/StatusAction.tsx');
  assert.ok(
    content.includes('Appointment status updated to ${getSentenceLabel(status)}'),
    'Status update toast must state specific operational appointment transition'
  );
});

test('T1-53: Customer booking cancellation toast uses operational cancellation copy', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  assert.ok(
    content.includes('Reservation cancelled and slot released'),
    'Cancellation toast must state cancellation confirmation'
  );
});

test('T1-54: Absence of instant confirmation claims across application source files', () => {
  const bookingContent = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(!bookingContent.includes('Instant confirmation'), 'BookingForm must not claim instant confirmation');
  assert.ok(!bookingContent.includes('instantly confirm'), 'BookingForm must not claim instant confirmation');

  const settingsContent = readSourceFile('frontend/src/app/(admin)/admin/settings/page.tsx');
  assert.ok(
    settingsContent.includes('Instant automatic slot confirmation is permanently disabled'),
    'Settings must document that instant confirmation is disabled'
  );
});

test('T1-55: Absence of bare generic alert copy across toast triggers', () => {
  const bookingContent = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(!bookingContent.includes("toast.success('Success!')"), 'BookingForm must not emit bare generic alert');
  assert.ok(!bookingContent.includes("toast.error('Error!')"), 'BookingForm must not emit bare generic error');

  const layoutContent = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(!layoutContent.includes("toast.success('Success')"), 'Layout must not emit generic alert');
});
