import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile, extractClassTokens, assertContainsTokens } from '../helpers/component-analyzer.mjs';

test('T3-11: Sonner Toaster defines paired light and dark palette tokens simultaneously', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('bg-[#FFF0F3]'), 'Must declare light mode background hex');
  assert.ok(content.includes('dark:bg-[#160D12]'), 'Must declare dark mode background hex');
  assert.ok(content.includes('border-rose-200'), 'Must declare light mode border');
  assert.ok(content.includes('dark:border-rose-950'), 'Must declare dark mode border');
});

test('T3-12: Form control primitives define paired light and dark surface classes simultaneously', () => {
  const content = readSourceFile('frontend/src/components/ui/Input.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'border-stone-200',
    'dark:border-stone-700',
    'dark:bg-stone-900/60'
  ]);
});

test('T3-13: Empty state card containers declare paired light and dark surface classes', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'border-rose-200/80',
    'dark:border-rose-950/60',
    'dark:bg-[#1A0E15]/90'
  ]);
});

test('T3-14: Editorial headlines enforce high-contrast light and dark text pairings', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'text-stone-900',
    'dark:text-rose-50'
  ]);
});
