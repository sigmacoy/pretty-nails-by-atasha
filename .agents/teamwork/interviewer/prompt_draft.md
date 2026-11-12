Execute the approved implementation plan in `fix_diagrams_plan.md` by splitting the work across parallel workers, one per diagram domain, to fix, standardize, and verify all architecture diagrams in `DIAGRAMS/` for production use. All diagrams must be valid Mermaid syntax directly renderable in Mermaid tools and draw.io.

Working directory: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone
Integrity mode: development

## Reference Material
- Implementation plan: `/Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/fix_diagrams_plan.md`
- Target diagrams directory: `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS`
  1. `database-schema-diagram.txt`
  2. `activity-diagram.txt`
  3. `use-case-diagram.txt`
  4. `class-diagram.txt`
  5. `ERD.txt`
- Backend context: Spring Boot entities in `backend/src/main/java/com/prettynails/entity/` use `@GeneratedValue(strategy = GenerationType.UUID)` with `private String id;`, and PostgreSQL uses `UUID` columns.

## Requirements

### R1. Database Schema Diagram Fixes (`database-schema-diagram.txt`)
Add `%%` comment prefixes to lines 269–276, remove or comment out composite keys inside entity bodies (e.g. `accounts` and `verification_tokens`), and update `}o--o{` to `||--o{` on lines 242 and 257. Ensure all field constraints and data types are valid Mermaid syntax compatible with draw.io and Mermaid renderers.

### R2. Activity Diagram Fixes (`activity-diagram.txt`)
Replace all self-referencing loops with explicit terminal `--> EndFlow([End])` nodes, rename colliding node IDs (`A13`, `A14`) in Flow 6, and add formal `(([Start]))` and `(([End]))` nodes. All activity flows must terminate cleanly without circular transitions.

### R3. Use Case Diagram Fixes (`use-case-diagram.txt`)
Merge `UC4/UC12` and `UC5/UC10`, move `Register` and `Login` from `Customer` to `Public`, and label all inter-usecase dashed arrows with `<<include>>` or `<<extend>>` (ensuring `<<extend>>` arrows point toward the base use case).

### R4. Class Diagram & ERD Fixes (`class-diagram.txt` and `ERD.txt`)
Remove duplicate reverse association lines in `class-diagram.txt`, add the missing `BookingService`–`ServiceVariant` association to both files, and standardize all ID types to `UUID` (matching the Spring Boot `GenerationType.UUID` backend entities and `String`/`UUID` in `class-diagram.txt`).

### R5. Automated Verification & Cross-Diagram Consistency
Create and execute an automated verification script (e.g. Node.js or Python) that parses and validates all 5 Mermaid `.txt` files. Cross-check that entity names, relationships, and `UUID` types are 100% consistent across `ERD.txt`, `database-schema-diagram.txt`, and `class-diagram.txt`, and verify that all diagrams are clean and copy-pasteable into draw.io / Mermaid renderers without parsing errors.

## Acceptance Criteria

### Diagram Syntax & Renderer Compatibility
- [ ] `database-schema-diagram.txt` contains no unescaped Markdown or invalid inline composite keys, and uses `||--o{` for `service_variants` and `bookings` junction relations.
- [ ] `activity-diagram.txt` contains zero self-loops, contains formal start/end nodes, and has unique node IDs for Flow 6.
- [ ] `use-case-diagram.txt` contains no duplicate use cases (`UC12` merged into `UC4`, `UC10` merged into `UC5`), associates `Register` and `Login` with `Public`, and labels all inter-usecase dashed lines with `<<include>>` or `<<extend>>` pointing toward base use cases.
- [ ] `class-diagram.txt` contains no duplicate reverse associations and includes the `ServiceVariant` to `BookingService` association.
- [ ] `ERD.txt` has all primary and foreign key IDs updated to `UUID`, and includes the `ServiceVariant` to `BookingService` association.
- [ ] All 5 `.txt` diagram files parse cleanly without syntax errors and are directly insertable into draw.io / Mermaid renderers.

### Cross-Diagram Consistency & Validation
- [ ] Entity names, relationships, and `UUID` key types are 100% consistent across `ERD.txt`, `database-schema-diagram.txt`, and `class-diagram.txt`.
- [ ] An automated verification script executes successfully, verifying valid Mermaid syntax and cross-file consistency across all 5 diagrams.
