# Product Roadmap: SavePoint

_This roadmap outlines our strategic direction based on customer needs and business goals. It focuses on the "what" and "why," not the technical "how."_

_Each phase is a single ordered list. Within Phase 2, items are ordered by dependency — earlier items unlock later ones._

---

## Phase 1: Core Foundation _(Complete)_

_The highest priority features that form the core foundation of SavePoint — enabling users to track their gaming library and begin journaling._

- [x] **IGDB Integration Consolidation** — unified types in `igdb-api-types`, deprecated legacy utility in favor of service layer.
- [x] **Google OAuth Sign-Up & Login** — primary authentication method.
- [x] **Credentials-Based Login** — secondary email/password flow for testing and E2E.
- [x] **Basic Profile Management** — view/update name and basic profile info.
- [x] **IGDB Integration** — primary source for game metadata, covers, descriptions, release dates, platforms.
- [x] **Game Search** — search IGDB to add to library.
- [x] **Game Detail Pages** — IGDB metadata + user's personal journal entries.
- [x] **Add Games to Library** — from IGDB search results.
- [x] **Journey Status Tracking** — Want to Play / Owned / Playing / Played.
- [x] **Library View & Organization** — browsable view with status/platform filters.
- [x] **Write Journal Entries** — reflections and memories linked to specific games.
- [x] **View Personal Journal** — chronological timeline of past reflections.
- [x] **Steam Library Integration — Stage 1: Technical Foundation** _(Spec 002)_ — Lambda pipeline, feature flag, local SAM/LocalStack, Steam profile UI, `ImportedGame` staging table.
- [x] **Code Health & Developer Experience** _(Spec 004)_
- [x] **Library Status Redesign** _(Spec 005)_
- [x] **FSD Architecture Compliance** _(Spec 007)_
- [x] **Social Engagement** _(Spec 008)_ — follow system, activity feed, public profile foundation.
- [x] **Unified Profile View** _(Spec 009)_ — `/u/[username]` consolidates personal + public profile surfaces.

---

## Phase 2: Internal Depth & Polish

_Everything we can ship on our own data + IGDB, with no AWS / external platform dependencies. Ordered by dependency: data primitives first, then consumers, then polish._

### Shipped

- [x] **Next.js 16 Feature Adoption** _(Spec 010)_ — `cacheComponents`, `"use cache"` directive, view transitions.
- [x] **Code Health & DX Round 2** _(Spec 006)_
- [x] **Star Ratings** _(Spec 011)_ — 1–10 ratings on library entries with sort/filter and rating histogram.
- [x] **Patient-Gamer UX Overhaul** _(post-011)_ — UX pass shipped on top of star ratings.
- [x] **UX Audit — Round 1** _(Spec 012)_ — library scannability, mobile filters, dashboard hero, onboarding entry, library card redesign, quick add.
- [x] **UX Audit — Round 2** _(Spec 014)_ — game detail / journal / profile / settings / auth surfaces; navigational connective tissue; Raycast-style command center direction. 12 pinned findings (3 High / 7 Medium / 2 Low).

### In Progress

### Ordered Backlog

1. [ ] **Per-Playthrough Logs** — multiple playthroughs per library entry, each with start/end dates, rating, platform, optional notes. Playthrough timeline on game detail. Journal/review entries can attach to a specific playthrough. _Data primitive — unblocks Reviews and Aggregate Game Stats._

2. [ ] **Reviews** — short-form, public, rated takes on a game; distinct from private long-form Journal. Public review feed on game detail; personal review history on profile; visibility setting (public/private/followers). _Depends on Per-Playthrough Logs._

3. [ ] **Public Reflections** — opt-in to make journal entries public; browse community reflections on a game. _Builds on Spec 008 public profiles._

4. [ ] **Game Detail Redesign** — single coordinated pass: hero with blurred cover backdrop, one-click status strip (no modal), personal stats column (playthroughs / your rating / journal count), community stats column, playthrough timeline, reviews feed, franchise / series / expansions / related games. _Consumes Per-Playthrough Logs + Reviews; replaces piecemeal asks (in-page status toggles, enhanced game details, fallback cover rendering)._

5. [ ] **Aggregate Game Stats** — community data on game detail: play counts (playing / played / backlog / wishlist), average rating + histogram, average / median completion time, review count. _Depends on Reviews._

6. [ ] **Bento Dashboard Reflow** — 12-col responsive grid with consistent height tiers; fills viewport on ≥1280px; graceful stacking on mobile/tablet; widget chrome aligned with terminal aesthetic. _Container for the next four items._

7. [ ] **Upcoming Releases Widget** — countdowns for unreleased wishlisted games using IGDB release dates.

8. [ ] **YTD Stats Card** — games finished this year, hours logged, journal entries, top genres / platforms. _Depends on Star Ratings._

9. [ ] **Pick Up Where You Left Off** — surface oldest `Playing` with days-since-last-update to nudge against backlog guilt.

10. [ ] **Gaming Events Calendar** — IGDB events endpoint integration; dashboard widget (next 3–5 events with countdowns); dedicated `/events` page; event detail (date, stream link, expected announcements).

11. [ ] **Similar Games Discovery** — IGDB-driven recommendations on game detail.

12. [ ] **Browse / Catalog** — first-class IGDB browse surface (trending, recent releases, by genre).

13. [ ] **Curated Collections** — create personal themed collections (e.g., "Cozy Winter Games") from library; browse personal collections view. _Public sharing deferred to Phase 4._

14. [ ] **First-Time User Onboarding** _(Spec 013)_ — server-persisted guided tour covering Library, Dashboard, Add Game (⌘K + navbar), Profile/settings; one-time per user across devices, re-triggerable from user menu.

15. [ ] **Library View Modes** — grid (default), compact grid, dense list (table with title + status + rating + platform + playtime); persists per user.

16. [ ] **Bulk Library Actions** — multi-select with bulk status change / delete.

17. [ ] **Global Quick-Log CTA** — persistent header entry point (button + ⌘K) to log/add a game from any page with smart default status.

---

## Phase 3: Platform Integrations

_Expand library import to external gaming platforms. Gated on external APIs (Steam, PSN, Xbox) and the AWS Lambda enrichment pipeline. Deferred until Phase 2 internal work is shipped so progress is not blocked by third-party constraints. Ordered by readiness — Steam pipeline is furthest along._

> **Blocked — Lambda pipeline removed in spec 015. Items below require the pipeline to be rebuilt before they can ship.**

1. [ ] **Steam Library — Stages 2 & 3: Curation** _(Spec 003)_ — paginated list of imported Steam games with sort/filter; individual import via auto-match IGDB on Steam App ID; manual IGDB search fallback; smart status assignment (playtime/recency → Owned/Playing/Played); dismiss action; checkbox multi-select with bulk import; selection persists across pagination. _Philosophy: import is curation, not bulk transfer._

2. [ ] **Steam Library — Stage 4: Ongoing Sync** — re-import detects new games only; optional periodic sync for new purchases.

3. [ ] **PlayStation Trophy Integration** _(Research Complete)_ — PSN username + "About Me" verification via `psn-api`; fetch trophy list; match to IGDB; reuse Steam curation UI. See [research/playstation-integration.md](../research/playstation-integration.md).

4. [ ] **Xbox Game Pass Integration** _(Research Complete)_ — OpenXBL OAuth ("Login with Xbox"); fetch full title history; match to IGDB; achievement enrichment; reuse Steam curation UI. See [research/xbox-integration.md](../research/xbox-integration.md).

---

## Phase 4: Community Scaling

_Builds on Phase 2 community foundations. Depends on Curated Collections shipping first._

1. [ ] **Community Collections** — share themed collections publicly for others to discover and draw inspiration from.

---

## Phase 5: Tech Health & Hygiene

_Audit-driven tech debt and process improvements. Sourced from `context/audits/2026-04-28/recommendations.md`. Non-blocking on product work but pays compounding interest. Runs in parallel with feature work. Ordered P1 → P2._

1. [x] **Architecture Doc Refresh** _(P1, SDD-03)_ — back-propagate spec 010 (Next.js 16) into `context/architecture.md`; correct "Next.js 15" → "Next.js 16"; move Upstash Redis from "Future considerations" to active stack.

2. [x] **Spec Status Reconciliation** _(P1, SDD-06)_ — mark spec 002 as Completed (55/55 tasks done); audit specs 009 and 012 against shipped state; run `/awos:verify` to formalize.

3. [ ] **Cross-Layer Vertical Slices** _(P1, E2E-01)_ — for items requiring data-pipeline or infra changes (PSN/Xbox imports, ongoing Steam sync), keep work in a single branch spanning `savepoint-app` + `lambdas-py` + `infra` rather than per-layer PRs.

4. [ ] **Terraform CI Parity** _(P2, E2E-05)_ — path-conditional job in `.github/workflows/pr-checks.yml` running `terraform fmt -check -recursive` and `terraform validate` from `infra/envs/dev/`.

5. [x] **Decompose Oversized Lambda Modules** _(P2, ARCH-06)_ — resolved by deletion in spec 015; `lambdas-py/services/database.py`, `handlers/database_import.py`, and `models/db.py` were removed along with the rest of the Lambda pipeline.

6. [ ] **Tighten FSD Type Boundaries** _(P2, ARCH-02)_ — move shared types out of repository layer for `features/social/ui/{followers,following}-list.tsx`; import from `entities/social/types`.

---

## Archive — Not Pursuing

_Items previously on the roadmap that have been dropped to keep the working list focused. Documented here so the decision is traceable; revisit if context changes._

- **Mood-Based Recommendations** — speculative; no clear signal users want a "cozy tonight" filter over their own library.
- **Year-in-Review / Wrapped** — seasonal one-shot; high cost relative to once-a-year payoff.
- **Theme Variants & Density Modes** — Terminal Green is the brand; alternative themes dilute identity for marginal user value.
- **Logged-Out Landing Page** — marketing surface, not core loop; defer until there's a growth motion to support.
- **Profile Slug Resolution** — minor polish on a low-traffic 404 path; not worth bespoke "did you mean…" infrastructure.
- **Keyboard Navigation Palette** _(g l, g j, n, etc.)_ — power-user shortcut layer; ⌘K already covers the same intent.
- **Fallback Cover Rendering** — folded into Game Detail Redesign / UX Audit as needed; not its own roadmap line.
- **Enhanced Game Details** _(franchise / series / expansions)_ — folded into Game Detail Redesign.
- **In-Page Status Toggles** — folded into Game Detail Redesign.
