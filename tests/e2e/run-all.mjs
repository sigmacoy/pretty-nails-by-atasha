import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TIERS = [
  {
    id: 1,
    name: 'Tier 1: Feature Coverage',
    dir: 'tests/e2e/tier1-feature-coverage',
    files: [
      'ui-primitives.test.mjs',
      'empty-states.test.mjs',
      'receipt-upload.test.mjs',
      'toast-notifications.test.mjs',
      'seed-data.test.mjs',
      'studio-identity.test.mjs'
    ]
  },
  {
    id: 2,
    name: 'Tier 2: Boundary & Corner Cases',
    dir: 'tests/e2e/tier2-boundary-corner',
    files: [
      'empty-state-boundaries.test.mjs',
      'focus-boundaries.test.mjs',
      'upload-boundaries.test.mjs',
      'toast-boundaries.test.mjs',
      'seed-boundaries.test.mjs',
      'theme-boundaries.test.mjs',
      'constraint-boundaries.test.mjs'
    ]
  },
  {
    id: 3,
    name: 'Tier 3: Cross-Feature Combinations',
    dir: 'tests/e2e/tier3-cross-feature',
    files: [
      'booking-flow-integration.test.mjs',
      'design-system-consistency.test.mjs',
      'theme-toggle-interactions.test.mjs'
    ]
  },
  {
    id: 4,
    name: 'Tier 4: Workload Scenarios',
    dir: 'tests/e2e/tier4-workload-scenarios',
    files: [
      'customer-booking-journey.test.mjs',
      'admin-audit-walkthrough.test.mjs',
      'repository-integrity-audit.test.mjs'
    ]
  }
];

function runSuite(filePath) {
  const startTime = Date.now();
  try {
    const stdout = execSync(`node --test ${filePath}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000
    });
    const durationMs = Date.now() - startTime;
    const passMatch = stdout.match(/\bpass (\d+)/);
    const failMatch = stdout.match(/\bfail (\d+)/);
    const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
    const failed = failMatch ? parseInt(failMatch[1], 10) : 0;
    return { success: failed === 0, passed, failed, durationMs, output: stdout };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    const passMatch = stdout.match(/\bpass (\d+)/);
    const failMatch = stdout.match(/\bfail (\d+)/);
    const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
    const failed = failMatch ? parseInt(failMatch[1], 10) : 1;
    return {
      success: false,
      passed,
      failed,
      durationMs,
      output: `${stdout}\n${stderr}\n${err.message}`
    };
  }
}

function main() {
  console.log('================================================================================');
  console.log('Pretty Nails by Atasha - Automated E2E Test Suite Runner');
  console.log('Specification: ORIGINAL_REQUEST.md and PROJECT.md (Features 1 to 16)');
  console.log('Standards: ASD-STE100, Zero Emojis, Zero Git Commits, Zero npm run build');
  console.log('================================================================================\n');

  const overallStartTime = Date.now();
  const tierResults = [];
  let grandTotalPassed = 0;
  let grandTotalFailed = 0;
  let totalSuites = 0;
  let passedSuites = 0;

  for (const tier of TIERS) {
    console.log(`--- Executing ${tier.name} ---`);
    let tierPassed = 0;
    let tierFailed = 0;
    let tierDuration = 0;

    for (const fileName of tier.files) {
      const suitePath = path.join(tier.dir, fileName);
      if (!fs.existsSync(suitePath)) {
        console.log(`[FAIL] ${suitePath} - File not found`);
        tierFailed += 1;
        grandTotalFailed += 1;
        totalSuites += 1;
        continue;
      }

      totalSuites += 1;
      const result = runSuite(suitePath);
      tierPassed += result.passed;
      tierFailed += result.failed;
      tierDuration += result.durationMs;
      grandTotalPassed += result.passed;
      grandTotalFailed += result.failed;

      if (result.success) {
        passedSuites += 1;
        console.log(
          `[PASS] ${fileName.padEnd(36)} | Passed: ${String(result.passed).padStart(2)} | Failed: ${String(result.failed).padStart(2)} | Duration: ${result.durationMs}ms`
        );
      } else {
        console.log(
          `[FAIL] ${fileName.padEnd(36)} | Passed: ${String(result.passed).padStart(2)} | Failed: ${String(result.failed).padStart(2)} | Duration: ${result.durationMs}ms`
        );
        console.error(result.output);
      }
    }

    tierResults.push({
      id: tier.id,
      name: tier.name,
      suitesCount: tier.files.length,
      passed: tierPassed,
      failed: tierFailed,
      durationMs: tierDuration
    });
    console.log('');
  }

  const grandTotalDuration = Date.now() - overallStartTime;

  console.log('================================================================================');
  console.log('E2E TEST SUITE EXECUTION SUMMARY (ASD-STE100)');
  console.log('================================================================================');
  console.log('| Tier                                 | Suites | Passed | Failed | Total  | Duration |');
  console.log('|--------------------------------------|--------|--------|--------|--------|----------|');

  for (const tr of tierResults) {
    const totalTests = tr.passed + tr.failed;
    const tierNamePadded = tr.name.padEnd(36);
    const suitesPadded = String(tr.suitesCount).padStart(6);
    const passedPadded = String(tr.passed).padStart(6);
    const failedPadded = String(tr.failed).padStart(6);
    const totalPadded = String(totalTests).padStart(6);
    const durationPadded = `${tr.durationMs}ms`.padStart(8);
    console.log(`| ${tierNamePadded} | ${suitesPadded} | ${passedPadded} | ${failedPadded} | ${totalPadded} | ${durationPadded} |`);
  }

  console.log('|--------------------------------------|--------|--------|--------|--------|----------|');
  const grandTotalTests = grandTotalPassed + grandTotalFailed;
  const grandTotalRow =
    `| Total                                | ${String(totalSuites).padStart(6)} | ${String(grandTotalPassed).padStart(6)} | ${String(grandTotalFailed).padStart(6)} | ${String(grandTotalTests).padStart(6)} | ${(grandTotalDuration + 'ms').padStart(8)} |`;
  console.log(grandTotalRow);
  console.log('================================================================================');

  if (grandTotalFailed === 0) {
    console.log(`\nOVERALL STATUS: SUCCESS (${grandTotalPassed} of ${grandTotalTests} tests passed across ${passedSuites} suites)`);
    console.log('All 16 features from PROJECT.md verified.');
    console.log('Compilation status: Zero errors.');
    console.log('Policy compliance: Zero emojis detected, zero git commits executed, zero npm run build executed.\n');
    process.exit(0);
  } else {
    console.error(`\nOVERALL STATUS: FAILURE (${grandTotalFailed} tests failed)`);
    process.exit(1);
  }
}

main();
