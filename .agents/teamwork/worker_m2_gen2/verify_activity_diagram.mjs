import fs from 'fs';
import jsdom from '/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/node_modules/jsdom/lib/api.js';

// Setup DOM for Mermaid
const dom = new jsdom.JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

const mermaid = (await import('/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/node_modules/mermaid/dist/mermaid.esm.mjs')).default;
mermaid.initialize({ startOnLoad: false });

const filePath = '/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/activity-diagram.txt';
const content = fs.readFileSync(filePath, 'utf8');

console.log('=== Checking activity-diagram.txt ===');

let allPassed = true;

// 1. Check Mermaid Parse
try {
  await mermaid.parse(content);
  console.log('✅ Mermaid syntax parse: PASS');
} catch (err) {
  console.error('❌ Mermaid syntax parse: FAIL -', err.message);
  allPassed = false;
}

// 2. Parse connections to find graph topology and self-loops
const lines = content.split('\n');
const edges = [];
const definedNodes = new Set();
const inEdges = new Map();
const outEdges = new Map();
const selfLoops = [];

// Subgraph nodes
const subgraphRegex = /subgraph\s+([A-Za-z0-9_]+)[\s\S]*?end/g;
let sgMatch;
while ((sgMatch = subgraphRegex.exec(content)) !== null) {
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
    edges.push({ from, to, line: idx + 1, raw: trimmed });
    if (!outEdges.has(from)) outEdges.set(from, []);
    outEdges.get(from).push(to);
    if (!inEdges.has(to)) inEdges.set(to, []);
    inEdges.get(to).push(from);

    if (from === to) {
      selfLoops.push({ node: from, line: idx + 1, raw: trimmed });
    }
  }
});

if (selfLoops.length === 0) {
  console.log('✅ Self-loops check: PASS (0 self-loops found)');
} else {
  console.error(`❌ Self-loops check: FAIL (${selfLoops.length} self-loops found):`);
  selfLoops.forEach(l => console.error(`   Line ${l.line}: ${l.raw}`));
  allPassed = false;
}

// 3. Check for specific prohibited loops
const prohibitedLoops = ['S32', 'A12', 'A14', 'A17', 'A19', 'A24'];
const prohibitedFound = selfLoops.filter(l => prohibitedLoops.includes(l.node));
if (prohibitedFound.length === 0) {
  console.log('✅ Prohibited self-loops (S32, A12, A14, A17, A19, A24): PASS (None found)');
} else {
  console.error('❌ Prohibited self-loops found:', prohibitedFound);
  allPassed = false;
}

// 4. Check for node collisions (A13/A14 in Flow 6)
const flow6Match = content.match(/FLOW 6:[\s\S]*?(?=FLOW 7:)/);
if (flow6Match) {
  const flow6Content = flow6Match[0];
  const hasA13 = /\bA13\b/.test(flow6Content);
  const hasA14 = /\bA14\b/.test(flow6Content);
  const hasA13Avail = /\bA13_Avail\b/.test(flow6Content);
  const hasA14Avail = /\bA14_Avail\b/.test(flow6Content);

  if (!hasA13 && !hasA14 && hasA13Avail && hasA14Avail) {
    console.log('✅ Flow 6 node collision check: PASS (A13/A14 renamed to A13_Avail/A14_Avail)');
  } else {
    console.error('❌ Flow 6 node collision check: FAIL', { hasA13, hasA14, hasA13Avail, hasA14Avail });
    allPassed = false;
  }
} else {
  console.error('❌ Could not locate FLOW 6 block');
  allPassed = false;
}

// 5. Check for Start and End nodes
const startNodes = content.match(/\b([A-Za-z0-9_]*Start[A-Za-z0-9_]*)\s*\(\(\[?Start\]?\)\)/g) || 
                   content.match(/\b([A-Za-z0-9_]*Start[A-Za-z0-9_]*)\s*\(\[Start\]\)/g) || [];
const endNodes = content.match(/\b([A-Za-z0-9_]*End[A-Za-z0-9_]*)\s*\(\(\[?End\]?\)\)/g) || 
                 content.match(/\b([A-Za-z0-9_]*End[A-Za-z0-9_]*)\s*\(\[End\]\)/g) || [];

console.log(`ℹ️ Start nodes found: ${startNodes.length}`);
console.log(`ℹ️ End nodes found: ${endNodes.length}`);

if (startNodes.length >= 10 && endNodes.length >= 10) {
  console.log('✅ Start and End nodes check: PASS');
} else {
  console.error('❌ Start and End nodes check: FAIL (missing start or end nodes)');
  allPassed = false;
}

// 6. Check classDef startend styling
const hasStartEndClassDef = /classDef\s+startend\b/.test(content);
const hasStartEndClassUsage = /class\s+[^;]*\bstartend\b/.test(content);
if (hasStartEndClassDef && hasStartEndClassUsage) {
  console.log('✅ classDef startend styling check: PASS');
} else {
  console.error('❌ classDef startend styling check: FAIL', { hasStartEndClassDef, hasStartEndClassUsage });
  allPassed = false;
}

// 7. Check for isolated nodes in subgraphs
const isolated = [];
for (const node of definedNodes) {
  if (!inEdges.has(node) && !outEdges.has(node)) {
    isolated.push(node);
  }
}
if (isolated.length === 0) {
  console.log('✅ Subgraph isolated nodes check: PASS (0 isolated nodes)');
} else {
  console.error('❌ Subgraph isolated nodes check: FAIL - isolated nodes:', isolated);
  allPassed = false;
}

if (allPassed) {
  console.log('\n🌟 ALL CHECKS PASSED PERFECTLY! 🌟');
  process.exit(0);
} else {
  console.error('\n💥 SOME CHECKS FAILED! 💥');
  process.exit(1);
}
