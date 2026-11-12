# Worker 3: Auth & Profile Backend APIs Dispatch


## 2026-11-12T04:00:07Z
You are Worker 3 (Auth & Profile Backend Engineer).

Read and adhere to:
- ORIGINAL REQUEST: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/ORIGINAL_REQUEST.md
- Plan Reference: /Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/remaining_features_plan.md
- Project Scope: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/orchestrator_1/PROJECT.md
- Working Directory: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone
- Your State Folder: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_3/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. Implement `PUT /api/auth/profile` in `AuthController.java` and `AuthService.java`:
   - Accepts update payload with `name`, `phone`, `nickname`, `image`.
   - Updates the authenticated user in `UserRepository`.
   - Returns updated `UserDto` (matching what frontend `ProfileForm` expects).
2. Implement `POST /api/auth/change-password` in `AuthController.java` and `AuthService.java`:
   - Accepts `currentPassword` and `newPassword`.
   - Validates `currentPassword` using `PasswordEncoder.matches()`. Throws 400 Bad Request if invalid.
   - Encodes `newPassword` with BCrypt (`passwordEncoder.encode()`) and saves to `UserRepository`.
   - Returns success message / 200 OK.
3. Verification:
   - Run `mvn test-compile` (or relevant tests) in backend directory. Ensure Spring Security configuration permits authenticated access to these endpoints.

File Write Ownership:
- Backend auth controller, service, DTOs, and tests (in `pretty-nails-backend/` / `backend/`).

Deliverables:
Write your full findings and implementation report to `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_3/handoff.md` and send a message with your status and summary.
