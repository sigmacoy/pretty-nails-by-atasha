import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readSourceFile,
  parseTsxAst,
  extractClassTokens,
  extractAstClassTokens,
  assertContainsTokens,
  assertExcludesTokens,
  extractJsxElementNames
} from '../helpers/component-analyzer.mjs';

// Feature 5: R2.1 UI Input Primitives

test('T1-21: Input component specifies rose hairline focus tokens and excludes blue rings', () => {
  const content = readSourceFile('frontend/src/components/ui/Input.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'focus:outline-none',
    'focus:ring-1',
    'focus:ring-rose-800/30',
    'focus:border-rose-800/40'
  ]);
  assertExcludesTokens(tokens, [
    'focus-visible:ring-primary',
    'focus-visible:ring-2',
    'focus:ring-blue-500'
  ]);
});

test('T1-22: Textarea component specifies rose hairline focus tokens and excludes generic primary rings', () => {
  const content = readSourceFile('frontend/src/components/ui/Textarea.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'focus:outline-none',
    'focus:ring-1',
    'focus:ring-rose-800/30',
    'focus:border-rose-800/40'
  ]);
  assertExcludesTokens(tokens, [
    'focus-visible:ring-primary',
    'focus-visible:ring-2'
  ]);
});

test('T1-23: Select component specifies rose hairline focus tokens and excludes generic primary rings', () => {
  const content = readSourceFile('frontend/src/components/ui/Select.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'focus:outline-none',
    'focus:ring-1',
    'focus:ring-rose-800/30',
    'focus:border-rose-800/40'
  ]);
  assertExcludesTokens(tokens, [
    'focus-visible:ring-primary',
    'focus-visible:ring-2'
  ]);
});

test('T1-24: Input error state harmonizes destructive borders with aria-invalid specification', () => {
  const sf = parseTsxAst('frontend/src/components/ui/Input.tsx');
  const tokens = extractAstClassTokens(sf);
  assertContainsTokens(tokens, [
    'border-destructive',
    'focus:ring-destructive/30',
    'focus:border-destructive/40'
  ]);
  const content = readSourceFile('frontend/src/components/ui/Input.tsx');
  assert.ok(content.includes('aria-invalid'), 'Input must specify aria-invalid attribute for accessibility');
  assert.ok(content.includes('role="alert"'), 'Input must announce error text with role alert');
});

test('T1-25: Input disabled state specifies disabled cursor and opacity styling', () => {
  const sf = parseTsxAst('frontend/src/components/ui/Input.tsx');
  const tokens = extractAstClassTokens(sf);
  assertContainsTokens(tokens, [
    'disabled:cursor-not-allowed',
    'disabled:opacity-50'
  ]);
});

// Feature 7: R2.3 Fixed Field Headers

test('T1-31: Input primitive declares fixed label element before input element in JSX hierarchy', () => {
  const sf = parseTsxAst('frontend/src/components/ui/Input.tsx');
  const elements = extractJsxElementNames(sf);
  assert.ok(elements.includes('label'), 'Input must declare a label JSX element');
  assert.ok(elements.includes('input'), 'Input must declare an input JSX element');
  const labelIndex = elements.indexOf('label');
  const inputIndex = elements.indexOf('input');
  assert.ok(labelIndex < inputIndex, 'Label element must precede input element in DOM hierarchy');
  const content = readSourceFile('frontend/src/components/ui/Input.tsx');
  assert.ok(content.includes('htmlFor={inputId}'), 'Label must connect to input through htmlFor');
});

test('T1-32: Textarea primitive declares fixed label element before textarea element in JSX hierarchy', () => {
  const sf = parseTsxAst('frontend/src/components/ui/Textarea.tsx');
  const elements = extractJsxElementNames(sf);
  assert.ok(elements.includes('label'), 'Textarea must declare a label JSX element');
  assert.ok(elements.includes('textarea'), 'Textarea must declare a textarea JSX element');
  const labelIndex = elements.indexOf('label');
  const textareaIndex = elements.indexOf('textarea');
  assert.ok(labelIndex < textareaIndex, 'Label element must precede textarea element in DOM hierarchy');
  const content = readSourceFile('frontend/src/components/ui/Textarea.tsx');
  assert.ok(content.includes('htmlFor={textareaId}'), 'Label must connect to textarea through htmlFor');
});

test('T1-33: Select primitive declares fixed label element before select element in JSX hierarchy', () => {
  const sf = parseTsxAst('frontend/src/components/ui/Select.tsx');
  const elements = extractJsxElementNames(sf);
  assert.ok(elements.includes('label'), 'Select must declare a label JSX element');
  assert.ok(elements.includes('select'), 'Select must declare a select JSX element');
  const labelIndex = elements.indexOf('label');
  const selectIndex = elements.indexOf('select');
  assert.ok(labelIndex < selectIndex, 'Label element must precede select element in DOM hierarchy');
  const content = readSourceFile('frontend/src/components/ui/Select.tsx');
  assert.ok(content.includes('htmlFor={selectId}'), 'Label must connect to select through htmlFor');
});

test('T1-34: BookingForm declares explicit labels for customer details inputs', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes('Full Name'), 'BookingForm must declare visible Full Name label text');
  assert.ok(content.includes('Mobile Number'), 'BookingForm must declare visible Mobile Number label text');
  assert.ok(content.includes('Consultation Notes'), 'BookingForm must declare visible Consultation Notes label text');
});

test('T1-35: Form control labels use standard font-sans and legible text sizing', () => {
  const content = readSourceFile('frontend/src/components/ui/Input.tsx');
  assert.ok(content.includes('block text-xs font-medium'), 'Input label must use legible block text styling');
  assert.ok(content.includes('font-sans'), 'Input label must use font-sans');
  const textareaContent = readSourceFile('frontend/src/components/ui/Textarea.tsx');
  assert.ok(textareaContent.includes('block text-xs font-medium'), 'Textarea label must use block text styling');
  assert.ok(textareaContent.includes('font-sans'), 'Textarea label must use font-sans');
});
