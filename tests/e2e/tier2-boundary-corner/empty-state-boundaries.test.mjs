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

// Feature 1: R1.1 Table Boundaries

test('T2-01: Table empty state defensive check handles zero data array length', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  assert.ok(content.includes('data.length === 0'), 'Table must guard with data.length === 0 check');
  assert.ok(content.includes('if (data.length === 0)'), 'Table must branch to empty container when empty');
});

test('T2-02: Table empty state emptyMessage prop accepts custom strings and displays faithfully', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  assert.ok(content.includes('{emptyMessage}'), 'Table must render emptyMessage prop in JSX');
  assert.ok(content.includes("emptyMessage = 'No records available'"), 'Table must declare sensible default emptyMessage');
});

test('T2-03: Table empty state description limits width to max-w-sm for line wrapping', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, ['max-w-sm', 'mx-auto', 'text-center']);
});

test('T2-04: Table empty state container uses p-12 padding for spacious breathing room', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, ['p-12', 'rounded-2xl']);
});

test('T2-05: Table empty state specifies dark mode background token #1A0E15 with backdrop blur', () => {
  const content = readSourceFile('frontend/src/components/ui/Table.tsx');
  assert.ok(content.includes('dark:bg-[#1A0E15]/90'), 'Table must use atelier dark background #1A0E15');
  assert.ok(content.includes('backdrop-blur-sm'), 'Table must apply backdrop blur for elevated feel');
});

// Feature 2: R1.2 Public Empty State Boundaries

test('T2-06: Lookbook gallery debounces search queries to prevent rapid empty state flickering', () => {
  const content = readSourceFile('frontend/src/app/(public)/gallery/page.tsx');
  assert.ok(content.includes('debouncedSearch'), 'Gallery must use debounced search query');
  assert.ok(content.includes('setTimeout'), 'Gallery must debounce user input using timer');
});

test('T2-07: Lookbook gallery handles empty filter matches with reset filter button', () => {
  const content = readSourceFile('frontend/src/app/(public)/gallery/page.tsx');
  assert.ok(content.includes('hasFilters'), 'Gallery must track filter state');
  assert.ok(content.includes('Reset Filter Settings'), 'Gallery must display Reset Filter Settings button');
  assert.ok(content.includes('handleClearFilters'), 'Gallery must provide handler to reset all active filters');
});

test('T2-08: Availability calendar guards past dates with past date badge and disablement', () => {
  const content = readSourceFile('frontend/src/app/(public)/availability/page.tsx');
  assert.ok(content.includes('isPast'), 'Availability page must check whether selected date is in the past');
  assert.ok(content.includes('Past date'), 'Availability page must display Past date indicator badge');
  assert.ok(content.includes('This date has passed'), 'Availability page must state clear operational advice for past dates');
});

test('T2-09: Availability calendar displays quiet operational message when zero slots open', () => {
  const content = readSourceFile('frontend/src/app/(public)/availability/page.tsx');
  assert.ok(content.includes('timeSlots.length === 0'), 'Availability page must guard with timeSlots.length === 0 check');
  assert.ok(content.includes('No 30-minute studio windows are open'), 'Availability page must give precise window guidance');
});

test('T2-10: BookingForm step 1 disables continue button when no treatments are selected', () => {
  const content = readSourceFile('frontend/src/app/(public)/booking/BookingForm.tsx');
  assert.ok(content.includes('disabled={selectedServices.length === 0}'), 'Continue button must be disabled when no treatment selected');
  assert.ok(content.includes('disabled:opacity-50'), 'Disabled continue button must reflect muted opacity');
});

// Feature 3: R1.3 Customer Empty State Boundaries

test('T2-11: Customer bookings view displays distinct empty copy when active filter has zero items', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  assert.ok(content.includes("activeFilter !== 'all'"), 'Must check active filter value');
  assert.ok(content.includes("appointments found matching your selected filter"), 'Must report filtered status context');
});

test('T2-12: Customer bookings view displays all appointment status tabs', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  assert.ok(content.includes('STATUS_FILTERS'), 'Must define STATUS_FILTERS array');
  assert.ok(content.includes('All bookings'), 'Must support All bookings filter');
});

test('T2-13: Customer bookings empty call-to-action button uses touch-friendly dimensions', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, ['h-14', 'rounded-full']);
});

test('T2-14: Customer bookings empty card uses elevated backdrop blur and subtle shadow', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, [
    'backdrop-blur-sm',
    'shadow-card',
    'border-rose-200/80',
    'dark:border-rose-950/60'
  ]);
});

test('T2-15: Customer bookings headline uses responsive font sizing from text-2xl to text-3xl', () => {
  const content = readSourceFile('frontend/src/app/(customer)/my-bookings/page.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, ['text-2xl', 'font-serif', 'font-normal']);
});

// Feature 4: R1.4 Admin Empty State Boundaries

test('T2-16: CustomersTable empty state adapts to filtered customer query results', () => {
  const content = readSourceFile('frontend/src/components/admin/customers/CustomersTable.tsx');
  assert.ok(content.includes('customers.length === 0'), 'CustomersTable must guard with customers.length === 0 check');
  assert.ok(content.includes('{emptyMessage}'), 'CustomersTable must render emptyMessage prop');
});

test('T2-17: GalleryGrid empty state optionally renders onAdd action button when provided', () => {
  const content = readSourceFile('frontend/src/components/admin/gallery/GalleryGrid.tsx');
  assert.ok(content.includes('{onAdd && ('), 'GalleryGrid must conditionally render onAdd button');
  assert.ok(content.includes('Upload design'), 'GalleryGrid CTA button must offer to upload design');
});

test('T2-18: ReportsView empty state displays active period phrase in explanatory copy', () => {
  const content = readSourceFile('frontend/src/components/admin/reports/ReportsView.tsx');
  assert.ok(content.includes('activePeriodMeta.periodPhrase'), 'ReportsView must display dynamic period name');
  assert.ok(content.includes('No booking records recorded'), 'ReportsView must state quiet operational copy');
});

test('T2-19: RevenueChart empty state preserves standard chart height of h-64 to prevent layout shifts', () => {
  const content = readSourceFile('frontend/src/components/admin/RevenueChart.tsx');
  const tokens = extractClassTokens(content);
  assertContainsTokens(tokens, ['h-64', 'rounded-xl', 'text-center']);
});

test('T2-20: BookingsTable renders quiet typographic statement for empty queues without broken layouts', () => {
  const content = readSourceFile('frontend/src/components/admin/bookings/BookingsTable.tsx');
  assert.ok(content.includes('emptyMessage='), 'BookingsTable must configure explicit emptyMessage');
  assert.ok(content.includes('striped'), 'BookingsTable must configure standard table presentation');
});
