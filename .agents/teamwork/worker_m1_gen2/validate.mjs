import mermaid from '/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/node_modules/mermaid/dist/mermaid.core.mjs';
import fs from 'fs';

const filePath = '/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/database-schema-diagram.txt';
const content = fs.readFileSync(filePath, 'utf8');

console.log('Testing file parsing with Mermaid core...');
try {
  await mermaid.parse(content);
  console.log('PASS: Diagram parsed successfully without syntax errors!');
} catch (err) {
  console.error('FAIL: Diagram failed to parse:', err.message);
  process.exit(1);
}
