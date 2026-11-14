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

// Feature 5: R2.1 UI Input Primitives Boundaries

test('T2-21: Input error border styling harmonizes with destructive focus tokens', () => {
  const content = readSourceFile('frontend/src/components/ui/Input.tsx');
  assert.ok(
    content.includes("error && 'border-destructive focus:ring-destructive/30 focus:border-destructive/40'"),
    'Input must specify destructive focus ring and border classes when in error state'
  );
});

test('T2-22: Input disabled state applies disabled cursor and opacity reduction', () => {
  const sf = parseTsxAst('frontend/src/components/ui/Input.tsx');
  const tokens = extractAstClassTokens(sf);
  assertContainsTokens(tokens, [
    'disabled:cursor-not-allowed',
    'disabled:opacity-50'
  ]);
});

test('T2-23: Textarea provides minimum vertical boundary min-h-[80px]', () => {
  const content = readSourceFile('frontend/src/components/ui/Textarea.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, ['min-h-[80px]', 'w-full']);
});

test('T2-24: Select primitive supports disabled option elements', () => {
  const content = readSourceFile('frontend/src/components/ui/Select.tsx');
  assert.ok(
    content.includes('disabled={option.disabled}'),
    'Select option mapping must forward option.disabled state'
  );
});

test('T2-25: Input error message takes precedence over helperText', () => {
  const content = readSourceFile('frontend/src/components/ui/Input.tsx');
  assert.ok(
    content.includes('helperText && !error'),
    'Helper text must only render when error is falsy'
  );
});

// Feature 6: R2.2 Global Focus Visible Boundaries

test('T2-26: Global focus-visible ring thickness is exactly ring-1', () => {
  const content = readSourceFile('frontend/src/app/globals.css');
  const match = content.match(/:focus-visible\s*\{([^}]+)\}/);
  assert.ok(match, ':focus-visible must exist in globals.css');
  const body = match[1];
  assert.ok(body.includes('ring-1'), 'Focus visible ring width must be ring-1');
  assert.ok(!body.includes('ring-2'), 'Focus visible ring width must not be ring-2');
  assert.ok(!body.includes('ring-4'), 'Focus visible ring width must not be ring-4');
});

test('T2-27: Global focus-visible ring opacity is exactly ring-rose-800/30', () => {
  const content = readSourceFile('frontend/src/app/globals.css');
  assert.ok(
    content.includes('ring-rose-800/30'),
    'Global focus-visible ring must specify 30% opacity rose hairline'
  );
});

test('T2-28: Global focus-visible border opacity is exactly border-rose-800/40', () => {
  const content = readSourceFile('frontend/src/app/globals.css');
  assert.ok(
    content.includes('border-rose-800/40'),
    'Global focus-visible border must specify 40% opacity rose hairline'
  );
});

test('T2-29: Global focus-visible resets default browser outline with outline-none', () => {
  const content = readSourceFile('frontend/src/app/globals.css');
  assert.ok(
    content.includes('outline-none'),
    'Global focus-visible must reset default browser outline'
  );
});

test('T2-30: Button primitive incorporates smooth transition-colors on interaction', () => {
  const content = readSourceFile('frontend/src/components/ui/Button.tsx');
  assert.ok(
    content.includes('transition-colors'),
    'Button base styling must specify transition-colors'
  );
});

// Feature 7: R2.3 Fixed Field Headers Boundaries

test('T2-31: Input generates kebab-case HTML ID from label when id prop is omitted', () => {
  const content = readSourceFile('frontend/src/components/ui/Input.tsx');
  assert.ok(
    content.includes("id || label?.toLowerCase().replace(/\\s+/g, '-')"),
    'Input must derive kebab-case ID from label'
  );
});

test('T2-32: Textarea generates kebab-case HTML ID from label when id prop is omitted', () => {
  const content = readSourceFile('frontend/src/components/ui/Textarea.tsx');
  assert.ok(
    content.includes("id || label?.toLowerCase().replace(/\\s+/g, '-')"),
    'Textarea must derive kebab-case ID from label'
  );
});

test('T2-33: Select generates kebab-case HTML ID from label when id prop is omitted', () => {
  const content = readSourceFile('frontend/src/components/ui/Select.tsx');
  assert.ok(
    content.includes("id || label?.toLowerCase().replace(/\\s+/g, '-')"),
    'Select must derive kebab-case ID from label'
  );
});

test('T2-34: Fixed field headers consistently enforce text-xs font-medium styling', () => {
  const inputContent = readSourceFile('frontend/src/components/ui/Input.tsx');
  assert.ok(inputContent.includes('text-xs font-medium'), 'Input label must enforce text-xs font-medium');

  const textareaContent = readSourceFile('frontend/src/components/ui/Textarea.tsx');
  assert.ok(textareaContent.includes('text-xs font-medium'), 'Textarea label must enforce text-xs font-medium');

  const selectContent = readSourceFile('frontend/src/components/ui/Select.tsx');
  assert.ok(selectContent.includes('text-xs font-medium'), 'Select label must enforce text-xs font-medium');
});

test('T2-35: Fixed field headers consistently apply bottom margin mb-1.5 for spacing', () => {
  const inputContent = readSourceFile('frontend/src/components/ui/Input.tsx');
  assert.ok(inputContent.includes('mb-1.5'), 'Input label must apply mb-1.5');

  const textareaContent = readSourceFile('frontend/src/components/ui/Textarea.tsx');
  assert.ok(textareaContent.includes('mb-1.5'), 'Textarea label must apply mb-1.5');

  const selectContent = readSourceFile('frontend/src/components/ui/Select.tsx');
  assert.ok(selectContent.includes('mb-1.5'), 'Select label must apply mb-1.5');
});
