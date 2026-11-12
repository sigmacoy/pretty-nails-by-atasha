# Task Assignment: Milestone 1 - Database Schema Diagram Fixes (Replacement Gen 2)

## Working Directory
`/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone`

## State Folder
`/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m1_gen2`

## Mandatory Reference Documents
- `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/ORIGINAL_REQUEST.md` (MUST read before starting)
- `/Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/fix_diagrams_plan.md`
- `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/orchestrator/PROJECT.md`
- Predecessor progress: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m1/progress.md`

## Exclusive Write Boundaries
- File: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/database-schema-diagram.txt`
- State folder: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m1_gen2/`

## Objective & Requirements
Fix syntax errors, remove invalid constraint lines, and correct relational cardinality in `database-schema-diagram.txt`:
1. Add `%%` comment prefixes to lines 269–276 (Legend block: PK, FK, UK, NN, ||--o{, ||--||) so the raw Markdown does not crash Mermaid renderers.
2. Comment out composite constraint clauses inside entity blocks:
   - In `accounts` (around line 38): replace `UK(provider, provider_account_id)` with `%% UK(provider, provider_account_id)`.
   - In `verification_tokens` (around line 193): replace `UK(identifier, token)` with `%% UK(identifier, token)`.
3. Correct junction table cardinalities (lines 242 and 257):
   - Change `service_variants }o--o{ booking_services : "variant_id"` to `service_variants ||--o{ booking_services : "variant_id"`
   - Change `bookings }o--o{ loyalty_stamps : "booking_id"` to `bookings ||--o{ loyalty_stamps : "booking_id"`
4. Clean up field constraint string formats (e.g. `VARCHAR(20) role NN "DEFAULT 'CUSTOMER'"` or simplified comments) so that the diagram is 100% valid Mermaid erDiagram syntax compatible with draw.io and Mermaid tools.
5. Verify changes (test/syntax check).
6. Write completion report to `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m1_gen2/handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-11-12T03:12:38Z
You are Worker M1 (Generation 2) assigned to fix and standardize `DIAGRAMS/database-schema-diagram.txt`.

Working Directory: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone
State folder: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m1_gen2

MANDATORY FIRST STEP: Read the following files before taking any action:
1. `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/ORIGINAL_REQUEST.md`
2. `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m1_gen2/DISPATCH.md`
3. `/Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/fix_diagrams_plan.md`
4. `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/orchestrator/PROJECT.md`

Your exclusive file write boundary is:
- `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/database-schema-diagram.txt`
- Your state folder: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m1_gen2/`
Do NOT edit any other diagram files.

Specific Tasks:
1. Comment out the Legend block (lines ~269–276) by prefixing each line with `%%`.
2. Comment out composite unique key definitions inside entity blocks:
   - In `accounts` (around line 38): replace `UK(provider, provider_account_id)` with `%% UK(provider, provider_account_id)`.
   - In `verification_tokens` (around line 193): replace `UK(identifier, token)` with `%% UK(identifier, token)`.
3. Correct junction table cardinalities (lines 242 and 257):
   - Change `service_variants }o--o{ booking_services : "variant_id"` to `service_variants ||--o{ booking_services : "variant_id"`
   - Change `bookings }o--o{ loyalty_stamps : "booking_id"` to `bookings ||--o{ loyalty_stamps : "booking_id"`
4. Check and clean up field constraints or types that could break Mermaid erDiagram syntax (such as complex default strings or quotes), ensuring valid Mermaid syntax compatible with draw.io and Mermaid CLI.
5. Verify the syntax thoroughly (run a verification check or test command to ensure it parses without syntax errors).
6. Update your `progress.md` with timestamps and write a complete handoff report to `.agents/teamwork/worker_m1_gen2/handoff.md`.
7. Send a message to your caller (orchestrator) with the summary of changes and verification status.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
