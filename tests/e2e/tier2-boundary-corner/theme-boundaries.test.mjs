import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile } from '../helpers/component-analyzer.mjs';

// Feature 14: R6.1 Studio Identity & Theme Boundaries

test('T2-66: Viewport light theme color is configured in root layout', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(
    content.includes("media: '(prefers-color-scheme: light)'"),
    'Viewport must configure media query for light color scheme'
  );
  assert.ok(
    content.includes('themeColor:'),
    'Viewport metadata must define themeColor array'
  );
});

test('T2-67: Viewport dark theme color is configured in root layout', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(
    content.includes("media: '(prefers-color-scheme: dark)'"),
    'Viewport must configure media query for dark color scheme'
  );
});

test('T2-68: Tailwind configuration defines warm rose palette extensions', () => {
  const content = readSourceFile('frontend/tailwind.config.ts');
  assert.ok(content.includes('rose:'), 'Tailwind config must define rose palette');
  assert.ok(content.includes('fontFamily:'), 'Tailwind config must define custom fontFamily map');
});

test('T2-69: Next.js Google font loaders configure display swap', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(
    content.includes("display: 'swap'"),
    'Instrument Sans and Newsreader must configure display: swap for optimal LCP'
  );
});

test('T2-70: Next.js Google font loaders restrict character subsets to latin', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(
    content.includes("subsets: ['latin']"),
    'Font loaders must constrain subsets to latin for lightweight payload'
  );
});
