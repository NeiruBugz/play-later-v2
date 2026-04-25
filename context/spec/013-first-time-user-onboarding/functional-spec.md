# Functional Specification: First-Time User Onboarding (Guided Tour)

- **Roadmap Item:** First-Time User Onboarding — guided tour for new authenticated users to reduce empty-surface bounce.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

After sign-up, SavePoint drops new users onto largely empty surfaces — the dashboard, the library, and the social feed all start empty. Spec 012 F#8 partially addresses the empty-library moment with an embedded hero (Steam Import / Search Games), but it does not orient the user to the rest of the app: how filters work, where the per-card primary CTA is, what `⌘K` does, where the activity feed lives, how profile visibility works, or how to follow other users.

The pain is general — new users land on empty surfaces, do not learn the product surface area, and leave without reaching first value (first game added, first journal entry, first follow). The audit-driven UI work in 012 makes the surfaces themselves better but does not by itself teach a new user where to look.

**Desired outcome.** A new user, on their first authenticated visit, is shown a brief, dismissible guided tour that names the four core surfaces (Library, Dashboard, Add Game entry points, Profile), explains the empty-state behavior on each, and leaves them on a surface where they can take a clear next action. The tour is server-persisted so a user sees it once across devices and can re-trigger it from the user menu.

**Success measures**

- A signed-in user with `User.onboardingCompletedAt = null` who lands on any authenticated route auto-receives the tour exactly once per device-session, and never again after they finish or skip it.
- The tour covers four surfaces — Library, Dashboard, Add Game (⌘K + navbar), and Profile/settings — without forcing the user to navigate manually between them; the tour drives navigation.
- The tour gracefully handles empty surfaces (no library items, no PLAYING games, no follows) by narrating the empty state inline rather than skipping or breaking.
- Skipping or completing the tour persists server-side; reopening the app from any device does not re-show the tour.
- The user menu exposes a **Take the tour again** entry that re-runs the tour on demand.

---

## 2. Functional Requirements (The "What")

### 2.1 Tour Trigger and Persistence

- **As a** new user signing in for the first time, **I want** the tour to start automatically, **so that** I do not have to discover it.
  - **Acceptance Criteria:**
    - [ ] On any authenticated route load, if `User.tourCompletedAt` is `null` and `User.tourSkippedAt` is `null`, the tour auto-starts within 500 ms of the page becoming interactive.
    - [ ] The tour does **not** auto-start on `/login`, `/sign-up`, or any unauthenticated route.
    - [ ] Once the tour starts, it cannot re-trigger itself in the same browser tab on subsequent route changes (single instance per session).
    - [ ] If the user **completes** the tour, `User.tourCompletedAt = now()` is written and the tour will not auto-start again on any device.
    - [ ] If the user **skips** the tour, `User.tourSkippedAt = now()` is written. The tour will not auto-start again on any device.
    - [ ] The tour can always be re-triggered via the user-menu entry **Take the tour again** (2.6); doing so does **not** reset the timestamps and does **not** affect the auto-start logic.

### 2.2 Tour Stops — Library

- **As a** new user, **I want** the tour to introduce the Library page surfaces, **so that** I can find filters, search, and per-card actions later on my own.
  - **Acceptance Criteria:**
    - [ ] The tour navigates to `/library` (or stays there if already there) and presents these stops in order:
      1. **Hero search** — popover anchored to the hero search input: "Find any game in your library. Press `/` to focus from anywhere."
      2. **Filters** — popover anchored to either the desktop sidebar (≥1280px) or the mobile **Filters** trigger (≤640px): "Filter by status, platform, and rating. Counts update as you filter."
      3. **Library card** — popover anchored to the first card if any exist; otherwise to the empty-library hero (012 F#8): "Each game has a status badge, a quick action, and a `⋮` menu. Tap a card to see details."
    - [ ] If the user has zero library items, stop 3 narrates the empty hero ("This is where your games will live") instead of pointing at a card.
    - [ ] Each popover has Next, Back, Skip, and Close buttons; keyboard `Esc` skips and `Enter` advances.

### 2.3 Tour Stops — Dashboard

- **As a** new user, **I want** the tour to introduce the dashboard, **so that** I understand the Quick Log hero and the social activity feed.
  - **Acceptance Criteria:**
    - [ ] The tour navigates to the dashboard route and presents these stops in order:
      1. **Quick Log hero** — popover anchored to the hero or its empty-state: "Log a session for any game you are playing. Reflect adds a journal entry."
      2. **Activity feed** — popover anchored to the activity feed widget: "Status changes and adds from people you follow show up here."
    - [ ] When the user has no `PLAYING` games, the Quick Log stop targets the existing empty-state CTA ("Find a game to start") and narrates the empty case instead of skipping.
    - [ ] When the user has no follows, the activity feed stop targets the existing 008 empty state ("Popular activity") and narrates that empty case.

### 2.4 Tour Stops — Add Game

- **As a** new user, **I want** the tour to show me where to add games, **so that** I do not have to guess between the empty hero, the navbar, and `⌘K`.
  - **Acceptance Criteria:**
    - [ ] One stop is anchored to the navbar **Add Game** button (per spec 012 F#2.11.3): "Add a game from anywhere — click here, or press `⌘K` (or `Ctrl K`)."
    - [ ] The tour does **not** programmatically open the command palette; it only points at the trigger. Users opt-in by clicking or hitting the shortcut after the tour ends.
    - [ ] On viewports ≤640px where the navbar button collapses to an icon, the popover targets the icon button using the same anchor.

### 2.5 Tour Stops — Profile / Settings

- **As a** new user, **I want** the tour to point me at profile and settings, **so that** I know how to make my profile public and how to follow others.
  - **Acceptance Criteria:**
    - [ ] The tour navigates to the user's own profile (`/u/[username]`, per spec 009) and presents these stops in order:
      1. **Profile visibility** — popover anchored to the visibility toggle: "Your profile is public/private. Toggle it any time."
      2. **Follow surface** — popover anchored to the follow buttons or follower-list area: "Follow other gamers from their profiles to see their activity on your dashboard."
    - [ ] If the user does not yet have a username slug populated (edge case), the tour falls back to a generic "your profile" stop on the user menu and skips the per-element anchors gracefully.

### 2.6 User Menu — Take the Tour Again

- **As a** returning user, **I want** to replay the tour, **so that** I can re-orient when SavePoint adds new surfaces.
  - **Acceptance Criteria:**
    - [ ] The header user menu exposes an entry labeled **Take the tour again**.
    - [ ] Clicking it starts the tour from stop 1 (Library) regardless of the user's `tourCompletedAt` / `tourSkippedAt` state.
    - [ ] Re-running the tour does **not** modify either timestamp.
    - [ ] The entry is visible to all authenticated users — not gated on having completed the tour previously.

### 2.7 Empty-Surface Narration

- **As a** new user with zero library items, zero follows, and zero PLAYING games, **I want** the tour to still feel useful, **so that** I do not bounce on a tour pointing at nothing.
  - **Acceptance Criteria:**
    - [ ] Every tour stop has a defined behavior for the case where its anchor element is not present:
      - Library card → fall back to empty-library hero (012 F#8).
      - Quick Log hero → fall back to its existing empty-state CTA.
      - Activity feed → fall back to the 008 social empty-state widget.
      - Profile follow surface → narrate via a stop on the user menu.
    - [ ] No tour stop is silently skipped without narration in this revision; every step shows a popover even on empty surfaces.
    - [ ] The fallback popovers reuse the same Next / Back / Skip / Close affordances and keyboard handling as anchored popovers.

### 2.8 Cancellation, Resumption, and Resilience

- **Acceptance Criteria:**
  - [ ] Pressing **Skip** at any stop ends the tour and persists `tourSkippedAt`.
  - [ ] Pressing **Close** (×) or `Esc` ends the tour and is treated as Skip.
  - [ ] Mid-tour navigation triggered by the user (e.g., they click outside the tour to a different page) ends the tour. It is treated as Skip.
  - [ ] The tour does **not** trap focus globally; the underlying page remains operable. The popover itself manages keyboard focus while open.
  - [ ] If the tour is interrupted because a target element fails to mount within a short timeout (≤2 s), the tour ends gracefully with a non-blocking notice ("Skipped a step that wasn't ready — you can replay the tour any time from the menu") and persists `tourSkippedAt`.

### 2.9 Accessibility & Internationalization

- **Acceptance Criteria:**
  - [ ] Every popover is reachable by keyboard (Tab focuses the active popover's primary action; arrow keys move between Next / Back).
  - [ ] Every popover has an accessible name and announces step `n of N` via `aria-live="polite"`.
  - [ ] Spotlights / dimmed backgrounds do not block screen-reader access to the anchored element.
  - [ ] All copy is sourced from a single content file so future translation does not require touching component code.
  - [ ] No animation that violates `prefers-reduced-motion` is used; popovers fade rather than slide when the preference is set.

---

## 3. Scope and Boundaries

### In-Scope

- A guided tour for newly authenticated users covering Library, Dashboard, Add Game entry points, and Profile/settings.
- Server-persisted tour state on the `User` record (two new timestamps: `tourCompletedAt`, `tourSkippedAt`). Independent from the existing `onboardingDismissedAt` (which tracks the existing Getting Started checklist on the dashboard — see 008/earlier).
- The existing Getting Started checklist (`features/onboarding/ui/getting-started.tsx`) and its `onboardingDismissedAt` flag are **unchanged** by this spec. The tour and the checklist coexist: the tour explains surfaces once; the checklist tracks first-action progress persistently.
- A user-menu entry to replay the tour on demand.
- Graceful narration of empty surfaces inline (no sample data seeded).
- Reuse of existing UI primitives (shadcn/ui, lucide icons) and existing routes — no new pages.

### Out-of-Scope

- **Sample-data seed** — no pre-populated games or journal entries are inserted to make the tour feel populated.
- **Coachmark / tooltip system for non-onboarding flows** — this spec does not introduce a generic feature-discovery framework.
- **Profile setup wizard** — collecting display name, avatar, etc. is handled elsewhere; this tour only points at the visibility toggle.
- **Tutorial copy localization beyond extracting strings to a content file** — i18n routing/translation is a future spec.
- **Analytics on tour funnel** — emitting events, dashboards, etc. — out of scope; only basic logger calls for skip/complete are included.
- **Cross-spec changes**: 012 F#8 (empty-library hero), 008 social feed empty state, and 009 profile route are reused as-is. Their copy is not changed by this spec.
- **Lambdas / infra changes.** This spec is `savepoint-app`-only.
- **All other roadmap items** not derived from the onboarding need are automatically out-of-scope.

---

## Appendix A — Cross-Spec Touchpoints

| Spec | Surface this tour reuses |
|---|---|
| 008 — Social Engagement | Activity feed widget + its existing empty state. |
| 009 — Unified Profile | `/u/[username]` route, visibility toggle, follow surface. |
| 012 — UI/UX Audit | Hero search (`/`), sidebar/mobile filters, per-card status badge + CTA + ⋮ menu, empty-library hero (F#8), navbar **Add Game** + ⌘K palette (F#2.11). |

This spec does not change any of the above. If acceptance criteria here imply a behavior that is not present in those specs, the corresponding spec is the source of truth.

## Appendix B — Data Model Touchpoints

Two new nullable timestamp columns on the `User` table:

- `tourCompletedAt: DateTime?` — set once when the user reaches the final stop and confirms.
- `tourSkippedAt: DateTime?` — set once when the user explicitly skips, presses Esc/Close, navigates away mid-tour, or hits the timeout-skip case.

These are independent: a user may have `tourSkippedAt` set without `tourCompletedAt`, or vice versa. The auto-start logic uses `tourCompletedAt IS NULL AND tourSkippedAt IS NULL`.

The user-menu **Take the tour again** does not write either column.

The existing `onboardingDismissedAt` column (used by the Getting Started checklist) is **not** touched by this spec.
