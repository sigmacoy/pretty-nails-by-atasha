import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readSourceFile,
  parseTsxAst,
  extractClassTokens,
  extractAstClassTokens,
  assertContainsTokens,
  assertExcludesTokens
} from '../helpers/component-analyzer.mjs';

// Feature 8: R3.1 Atelier Receipt Card (FileUpload.tsx)

test('T1-36: FileUpload idle state renders structured atelier card with solid hairline border', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'rounded-2xl',
    'border-rose-200/80',
    'dark:border-rose-950/60',
    'shadow-xs'
  ]);
  assertExcludesTokens(tokens, ['border-dashed']);
});

test('T1-37: FileUpload idle state specifies JPG and PNG format constraints with 5MB limit', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  assert.ok(content.includes('JPG or PNG'), 'FileUpload must specify JPG or PNG in constraint text');
  assert.ok(content.includes('maximum {maxSizeMB}MB') || content.includes('maximum 5MB'), 'FileUpload must display 5MB limit');
  assert.ok(content.includes("accept = 'image/jpeg,image/png'"), 'Default accept prop must restrict to JPEG and PNG');
  assert.ok(content.includes('maxSizeMB = 5'), 'Default maxSizeMB prop must default to 5');
});

test('T1-38: FileUpload preview renders thumbnail frame with rose border', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'h-20',
    'w-20',
    'rounded-xl',
    'border-rose-200/80',
    'object-cover'
  ]);
});

test('T1-39: FileUpload preview renders Replace receipt action button', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  assert.ok(content.includes('Replace receipt'), 'FileUpload must provide Replace receipt action');
});

test('T1-40: FileUpload preview renders Remove action button and callback trigger', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  assert.ok(/>\s*Remove\s*<\/button>/.test(content), 'FileUpload must provide Remove action button');
  assert.ok(content.includes('aria-label="Remove receipt attachment"'), 'FileUpload must provide accessible Remove button');
  assert.ok(content.includes('onRemove'), 'FileUpload must support onRemove callback prop');
});

// Feature 9: R3.2 Booking Form Receipt Upload (BookingForm.tsx)

test('T1-41: BookingForm payment step renders structured atelier receipt card without dashed drop zone', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  const receiptSection = content.slice(content.indexOf('Structured Atelier Receipt Card'), content.indexOf('BookingSummarySidebar'));
  assert.ok(!receiptSection.includes('border-dashed'), 'Booking receipt card must not use dashed borders');
  assert.ok(receiptSection.includes('border border-rose-200/80 dark:border-rose-950/60'), 'Must use rose hairline border');
});

test('T1-42: BookingForm validates file size limit of 5MB client-side', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes('5 * 1024 * 1024'), 'Must validate 5MB byte size limit');
  assert.ok(content.includes('Receipt file size exceeds the 5MB limit'), 'Must display specific operational error toast');
});

test('T1-43: BookingForm validates file format restricting to JPG and PNG only', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes("file.type !== 'image/jpeg' && file.type !== 'image/png'"), 'Must enforce JPEG and PNG MIME validation');
  assert.ok(content.includes('Only JPG and PNG receipt images are allowed'), 'Must display specific operational format toast');
});

test('T1-44: BookingForm renders immediate thumbnail preview frame for uploaded receipt', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes('alt="Payment receipt preview"'), 'Preview image must have descriptive alt attribute');
  assert.ok(content.includes('h-20 w-20 sm:h-24 sm:w-24'), 'Preview image container must have standard thumbnail dimensions');
  assert.ok(content.includes('rounded-xl border border-rose-200/80 dark:border-rose-900'), 'Preview container must use rose border');
});

test('T1-45: BookingForm provides Replace receipt and Remove actions for uploaded receipts', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  const receiptSection = content.slice(content.indexOf('Structured Atelier Receipt Card'), content.indexOf('BookingSummarySidebar'));
  assert.ok(receiptSection.includes('Replace receipt'), 'Booking receipt preview must provide Replace receipt control');
  assert.ok(receiptSection.includes('Remove'), 'Booking receipt preview must provide Remove control');
  assert.ok(receiptSection.includes('aria-label="Remove receipt attachment"'), 'Remove button must have accessible label');
});
