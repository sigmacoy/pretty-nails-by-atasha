## Build & Verification

- Build command: `npm run build`. Always verify changes with it.
- After any code edit, re-run the build. Never claim a task is done
  without a passing build.
- On failure: fix ONLY the errors shown. Re-run and repeat until it
  passes, or stop after 5 attempts and report what remains.
- Do not modify files unrelated to the reported errors.
- Never silence errors by: adding `any`, skipping/`.skip`-ing tests,
  disabling lint rules, or editing `tsconfig`/build config.
- When reporting, quote the exact error lines you fixed and paste the
  raw final build result (exit code included).