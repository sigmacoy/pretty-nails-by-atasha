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

// Feature 8: R3.1 FileUpload Boundaries

test('T2-36: FileUpload client-side size calculation accurately evaluates bytes threshold', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  assert.ok(
    content.includes('file.size > maxSizeMB * 1024 * 1024'),
    'FileUpload must compute exact byte limit using maxSizeMB * 1024 * 1024'
  );
});

test('T2-37: FileUpload MIME type parser parses comma-separated format tokens', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  assert.ok(
    content.includes(".split(',')") && content.includes('.map((t) => t.trim().toLowerCase())'),
    'FileUpload must sanitize and split comma-delimited accept list'
  );
});

test('T2-38: FileUpload formats precise error message for disallowed file formats', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  assert.ok(
    content.includes('Only JPG and PNG receipt images are allowed'),
    'FileUpload must report specific allowed format copy'
  );
});

test('T2-39: FileUpload preview thumbnail frame enforces square aspect ratio', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'h-20',
    'w-20',
    'rounded-xl',
    'overflow-hidden',
    'object-cover'
  ]);
});

test('T2-40: FileUpload clear action resets internal error and controlled state', () => {
  const content = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  assert.ok(
    content.includes('setInternalError(null)'),
    'FileUpload clear function must clear active internal errors'
  );
  assert.ok(
    content.includes('setPreviewUrl(null)'),
    'FileUpload clear function must clear active preview URL'
  );
});

// Feature 9: R3.2 BookingForm Receipt Boundaries

test('T2-41: BookingForm receipt file size threshold enforces 5MB limit', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(
    content.includes('file.size > 5 * 1024 * 1024'),
    'BookingForm must test 5MB byte size boundary'
  );
});

test('T2-42: BookingForm receipt rejection toast matches operational copy', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(
    content.includes("toast.error('Receipt file size exceeds the 5MB limit')"),
    'BookingForm must display operational error toast for oversized receipts'
  );
});

test('T2-43: BookingForm receipt rejection for non-JPG/PNG formats matches salon copy', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(
    content.includes("toast.error('Only JPG and PNG receipt images are allowed')"),
    'BookingForm must display operational error toast for invalid MIME formats'
  );
});

test('T2-44: BookingForm receipt removal clears both file state and preview URL', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(
    content.includes('setReceiptFile(null)'),
    'BookingForm remove action must clear receiptFile state'
  );
  assert.ok(
    content.includes('setReceiptPreview(null)'),
    'BookingForm remove action must clear receiptPreview state'
  );
});

test('T2-45: BookingForm receipt input restricts file selection accept attribute', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(
    content.includes('accept="image/jpeg,image/png"'),
    'BookingForm receipt file input must restrict accept to image/jpeg,image/png'
  );
  assert.ok(
    content.includes('type="file"'),
    'BookingForm must render HTML file input for receipt uploads'
  );
});
