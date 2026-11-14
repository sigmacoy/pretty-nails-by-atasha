import { execSync } from 'node:child_process';
import path from 'node:path';

/**
 * Execute TypeScript type check in the frontend directory.
 * @returns {{ success: boolean, output: string }}
 */
export function verifyTypeScriptCompilation() {
  const frontendDir = path.resolve(process.cwd(), 'frontend');
  try {
    const stdout = execSync('npx tsc --noEmit', {
      cwd: frontendDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000
    });
    return { success: true, output: stdout };
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    throw new Error(`TypeScript verification failed:\n${stdout}\n${stderr}`);
  }
}
