import mermaid from '/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/node_modules/mermaid/dist/mermaid.core.mjs';
import fs from 'fs';

const filePath = '/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/database-schema-diagram.txt';
const content = fs.readFileSync(filePath, 'utf8');

console.log('=== RUNNING VERIFICATION SUITE FOR database-schema-diagram.txt ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// Test 1: Mermaid Parse
try {
  await mermaid.parse(content);
  assert(true, 'Test 1: Mermaid parser executes cleanly with 0 syntax errors');
} catch (err) {
  assert(false, `Test 1: Mermaid parser failed: ${err.message}`);
}

// Test 2: Legend is commented out
const legendLines = content.split('\n').filter(l => l.includes('Legend:') || l.includes('PK` = Primary Key'));
assert(legendLines.length > 0 && legendLines.every(l => l.trim().startsWith('%%')),
  'Test 2: Legend block is fully prefixed with %% comments');

// Test 3: Composite keys commented out
assert(content.includes('%% UK(provider, provider_account_id)'),
  'Test 3a: accounts composite unique key UK(provider, provider_account_id) is commented out');
assert(!content.match(/^\s+UK\(provider,\s*provider_account_id\)/m),
  'Test 3b: accounts has no unescaped composite unique key clause');
assert(content.includes('%% UK(identifier, token)'),
  'Test 3c: verification_tokens composite unique key UK(identifier, token) is commented out');
assert(!content.match(/^\s+UK\(identifier,\s*token\)/m),
  'Test 3d: verification_tokens has no unescaped composite unique key clause');

// Test 4: Junction table cardinalities
assert(content.includes('service_variants ||--o{ booking_services : "variant_id"'),
  'Test 4a: service_variants to booking_services cardinality updated to ||--o{');
assert(!content.includes('service_variants }o--o{ booking_services'),
  'Test 4b: service_variants no longer uses }o--o{');
assert(content.includes('bookings ||--o{ loyalty_stamps : "booking_id"'),
  'Test 4c: bookings to loyalty_stamps cardinality updated to ||--o{');
assert(!content.includes('bookings }o--o{ loyalty_stamps'),
  'Test 4d: bookings to loyalty_stamps no longer uses }o--o{');

// Test 5: All 15 entities defined
const expectedEntities = [
  'users', 'accounts', 'services', 'service_variants',
  'bookings', 'booking_services', 'payments', 'availabilities',
  'loyalty_cards', 'loyalty_stamps', 'customer_notes', 'sessions',
  'verification_tokens', 'gallery', 'settings'
];

for (const entity of expectedEntities) {
  assert(new RegExp(`\\b${entity}\\s*\\{`).test(content),
    `Test 5: Entity '${entity}' is defined with open block`);
}

// Test 6: UUID types for PKs
for (const entity of expectedEntities) {
  assert(new RegExp(`\\b${entity}\\s*\\{[\\s\\S]*?UUID\\s+id\\s+PK`).test(content),
    `Test 6: Entity '${entity}' uses 'UUID id PK'`);
}

// Test 7: No unquoted NN constraints
const lines = content.split('\n');
let unquotedNNFound = false;
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('%%') || trimmed.startsWith('erDiagram') || trimmed.includes('--')) continue;
  if (/\bNN\b/.test(trimmed) && !trimmed.includes('"')) {
    unquotedNNFound = true;
    console.error(`Found unquoted NN: ${line}`);
  }
}
assert(!unquotedNNFound, 'Test 7: All NN constraints and default values are safely quoted in Mermaid attribute comments');

console.log(`\n=== RESULTS: ${passedTests}/${totalTests} tests passed ===`);
if (passedTests === totalTests) {
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
} else {
  console.error('SOME CHECKS FAILED!\n');
}
