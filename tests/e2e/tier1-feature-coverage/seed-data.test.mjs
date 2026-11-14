import test from 'node:test';
import assert from 'node:assert/strict';
import { readSourceFile } from '../helpers/component-analyzer.mjs';
import {
  verifyLocalImage,
  verifySeedScript,
  verifyAuthenticDescriptions
} from '../helpers/seed-asset-verifier.mjs';

// Feature 12: R5.1 Prisma Seed Local Assets (prisma/seed.ts)

test('T1-56: Prisma seed script excludes external Unsplash URLs', () => {
  verifySeedScript('pretty-nails-source/prisma/seed.ts', [], [/unsplash\.com/i]);
});

test('T1-57: Prisma seed script references local studio assets sample2 through sample5', () => {
  verifySeedScript('pretty-nails-source/prisma/seed.ts', [
    '/gallery/sample2.jpg',
    '/gallery/sample3.jpg',
    '/gallery/sample4.jpg',
    '/gallery/sample5.jpg'
  ]);
});

test('T1-58: Physical image assets exist in frontend/public/gallery/ with valid JPEG header bytes', () => {
  const images = [
    'frontend/public/gallery/sample2.jpg',
    'frontend/public/gallery/sample3.jpg',
    'frontend/public/gallery/sample4.jpg',
    'frontend/public/gallery/sample5.jpg'
  ];
  for (const img of images) {
    const result = verifyLocalImage(img, 50000);
    assert.ok(result.valid, `${img} must be a valid JPEG asset`);
    assert.ok(result.size > 50000, `${img} must exceed 50KB minimum size threshold`);
  }
});

test('T1-59: Prisma seed script includes authentic atelier service descriptions', () => {
  verifyAuthenticDescriptions('pretty-nails-source/prisma/seed.ts', [
    'BIAB',
    'Russian',
    'autoclave'
  ]);
});

test('T1-60: Prisma gallery seed titles reflect atelier lookbook designs', () => {
  const content = readSourceFile('pretty-nails-source/prisma/seed.ts');
  assert.ok(content.includes('Magnetic Velvet Cat-Eye in Bronze Shimmer'), 'Must seed Magnetic Velvet design');
  assert.ok(content.includes('Tortoiseshell Glass & Noir Minimalist'), 'Must seed Tortoiseshell Glass design');
  assert.ok(content.includes('Burgundy Wave French with Gold Hairline'), 'Must seed Burgundy Wave French design');
});

// Feature 13: R5.2 Spring Boot Seed Data (data.sql, DataSeeder.java)

test('T1-61: Spring Boot data.sql exists and contains SQL seed definitions', () => {
  const content = readSourceFile('pretty-nails-backend/src/main/resources/data.sql');
  assert.ok(content.length > 500, 'data.sql must contain comprehensive seed SQL definitions');
  assert.ok(content.includes('INSERT INTO services'), 'data.sql must insert services');
  assert.ok(content.includes('INSERT INTO gallery'), 'data.sql must insert gallery records');
});

test('T1-62: Spring Boot data.sql inserts authentic atelier services and descriptions', () => {
  verifyAuthenticDescriptions('pretty-nails-backend/src/main/resources/data.sql', [
    'Structured BIAB & Gel Overlay',
    'Russian dry cuticle prep',
    'autoclave-sterilized'
  ]);
});

test('T1-63: DataSeeder.java defines authentic atelier services and base prices', () => {
  const content = readSourceFile('pretty-nails-backend/src/main/java/com/prettynails/config/DataSeeder.java');
  assert.ok(content.includes('Structured BIAB & Gel Overlay'), 'DataSeeder must define BIAB overlay service');
  assert.ok(content.includes('Russian dry cuticle prep'), 'DataSeeder must include Russian dry cuticle prep');
  assert.ok(content.includes('autoclave-sterilized'), 'DataSeeder must specify autoclave sterilization');
  assert.ok(content.includes('.basePrice(50000)'), 'DataSeeder must specify price in centavos');
});

test('T1-64: Spring Boot data.sql references local gallery assets and excludes Unsplash URLs', () => {
  verifySeedScript(
    'pretty-nails-backend/src/main/resources/data.sql',
    [
      '/gallery/sample2.jpg',
      '/gallery/sample3.jpg',
      '/gallery/sample4.jpg',
      '/gallery/sample5.jpg'
    ],
    [/unsplash\.com/i]
  );
});

test('T1-65: Service pricing in data.sql is denominated in centavos', () => {
  const content = readSourceFile('pretty-nails-backend/src/main/resources/data.sql');
  assert.ok(content.includes('50000'), 'Must contain 50000 centavos (PHP 500)');
  assert.ok(content.includes('80000'), 'Must contain 80000 centavos (PHP 800)');
  assert.ok(content.includes('30000'), 'Must contain 30000 centavos (PHP 300)');
});
