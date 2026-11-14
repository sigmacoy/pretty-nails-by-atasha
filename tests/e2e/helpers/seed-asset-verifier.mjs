import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

/**
 * Verify local image asset existence, size, and JPEG magic bytes.
 * @param {string} relativePath Path relative to project root.
 * @param {number} minBytes Minimum expected byte size.
 * @returns {{ path: string, size: number, valid: boolean }}
 */
export function verifyLocalImage(relativePath, minBytes = 50000) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  assert.ok(fs.existsSync(fullPath), `Image asset must exist: ${relativePath}`);

  const stat = fs.statSync(fullPath);
  assert.ok(
    stat.size >= minBytes,
    `Image asset size too small (${stat.size} bytes < ${minBytes}): ${relativePath}`
  );

  const buffer = fs.readFileSync(fullPath);
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  assert.ok(isJpeg, `Invalid JPEG magic bytes in asset: ${relativePath}`);

  return { path: relativePath, size: stat.size, valid: true };
}

/**
 * Verify seed script content for expected local assets and absence of forbidden patterns.
 * @param {string} relativePath Path relative to project root.
 * @param {string[]} expectedAssets Array of required strings (e.g., local image paths).
 * @param {RegExp[]} forbiddenPatterns Array of disallowed patterns (e.g., unsplash.com).
 * @returns {{ path: string, verified: boolean }}
 */
export function verifySeedScript(
  relativePath,
  expectedAssets = [],
  forbiddenPatterns = [/unsplash\.com/i]
) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  assert.ok(fs.existsSync(fullPath), `Seed file must exist: ${relativePath}`);

  const content = fs.readFileSync(fullPath, 'utf-8');

  for (const pattern of forbiddenPatterns) {
    assert.ok(
      !pattern.test(content),
      `Forbidden pattern detected in ${relativePath}: ${pattern.toString()}`
    );
  }

  for (const asset of expectedAssets) {
    assert.ok(
      content.includes(asset),
      `Required local asset reference missing in ${relativePath}: ${asset}`
    );
  }

  return { path: relativePath, verified: true };
}

/**
 * Verify service catalog descriptions and details in seed script.
 * @param {string} relativePath Path relative to project root.
 * @param {string[]} requiredTerms Array of required keywords (e.g., BIAB, Russian, autoclave).
 * @returns {{ path: string, verified: boolean }}
 */
export function verifyAuthenticDescriptions(relativePath, requiredTerms = []) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  assert.ok(fs.existsSync(fullPath), `Seed file must exist: ${relativePath}`);

  const content = fs.readFileSync(fullPath, 'utf-8');

  for (const term of requiredTerms) {
    assert.ok(
      content.includes(term),
      `Required authentic salon term missing in ${relativePath}: "${term}"`
    );
  }

  return { path: relativePath, verified: true };
}
