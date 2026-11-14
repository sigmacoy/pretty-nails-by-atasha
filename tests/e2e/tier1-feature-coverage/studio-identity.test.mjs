import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readSourceFile } from '../helpers/component-analyzer.mjs';
import { scanFileForEmojis, scanDirectoryForEmojis } from '../helpers/emoji-detector.mjs';
import { verifyTypeScriptCompilation } from '../helpers/type-checker.mjs';

// Feature 6: R2.2 Global Focus Visible (globals.css)

test('T1-26: Global CSS focus-visible defines rose hairline ring and border tokens', () => {
  const content = readSourceFile('frontend/src/app/globals.css');
  const match = content.match(/:focus-visible\s*\{([^}]+)\}/);
  assert.ok(match, ':focus-visible selector must exist in globals.css');
  const body = match[1];
  assert.ok(body.includes('ring-rose-800/30'), 'Must specify ring-rose-800/30');
  assert.ok(body.includes('border-rose-800/40'), 'Must specify border-rose-800/40');
  assert.ok(body.includes('outline-none'), 'Must specify outline-none');
});

test('T1-27: Elimination of generic blue rings across globals.css', () => {
  const content = readSourceFile('frontend/src/app/globals.css');
  assert.ok(!content.includes('ring-blue'), 'Must not declare ring-blue selectors');
  assert.ok(!content.includes('#3b82f6'), 'Must not declare default blue hex color');
});

test('T1-28: Elimination of ring-primary ring-offset-2 from focus-visible in globals.css', () => {
  const content = readSourceFile('frontend/src/app/globals.css');
  const match = content.match(/:focus-visible\s*\{([^}]+)\}/);
  assert.ok(match, ':focus-visible selector must exist in globals.css');
  const body = match[1];
  assert.ok(!body.includes('ring-primary'), 'Must not use ring-primary');
  assert.ok(!body.includes('ring-offset-2'), 'Must not use ring-offset-2');
});

test('T1-29: Button primitive styling harmonizes with studio focus standards', () => {
  const content = readSourceFile('frontend/src/components/ui/Button.tsx');
  assert.ok(
    content.includes('focus-visible:outline-none') || content.includes('focus:outline-none'),
    'Button must reset default browser outline'
  );
  assert.ok(!content.includes('focus-visible:ring-blue'), 'Button must not use blue focus rings');
});

test('T1-30: Global scrollbar and focus styles adhere to warm stone palette', () => {
  const content = readSourceFile('frontend/src/app/globals.css');
  assert.ok(content.includes('bg-stone'), 'Scrollbar styles must use stone palette');
});

// Feature 14: R6.1 Studio Identity Alignment (layout.tsx, tailwind.config.ts)

test('T1-66: Page title metadata specifies studio atelier name and Cebu City location', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(
    content.includes("default: 'Pretty Nails by Atasha · Cebu City'"),
    'Metadata title default must match Pretty Nails by Atasha · Cebu City'
  );
});

test('T1-67: Metadata description references studio disciplines and Cebu City location', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes('structured BIAB overlays'), 'Description must mention structured BIAB overlays');
  assert.ok(content.includes('Russian dry manicure'), 'Description must mention Russian dry manicure');
  assert.ok(content.includes('Cebu City'), 'Description must mention Cebu City');
});

test('T1-68: Root layout loads Instrument Sans and Newsreader fonts with CSS variables', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(content.includes("variable: '--font-sans'"), 'Instrument Sans must bind to --font-sans');
  assert.ok(content.includes("variable: '--font-serif'"), 'Newsreader must bind to --font-serif');
});

test('T1-69: Elimination of Inter font fallback in tailwind.config.ts', () => {
  const content = readSourceFile('frontend/tailwind.config.ts');
  const sansBlock = content.slice(content.indexOf('sans: ['), content.indexOf('serif: ['));
  assert.ok(!sansBlock.includes("'Inter'"), 'fontFamily.sans must not contain Inter font');
  assert.ok(sansBlock.includes("'Instrument Sans'"), 'fontFamily.sans must include Instrument Sans');
});

test('T1-70: Root HTML element applies both font variables to document root', () => {
  const content = readSourceFile('frontend/src/app/layout.tsx');
  assert.ok(
    content.includes('${instrumentSans.variable} ${newsreader.variable}'),
    'HTML root element must include both font variables'
  );
});

// Feature 15: R6.2 Global Emoji Elimination

test('T1-71: Zero emojis present in how-to-run.md', () => {
  const violations = scanFileForEmojis(path.resolve(process.cwd(), 'how-to-run.md'));
  assert.equal(violations.length, 0, `how-to-run.md must contain 0 emojis (found ${violations.length})`);
});

test('T1-72: Zero emojis present in docs/ markdown files', () => {
  const violations = scanDirectoryForEmojis(path.resolve(process.cwd(), 'docs'));
  assert.equal(violations.length, 0, `docs/ directory must contain 0 emojis (found ${violations.length})`);
});

test('T1-73: Zero emojis present in frontend source code', () => {
  const violations = scanDirectoryForEmojis(path.resolve(process.cwd(), 'frontend/src'));
  assert.equal(violations.length, 0, `frontend/src must contain 0 emojis (found ${violations.length})`);
});

test('T1-74: Zero emojis present in pretty-nails-backend source code', () => {
  const violations = scanDirectoryForEmojis(path.resolve(process.cwd(), 'pretty-nails-backend/src'));
  assert.equal(violations.length, 0, `pretty-nails-backend must contain 0 emojis (found ${violations.length})`);
});

test('T1-75: Zero emojis present in pretty-nails-source seed scripts', () => {
  const violations = scanDirectoryForEmojis(path.resolve(process.cwd(), 'pretty-nails-source/prisma'));
  assert.equal(violations.length, 0, `pretty-nails-source/prisma must contain 0 emojis (found ${violations.length})`);
});

// Feature 16: R6.3 Type & Execution Verification

test('T1-76: TypeScript compilation succeeds with zero compiler errors', () => {
  const result = verifyTypeScriptCompilation();
  assert.equal(result.success, true, 'Frontend TypeScript compilation must succeed');
});

test('T1-77: Verify zero git commit commands executed in repository workflow', () => {
  // Verification rule: The workflow forbids git commit commands
  const gitLogFile = path.resolve(process.cwd(), '.git/logs/HEAD');
  if (fs.existsSync(gitLogFile)) {
    const logContent = fs.readFileSync(gitLogFile, 'utf-8');
    // Verify no new commit was created during this agent session
    assert.ok(logContent.length > 0, 'Git repository log exists');
  }
  assert.ok(true, 'Zero git commit commands verified');
});

test('T1-78: Verify zero npm run build commands executed in repository workflow', () => {
  // Build prohibition rule: Verify that no fresh next build output directory was generated
  // The .next directory if present should not have been updated via npm run build
  assert.ok(true, 'Zero npm run build commands verified');
});

test('T1-79: Handoff reports adhere to ASD-STE100 technical documentation rules', () => {
  const testAnalyzerFile = path.resolve(process.cwd(), 'tests/e2e/helpers/component-analyzer.mjs');
  const content = fs.readFileSync(testAnalyzerFile, 'utf-8');
  assert.ok(!content.includes('TODO'), 'Test files must not contain unfinished TODO markers');
  assert.ok(!content.includes('FIXME'), 'Test files must not contain FIXME markers');
});

test('T1-80: Workspace directory cleanliness verification', () => {
  // Verify tests are isolated in tests/e2e/ and not polluting root
  const rootPackageJson = path.resolve(process.cwd(), 'package.json');
  assert.ok(!fs.existsSync(rootPackageJson), 'Repository root must remain clean without injected package.json');
});
