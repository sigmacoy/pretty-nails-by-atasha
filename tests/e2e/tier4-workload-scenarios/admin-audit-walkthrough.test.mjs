import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile } from '../helpers/component-analyzer.mjs';

test('T4-04: Admin customer management renders quiet typographic empty state during search filtering', () => {
  const content = readSourceFile('frontend/src/components/admin/customers/CustomersTable.tsx');
  assert.ok(content.includes('customers.length === 0'), 'Must inspect customers length');
  assert.ok(content.includes('font-serif font-medium text-stone-900 dark:text-rose-50'), 'Headline must use font-serif');
  assert.ok(!content.includes('lucide-users'), 'Must not render users icon circle');
});

test('T4-05: Admin portfolio management uses local high-resolution assets without external dependencies', () => {
  const sql = readSourceFile('pretty-nails-backend/src/main/resources/data.sql');
  assert.ok(sql.includes('/gallery/sample2.jpg'), 'Must link local asset sample2.jpg');
  assert.ok(sql.includes('/gallery/sample3.jpg'), 'Must link local asset sample3.jpg');
  assert.ok(!sql.includes('unsplash.com'), 'Must not link external Unsplash images');
});

test('T4-06: Admin appointment queue transitions emit operational salon toast messages', () => {
  const content = readSourceFile('frontend/src/components/admin/bookings/StatusAction.tsx');
  assert.ok(
    content.includes('Appointment status updated to ${getSentenceLabel(status)}'),
    'Must display operational status transition toast'
  );
  assert.ok(!content.includes("toast.success('Success!')"), 'Must not emit generic alert text');
});
