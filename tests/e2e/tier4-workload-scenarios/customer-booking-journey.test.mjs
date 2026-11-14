import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile } from '../helpers/component-analyzer.mjs';

test('T4-01: Customer journey begins at service catalogue with typographic empty states and clear navigation', () => {
  const servicesContent = readSourceFile('frontend/src/app/(public)/services/page.tsx');
  assert.ok(servicesContent.includes('No services found in this category'), 'Must provide quiet empty state');
  assert.ok(servicesContent.includes('font-serif'), 'Must style headline with font-serif');
  assert.ok(servicesContent.includes('Select another category above'), 'Must guide customer to continue exploring');
});

test('T4-02: Customer inputs personal reservation details with visible headers and subtle rose focus', () => {
  const bookingContent = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(bookingContent.includes('Full Name'), 'Customer step requires visible Full Name header');
  assert.ok(bookingContent.includes('Mobile Number'), 'Customer step requires visible Mobile Number header');
  assert.ok(bookingContent.includes('focus:ring-rose-800'), 'Form inputs must apply rose hairline focus styling');
});

test('T4-03: Customer attaches GCash/Maya deposit proof and receives manual studio review guidance', () => {
  const bookingContent = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(bookingContent.includes('Payment Receipt Screenshot'), 'Must render atelier receipt card');
  assert.ok(bookingContent.includes('5 * 1024 * 1024'), 'Must enforce client-side 5MB limit');
  assert.ok(bookingContent.includes('image/jpeg,image/png'), 'Must enforce JPG/PNG receipt format');
  assert.ok(
    bookingContent.includes('Atasha will review your downpayment reference to confirm your slot'),
    'Must advise customer of manual studio verification'
  );
});
