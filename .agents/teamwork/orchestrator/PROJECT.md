# Project: Architecture Diagrams Standardization and Verification

## Architecture
The system architecture documentation consists of 5 core Mermaid diagram artifacts under `DIAGRAMS/`:
1. `database-schema-diagram.txt` (Relational schema, junction tables, data types, constraints)
2. `activity-diagram.txt` (Workflow control flow, start/end nodes, decision points)
3. `use-case-diagram.txt` (Actor-use case interactions, UML include/extend stereotypes)
4. `class-diagram.txt` (Class relationships, members, methods, cardinalities)
5. `ERD.txt` (Entity-relationship model, keys, cardinalities)

Backend Alignment Source of Truth:
- JPA Entity source code in `backend/src/main/java/com/prettynails/entity/` uses `@GeneratedValue(strategy = GenerationType.UUID)` with `private String id;`.
- PostgreSQL database schema uses `UUID` data type for all primary and foreign key IDs.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1: Database Schema Diagram Fixes | Comment out legend (lines 269-276) with `%%`, comment out composite keys UK in accounts/verification_tokens, update cardinality `}o--o{` to `||--o{` on junction tables (service_variants and bookings), clean constraints. | M1 | fix_diagrams_plan.md / ORIGINAL_REQUEST |
| 2 | R2: Activity Diagram Fixes | Remove infinite self-loops (S32, A12, A14, A17, A19, A24), rename colliding node IDs in Flow 6 (A13, A14 -> A13_Avail, A14_Avail), add formal start/end nodes (`([Start])`, `([End])`). | M2 | fix_diagrams_plan.md / ORIGINAL_REQUEST |
| 3 | R3: Use Case Diagram Fixes | Consolidate duplicate use cases (merge UC12 into UC4, UC10 into UC5), assign UC1 (Register) and UC2 (Login) to Public actor, label inter-usecase dashed arrows with `<<include>>` or `<<extend>>` with proper arrow direction. | M3 | fix_diagrams_plan.md / ORIGINAL_REQUEST |
| 4 | R4: Class Diagram & ERD Fixes | Remove duplicate reverse association lines in class-diagram.txt, add missing ServiceVariant-BookingService association in both files, standardize all ID types in ERD.txt to UUID matching backend and schema. | M4 | fix_diagrams_plan.md / ORIGINAL_REQUEST |
| 5 | R5: Automated Verification & Consistency | Develop and execute automated test script (Node.js/Python) validating Mermaid syntax across all 5 diagrams, confirming zero parse errors, and verifying 100% cross-diagram consistency in entity names, relationships, and UUID types. | M5 | fix_diagrams_plan.md / ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Schema Diagram | Fix syntax, comments, composite keys, cardinality in `DIAGRAMS/database-schema-diagram.txt` | none | DONE (by Worker M1 Gen 2; 41/41 assertions pass) |
| M2 | Activity Diagram | Fix infinite self-loops, node collisions, start/end nodes in `DIAGRAMS/activity-diagram.txt` | none | DONE (by Worker M2 Gen 2; 7/7 verification checks pass) |
| M3 | Use Case Diagram | Consolidate use cases, actor mapping, UML stereotypes in `DIAGRAMS/use-case-diagram.txt` | none | DONE (by Worker M3 Gen 2; 31 assertions pass) |
| M4 | Class Diagram & ERD | Remove duplicate reverse associations, standardize UUID types, add missing ServiceVariant-BookingService association in `DIAGRAMS/class-diagram.txt` and `DIAGRAMS/ERD.txt` | none | DONE (by Worker M4 Gen 2; all 15 JPA entities aligned) |
| M5 | Automated Verification & Consistency | Run automated verification script across all 5 diagrams, verify Mermaid renderer compatibility and cross-diagram consistency | M1, M2, M3, M4 | DONE (by Worker M5; 266/266 assertions pass across 7 test suites) |

## Interface Contracts & Cross-Diagram Conventions
- **Identifier Type Standard**: Primary and foreign keys for all entity tables (`User`, `Account`, `Service`, `ServiceVariant`, `Booking`, `BookingService`, `Payment`, `Availability`, `LoyaltyCard`, `LoyaltyStamp`, `CustomerNote`, `Session`, `VerificationToken`, `Gallery`, `Setting`) MUST use `UUID` in `ERD.txt` and `database-schema-diagram.txt`, and `String` (with UUID semantics) in `class-diagram.txt`.
- **Relational Cardinalities**:
  - `ServiceVariant` to `BookingService`: One-to-Many (`ServiceVariant ||--o{ BookingService` in ERD, `service_variants ||--o{ booking_services` in schema, `ServiceVariant "1" -- "0..*" BookingService` in class diagram).
  - `Booking` to `BookingService`: One-to-Many (`Booking ||--o{ BookingService`).
  - `User` to `LoyaltyCard`: Zero-or-One (`User ||--o| LoyaltyCard` in ERD).
  - `Booking` to `Payment`: Zero-or-One (`Booking "1" -- "0..1" Payment` in class diagram).

## Code Layout & Exclusive Write Boundaries
- **Worker 1 (`teamwork_worker_m1`)**:
  - File: `DIAGRAMS/database-schema-diagram.txt`
- **Worker 2 (`teamwork_worker_m2`)**:
  - File: `DIAGRAMS/activity-diagram.txt`
- **Worker 3 (`teamwork_worker_m3`)**:
  - File: `DIAGRAMS/use-case-diagram.txt`
- **Worker 4 (`teamwork_worker_m4`)**:
  - Files: `DIAGRAMS/class-diagram.txt`, `DIAGRAMS/ERD.txt`
- **Worker 5 (`teamwork_worker_m5`)**:
  - File: `scripts/verify_diagrams.mjs` (Verification script only; reads `DIAGRAMS/*.txt`)
