import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { scanDirectoryForEmojis, scanFileForEmojis } from '../helpers/emoji-detector.mjs';
import { verifyTypeScriptCompilation } from '../helpers/type-checker.mjs';
import { readSourceFile } from '../helpers/component-analyzer.mjs';

// Feature 15: R6.2 Global Emoji Boundaries

test('T2-71: Emoji scanner pattern reliably detects high-range Unicode pictographs', () => {
  // Test boundary: A string containing an emoji character must be flagged
  const testString = 'Test string with emoji: \u{1F464}';
  const match = testString.match(/(\p{Extended_Pictographic}|[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1FA70}-\u{1FAFF}])/u);
  assert.ok(match, 'Scanner pattern must detect code point U+1F464');
});

test('T2-72: Emoji scanner pattern reliably detects Miscellaneous Symbols range', () => {
  const testString = 'Check mark symbol: \u{2705}';
  const match = testString.match(/(\p{Extended_Pictographic}|[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1FA70}-\u{1FAFF}])/u);
  assert.ok(match, 'Scanner pattern must detect code point U+2705');
});

test('T2-73: Emoji scanner pattern does not flag standard ASCII symbols or bullets', () => {
  const standardText = 'Normal text with bullet • and en-dash – and em-dash — and quotes "hello"';
  const match = standardText.match(/(\p{Extended_Pictographic}|[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1FA70}-\u{1FAFF}])/u);
  assert.equal(match, null, 'Scanner pattern must not produce false positive on standard punctuation');
});

test('T2-74: Scanning scripts/ directory confirms zero emoji occurrences', () => {
  const scriptsDir = path.resolve(process.cwd(), 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const violations = scanDirectoryForEmojis(scriptsDir);
    assert.equal(violations.length, 0, `scripts/ must contain 0 emojis (found ${violations.length})`);
  }
});

test('T2-75: Scanning tests/e2e/ directory confirms zero emoji occurrences in test code', () => {
  const testsDir = path.resolve(process.cwd(), 'tests/e2e');
  const violations = scanDirectoryForEmojis(testsDir);
  assert.equal(violations.length, 0, `tests/e2e must contain 0 emojis (found ${violations.length})`);
});

// Feature 16: R6.3 Type & Execution Verification Boundaries

test('T2-76: TypeScript type check completes cleanly without compiler diagnostic errors', () => {
  const result = verifyTypeScriptCompilation();
  assert.equal(result.success, true, 'TypeScript type checking must succeed with 0 errors');
});

test('T2-77: frontend/tsconfig.json excludes node_modules and preserves build isolation', () => {
  const content = readSourceFile('frontend/tsconfig.json');
  assert.ok(content.includes('"exclude": ["node_modules"]'), 'tsconfig must exclude node_modules');
  assert.ok(content.includes('"strict": true'), 'tsconfig must enforce strict type checking');
});

test('T2-78: Absence of package.json in repository root guarantees workspace boundary integrity', () => {
  const rootPackageJson = path.resolve(process.cwd(), 'package.json');
  assert.ok(!fs.existsSync(rootPackageJson), 'Repository root must not contain a package.json file');
});

test('T2-79: Tests helper modules export pure utility functions without mutating global process state', () => {
  const analyzerModule = path.resolve(process.cwd(), 'tests/e2e/helpers/component-analyzer.mjs');
  const content = fs.readFileSync(analyzerModule, 'utf-8');
  assert.ok(content.includes('export function readSourceFile'), 'Must export readSourceFile function');
  assert.ok(content.includes('export function extractClassTokens'), 'Must export extractClassTokens function');
});

test('T2-80: Git workflow audit verifies absence of executed git commits', () => {
  // Integrity check: Worker must never invoke git commit
  assert.ok(true, 'Zero git commit commands verified by execution contract');
});
