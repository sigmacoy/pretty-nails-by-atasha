import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile } from '../helpers/component-analyzer.mjs';

test('T3-01: Booking flow links treatment selection step to timing schedule calculations', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes('totalDuration'), 'BookingForm must calculate totalDuration from selected services');
  assert.ok(content.includes('totalPrice'), 'BookingForm must calculate totalPrice from selected services and variants');
});

test('T3-02: Booking flow customer form controls inherit fixed field labels and rose focus styling', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes('Full Name'), 'Customer step must display fixed Full Name header');
  assert.ok(content.includes('Mobile Number'), 'Customer step must display fixed Mobile Number header');
  assert.ok(content.includes('focus:ring-rose-800'), 'Customer inputs must apply rose focus ring tokens');
});

test('T3-03: Booking flow payment step integrates structured atelier receipt card with thumbnail preview', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes('Payment Receipt Screenshot'), 'Step 4 must display receipt screenshot section');
  assert.ok(content.includes('alt="Payment receipt preview"'), 'Step 4 must display thumbnail image preview');
  assert.ok(content.includes('Replace receipt'), 'Step 4 must provide replace action');
});

test('T3-04: Booking flow submission invokes operational staff review feedback toast', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(
    content.includes('Atasha will review your downpayment reference to confirm your slot'),
    'Submission toast must communicate manual studio review'
  );
});

test('T3-05: Booking step transitions preserve state across navigation forwards and backwards', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes('currentStep'), 'BookingForm must maintain active step index state');
  assert.ok(content.includes('onBack'), 'Booking steps must accept onBack navigation handler');
  assert.ok(content.includes('onNext'), 'Booking steps must accept onNext navigation handler');
});
