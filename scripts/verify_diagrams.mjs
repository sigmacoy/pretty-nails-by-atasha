#!/usr/bin/env node
/**
 * Comprehensive Automated Verification Suite for Architecture Diagrams
 * 
 * Verifies all 5 Mermaid architecture diagrams under DIAGRAMS/:
 * 1. database-schema-diagram.txt (Relational schema, junction tables, data types, constraints)
 * 2. activity-diagram.txt (Workflow control flow, start/end nodes, decision points)
 * 3. use-case-diagram.txt (Actor-use case interactions, UML include/extend stereotypes)
 * 4. class-diagram.txt (Class relationships, members, methods, cardinalities)
 * 5. ERD.txt (Entity-relationship model, keys, cardinalities)
 * 
 * And cross-verifies consistency against JPA entities in backend/src/main/java/com/prettynails/entity/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// ============================================================================
// ENVIRONMENT INITIALIZATION (Mermaid & Headless DOM)
// ============================================================================

async function initializeMermaid() {
  const possibleJsdomPaths = [
    'jsdom',
    path.join(REPO_ROOT, 'node_modules/jsdom/lib/api.js'),
    path.join(REPO_ROOT, '.agents/teamwork/worker_m3/node_modules/jsdom/lib/api.js'),
    '/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/node_modules/jsdom/lib/api.js'
  ];

  let jsdomMod = null;
  for (const p of possibleJsdomPaths) {
    try {
      jsdomMod = await import(p);
      break;
    } catch (e) {
      // try next
    }
  }

  if (jsdomMod) {
    const JSDOM = jsdomMod.JSDOM || jsdomMod.default?.JSDOM || jsdomMod.default;
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    // Only assign global.navigator if not already present (Node 21+ has globalThis.navigator getter)
    if (!global.navigator) {
      try {
        global.navigator = dom.window.navigator;
      } catch (e) {
        // getter only in Node 21+, safe to leave built-in navigator
      }
    }
  }

  const possibleMermaidPaths = [
    'mermaid',
    path.join(REPO_ROOT, 'node_modules/mermaid/dist/mermaid.esm.min.mjs'),
    path.join(REPO_ROOT, '.agents/teamwork/worker_m3/node_modules/mermaid/dist/mermaid.esm.min.mjs'),
    path.join(REPO_ROOT, '.agents/teamwork/worker_m3/node_modules/mermaid/dist/mermaid.esm.mjs'),
    '/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/node_modules/mermaid/dist/mermaid.esm.min.mjs'
  ];

  let mermaid = null;
  for (const p of possibleMermaidPaths) {
    try {
      const mod = await import(p);
      mermaid = mod.default || mod;
      break;
    } catch (e) {
      // try next
    }
  }

  if (!mermaid) {
    throw new Error('Could not resolve @mermaid-js/mermaid parser from any standard path.');
  }

  mermaid.initialize({ startOnLoad: false });
  return mermaid;
}

// ============================================================================
// TEST HARNESS & REPORTING
// ============================================================================

const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: []
};

let currentSuite = null;

function suite(name, fn) {
  currentSuite = {
    name,
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    startTime: Date.now(),
    duration: 0
  };
  console.log(`\n================================================================================`);
  console.log(`SUITE: ${name}`);
  console.log(`================================================================================`);
  try {
    fn();
  } catch (err) {
    console.error(`💥 Unhandled Suite Exception in "${name}":`, err.message);
    currentSuite.failed++;
    stats.failed++;
    currentSuite.errors.push(`Suite Exception: ${err.message}`);
  }
  currentSuite.duration = Date.now() - currentSuite.startTime;
  stats.suites.push(currentSuite);
}

async function asyncSuite(name, fn) {
  currentSuite = {
    name,
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    startTime: Date.now(),
    duration: 0
  };
  console.log(`\n================================================================================`);
  console.log(`SUITE: ${name}`);
  console.log(`================================================================================`);
  try {
    await fn();
  } catch (err) {
    console.error(`💥 Unhandled Suite Exception in "${name}":`, err.message);
    currentSuite.failed++;
    stats.failed++;
    currentSuite.errors.push(`Suite Exception: ${err.message}`);
  }
  currentSuite.duration = Date.now() - currentSuite.startTime;
  stats.suites.push(currentSuite);
}

function assert(condition, testName, failureDetails = null) {
  stats.total++;
  if (currentSuite) {
    currentSuite.total++;
  }
  if (condition) {
    stats.passed++;
    if (currentSuite) currentSuite.passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    stats.failed++;
    if (currentSuite) currentSuite.failed++;
    const detailMsg = failureDetails ? ` -> ${failureDetails}` : '';
    console.error(`  [FAIL] ${testName}${detailMsg}`);
    if (currentSuite) currentSuite.errors.push(`${testName}${detailMsg}`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log(`Starting Architecture Diagram Verification Suite...`);
  console.log(`Workspace Root: ${REPO_ROOT}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const mermaid = await initializeMermaid();
  console.log(`Real Mermaid Parser initialized successfully.`);

  // Load Diagram Files
  const diagramFiles = {
    dbSchema: path.join(REPO_ROOT, 'DIAGRAMS/database-schema-diagram.txt'),
    activity: path.join(REPO_ROOT, 'DIAGRAMS/activity-diagram.txt'),
    useCase: path.join(REPO_ROOT, 'DIAGRAMS/use-case-diagram.txt'),
    classDiagram: path.join(REPO_ROOT, 'DIAGRAMS/class-diagram.txt'),
    erd: path.join(REPO_ROOT, 'DIAGRAMS/ERD.txt')
  };

  const diagramContents = {};
  for (const [key, filePath] of Object.entries(diagramFiles)) {
    assert(fs.existsSync(filePath), `Diagram file exists: ${path.relative(REPO_ROOT, filePath)}`);
    diagramContents[key] = fs.readFileSync(filePath, 'utf8');
  }

  // --------------------------------------------------------------------------
  // SUITE 1: Real Mermaid Parser Syntax Validation (All 5 Diagrams)
  // --------------------------------------------------------------------------
  await asyncSuite('Suite 1: Mermaid Real Parser Syntax Validation (0 Parse Errors)', async () => {
    const list = [
      { name: 'database-schema-diagram.txt', content: diagramContents.dbSchema },
      { name: 'activity-diagram.txt', content: diagramContents.activity },
      { name: 'use-case-diagram.txt', content: diagramContents.useCase },
      { name: 'class-diagram.txt', content: diagramContents.classDiagram },
      { name: 'ERD.txt', content: diagramContents.erd }
    ];

    for (const item of list) {
      try {
        const res = await mermaid.parse(item.content);
        assert(!!res, `Mermaid core parsed "${item.name}" with 0 syntax errors`);
      } catch (err) {
        assert(false, `Mermaid core parsed "${item.name}" with 0 syntax errors`, err.message);
      }
    }
  });

  // --------------------------------------------------------------------------
  // SUITE 2: Database Schema Diagram (`database-schema-diagram.txt`)
  // --------------------------------------------------------------------------
  suite('Suite 2: Database Schema Diagram Requirements (M1 / R1)', () => {
    const content = diagramContents.dbSchema;
    const lines = content.split('\n');

    // 1. Legend commented with %%
    const legendHeaderIdx = lines.findIndex(l => l.includes('Legend:') || l.includes('PK` = Primary Key'));
    assert(legendHeaderIdx !== -1, 'Legend block exists in database-schema-diagram.txt');
    
    const legendLines = lines.slice(legendHeaderIdx).filter(l => l.trim().length > 0 && !l.trim().startsWith('---'));
    const allLegendCommented = legendLines.every(l => l.trim().startsWith('%%'));
    assert(allLegendCommented, 'Legend block lines are fully prefixed with "%%" comments');

    // 2. Composite unique keys commented out
    assert(content.includes('%% UK(provider, provider_account_id)'),
      'accounts composite key UK(provider, provider_account_id) is commented with %%');
    assert(!/^\s+UK\(provider,\s*provider_account_id\)/m.test(content),
      'accounts has no unescaped inline composite key clause');

    assert(content.includes('%% UK(identifier, token)'),
      'verification_tokens composite key UK(identifier, token) is commented with %%');
    assert(!/^\s+UK\(identifier,\s*token\)/m.test(content),
      'verification_tokens has no unescaped inline composite key clause');

    // 3. Junction table cardinality ||--o{ and no }o--o{
    assert(content.includes('service_variants ||--o{ booking_services : "variant_id"'),
      'service_variants to booking_services uses "||--o{"');
    assert(!content.includes('service_variants }o--o{ booking_services'),
      'service_variants to booking_services no longer contains "}o--o{"');

    assert(content.includes('bookings ||--o{ loyalty_stamps : "booking_id"'),
      'bookings to loyalty_stamps uses "||--o{"');
    assert(!content.includes('bookings }o--o{ loyalty_stamps'),
      'bookings to loyalty_stamps no longer contains "}o--o{"');

    // 4. All 15 database tables defined with UUID id PK
    const expectedTables = [
      'users', 'accounts', 'services', 'service_variants',
      'bookings', 'booking_services', 'payments', 'availabilities',
      'loyalty_cards', 'loyalty_stamps', 'customer_notes', 'sessions',
      'verification_tokens', 'gallery', 'settings'
    ];

    for (const table of expectedTables) {
      const hasBlock = new RegExp(`\\b${table}\\s*\\{`).test(content);
      assert(hasBlock, `Table "${table}" is defined with an entity block`);

      const hasUuidPk = new RegExp(`\\b${table}\\s*\\{[\\s\\S]*?UUID\\s+id\\s+PK`).test(content);
      assert(hasUuidPk, `Table "${table}" defines primary key "UUID id PK"`);
    }

    // 5. Constraints safely encapsulated in quotes
    let unquotedNNFound = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('%%') || trimmed.startsWith('erDiagram') || trimmed.includes('--')) continue;
      if (/\bNN\b/.test(trimmed) && !trimmed.includes('"')) {
        unquotedNNFound = true;
        console.error(`     Unquoted NN in schema: ${line}`);
      }
    }
    assert(!unquotedNNFound, 'All "NN" and default constraints are enclosed in attribute comment quotes');
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Activity Diagram Requirements (M2 / R2)
  // --------------------------------------------------------------------------
  suite('Suite 3: Activity Diagram Requirements (M2 / R2)', () => {
    const content = diagramContents.activity;
    const lines = content.split('\n');

    // 1. Build Graph Topology and detect self-loops
    const edges = [];
    const definedNodes = new Set();
    const inDegree = new Map();
    const outDegree = new Map();
    const selfLoops = [];

    // Extract defined nodes in subgraphs
    const sgRegex = /subgraph\s+([A-Za-z0-9_]+)[\s\S]*?end/g;
    let sgMatch;
    while ((sgMatch = sgRegex.exec(content)) !== null) {
      const sgContent = sgMatch[0];
      const nodeMatches = sgContent.matchAll(/^\s*([A-Za-z0-9_]+)\[/gm);
      for (const m of nodeMatches) {
        definedNodes.add(m[1]);
      }
    }

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('%%') || trimmed.startsWith('classDef') || trimmed.startsWith('class ')) return;
      if (!trimmed.includes('-->')) return;

      const parts = trimmed.split('-->').map(p => {
        let s = p.replace(/^\|.*?\|\s*/, '').trim();
        const m = s.match(/^([A-Za-z0-9_]+)/);
        return m ? m[1] : null;
      }).filter(Boolean);

      for (let i = 0; i < parts.length - 1; i++) {
        const from = parts[i];
        const to = parts[i + 1];
        edges.push({ from, to, line: idx + 1 });
        outDegree.set(from, (outDegree.get(from) || 0) + 1);
        inDegree.set(to, (inDegree.get(to) || 0) + 1);

        if (from === to) {
          selfLoops.push({ node: from, line: idx + 1, raw: trimmed });
        }
      }
    });

    assert(selfLoops.length === 0, `Graph contains zero self-loops (found: ${selfLoops.length})`);

    // Prohibited self-loops check
    const prohibitedLoops = ['S32', 'A12', 'A14', 'A17', 'A19', 'A24'];
    for (const target of prohibitedLoops) {
      const found = selfLoops.find(l => l.node === target);
      assert(!found, `Node "${target}" has no circular self-loop transition`);
    }

    // 2. Flow 6 node collision check
    const flow6Match = content.match(/FLOW 6:[\s\S]*?(?=FLOW 7:)/);
    assert(!!flow6Match, 'FLOW 6 block exists in activity-diagram.txt');
    if (flow6Match) {
      const flow6Content = flow6Match[0];
      const hasA13 = /\bA13\b/.test(flow6Content);
      const hasA14 = /\bA14\b/.test(flow6Content);
      const hasA13Avail = /\bA13_Avail\b/.test(flow6Content);
      const hasA14Avail = /\bA14_Avail\b/.test(flow6Content);

      assert(!hasA13 && !hasA14, 'Flow 6 does not reuse colliding node IDs "A13" or "A14"');
      assert(hasA13Avail && hasA14Avail, 'Flow 6 correctly uses disambiguated IDs "A13_Avail" and "A14_Avail"');
    }

    // 3. Start and End nodes check
    const startNodes = content.match(/\b([A-Za-z0-9_]*Start[A-Za-z0-9_]*)\s*\(\[Start\]\)/g) || [];
    const endNodes = content.match(/\b([A-Za-z0-9_]*End[A-Za-z0-9_]*)\s*\(\[End\]\)/g) || [];

    assert(startNodes.length >= 10, `Formal start nodes "([Start])" present (found: ${startNodes.length} >= 10)`);
    assert(endNodes.length >= 10, `Formal terminal nodes "([End])" present (found: ${endNodes.length} >= 10)`);

    // 4. classDef startend styling check
    const hasClassDef = /classDef\s+startend\b/.test(content);
    const hasClassUsage = /class\s+[^;]*\bstartend\b/.test(content);
    assert(hasClassDef && hasClassUsage, 'UML start/end nodes are styled with "classDef startend"');

    // 5. Zero isolated nodes in subgraphs
    let isolatedCount = 0;
    for (const node of definedNodes) {
      if (!inDegree.has(node) && !outDegree.has(node)) {
        isolatedCount++;
        console.error(`     Isolated subgraph node: ${node}`);
      }
    }
    assert(isolatedCount === 0, `All declared subgraph nodes are connected (isolated count: ${isolatedCount})`);
  });

  // --------------------------------------------------------------------------
  // SUITE 4: Use Case Diagram Requirements (M3 / R3)
  // --------------------------------------------------------------------------
  suite('Suite 4: Use Case Diagram Requirements (M3 / R3)', () => {
    const content = diagramContents.useCase;

    // 1. Consolidation check (UC12 -> UC4, UC10 -> UC5)
    assert(!/\bUC12\b/.test(content), 'Duplicate "UC12" is completely removed');
    assert(!/\bUC10\b/.test(content), 'Duplicate "UC10" is completely removed');
    assert(content.includes('UC4["UC4: View Available Dates"]'), 'UC4 defined with "View Available Dates"');
    assert(content.includes('UC5["UC5: View Active Services"]'), 'UC5 defined with "View Active Services"');

    // Check subgraph placement
    const availBlock = content.match(/subgraph Availability\["Availability Management"\]([\s\S]*?)end/);
    assert(availBlock && availBlock[1].includes('UC4'), 'UC4 placed inside "Availability Management"');
    assert(availBlock && !availBlock[1].includes('UC12'), 'UC12 not present in "Availability Management"');

    const servBlock = content.match(/subgraph Service\["Service Management"\]([\s\S]*?)end/);
    assert(servBlock && servBlock[1].includes('UC5'), 'UC5 placed inside "Service Management"');
    assert(servBlock && !servBlock[1].includes('UC10'), 'UC10 not present in "Service Management"');

    const bookBlock = content.match(/subgraph Booking\["Booking Management"\]([\s\S]*?)end/);
    assert(bookBlock && !/\bUC4\b/.test(bookBlock[1]), 'UC4 removed from "Booking Management"');
    assert(bookBlock && !/\bUC5\b/.test(bookBlock[1]), 'UC5 removed from "Booking Management"');

    // 2. Actor mapping check (Public has Register & Login, Customer does not)
    assert(/Public\s*-->\s*UC1\b/.test(content), 'Public actor connects to UC1 (Register Account)');
    assert(/Public\s*-->\s*UC2\b/.test(content), 'Public actor connects to UC2 (Login)');
    assert(/Public\s*-->\s*UC4\b/.test(content), 'Public actor connects to UC4 (View Available Dates)');
    assert(/Public\s*-->\s*UC5\b/.test(content), 'Public actor connects to UC5 (View Active Services)');
    assert(/Public\s*-->\s*UC14\b/.test(content), 'Public actor connects to UC14 (View Public Gallery)');

    assert(!/Customer\s*-->\s*UC1\b/.test(content), 'Customer actor does NOT connect to UC1 (Register)');
    assert(!/Customer\s*-->\s*UC2\b/.test(content), 'Customer actor does NOT connect to UC2 (Login)');
    assert(/Customer\s*-->\s*UC3\b/.test(content), 'Customer actor connects to UC3 (View Profile)');
    assert(/Customer\s*-->\s*UC4\b/.test(content), 'Customer actor connects to UC4 (View Available Dates)');
    assert(/Customer\s*-->\s*UC5\b/.test(content), 'Customer actor connects to UC5 (View Active Services)');

    // 3. Include/extend stereotypes and arrow direction
    assert(content.includes('UC9 -.->|"<<extend>>"| UC8'),
      'UC9 extends UC8 with correct UML arrow direction and stereotype: UC9 -.->|"<<extend>>"| UC8');
    assert(content.includes('UC13 -.->|"<<include>>"| UC4'),
      'UC13 includes UC4 with correct UML arrow direction and stereotype: UC13 -.->|"<<include>>"| UC4');
    assert(content.includes('UC15 -.->|"<<include>>"| UC14'),
      'UC15 includes UC14 with correct UML arrow direction and stereotype: UC15 -.->|"<<include>>"| UC14');
    assert(content.includes('UC19 -.->|"<<extend>>"| UC18'),
      'UC19 extends UC18 with correct UML arrow direction and stereotype: UC19 -.->|"<<extend>>"| UC18');

    // 4. Removal of non-standard pseudo-dependencies
    assert(!content.includes('UC4 -.-> UC12'), 'Pseudo-link UC4 -.-> UC12 removed');
    assert(!content.includes('UC5 -.-> UC10'), 'Pseudo-link UC5 -.-> UC10 removed');
    assert(!content.includes('UC20 -.-> UC21'), 'Pseudo-link UC20 -.-> UC21 removed');
    assert(!content.includes('UC22 -.-> UC16'), 'Pseudo-link UC22 -.-> UC16 removed');
    assert(!content.includes('UC22 -.-> UC17'), 'Pseudo-link UC22 -.-> UC17 removed');
    assert(!content.includes('UC22 -.-> UC18'), 'Pseudo-link UC22 -.-> UC18 removed');
    assert(!content.includes('UC22 -.-> UC19'), 'Pseudo-link UC22 -.-> UC19 removed');
  });

  // --------------------------------------------------------------------------
  // SUITE 5: Class Diagram Requirements (M4 / R4)
  // --------------------------------------------------------------------------
  suite('Suite 5: Class Diagram Requirements (M4 / R4)', () => {
    const content = diagramContents.classDiagram;
    const lines = content.split('\n');

    // 1. Zero duplicate reverse associations
    const prohibitedReverseAssocs = [
      'Account "0..*" -- "1" User',
      'ServiceVariant "0..*" -- "1" Service',
      'Booking "0..*" -- "1" User',
      'BookingService "0..*" -- "1" Booking',
      'BookingService "0..*" -- "1" Service',
      'Payment "0..*" -- "1" Booking',
      'Payment "0..*" -- "1" User',
      'LoyaltyCard "0..1" -- "1" User',
      'LoyaltyStamp "0..*" -- "1" LoyaltyCard',
      'LoyaltyStamp "0..*" -- "1" Booking',
      'CustomerNote "0..*" -- "1" User',
      'Session "0..*" -- "1" User'
    ];

    for (const rev of prohibitedReverseAssocs) {
      const found = lines.some(l => l.includes(rev));
      assert(!found, `Class diagram does not contain reverse association: ${rev}`);
    }

    // 2. Canonical associations present
    assert(content.includes('User "1" *-- "0..*" Account : accounts'),
      'Canonical association User -> Account is present');
    assert(content.includes('Booking "1" -- "0..1" Payment : payment'),
      'Canonical association Booking -> Payment (0..1) is present');
    assert(content.includes('ServiceVariant "1" -- "0..*" BookingService : bookingServices'),
      'Missing association ServiceVariant -> BookingService is present');

    // 3. Generics syntax sanitization (no unescaped spaces, no nested ~~)
    const spaceInGenerics = lines.filter(l => /~[^~]* [^~]*~/.test(l));
    assert(spaceInGenerics.length === 0,
      `Generics have no unescaped inner spaces (found: ${spaceInGenerics.length})`);

    const nestedTildes = lines.filter(l => l.includes('~~'));
    assert(nestedTildes.length === 0,
      `Generics have no nested "~~" crash hazards (found: ${nestedTildes.length})`);
    
    assert(content.includes('Map~String,Object~'),
      'ReportResponse uses valid sanitized generic Map~String,Object~');
  });

  // --------------------------------------------------------------------------
  // SUITE 6: ERD Diagram Requirements (M4 / R4)
  // --------------------------------------------------------------------------
  suite('Suite 6: ERD Diagram Requirements (M4 / R4)', () => {
    const content = diagramContents.erd;
    const lines = content.split('\n');

    // 1. Zero occurrences of Long types in ERD
    const longLines = lines.filter(l => /\bLong\b/.test(l));
    assert(longLines.length === 0, `ERD contains zero "Long" ID types (found: ${longLines.length})`);

    // 2. All 15 entities have UUID PK
    const expectedEntities = [
      'User', 'Account', 'Service', 'ServiceVariant', 'Booking',
      'BookingService', 'Payment', 'Availability', 'LoyaltyCard',
      'LoyaltyStamp', 'CustomerNote', 'Session', 'VerificationToken',
      'Gallery', 'Setting'
    ];

    for (const entity of expectedEntities) {
      const hasBlock = new RegExp(`\\b${entity}\\s*\\{`).test(content);
      assert(hasBlock, `Entity "${entity}" is defined in ERD`);

      const hasUuidPk = new RegExp(`\\b${entity}\\s*\\{[\\s\\S]*?UUID\\s+id\\s+PK`).test(content);
      assert(hasUuidPk, `Entity "${entity}" primary key is "UUID id PK"`);
    }

    // 3. Foreign key types are UUID
    const fkPatterns = [
      'UUID userId FK',
      'UUID serviceId FK',
      'UUID variantId FK',
      'UUID bookingId FK',
      'UUID cardId FK',
      'UUID adminId FK',
      'UUID verifiedBy FK'
    ];

    for (const fk of fkPatterns) {
      assert(content.includes(fk), `Foreign key definition "${fk}" is present as UUID`);
    }

    // 4. Cardinalities & associations
    assert(content.includes('ServiceVariant ||--o{ BookingService : "bookingServices"'),
      'ServiceVariant to BookingService association is present with "||--o{"');
    assert(content.includes('User ||--o| LoyaltyCard : "loyaltyCard"'),
      'User to LoyaltyCard uses zero-or-one cardinality "||--o|"');
    assert(content.includes('User ||--o{ Payment : "verifiedPayments"'),
      'User to Payment verifier relationship "verifiedPayments" is present');

    // 5. Bare %% comment syntax check (verifying line 244 fix)
    const bareCommentLines = lines.filter((l, idx) => /^\s*%%\s*$/.test(l));
    assert(bareCommentLines.length === 0,
      `ERD has zero bare "%%" lines that cause Mermaid lexer crash (found: ${bareCommentLines.length})`);
  });

  // --------------------------------------------------------------------------
  // SUITE 7: Cross-Diagram Consistency & JPA Backend Alignment
  // --------------------------------------------------------------------------
  suite('Suite 7: Cross-Diagram Consistency & JPA Entity Alignment', () => {
    const jpaDir = path.join(REPO_ROOT, 'backend/src/main/java/com/prettynails/entity');
    assert(fs.existsSync(jpaDir), `JPA entity directory exists: ${path.relative(REPO_ROOT, jpaDir)}`);

    const jpaFiles = fs.readdirSync(jpaDir).filter(f => f.endsWith('.java'));
    assert(jpaFiles.length === 15, `Found all 15 JPA entity Java files (found: ${jpaFiles.length})`);

    const entityNames = [
      'Account', 'Availability', 'Booking', 'BookingService', 'CustomerNote',
      'Gallery', 'LoyaltyCard', 'LoyaltyStamp', 'Payment', 'Service',
      'ServiceVariant', 'Session', 'Setting', 'User', 'VerificationToken'
    ];

    const entityToDbTable = {
      'User': 'users',
      'Account': 'accounts',
      'Service': 'services',
      'ServiceVariant': 'service_variants',
      'Booking': 'bookings',
      'BookingService': 'booking_services',
      'Payment': 'payments',
      'Availability': 'availabilities',
      'LoyaltyCard': 'loyalty_cards',
      'LoyaltyStamp': 'loyalty_stamps',
      'CustomerNote': 'customer_notes',
      'Session': 'sessions',
      'VerificationToken': 'verification_tokens',
      'Gallery': 'gallery',
      'Setting': 'settings'
    };

    // 1. Verify JPA Entities implementation
    for (const name of entityNames) {
      const javaPath = path.join(jpaDir, `${name}.java`);
      assert(fs.existsSync(javaPath), `JPA Entity file "${name}.java" exists`);
      const javaCode = fs.readFileSync(javaPath, 'utf8');

      const hasUuidGen = javaCode.includes('@GeneratedValue(strategy = GenerationType.UUID)');
      assert(hasUuidGen, `Entity "${name}.java" implements @GeneratedValue(strategy = GenerationType.UUID)`);

      const hasStringId = javaCode.includes('private String id;');
      assert(hasStringId, `Entity "${name}.java" defines "private String id;"`);
    }

    // 2. Cross-verify entity representations across diagrams
    for (const name of entityNames) {
      const dbTable = entityToDbTable[name];

      // In ERD.txt
      assert(new RegExp(`\\b${name}\\s*\\{`).test(diagramContents.erd),
        `Entity "${name}" represented in ERD.txt`);

      // In class-diagram.txt
      assert(new RegExp(`class\\s+${name}\\s*\\{`).test(diagramContents.classDiagram),
        `Entity "${name}" represented as class in class-diagram.txt`);

      // In database-schema-diagram.txt
      assert(new RegExp(`\\b${dbTable}\\s*\\{`).test(diagramContents.dbSchema),
        `Table "${dbTable}" represented in database-schema-diagram.txt for entity "${name}"`);
    }

    // 3. Cross-verify core relationship cardinalities across diagrams
    // ServiceVariant -> BookingService
    assert(diagramContents.erd.includes('ServiceVariant ||--o{ BookingService'),
      'ERD has ServiceVariant ||--o{ BookingService');
    assert(diagramContents.dbSchema.includes('service_variants ||--o{ booking_services'),
      'Schema has service_variants ||--o{ booking_services');
    assert(diagramContents.classDiagram.includes('ServiceVariant "1" -- "0..*" BookingService'),
      'Class diagram has ServiceVariant "1" -- "0..*" BookingService');

    // Booking -> BookingService
    assert(diagramContents.erd.includes('Booking ||--o{ BookingService'),
      'ERD has Booking ||--o{ BookingService');
    assert(diagramContents.dbSchema.includes('bookings ||--o{ booking_services'),
      'Schema has bookings ||--o{ booking_services');
    assert(diagramContents.classDiagram.includes('Booking "1" *-- "0..*" BookingService'),
      'Class diagram has Booking "1" *-- "0..*" BookingService');

    // User -> LoyaltyCard
    assert(diagramContents.erd.includes('User ||--o| LoyaltyCard'),
      'ERD has User ||--o| LoyaltyCard (zero-or-one)');
    assert(diagramContents.dbSchema.includes('users ||--|| loyalty_cards'),
      'Schema has users ||--|| loyalty_cards');
    assert(diagramContents.classDiagram.includes('User "1" -- "0..1" LoyaltyCard'),
      'Class diagram has User "1" -- "0..1" LoyaltyCard');

    // Booking -> Payment
    assert(diagramContents.erd.includes('Booking ||--o| Payment'),
      'ERD has Booking ||--o| Payment (zero-or-one)');
    assert(diagramContents.dbSchema.includes('bookings ||--|| payments'),
      'Schema has bookings ||--|| payments');
    assert(diagramContents.classDiagram.includes('Booking "1" -- "0..1" Payment'),
      'Class diagram has Booking "1" -- "0..1" Payment');

    // Service -> ServiceVariant
    assert(diagramContents.erd.includes('Service ||--o{ ServiceVariant'),
      'ERD has Service ||--o{ ServiceVariant');
    assert(diagramContents.dbSchema.includes('services ||--o{ service_variants'),
      'Schema has services ||--o{ service_variants');
    assert(diagramContents.classDiagram.includes('Service "1" *-- "0..*" ServiceVariant'),
      'Class diagram has Service "1" *-- "0..*" ServiceVariant');

    // LoyaltyCard -> LoyaltyStamp
    assert(diagramContents.erd.includes('LoyaltyCard ||--o{ LoyaltyStamp'),
      'ERD has LoyaltyCard ||--o{ LoyaltyStamp');
    assert(diagramContents.dbSchema.includes('loyalty_cards ||--o{ loyalty_stamps'),
      'Schema has loyalty_cards ||--o{ loyalty_stamps');
    assert(diagramContents.classDiagram.includes('LoyaltyCard "1" *-- "0..*" LoyaltyStamp'),
      'Class diagram has LoyaltyCard "1" *-- "0..*" LoyaltyStamp');
  });

  // ==========================================================================
  // FINAL REPORT & SUMMARY
  // ==========================================================================
  console.log(`\n================================================================================`);
  console.log(`OVERALL VERIFICATION SUITE SUMMARY`);
  console.log(`================================================================================`);
  console.log(`Suites Executed: ${stats.suites.length}`);
  console.log(`Total Assertions: ${stats.total}`);
  console.log(`Assertions Passed: ${stats.passed}`);
  console.log(`Assertions Failed: ${stats.failed}`);
  console.log(`Pass Rate: ${((stats.passed / stats.total) * 100).toFixed(2)}%\n`);

  for (const s of stats.suites) {
    const status = s.failed === 0 ? 'PASS' : 'FAIL';
    const indicator = s.failed === 0 ? '✅' : '❌';
    console.log(`${indicator} [${status}] ${s.name} (${s.passed}/${s.total} passed in ${s.duration}ms)`);
    if (s.errors.length > 0) {
      for (const err of s.errors) {
        console.log(`      ⚠️  ${err}`);
      }
    }
  }

  if (stats.failed === 0) {
    console.log(`\n🎉 ALL ARCHITECTURE DIAGRAM VERIFICATION CHECKS PASSED WITH 0 ERRORS! 🎉\n`);
    process.exit(0);
  } else {
    console.error(`\n💥 VERIFICATION FAILED: ${stats.failed} assertion(s) failed across ${stats.suites.length} suites.\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
