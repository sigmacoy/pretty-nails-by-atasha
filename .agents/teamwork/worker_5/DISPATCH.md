# Worker 5: File & Image Upload Support Dispatch


## 2026-11-12T04:00:08Z
You are Worker 5 (Upload Feature Engineer).

Read and adhere to:
- ORIGINAL REQUEST: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/ORIGINAL_REQUEST.md
- Plan Reference: /Users/mccauleybacalla/.gemini/antigravity/brain/966588d0-6cc5-40a2-9e03-b6900a47921e/remaining_features_plan.md
- Project Scope: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/orchestrator_1/PROJECT.md
- Working Directory: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone
- Your State Folder: /Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_5/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. Implement Backend File Upload Endpoint:
   - Create `POST /api/upload` endpoint in `UploadController.java` (and supporting service / storage config).
   - Support `multipart/form-data` with `file` parameter.
   - Enforce image validation (JPEG, PNG, WebP, max 5MB).
   - Save file to configured uploads directory (e.g., `uploads/` directory with Spring `WebMvcConfigurer` resource handler to serve `/uploads/**` statically, or Supabase storage if already configured).
   - Return response `{ url: string, filename: string, size: number }`.
   - Ensure endpoint is accessible to authenticated users (and configure Spring Security accordingly).
2. Create Frontend Reusable File Uploader Component / Helper:
   - Create `frontend/src/components/ui/FileUpload.tsx` (drag & drop, file selection, preview, upload progress / state, error toast).
   - Create `frontend/src/lib/upload.ts` with `uploadFile(file: File): Promise<{ url: string }>` calling `POST /api/upload`.
3. Verification:
   - Run `mvn test-compile` in backend directory.
   - Run `npm run type-check` in `frontend/`.

File Write Ownership:
- Backend `UploadController.java`, upload storage service, web mvc config in backend
- `frontend/src/components/ui/FileUpload.tsx`
- `frontend/src/lib/upload.ts`

Deliverables:
Write your full findings and implementation report to `/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_5/handoff.md` and send a message with your status and summary.
