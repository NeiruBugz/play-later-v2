# Functional Specification: Migrate Authentication System to Better Auth

- **Roadmap Item:** Foundational tech migration (not on roadmap; gating step before TanStack Start exploration)
- **Status:** Draft
- **Author:** Nail

---

## 1. Overview and Rationale (The "Why")

SavePoint's sign-in system is built on a library that ties the application tightly to its current web framework. To keep our options open for future framework choices and to simplify the foundation our login flows sit on, we are replacing the underlying sign-in system with a more portable alternative.

From the user's perspective, **nothing about how they sign in changes**: the same login page, the same "Continue with Google" button, the same flow. The only visible effect is a one-time forced sign-out at the moment of cutover — every signed-in user is logged out and asked to sign in again. To avoid surprising users, an in-app banner will appear **48 hours before** the cutover explaining that they will need to sign in again on the cutover date.

**Why now:** the current sign-in foundation is a beta version of a library coupled to one specific web framework. The replacement is stable, framework-agnostic, and removes a constraint on where SavePoint can run in the future. It also retains support for our existing identity provider (Cognito with Google federation) so no external accounts or upstream configuration changes are required for end users.

**Success looks like:**
- Every user who could sign in before the cutover can sign in after.
- The forced sign-out happens once, is communicated 48 hours in advance, and produces no support tickets that are not addressed by the banner.
- No user data (profile, library, journal entries, Steam connection, follows) is lost or altered.
- The Steam connection flow continues to work without change.
- Test and developer workflows for signing in (email + password) continue to work in non-production environments.

---

## 2. Functional Requirements (The "What")

### 2.1. Sign-In Experience (Unchanged)

- **As a** signed-out user, **I want to** sign in with my Google account, **so that** I can access my library and journal.
  - **Acceptance Criteria:**
    - [ ] The login page looks visually identical to before the migration.
    - [ ] Clicking "Continue with Google" takes the user through the same Google sign-in screen they saw previously.
    - [ ] After successful sign-in, the user lands on the same destination page as before (`/dashboard` or `/profile/setup` for first-time users).
    - [ ] If the user cancels the Google sign-in, they return to the login page with no error state stuck on screen.
    - [ ] If the upstream identity service is unavailable, the user sees a clear, plain-language error message with a "Try again" affordance.

### 2.2. Pre-Cutover Notice

- **As a** signed-in user, **I want to** know in advance that I will need to sign in again, **so that** I am not surprised or worried when I am unexpectedly logged out.
  - **Acceptance Criteria:**
    - [ ] Starting 48 hours before the cutover, every signed-in user sees a banner at the top of the application.
    - [ ] The banner reads: *"We're upgrading our sign-in system on [date]. You'll be signed out and need to sign in again — your library, journal, and settings won't be affected."*
    - [ ] The `[date]` placeholder is replaced with the actual cutover date and time at runtime.
    - [ ] The banner can be dismissed by the user; once dismissed it does not reappear on that browser.
    - [ ] The banner stops appearing automatically after the cutover time has passed.
    - [ ] The banner does not appear for signed-out users on the login page.

### 2.3. The One-Time Forced Sign-Out

- **As a** signed-in user at the moment of cutover, **I want to** be returned to a clear sign-in flow, **so that** I can resume using SavePoint with minimal friction.
  - **Acceptance Criteria:**
    - [ ] At the cutover moment, all currently active sessions stop being valid.
    - [ ] The next time a user navigates to or refreshes any protected page, they are sent to the login page.
    - [ ] The login page shows a one-time message: *"We've upgraded our sign-in system. Please sign in again to continue."*
    - [ ] The message appears only on the first visit to the login page after cutover; it does not persist across subsequent visits.
    - [ ] After signing in once, the user lands on the page they were trying to reach (or the dashboard if no destination is preserved).
    - [ ] All of the user's data — library, journal entries, ratings, follows, Steam connection, profile — appears unchanged after re-signing in.

### 2.4. Steam Connection (Unchanged)

- **As a** signed-in user with a Steam account already connected, **I want to** keep my Steam connection after the migration, **so that** I do not need to re-link Steam.
  - **Acceptance Criteria:**
    - [ ] After the migration, the Settings → Profile page shows the same Steam profile information that was shown before.
    - [ ] The "Connect Steam" / "Reconnect Steam" buttons behave identically to before.
    - [ ] Newly connecting Steam after the migration produces the same success message and the same connected-state UI as before.

### 2.5. First-Time Sign-Up (Unchanged)

- **As a** new user, **I want to** sign up using my Google account, **so that** I can start building my library.
  - **Acceptance Criteria:**
    - [ ] Sign-up uses the same "Continue with Google" affordance as sign-in.
    - [ ] First-time users land on the existing profile setup flow exactly as they did before.
    - [ ] Username, profile fields, and onboarding state work identically post-migration.

### 2.6. Developer / Test Sign-In (Email + Password)

- **As a** developer or automated test, **I want to** sign in with an email and password in non-production environments, **so that** I can run E2E tests and test flows locally without going through Google.
  - **Acceptance Criteria:**
    - [ ] In environments where the credentials sign-in is enabled, an email + password form is available on the login page.
    - [ ] Submitting valid credentials signs the user in and lands them on the same destination as Google sign-in.
    - [ ] Submitting invalid credentials shows a plain-language error message ("Email or password is incorrect").
    - [ ] In production, the email + password form is not visible and is not reachable.
    - [ ] Existing test accounts continue to work after the migration (their passwords remain valid).

### 2.7. Sign-Out (Unchanged)

- **As a** signed-in user, **I want to** sign out, **so that** my session ends.
  - **Acceptance Criteria:**
    - [ ] The "Sign out" affordance in the user menu signs the user out and returns them to the public landing page.
    - [ ] After sign-out, attempting to access a protected page sends the user to the login page.

### 2.8. Session Lifetime (Unchanged Behavior)

- **As a** signed-in user, **I want to** stay signed in across visits without re-entering credentials, **so that** I am not asked to sign in every day.
  - **Acceptance Criteria:**
    - [ ] After signing in, a user remains signed in across browser restarts for the same duration window users experience today (sessions persist for ~30 days of inactivity).
    - [ ] Active use during the session window extends the session, matching today's behavior.

---

## 3. Scope and Boundaries

### In-Scope

- Replacing the underlying sign-in system end-to-end while preserving the existing user experience.
- Continuing to use Cognito (with Google as the federated identity provider) as the sign-in source.
- Migrating existing user accounts so every user can sign in again after cutover with the same Google account they used before.
- A 48-hour pre-cutover banner notifying signed-in users of the one-time forced sign-out.
- Continuing to support email + password sign-in in development and test environments.
- Continuing to support the existing Steam account connection flow without change.
- Updating the upstream identity provider's configured callback URL to match the new system, with a transition window where both old and new URLs are accepted.
- Cleanup of stale internal documentation that references the old sign-in system.

### Out-of-Scope

- Visual redesign of the login or sign-up pages.
- Adding new sign-in methods (e.g., email + password for end users, Apple, GitHub, magic links). Email + password remains dev/test only.
- Replacing or removing Cognito as the upstream identity service.
- Email verification flows, password reset flows, or any user-facing email sending.
- Any TanStack Start migration work — that is a separate effort that this spec enables.
- Changes to the Steam OpenID flow (it is independent of the sign-in system).
- All other roadmap items: Per-Playthrough Logs, Reviews, Public Reflections, Game Detail Redesign, Aggregate Game Stats, Bento Dashboard Reflow, Upcoming Releases Widget, YTD Stats Card, Pick Up Where You Left Off, Gaming Events Calendar, Similar Games Discovery, Browse / Catalog, Curated Collections, First-Time User Onboarding (Spec 013), Library View Modes.

### Open Items

- **Cutover date and time:** TBD — to be set during deployment scheduling. The 48-hour banner window and the post-cutover login message both reference this date once chosen.
