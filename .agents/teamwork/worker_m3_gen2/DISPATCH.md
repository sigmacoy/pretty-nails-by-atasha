# Task Assignment: Milestone 3 - Use Case Diagram Fixes (Replacement Gen 2)

## Working Directory
`/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone`

## State Folder
`/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3_gen2`

## Mandatory Reference Documents
- `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/ORIGINAL_REQUEST.md` (MUST read before starting)
- `/Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/fix_diagrams_plan.md`
- `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/orchestrator/PROJECT.md`
- Predecessor progress: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/progress.md`

## Exclusive Write Boundaries
- File: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/use-case-diagram.txt`
- State folder: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3_gen2/`

## Objective & Requirements
Align with UML Use Case standards, eliminate duplicate use cases, correct actor mappings, and add standard relationship stereotypes in `use-case-diagram.txt`:
1. Consolidate duplicate use cases:
   - Merge `UC12` into `UC4` (`UC4["UC4: View Available Dates"]` under Availability Management).
   - Merge `UC10` into `UC5` (`UC5["UC5: View Active Services"]` under Service Management).
   - Remove lines `UC4 -.-> UC12` and `UC5 -.-> UC10`.
   - Re-route actor connections:
     `Public --> UC4`
     `Public --> UC5`
     `Customer --> UC4`
     `Customer --> UC5`
2. Move Authentication Use Cases to `Public` actor:
   - Connect `Public --> UC1` (Register Account) and `Public --> UC2` (Login).
   - Remove `Customer --> UC1` and `Customer --> UC2` (since Customer is already registered/authenticated).
   - Retain `Customer --> UC3` (View Profile).
3. Add UML Stereotypes (`<<include>>`, `<<extend>>`) and ensure proper arrow directions (extension use case points toward base use case):
   - `UC9 -.->|"<<extend>>"| UC8` (Update Booking Status extends View All Bookings)
   - `UC13 -.->|"<<include>>"| UC4` (Manage Availability includes View Available Dates)
   - `UC15 -.->|"<<include>>"| UC14` (Manage Gallery includes View Public Gallery)
   - `UC19 -.->|"<<extend>>"| UC18` (View All Loyalty Cards extends/includes Redeem Stamps)
   - Remove or replace non-standard pseudo-dependencies like `UC22 -.-> UC16` and `UC20 -.-> UC21`.
4. Ensure the entire diagram is valid Mermaid syntax renderable in Mermaid CLI and draw.io.
5. Verify changes (syntax check).
6. Write completion report to `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3_gen2/handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-11-12T03:12:56Z
You are Worker M3 (Generation 2) assigned to fix and standardize `DIAGRAMS/use-case-diagram.txt`.

Working Directory: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone
State folder: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3_gen2

MANDATORY FIRST STEP: Read the following files before taking any action:
1. `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/ORIGINAL_REQUEST.md`
2. `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3_gen2/DISPATCH.md`
3. `/Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/fix_diagrams_plan.md`
4. `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/orchestrator/PROJECT.md`

Your exclusive file write boundary is:
- `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/use-case-diagram.txt`
- Your state folder: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3_gen2/`
Do NOT edit any other diagram files.

Specific Tasks:
1. Consolidate duplicate use cases:
   - Merge `UC12` into `UC4` (`UC4["UC4: View Available Dates"]` under Availability Management).
   - Merge `UC10` into `UC5` (`UC5["UC5: View Active Services"]` under Service Management).
   - Remove lines `UC4 -.-> UC12` and `UC5 -.-> UC10`.
   - Re-route actor connections:
     `Public --> UC4`
     `Public --> UC5`
     `Customer --> UC4`
     `Customer --> UC5`
2. Move Authentication Use Cases to `Public` actor:
   - Connect `Public --> UC1` (Register Account) and `Public --> UC2` (Login).
   - Remove `Customer --> UC1` and `Customer --> UC2` (since Customer is already authenticated).
   - Retain `Customer --> UC3` (View Profile).
3. Add UML Stereotypes (`<<include>>`, `<<extend>>`) and ensure proper arrow directions (extension use case points toward base use case):
   - `UC9 -.->|"<<extend>>"| UC8` (Update Booking Status extends View All Bookings)
   - `UC13 -.->|"<<include>>"| UC4` (Manage Availability includes View Available Dates)
   - `UC15 -.->|"<<include>>"| UC14` (Manage Gallery includes View Public Gallery)
   - `UC19 -.->|"<<extend>>"| UC18` (View All Loyalty Cards extends/includes Redeem Stamps)
   - Remove or replace non-standard pseudo-dependencies like `UC22 -.-> UC16` and `UC20 -.-> UC21`.
4. Ensure the entire diagram is valid Mermaid syntax renderable in Mermaid CLI and draw.io.
5. Verify syntax and validity (run a verification check).
6. Update your `progress.md` with timestamps and write a complete handoff report to `.agents/teamwork/worker_m3_gen2/handoff.md`.
7. Send a message to your caller (orchestrator) with the summary of changes and verification status.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
