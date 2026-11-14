import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readSourceFile,
  parseTsxAst,
  extractClassTokens,
  extractAstClassTokens,
  assertContainsTokens,
  assertExcludesTokens,
  extractNamedImports
} from '../helpers/component-analyzer.mjs';

// Feature 1: R1.1 UI Table Fallback (Table.tsx)

test('T1-01: Table empty state renders quiet container with rose hairline border', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'border-rose-200/80',
    'rounded-2xl',
    'shadow-card'
  ]);
  assertExcludesTokens(tokens, ['border-dashed']);
});

test('T1-02: Table empty state typography uses Newsreader serif styling for headline', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  assert.ok(content.includes('font-serif text-lg font-medium'), 'Table empty headline must use font-serif styling');
  assert.ok(content.includes('{emptyMessage}'), 'Table must render emptyMessage prop in headline');
});

test('T1-03: Table empty state renders Instrument Sans for operational copy', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  assert.ok(content.includes('font-sans text-xs sm:text-sm'), 'Table empty description must use font-sans sizing');
  assert.ok(content.includes('No records are currently cataloged'), 'Table must provide informative operational copy');
});

test('T1-04: Table empty state excludes Lucide search and illustration icons', () => {
  const sf = parseTsxAst('frontend/src/components/ui/Table.tsx');
  const lucideImports = extractNamedImports(sf, 'lucide-react');
  assert.ok(!lucideImports.includes('Search'), 'Table must not import Search icon');
  assert.ok(!lucideImports.includes('FolderOpen'), 'Table must not import FolderOpen icon');
  assert.ok(!lucideImports.includes('HelpCircle'), 'Table must not import HelpCircle icon');
});

test('T1-05: Table empty state specifies dark mode rose border token', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'dark:border-rose-950/60',
    'dark:bg-[#1A0E15]/90'
  ]);
});

// Feature 2: R1.2 Public Empty States (gallery, services, availability, booking)

test('T1-06: Lookbook gallery empty state removes Search icon circle and renders font-serif headline', () => {
  const content = readSourceFile('frontend/src/app/(public)/gallery/page.tsx');
  const emptyBlockIndex = content.indexOf('gallery.length === 0');
  assert.ok(emptyBlockIndex !== -1, 'Gallery must have empty state condition');
  const emptyBlock = content.slice(emptyBlockIndex, content.indexOf('gallery.map', emptyBlockIndex));
  assert.ok(!emptyBlock.includes('<Search'), 'Gallery empty state block must not render Search icon');
  assert.ok(!emptyBlock.includes('border-dashed'), 'Gallery empty state block must not use dashed border');
  assert.ok(emptyBlock.includes('font-serif font-normal text-stone-900 dark:text-rose-50'), 'Headline must use font-serif');
  assert.ok(emptyBlock.includes('No lookbook entries found in this category'), 'Must display operational lookbook copy');
});

test('T1-07: Services catalogue empty state removes Layers icon circle and renders font-serif headline', () => {
  const content = readSourceFile('frontend/src/app/(public)/services/page.tsx');
  const sf = parseTsxAst('frontend/src/app/(public)/services/page.tsx');
  const lucideImports = extractNamedImports(sf, 'lucide-react');
  assert.ok(!lucideImports.includes('Layers'), 'Services page must not import or render Layers icon in empty state');
  assert.ok(content.includes('No services found in this category'), 'Must display operational services copy');
  assert.ok(content.includes('font-serif font-normal'), 'Must use font-serif headline');
});

test('T1-08: Availability calendar empty state removes Clock icon circle and renders operational copy', () => {
  const content = readSourceFile('frontend/src/app/(public)/availability/page.tsx');
  const sf = parseTsxAst('frontend/src/app/(public)/availability/page.tsx');
  const lucideImports = extractNamedImports(sf, 'lucide-react');
  assert.ok(!lucideImports.includes('Clock'), 'Availability page must not import or render Clock icon in empty state');
  assert.ok(content.includes('No appointments scheduled for this date'), 'Must display operational schedule copy');
  assert.ok(content.includes('font-serif font-normal'), 'Must use font-serif headline');
});

test('T1-09: BookingForm step 1 service selection removes ShoppingBag dashed box and uses solid rose border', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  const emptyBlockIndex = content.indexOf('selectedServices.length === 0');
  assert.ok(emptyBlockIndex !== -1, 'BookingForm step 1 must declare selectedServices empty check');
  const emptyBlock = content.slice(emptyBlockIndex, emptyBlockIndex + 600);
  assert.ok(!emptyBlock.includes('<ShoppingBag'), 'BookingForm step 1 empty state must not render ShoppingBag icon');
  assert.ok(!emptyBlock.includes('border-dashed'), 'BookingForm step 1 empty state must not use dashed borders');
  assert.ok(emptyBlock.includes('No treatments selected'), 'Must display operational treatment selection prompt');
  assert.ok(emptyBlock.includes('rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/70'), 'Must use solid rose border card');
});

test('T1-10: BookingForm step 2 timing slot empty state uses solid hairline container without dashed styling', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes('No appointments scheduled for this date'), 'Must display quiet timing copy');
  assert.ok(content.includes('border-rose-200/80 dark:border-rose-950/60'), 'Must use rose border tokens');
});

// Feature 3: R1.3 Customer Empty States (my-bookings)

test('T1-11: Customer bookings empty state excludes Lucide Calendar icon illustration', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  const emptyBlockIndex = content.indexOf('filteredBookings.length === 0');
  assert.ok(emptyBlockIndex !== -1, 'my-bookings must declare filteredBookings empty check');
  const emptyBlock = content.slice(emptyBlockIndex, emptyBlockIndex + 800);
  assert.ok(!emptyBlock.includes('<Calendar'), 'my-bookings empty state block must not render Calendar icon');
  assert.ok(!emptyBlock.includes('border-dashed'), 'my-bookings empty state block must not use dashed borders');
});

test('T1-12: Customer bookings empty state headline uses Newsreader serif styling', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  assert.ok(content.includes('font-serif text-stone-900 dark:text-rose-50 font-normal'), 'Headline must use font-serif');
  assert.ok(content.includes('No Appointments Scheduled'), 'Headline must state No Appointments Scheduled');
});

test('T1-13: Customer bookings empty state renders operational copy for appointment reservation', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  assert.ok(content.includes('You have not scheduled any private atelier sessions yet'), 'Must provide clear guidance');
  assert.ok(content.includes('font-sans leading-relaxed'), 'Must use font-sans for body copy');
});

test('T1-14: Customer bookings empty state provides link to service catalogue', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  assert.ok(content.includes('href="/services"'), 'Must provide navigation link to explore service menu');
  assert.ok(content.includes('Explore Service Catalog'), 'CTA button text must invite client to explore services');
});

test('T1-15: Customer bookings empty state container uses rounded-3xl solid hairline border', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'rounded-3xl',
    'border-rose-200/80',
    'dark:border-rose-950/60'
  ]);
  assertExcludesTokens(tokens, ['border-dashed']);
});

// Feature 4: R1.4 Admin Empty States

test('T1-16: CustomersTable empty state removes Users icon circle and uses solid rose border', () => {
  const content = readSourceFile('frontend/src/components/admin/customers/CustomersTable.tsx');
  const sf = parseTsxAst('frontend/src/components/admin/customers/CustomersTable.tsx');
  const lucideImports = extractNamedImports(sf, 'lucide-react');
  assert.ok(!lucideImports.includes('Users'), 'CustomersTable must not import or render Users icon in empty state');
  assert.ok(content.includes('font-serif font-medium text-stone-900 dark:text-rose-50'), 'Headline must use font-serif');
  assert.ok(content.includes('border-rose-200/80 dark:border-rose-950/60'), 'Must use solid rose border card');
});

test('T1-17: GalleryGrid empty state removes ImageIcon circle and dashed borders', () => {
  const content = readSourceFile('frontend/src/components/admin/gallery/GalleryGrid.tsx');
  const sf = parseTsxAst('frontend/src/components/admin/gallery/GalleryGrid.tsx');
  const lucideImports = extractNamedImports(sf, 'lucide-react');
  assert.ok(!lucideImports.includes('Image'), 'GalleryGrid must not import or render Image icon in empty state');
  assert.ok(!lucideImports.includes('ImageIcon'), 'GalleryGrid must not import or render ImageIcon');
  assert.ok(content.includes('font-serif font-normal text-stone-900 dark:text-rose-50'), 'Headline must use font-serif');
  assert.ok(content.includes('rounded-2xl border border-rose-200/80 dark:border-rose-950/60'), 'Must use solid rose card');
});

test('T1-18: ReportsView empty state removes BarChart3 illustration and dashed borders', () => {
  const content = readSourceFile('frontend/src/components/admin/reports/ReportsView.tsx');
  const sf = parseTsxAst('frontend/src/components/admin/reports/ReportsView.tsx');
  const lucideImports = extractNamedImports(sf, 'lucide-react');
  assert.ok(!lucideImports.includes('BarChart3'), 'ReportsView must not import or render BarChart3 icon in empty state');
  assert.ok(content.includes('No booking records recorded'), 'Must state quiet operational message');
  assert.ok(content.includes('border-rose-200/80 dark:border-rose-950/60'), 'Must use solid rose hairline container');
});

test('T1-19: RevenueChart renders quiet typographic fallback without dashed borders', () => {
  const content = readSourceFile('frontend/src/components/admin/RevenueChart.tsx');
  assert.ok(content.includes('No revenue data recorded'), 'Must display quiet headline');
  assert.ok(content.includes('font-serif font-normal'), 'Must use font-serif headline');
  assert.ok(content.includes('border-rose-200/80 dark:border-rose-950/60'), 'Must use solid rose border');
});

test('T1-20: BookingsTable renders quiet typographic empty statement for filtered queue', () => {
  const content = readSourceFile('frontend/src/components/admin/bookings/BookingsTable.tsx');
  assert.ok(content.includes('emptyMessage="No bookings in queue matching current filters"'), 'Must configure operational queue copy');
});
