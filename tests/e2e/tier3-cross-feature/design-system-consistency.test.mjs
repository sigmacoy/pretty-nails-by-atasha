import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile, extractClassTokens, assertContainsTokens } from '../helpers/component-analyzer.mjs';

test('T3-06: Uniform rose hairline border tokens are shared across Table and FileUpload', () => {
  const tableContent = readSourceFile('frontend/src/components/ui/Table.tsx');
  const tableTokens = extractClassTokens(tableContent);
  assertContainsTokens(tableTokens, ['border-rose-200/80', 'dark:border-rose-950/60']);

  const fileUploadContent = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  const fileUploadTokens = extractClassTokens(fileUploadContent);
  assertContainsTokens(fileUploadTokens, ['border-rose-200/80', 'dark:border-rose-950/60']);
});

test('T3-07: Uniform focus ring specification is shared across Input, Textarea, and Select primitives', () => {
  const inputContent = readSourceFile('frontend/src/components/ui/Input.tsx');
  const inputTokens = extractClassTokens(inputContent);
  assertContainsTokens(inputTokens, ['focus:ring-1', 'focus:ring-rose-800/30', 'focus:border-rose-800/40']);

  const textareaContent = readSourceFile('frontend/src/components/ui/Textarea.tsx');
  const textareaTokens = extractClassTokens(textareaContent);
  assertContainsTokens(textareaTokens, ['focus:ring-1', 'focus:ring-rose-800/30', 'focus:border-rose-800/40']);

  const selectContent = readSourceFile('frontend/src/components/ui/Select.tsx');
  const selectTokens = extractClassTokens(selectContent);
  assertContainsTokens(selectTokens, ['focus:ring-1', 'focus:ring-rose-800/30', 'focus:border-rose-800/40']);
});

test('T3-08: Editorial serif typography is consistently applied to headlines across all empty states', () => {
  const tableContent = readSourceFile('frontend/src/components/ui/Table.tsx');
  assert.ok(tableContent.includes('font-serif'), 'Table empty headline must use font-serif');

  const galleryContent = readSourceFile('frontend/src/app/(public)/gallery/page.tsx');
  assert.ok(galleryContent.includes('font-serif'), 'Gallery empty headline must use font-serif');

  const servicesContent = readSourceFile('frontend/src/app/(public)/services/page.tsx');
  assert.ok(servicesContent.includes('font-serif'), 'Services empty headline must use font-serif');

  const customerContent = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  assert.ok(customerContent.includes('font-serif'), 'Customer bookings empty headline must use font-serif');
});

test('T3-09: Instrument Sans body typography is consistently applied to descriptions and controls', () => {
  const tableContent = readSourceFile('frontend/src/components/ui/Table.tsx');
  assert.ok(tableContent.includes('font-sans'), 'Table description must use font-sans');

  const inputContent = readSourceFile('frontend/src/components/ui/Input.tsx');
  assert.ok(inputContent.includes('font-sans'), 'Input field must use font-sans');

  const layoutContent = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(layoutContent.includes('font-sans'), 'Sonner toast options must specify font-sans');
});

test('T3-10: Standard rounded-2xl border radius is shared across empty cards and upload cards', () => {
  const tableContent = readSourceFile('frontend/src/components/ui/Table.tsx');
  const tableTokens = extractClassTokens(tableContent);
  assertContainsTokens(tableTokens, ['rounded-2xl']);

  const fileUploadContent = readSourceFile('frontend/src/components/ui/FileUpload.tsx');
  const fileUploadTokens = extractClassTokens(fileUploadContent);
  assertContainsTokens(fileUploadTokens, ['rounded-2xl']);
});
