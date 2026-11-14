import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile } from '../helpers/component-analyzer.mjs';

// Feature 10: R4.1 Sonner Warm Stone Boundaries

test('T2-46: Light mode toast background matches exact warm stone hex #FFF0F3', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('bg-[#FFF0F3]'), 'Toaster class must specify exact uppercase hex #FFF0F3');
});

test('T2-47: Dark mode toast background matches exact warm dark stone hex #160D12', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('dark:bg-[#160D12]'), 'Toaster class must specify exact uppercase hex #160D12');
});

test('T2-48: Toaster position is configured to top-right viewport anchor', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('position="top-right"'), 'Toaster must position at top-right for non-intrusive alerts');
});

test('T2-49: Toast action button specifies rose-900 background with hover transition', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('actionButton:'), 'Toaster must configure actionButton classNames');
  assert.ok(content.includes('bg-rose-900'), 'actionButton must use bg-rose-900');
  assert.ok(content.includes('hover:bg-rose-950'), 'actionButton must use hover:bg-rose-950');
});

test('T2-50: Toast cancel button specifies neutral stone styling across light and dark modes', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('cancelButton:'), 'Toaster must configure cancelButton classNames');
  assert.ok(content.includes('bg-stone-200'), 'cancelButton must use bg-stone-200 in light');
  assert.ok(content.includes('dark:bg-stone-800'), 'cancelButton must use dark:bg-stone-800 in dark');
});

// Feature 11: R4.2 Operational Toast Copy Boundaries

test('T2-51: StatusAction fallback error toast reports descriptive operational failure', () => {
  const content = readSourceFile('frontend/src/components/admin/bookings/StatusAction.tsx');
  assert.ok(
    content.includes("'Unable to update appointment status'"),
    'StatusAction must fall back to clear operational error description'
  );
});

test('T2-52: BookingForm fallback error toast reports clear retry instructions', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(
    content.includes("'Could not submit reservation request. Check your details and retry.'"),
    'BookingForm error handler must provide calm retry guidance'
  );
});

test('T2-53: Booking submission toast copy explicitly emphasizes manual staff review', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(
    content.includes('Atasha will review your downpayment reference to confirm your slot'),
    'Submission toast must state manual review by Atasha'
  );
});

test('T2-54: Customer booking cancellation failure toast reports descriptive fallback', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  assert.ok(
    content.includes("'Could not cancel this reservation. Retry or contact the studio.'"),
    'my-bookings cancellation handler must provide informative fallback'
  );
});

test('T2-55: Toaster error styling harmonizes with rose palette', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(
    content.includes("error: 'border-rose-300 dark:border-rose-900"),
    'Toaster error toast style must harmonize with rose border tokens'
  );
});
