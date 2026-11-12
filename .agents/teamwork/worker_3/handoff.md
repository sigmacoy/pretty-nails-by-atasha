# Handoff Report: Worker 3 (Auth & Profile Backend APIs)

## 1. Observation
- Frontend `/profile` page contains two forms:
  1. `ProfileForm.tsx` invokes `authApi.updateProfile({ name, phone, nickname })`, calling `PUT /api/auth/profile` and expecting an updated `UserDto` (`AuthResponse['user']`).
  2. `ChangePasswordForm.tsx` invokes `authApi.changePassword({ currentPassword, newPassword })`, calling `POST /api/auth/change-password` and expecting `{ message: string }`, specifically checking for error response message `"Current password is incorrect"`.
- Prior to this task, `AuthController.java` and `AuthService.java` only provided `/api/auth/register`, `/api/auth/login`, and `/api/auth/me`. Any call to `PUT /api/auth/profile` or `POST /api/auth/change-password` returned `404 Not Found`.
- In `JwtAuthenticationFilter.java`, `PUBLIC_PATHS` originally had `"/api/auth/"`, which caused `JwtAuthenticationFilter` to bypass JWT authentication for all `/api/auth/*` requests. Furthermore, `SecurityConfig.java` configured `.requestMatchers("/api/auth/**").permitAll()`. This prevented authenticated endpoints under `/api/auth/` from having `SecurityContextHolder` populated with the authenticated `User`.
- The `User` JPA entity (`com.prettynails.entity.User`) already includes persistent fields for `name`, `nickname`, `phone`, `image`, and `password`.

## 2. Logic Chain
1. **DTO Definition (`AuthDtos.java`):**
   - Added `UpdateProfileRequest`: holds `name` (max 100), `phone` (max 20), `nickname` (max 100), and `image` (max 500).
   - Added `ChangePasswordRequest`: holds `@NotBlank` `currentPassword` and `@NotBlank @Size(min = 6)` `newPassword`.
   - Added `MessageResponse`: standard JSON container for `{ "message": "..." }`.
2. **Business Logic Implementation (`AuthService.java`):**
   - `updateProfile(String userId, UpdateProfileRequest request)`:
     - Retrieves authenticated user by `userId` from `UserRepository` (or throws `ResourceNotFoundException`).
     - Validates that non-null `name` is not blank (`BadRequestException("Name cannot be empty")`).
     - Updates `name`, `phone`, `nickname`, and `image` when provided.
     - Persists user entity via `userRepository.save(user)`.
     - Maps and returns updated `UserDto` matching frontend expectations.
   - `changePassword(String userId, ChangePasswordRequest request)`:
     - Retrieves user by `userId`.
     - Verifies `currentPassword` using `passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())`. If invalid, throws `BadRequestException("Current password is incorrect")`, returning HTTP 400 Bad Request to match frontend `ChangePasswordForm` handler.
     - Validates new password length (minimum 6 characters).
     - Encodes new password using BCrypt via `passwordEncoder.encode(request.getNewPassword())`.
     - Saves updated password to `UserRepository`.
3. **Controller Endpoints (`AuthController.java`):**
   - Added `getCurrentUser()` helper to reliably retrieve the authenticated `User` from `SecurityContextHolder` and throw `BadRequestException("User not authenticated")` if unauthenticated.
   - Implemented `PUT /api/auth/profile`: extracts authenticated user, calls `authService.updateProfile()`, returns `ResponseEntity.ok(UserDto)`.
   - Implemented `POST /api/auth/change-password`: extracts authenticated user, calls `authService.changePassword()`, returns `ResponseEntity.ok(new MessageResponse("Password changed successfully"))`.
4. **Spring Security Hardening (`SecurityConfig.java` & `JwtAuthenticationFilter.java`):**
   - In `SecurityConfig.java`, refined permitAll matcher:
     `.requestMatchers("/api/auth/register", "/api/auth/login").permitAll()`
     All other auth endpoints (`/profile`, `/change-password`, `/me`) are governed by `.anyRequest().authenticated()`.
   - In `JwtAuthenticationFilter.java`, narrowed `PUBLIC_PATHS` to `"/api/auth/login"` and `"/api/auth/register"`, ensuring Bearer tokens are decoded and `SecurityContextHolder` is populated for authenticated endpoints.
5. **Codebase Synchronization:**
   - Synchronized all controller, service, DTO, security, and test changes to both active project folders: `pretty-nails-backend/` and `backend/`.
6. **Testing and Verification:**
   - Authored 8 new tests in `AuthServiceTest.java` (13 total) covering all positive and negative edge cases.
   - Authored 7 tests in `AuthControllerTest.java` verifying MockMvc HTTP status codes, request bodies, authentication checks, and error responses.
   - Verified that all 20 tests pass with 0 failures and 0 errors across both backend directories.

## 3. Caveats
- `BookingServiceTest` and `LoyaltyServiceTest` contain unrelated failures from in-progress work by other domain workers (Worker 1 / Worker 4). All authentication-related tests (`AuthServiceTest`, `AuthControllerTest`) pass cleanly with 100% success.
- `BookingForm.tsx` currently has an ongoing TypeScript type error being worked on by Worker 2 (`paymentMethod`). Frontend auth files (`ProfileForm.tsx`, `ChangePasswordForm.tsx`, `lib/api.ts`) have zero errors.

## 4. Conclusion
Tasks 1, 2, and 3 are genuinely and completely implemented without facades or hardcoded values:
1. `PUT /api/auth/profile` accepts `name`, `phone`, `nickname`, `image`, updates the authenticated user in `UserRepository`, and returns the updated `UserDto`.
2. `POST /api/auth/change-password` accepts `currentPassword` and `newPassword`, validates current password via `passwordEncoder.matches()` (returning 400 Bad Request with message `"Current password is incorrect"` on mismatch), encodes new password using BCrypt, saves to `UserRepository`, and returns 200 OK with success message.
3. Spring Security configuration allows authenticated access to these endpoints and restricts unauthenticated access. 20/20 unit and controller tests pass.

## 5. Verification Method
Run the following commands from workspace root:
1. Backend compilation and tests in `pretty-nails-backend`:
   ```bash
   ./mvnw -f pretty-nails-backend/pom.xml test -Dtest=AuthServiceTest,AuthControllerTest
   ```
   Expected: `Tests run: 20, Failures: 0, Errors: 0, Skipped: 0` -> `BUILD SUCCESS`.
2. Backend compilation and tests in `backend`:
   ```bash
   ./mvnw -f backend/pom.xml test -Dtest=AuthServiceTest,AuthControllerTest
   ```
   Expected: `Tests run: 20, Failures: 0, Errors: 0, Skipped: 0` -> `BUILD SUCCESS`.
3. Source files to inspect:
   - `pretty-nails-backend/src/main/java/com/prettynails/controller/AuthController.java`
   - `pretty-nails-backend/src/main/java/com/prettynails/service/AuthService.java`
   - `pretty-nails-backend/src/main/java/com/prettynails/dto/AuthDtos.java`
   - `pretty-nails-backend/src/main/java/com/prettynails/security/SecurityConfig.java`
   - `pretty-nails-backend/src/main/java/com/prettynails/security/JwtAuthenticationFilter.java`
   - `pretty-nails-backend/src/test/java/com/prettynails/controller/AuthControllerTest.java`
   - `pretty-nails-backend/src/test/java/com/prettynails/service/AuthServiceTest.java`
