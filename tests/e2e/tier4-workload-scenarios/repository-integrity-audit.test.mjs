import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { scanDirectoryForEmojis, scanFileForEmojis } from '../helpers/emoji-detector.mjs';
import { verifyLocalImage } from '../helpers/seed-asset-verifier.mjs';
import { verifyTypeScriptCompilation } from '../helpers/type-checker.mjs';

test('T4-07: Repository-wide emoji audit confirms zero emojis across all targets', () => {
  const rootFiles = ['how-to-run.md', 'README.md'];
  for (const file of rootFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    const violations = scanFileForEmojis(fullPath);
    assert.equal(violations.length, 0, `${file} must contain 0 emojis (found ${violations.length})`);
  }

  const dirsToScan = ['docs', 'frontend/src', 'pretty-nails-backend/src', 'pretty-nails-source/prisma'];
  for (const dir of dirsToScan) {
    const fullPath = path.resolve(process.cwd(), dir);
    const violations = scanDirectoryForEmojis(fullPath);
    assert.equal(violations.length, 0, `${dir} must contain 0 emojis (found ${violations.length})`);
  }
});

test('T4-08: Local gallery asset audit verifies valid binary JPEG magic bytes for sample images', () => {
  const samples = [
    'frontend/public/gallery/sample1.jpg',
    'frontend/public/gallery/sample2.jpg',
    'frontend/public/gallery/sample3.jpg',
    'frontend/public/gallery/sample4.jpg',
    'frontend/public/gallery/sample5.jpg',
    'frontend/public/gallery/sample6.jpg',
    'frontend/public/gallery/sample7.jpg'
  ];

  for (const sample of samples) {
    const result = verifyLocalImage(sample, 50000);
    assert.ok(result.valid, `${sample} must be a valid binary JPEG`);
    assert.ok(result.size > 50000, `${sample} size must exceed 50KB`);
  }
});

test('T4-09: TypeScript compiler audit executes without diagnostic errors', () => {
  const result = verifyTypeScriptCompilation();
  assert.equal(result.success, true, 'Frontend TypeScript compiler must produce 0 diagnostic errors');
});
