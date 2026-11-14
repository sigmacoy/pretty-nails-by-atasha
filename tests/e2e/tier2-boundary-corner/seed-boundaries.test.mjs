import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile } from '../helpers/component-analyzer.mjs';

// Feature 12: R5.1 Prisma Seed Boundaries

test('T2-56: Prisma seed uses idempotent upsert queries for settings records', () => {
  const content = readSourceFile('pretty-nails-source/prisma/seed.ts');
  assert.ok(
    content.includes('prisma.setting.upsert'),
    'Prisma seed must use upsert to avoid duplicate key errors on re-execution'
  );
});

test('T2-57: Prisma seed sample gallery entries reference valid local JPG file paths', () => {
  const content = readSourceFile('pretty-nails-source/prisma/seed.ts');
  const sampleGalleryBlock = content.slice(content.indexOf('sampleGallery = ['), content.indexOf('for (const item of sampleGallery)'));
  assert.ok(sampleGalleryBlock.includes('/gallery/sample2.jpg'), 'Must reference sample2.jpg');
  assert.ok(sampleGalleryBlock.includes('/gallery/sample3.jpg'), 'Must reference sample3.jpg');
  assert.ok(sampleGalleryBlock.includes('/gallery/sample4.jpg'), 'Must reference sample4.jpg');
  assert.ok(sampleGalleryBlock.includes('/gallery/sample5.jpg'), 'Must reference sample5.jpg');
  assert.ok(!sampleGalleryBlock.includes('.png'), 'All local gallery seed assets must use .jpg extension');
});

test('T2-58: Prisma seed services use atelier category enum codes', () => {
  const content = readSourceFile('pretty-nails-source/prisma/seed.ts');
  assert.ok(content.includes('category: "GEL"'), 'Must seed GEL category');
  assert.ok(content.includes('category: "EXTENSION"'), 'Must seed EXTENSION category');
});

test('T2-59: Prisma seed defines loyalty reward threshold setting as 9 stamps', () => {
  const content = readSourceFile('pretty-nails-source/prisma/seed.ts');
  assert.ok(
    content.includes('key: "stampsRequired"') && content.includes('value: "9"'),
    'Prisma seed must configure 9 stamps required for reward'
  );
});

test('T2-60: Prisma seed defines loyalty stamp per amount as 50000 centavos', () => {
  const content = readSourceFile('pretty-nails-source/prisma/seed.ts');
  assert.ok(
    content.includes('key: "stampPerAmount"') && content.includes('value: "50000"'),
    'Prisma seed must set 500 PHP (50000 centavos) per loyalty stamp'
  );
});

// Feature 13: R5.2 Spring Boot Seed Boundaries

test('T2-61: Spring Boot data.sql ensures idempotency with ON CONFLICT DO NOTHING clauses', () => {
  const content = readSourceFile('pretty-nails-backend/src/main/resources/data.sql');
  assert.ok(
    content.includes('ON CONFLICT (name) DO NOTHING') || content.includes('ON CONFLICT (id) DO NOTHING'),
    'data.sql must include conflict handling to allow safe repeatable execution'
  );
});

test('T2-62: Spring Boot data.sql services define realistic treatment durations between 30 and 90 minutes', () => {
  const content = readSourceFile('pretty-nails-backend/src/main/resources/data.sql');
  assert.ok(content.includes('60, true, NOW()'), 'Must configure 60 minute treatments');
  assert.ok(content.includes('90, true, NOW()'), 'Must configure 90 minute extension appointments');
  assert.ok(content.includes('30, true, NOW()'), 'Must configure 30 minute add-on treatments');
});

test('T2-63: Spring Boot data.sql base prices are strictly positive integer centavos', () => {
  const content = readSourceFile('pretty-nails-backend/src/main/resources/data.sql');
  assert.ok(content.includes('50000'), 'BIAB base price must be 50000 centavos (500 PHP)');
  assert.ok(content.includes('80000'), 'Extensions base price must be 80000 centavos (800 PHP)');
  assert.ok(content.includes('60000'), 'Pedicure base price must be 60000 centavos (600 PHP)');
});

test('T2-64: Spring Boot data.sql activates seeded gallery records with is_active flag true', () => {
  const content = readSourceFile('pretty-nails-backend/src/main/resources/data.sql');
  const galleryInserts = content.slice(content.indexOf('INSERT INTO gallery'));
  assert.ok(
    galleryInserts.includes('true, NOW(), NOW()'),
    'All gallery SQL records must be marked is_active true'
  );
});

test('T2-65: Spring Boot DataSeeder.java restricts execution to non-test runtime profiles', () => {
  const content = readSourceFile('pretty-nails-backend/src/main/java/com/prettynails/config/DataSeeder.java');
  assert.ok(
    content.includes('@Profile("!test")'),
    'DataSeeder must use @Profile("!test") to avoid interfering with automated backend test fixtures'
  );
});
