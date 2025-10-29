# User Account Essentials - Task List

## **Slice 0: Playwright E2E Testing Setup**
*Goal: Set up Playwright testing infrastructure for E2E tests*

- [x] **Sub-task:** Install Playwright and its dependencies (`pnpm add -D @playwright/test`)
- [x] **Sub-task:** Run Playwright initialization (`pnpm exec playwright install`)
- [x] **Sub-task:** Create `playwright.config.ts` in project root with configuration (base URL: `http://localhost:6060`, test directory, timeout settings)
- [x] **Sub-task:** Create `e2e/` directory in project root for E2E test files
- [x] **Sub-task:** Add Playwright scripts to `package.json` (`test:e2e`, `test:e2e:ui`, `test:e2e:debug`)
- [x] **Sub-task:** Create example E2E test (`e2e/example.spec.ts`) that verifies home page loads
- [x] **Sub-task:** Create test helper utilities in `e2e/helpers/` (auth helpers, database seeding utilities)
- [x] **Sub-task:** Add Playwright HTML report to `.gitignore`
- [x] **Sub-task:** Document Playwright setup and usage in README
- [x] **Sub-task:** Run example E2E test to verify Playwright works correctly

---

## **Slice 1: Basic Profile View Foundation (Read-Only)**
*Goal: Display a minimal profile page with existing user data*

- [x] **Sub-task:** Add Prisma migration for `username`, `usernameNormalized`, `createdAt` fields to User model (nullable, with backfill strategy)
- [x] **Sub-task:** Run migration on local database and verify existing users have `createdAt` backfilled
- [x] **Sub-task:** Create `ProfileService` class skeleton in `data-access-layer/services/profile/` with `getProfile()` method
- [x] **Sub-task:** Add `findUserById()` repository function in `data-access-layer/repository/user/user-repository.ts`
- [x] **Sub-task:** Write unit tests for `ProfileService.getProfile()`
- [x] **Sub-task:** Create `/profile/page.tsx` with server component that calls `ProfileService.getProfile()` and displays username (or Google name), email, and join date
- [x] **Sub-task:** Create simple read-only `ProfileView` component in `features/profile/ui/profile-view.tsx`
- [x] **Sub-task:** Add navigation link to `/profile` in app navigation
- [x] **Sub-task:** Write E2E test: Navigate to `/profile` and verify basic profile data is displayed
- [x] **Sub-task:** Verify profile page loads correctly for authenticated users

---

## **Slice 2: Display Profile Stats (Library Breakdown)**
*Goal: Enhance profile view with game library statistics*

- [x] **Sub-task:** Add `getLibraryStatsByUserId()` repository function in `data-access-layer/repository/library/library-repository.ts` (status counts only)
- [x] **Sub-task:** Write integration tests for `getLibraryStatsByUserId()` with test data
- [x] **Sub-task:** Update `ProfileService.getProfileWithStats()` to call library repository and return aggregated data
- [x] **Sub-task:** Write unit tests for `ProfileService.getProfileWithStats()`
- [x] **Sub-task:** Update `/profile/page.tsx` to use `getProfileWithStats()` instead of `getProfile()`
- [x] **Sub-task:** Update `ProfileView` component to display status breakdown (e.g., "Curious About: 3, Currently Exploring: 2")
- [x] **Sub-task:** Write E2E test: Verify profile page displays correct library stats for user with games
- [x] **Sub-task:** Verify profile page displays correct stats for users with library items

---

## **Slice 3: Display Recently Played Games**
*Goal: Show last 3-5 games marked as "Currently Exploring"*

- [x] **Sub-task:** Update `getLibraryStatsByUserId()` to include recently played games (last 5 `CURRENTLY_EXPLORING` items, ordered by `updatedAt`)
- [x] **Sub-task:** Update integration tests to verify recent games query
- [x] **Sub-task:** Update `ProfileView` component to render list of recent games with cover images
- [x] **Sub-task:** Add basic styling for recent games list (grid or horizontal scroll)
- [x] **Sub-task:** Write E2E test: Verify recent games section displays correct games (or empty state)
- [x] **Sub-task:** Verify profile page shows recent games correctly (or empty state if none)

---

## **Slice 4: Username Validation Logic (Client + Server)**
*Goal: Implement username validation rules without UI*

- [x] **Sub-task:** Install `bad-words` npm package for profanity filtering
- [x] **Sub-task:** Create `features/profile/lib/validation.ts` with `validateUsername()` function (length, characters, reserved names, profanity)
- [x] **Sub-task:** Write comprehensive unit tests for username validation (all edge cases from spec)
- [x] **Sub-task:** Add `findUserByNormalizedUsername()` repository function
- [x] **Sub-task:** Implement `ProfileService.checkUsernameAvailability()` method (case-insensitive uniqueness check)
- [x] **Sub-task:** Write unit tests for `checkUsernameAvailability()`
- [x] **Sub-task:** Create `checkUsernameAvailability` server action in `features/profile/server-actions/`
- [x] **Sub-task:** Add Zod schema for username validation (`CheckUsernameSchema`)
- [x] **Sub-task:** Test server action with integration test (verify available/taken responses)

---

## **Slice 5: Profile Settings Page (Username Only)**
*Goal: Allow users to update their username*

- [x] **Sub-task:** Create `/profile/settings/page.tsx` with server component that fetches current username
- [x] **Sub-task:** Add `updateUserProfile()` repository function (updates `username` and `usernameNormalized`)
- [x] **Sub-task:** Write integration tests for `updateUserProfile()`
- [x] **Sub-task:** Implement `ProfileService.updateProfile()` method (username validation + uniqueness check + update)
- [x] **Sub-task:** Write unit tests for `ProfileService.updateProfile()`
- [x] **Sub-task:** Create `updateProfile` server action with Zod schema (`UpdateProfileSchema`)
- [x] **Sub-task:** Create `ProfileSettingsForm` component with username input field (no real-time validation yet)
- [x] **Sub-task:** Add "Save Changes" button that calls `updateProfile` action and shows success toast
- [x] **Sub-task:** Write E2E test: Change username and verify it updates in profile view
- [x] **Sub-task:** Verify profile settings page allows username changes and updates profile view

---

## **Slice 6: Real-Time Username Validation UI**
*Goal: Add live validation feedback while typing username*

- [x] **Sub-task:** Create `UsernameInput` component in `features/profile/ui/username-input.tsx` with debounced input (500ms)
- [x] **Sub-task:** Create `useUsernameValidation` hook that calls `checkUsernameAvailability` action after debounce
- [x] **Sub-task:** Add loading spinner, error states, and success checkmark icons to `UsernameInput`
- [x] **Sub-task:** Write component tests for `UsernameInput` (typing, debounce, validation states)
- [x] **Sub-task:** Replace plain input in `ProfileSettingsForm` with `UsernameInput` component
- [x] **Sub-task:** Write E2E test: Type username and verify real-time validation feedback (available vs. taken)
- [x] **Sub-task:** Verify real-time validation works correctly (available = checkmark, taken = error message)

---

## **Slice 7: LocalStack S3 Setup (Development Infrastructure)**
*Goal: Add local S3 storage for avatar uploads*

- [x] **Sub-task:** Add LocalStack service to `docker-compose.yml` with S3 configuration
- [x] **Sub-task:** Create `scripts/init-localstack.sh` script to create `savepoint-dev` S3 bucket
- [x] **Sub-task:** Create `scripts/localstack-cors.json` CORS configuration file
- [x] **Sub-task:** Add S3 environment variables to `.env.example` (AWS_REGION, AWS_ENDPOINT_URL, etc.)
- [x] **Sub-task:** Run `docker-compose up -d` and verify LocalStack service starts successfully
- [x] **Sub-task:** Run initialization script and verify bucket is created (use AWS CLI to list buckets)
- [x] **Sub-task:** Update project README with LocalStack setup instructions

---

## **Slice 8: S3 Storage Service (Avatar Upload Backend)**
*Goal: Implement avatar upload to S3 without UI*

- [x] **Sub-task:** Install `@aws-sdk/client-s3` npm package
- [x] **Sub-task:** Update `env.mjs` to validate S3 environment variables (`AWS_REGION`, `S3_BUCKET_NAME`, etc.)
- [x] **Sub-task:** Create `shared/lib/storage/s3-client.ts` with S3Client wrapper
- [x] **Sub-task:** Create `shared/lib/storage/avatar-storage.ts` with `AvatarStorageService.uploadAvatar()` method
- [x] **Sub-task:** Write unit tests for avatar upload (file validation, S3 key generation)
- [x] **Sub-task:** Write LocalStack integration tests for avatar upload (upload file, verify in bucket)
- [x] **Sub-task:** Create `uploadAvatar` server action with file validation (size, MIME type)
- [x] **Sub-task:** Add Zod schema for avatar upload (`UploadAvatarSchema`)
- [x] **Sub-task:** Test avatar upload with integration test (verify S3 URL returned)

---

## **Slice 9: Avatar Upload UI Component**
*Goal: Add avatar upload widget to profile settings*

- [x] **Sub-task:** Create `AvatarUpload` component in `features/profile/ui/avatar-upload.tsx` (drag-and-drop or click to select)
- [x] **Sub-task:** Add client-side file validation (size, MIME type) before upload
- [x] **Sub-task:** Add image preview after selection (before upload)
- [x] **Sub-task:** Add progress indicator during upload (loading state)
- [x] **Sub-task:** Write component tests for `AvatarUpload` (file selection, validation, upload success/failure)
- [x] **Sub-task:** Integrate `AvatarUpload` into `ProfileSettingsForm` (display current avatar + upload widget)
- [x] **Sub-task:** Update `ProfileService.updateAvatarUrl()` method to save S3 URL to user record
- [x] **Sub-task:** Update `updateProfile` action to accept `avatarUrl` parameter
- [x] **Sub-task:** Write E2E test: Upload avatar and verify it displays in profile view
- [x] **Sub-task:** Verify avatar upload works end-to-end (upload → save → display in profile view)

---

## **Slice 10: Profile Setup Page (Optional First-Time Setup)**
*Goal: Add profile setup page for new users*

- [x] **Sub-task:** Create `/profile/setup/page.tsx` server component with setup status check
- [x] **Sub-task:** Implement `ProfileService.checkSetupStatus()` method (determines if setup needed)
- [x] **Sub-task:** Write unit tests for `checkSetupStatus()`
- [x] **Sub-task:** Create `ProfileSetupForm` component (username input + avatar upload, both optional)
- [x] **Sub-task:** Add "Skip" button that redirects to `/dashboard` without saving
- [x] **Sub-task:** Add "Save & Continue" button that calls `completeProfileSetup` action
- [x] **Sub-task:** Implement `ProfileService.completeSetup()` method (saves username + avatar if provided)
- [x] **Sub-task:** Create `completeProfileSetup` server action with Zod schema
- [x] **Sub-task:** Write component tests for `ProfileSetupForm` (skip flow, save flow)
- [x] **Sub-task:** Write E2E test: Complete profile setup (username + avatar) and verify redirect to dashboard
- [x] **Sub-task:** Write E2E test: Skip profile setup and verify redirect to dashboard with defaults
- [x] **Sub-task:** Verify setup page works for new users (redirects to dashboard after setup/skip)

---

## **Slice 11: OAuth Redirect Logic (First-Time User Detection)**
*Goal: Redirect new users to profile setup after OAuth*

- [x] **Sub-task:** Implement `ProfileService.getRedirectAfterAuth()` method (checks if user needs setup)
- [x] **Sub-task:** Write unit tests for `getRedirectAfterAuth()`
- [x] **Sub-task:** Update `auth.ts` redirect callback to call `ProfileService.getRedirectAfterAuth()`
- [x] **Sub-task:** Add logic to redirect new users to `/profile/setup` and existing users to `/dashboard`
- [x] **Sub-task:** Add redirect loop detection (max 2 redirects, fallback to `/dashboard`)
*Note: Outstanding E2E tests for this slice moved to Slice 17.*

---

## **Slice 12: 30-Day Session Duration**
*Goal: Update session expiry to 30 days*

- [x] **Sub-task:** Update `auth.ts` session configuration: change `maxAge` to `30 * 24 * 60 * 60` (30 days)
- [x] **Sub-task:** Verify `updateAge` is set to `24 * 60 * 60` (rotate session token daily)
- *Note: E2E test for session persistence moved to Slice 17.*
- [ ] **Sub-task:** Document 30-day session behavior in security policy or README

---

## **Slice 13: Credentials-Based Login (Development Only)**
*Goal: Enable email/password login for testing*

- [x] **Sub-task:** Verify `AUTH_ENABLE_CREDENTIALS` environment variable is documented in `.env.example`
- [x] **Sub-task:** Update `auth.ts` to conditionally include Credentials provider based on `AUTH_ENABLE_CREDENTIALS`
- [x] **Sub-task:** Create or update login page to show email/password form when credentials enabled
- [x] **Sub-task:** Write E2E test: Credentials-based login (test environment only)
- [x] **Sub-task:** Verify credentials login form is hidden when `AUTH_ENABLE_CREDENTIALS=false`
- [ ] **Sub-task:** Document credentials-based login setup in README (for developers and testers)

---

## **Slice 14: Production S3 Setup (Terraform)**
*Goal: Create S3 bucket infrastructure for production*

- [ ] **Sub-task:** Create `infra/modules/s3/main.tf` Terraform module for S3 bucket
- [ ] **Sub-task:** Add S3 bucket resource with versioning enabled
- [ ] **Sub-task:** Add CORS configuration for production domain (`https://savepoint.app`)
- [ ] **Sub-task:** Add public access block (prevent accidental public exposure)
- [ ] **Sub-task:** Create IAM policy for ECS task to access S3 bucket (PutObject, GetObject, DeleteObject)
- [ ] **Sub-task:** Update ECS task execution role to attach S3 access policy
- [ ] **Sub-task:** Apply Terraform configuration to dev environment and verify bucket creation
- [ ] **Sub-task:** Document Terraform S3 setup in infrastructure README

---

## **Slice 15: Documentation**
*Goal: Update and consolidate documentation for profile essentials*

- [ ] **Sub-task:** Update README with profile feature documentation (user-facing and developer)
- [ ] **Sub-task:** Update CLAUDE.md with profile feature architecture and common commands

---

## **Slice 16: Deployment & Monitoring**
*Goal: Deploy to staging/production and verify functionality*

- [ ] **Sub-task:** Create deployment runbook (migration steps, environment variables, rollback plan)
- [ ] **Sub-task:** Deploy to staging environment and run smoke tests
- [ ] **Sub-task:** Conduct UAT (User Acceptance Testing) with stakeholders
- [ ] **Sub-task:** Monitor S3 upload success rates in CloudWatch (if production)
- [ ] **Sub-task:** Fix any bugs discovered during UAT
- [ ] **Sub-task:** Deploy to production environment
- [ ] **Sub-task:** Verify all features work correctly in production (OAuth, profile setup, avatar upload, stats)
- [ ] **Sub-task:** Monitor error rates and performance metrics for 24 hours post-deployment

---

## **Slice 17: Deferred End-to-End Tests**
*Goal: Consolidate remaining E2E tests to reduce churn while core flows stabilize*

- [ ] **Sub-task:** Write E2E test: First-time OAuth sign-up flow (Google OAuth → setup page → dashboard)
- [ ] **Sub-task:** Write E2E test: Returning user login (Google OAuth → dashboard directly)
- [ ] **Sub-task:** Write E2E test to verify session persists across page reloads
- [ ] **Sub-task:** Write E2E test: Username conflict (case-insensitive uniqueness)
- [ ] **Sub-task:** Write E2E test: Profile view displays stats and recent games correctly
- [ ] **Sub-task:** Write E2E test: Invalid username scenarios (too short, profanity, reserved names)
- [ ] **Sub-task:** Write E2E test: Avatar upload validation (file size, unsupported format)
- [ ] **Sub-task:** Run all unit, integration, and E2E tests (verify ≥80% coverage)

---

## Summary

This task list contains **18 vertical slices** (Slice 0 through Slice 17), each delivering a small, runnable increment of functionality. The application remains in a working state after each main task is completed.

**Key Principles:**
- **Slice 0** sets up E2E testing infrastructure before any feature work
- Each slice builds on previous slices incrementally
- Foundational E2E setup (Slice 0) is done early; remaining E2E tests are consolidated in Slice 17 during active refactors
- Infrastructure work (LocalStack, S3, Terraform) is introduced just-in-time when needed
- Profile viewing (read-only) is implemented before editing capabilities
- Backend services are built before frontend components that consume them

**Estimated Timeline:** 16-20 development days (assuming 1-2 slices per day with testing)
