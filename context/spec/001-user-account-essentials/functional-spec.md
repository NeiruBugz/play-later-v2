# Functional Specification: User Account Essentials

- **Roadmap Item:** User Account Essentials (Phase 1: Core Foundation)
- **Status:** Draft
- **Author:** SavePoint Team

---

## 1. Overview and Rationale (The "Why")

SavePoint is a personal gaming library and journaling application for patient gamers. For users to curate their gaming collections, track their journey through different games, and write reflections about their experiences, they need a persistent account that stores all their personal data across sessions and devices.

**Problem:** Without user accounts, users cannot save their personal gaming library, journal entries, journey status tracking (Curious About, Currently Exploring, etc.), or curated collections. All of this data requires persistent storage tied to individual users.

**Goal:** Enable users to create accounts, authenticate securely, and manage basic profile information so they can access their saved library, journal, and collections from any device.

**Success Metrics:**
- **Ease of sign-up/login:** Users can create an account and sign in with minimal friction (target: under 60 seconds for first-time Google OAuth sign-up).
- **Account creation rate:** Percentage of visitors who complete account creation.
- **Authentication reliability:** Zero authentication-related errors for valid users.

---

## 2. Functional Requirements (The "What")

### 2.1. Google OAuth Sign-Up & Login (Primary Authentication Method)

**As a** user, **I want to** sign up and log in using my Google account, **so that** I can quickly access SavePoint without creating a new password.

**Acceptance Criteria:**

- [ ] **Entry Point:** Users can initiate Google OAuth from a dedicated login page with a "Sign in with Google" button.

- [ ] **First-Time Sign-Up:**
  - [ ] When a user signs in with Google for the first time, the system automatically captures their email, name, and Google ID.
  - [ ] After successful OAuth authentication, new users are taken to an **optional** profile setup page to configure:
    - Username (optional, defaults to Google name if skipped)
    - Profile image (optional, blank/no image if skipped)
  - [ ] Users can skip the profile setup page and proceed directly to the dashboard. If skipped:
    - Username defaults to their Google name.
    - Profile image is blank (no default avatar displayed).
  - [ ] If the user completes profile setup, they are then redirected to the dashboard.

- [ ] **Returning Users:**
  - [ ] When a returning user signs in with Google, they are taken directly to their dashboard (no profile setup page).

- [ ] **Profile Picture from Google:**
  - [ ] The user's Google profile picture is **not** automatically imported or used by default.
  - [ ] Profile images must be uploaded by the user through the profile management interface.

- [ ] **Error Handling:**
  - [ ] If the OAuth flow fails (e.g., user denies permission, network error), a generic but useful error message is displayed: "Sign-in failed. Please try again or contact support if the issue persists."
  - [ ] Users can retry the sign-in process from the login page.

- [ ] **Session Duration:**
  - [ ] Users remain logged in for **30 days** from their last login.
  - [ ] After 30 days of inactivity, users must sign in again.
  - [ ] There is no "Remember me" checkbox; 30-day persistent sessions are the default behavior.

---

### 2.2. Credentials-Based Login (Development & Testing Only)

**As a** developer or tester, **I want to** use email/password authentication in development and test environments, **so that** I can run automated E2E tests with Playwright without relying on third-party OAuth.

**Acceptance Criteria:**

- [ ] **Environment Control:**
  - [ ] Credentials-based login is controlled by an environment variable: `AUTH_ENABLE_CREDENTIALS`.
  - [ ] When `AUTH_ENABLE_CREDENTIALS=true` (development/test environments), the email/password login form is visible on the login page.
  - [ ] When `AUTH_ENABLE_CREDENTIALS=false` or unset (production), the email/password login form is **not rendered at all** (completely hidden).

- [ ] **Login Form Fields:**
  - [ ] The login form includes fields for email and password.
  - [ ] No "Sign Up with Email" option is provided (test accounts are pre-seeded in the database or created programmatically).

- [ ] **Password Requirements:**
  - [ ] No specific password complexity rules are enforced (this is for testing convenience).
  - [ ] Passwords must be at least 8 characters.

- [ ] **Error Handling:**
  - [ ] If incorrect credentials are entered, display a generic error message: "Invalid email or password."
  - [ ] The system does not distinguish between "email not found" vs. "wrong password" (security best practice).

- [ ] **No Email Verification or Password Reset:**
  - [ ] Email verification is out-of-scope.
  - [ ] Password reset ("Forgot Password") flow is out-of-scope.

- [ ] **Access Restriction:**
  - [ ] Credentials-based login is only available to developers in development and test environments.
  - [ ] It is not accessible or visible in production.

---

### 2.3. Basic Profile Management

**As a** user, **I want to** view and update my username and profile image, **so that** I can personalize my SavePoint account.

**Acceptance Criteria:**

- [ ] **Profile Setup Page (Optional, First-Time Users):**
  - [ ] After a user completes Google OAuth for the first time, they are shown a profile setup page with the following fields:
    - **Username** (text input, optional)
    - **Profile Image** (file upload, optional)
  - [ ] Users can skip this page and proceed directly to the dashboard.
  - [ ] If the user uploads a profile image during setup:
    - [ ] The uploaded image is immediately displayed in the profile image area.
    - [ ] A success toast notification appears: "Profile image uploaded successfully."
  - [ ] After completing or skipping setup, the user is redirected to the dashboard.

- [ ] **Profile Editing (All Users):**
  - [ ] Users can access a profile settings page from the dashboard/navigation menu.
  - [ ] The profile settings page allows users to edit:
    - **Username** (text input, required, must be unique)
    - **Profile Image** (file upload, optional)
  - [ ] Changes are saved with a "Save Changes" button.
  - [ ] After saving, a success message is displayed: "Profile updated successfully."

- [ ] **Username Requirements:**
  - [ ] **Minimum Length:** 3 characters.
  - [ ] **Maximum Length:** 25 characters.
  - [ ] **Allowed Characters:** Letters (a-z, A-Z), numbers (0-9), and special symbols (e.g., underscores, hyphens, periods).
  - [ ] **Uniqueness:** Usernames must be unique across all users, **case-insensitive** (e.g., "abc123" is considered the same as "ABC123").
  - [ ] **Real-Time Validation:** As the user types their username, the system checks uniqueness in real-time and displays an error message if the username is already taken: "Username already exists. Please choose another."
  - [ ] **Reserved/Offensive Usernames:** The system validates that usernames do not:
    - Contain offensive or inappropriate language (use a profanity filter library/service if available).
    - Represent admin or app-support roles: the exact list of reserved usernames is: `admin`, `support`, `savepoint`, `moderator`.
  - [ ] If a username violates these rules, display an error message: "Username is not allowed. Please choose another."

- [ ] **Profile Image Upload:**
  - [ ] **Supported Formats:** JPG, PNG, GIF, WebP (common web image formats).
  - [ ] **Maximum File Size:** 5MB.
  - [ ] **Validation:** If the user attempts to upload a file that exceeds 5MB or is not a supported format, display an error message:
    - File too large: "File size exceeds 5MB. Please upload a smaller image."
    - Unsupported format: "Unsupported file format. Please upload a JPG, PNG, GIF, or WebP image."
  - [ ] **Upload Success:** After a successful upload, the new profile image is displayed in the profile area, and a toast notification appears: "Profile image uploaded successfully."
  - [ ] **Upload Failure:** If the upload fails for any reason (e.g., network error, server error), display an error message: "Image upload failed. Please try again."

- [ ] **Default Values:**
  - [ ] **Username:** If a user skips username setup, their username defaults to their Google name.
  - [ ] **Profile Image:** If a user does not upload a profile image, the profile image area is **blank** (no default avatar or placeholder).

- [ ] **Profile Viewing (Private, Read-Only):**
  - [ ] Users can view their own profile in a read-only mode before editing.
  - [ ] The profile view displays:
    - **Username**
    - **Profile Image** (if uploaded; otherwise blank)
    - **Join Date** (account creation date, formatted as "Joined [Month Year]", e.g., "Joined January 2025")
    - **Status Breakdown:** Number of games in each journey status (e.g., "Curious About: 3, Currently Exploring: 2, Experienced: 10")
    - **Last Played Games:** A list of the last 3-5 games based on recent status changes to `CURRENTLY_EXPLORING` (most recent first).
  - [ ] The profile view is **private** and can only be accessed by the user themselves (not publicly accessible to other users).

- [ ] **Editing Restrictions:**
  - [ ] Users can change their username and profile image as often as they like (no frequency restrictions for this version).

---

## 3. Scope and Boundaries

### In-Scope

- Google OAuth sign-up and login as the primary authentication method.
- Optional profile setup page for first-time users (username and profile image).
- Credentials-based email/password login for development and testing environments only (controlled by environment variable).
- Profile management page allowing users to update their username and profile image.
- Username validation: uniqueness (case-insensitive), length (3-25 characters), character restrictions, and offensive/reserved username blocking (reserved list: `admin`, `support`, `savepoint`, `moderator`).
- Profanity filter integration for username validation (use existing library/service if available).
- Profile image upload with format and size validation (JPG, PNG, GIF, WebP; max 5MB).
- Private profile view displaying username, profile image, join date, status breakdown, and last 3-5 games marked as `CURRENTLY_EXPLORING` (most recent first).
- 30-day session duration for authenticated users.
- Generic, user-friendly error messages for authentication and profile management failures.

### Out-of-Scope

- Email verification for credentials-based accounts.
- Password reset ("Forgot Password") flow.
- Publicly accessible user profiles (planned for Phase 3: Community & Social Features).
- Social features (following users, activity feeds, profile likes).
- Automatic import of Google profile pictures.
- Profile customization beyond username and profile image (e.g., bio, cover image, theme preferences).
- "Remember me" checkbox or custom session duration settings.
- Advanced username change restrictions (e.g., "can only change username once per month").
- Integration with additional OAuth providers (e.g., Steam, Discord) beyond Google.
