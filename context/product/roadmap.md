# Product Roadmap: SavePoint

_This roadmap outlines our strategic direction based on customer needs and business goals. It focuses on the "what" and "why," not the technical "how."_

_Each phase is a single ordered list, ordered by dependency — earlier items unlock later ones._

> **Vision reset (2026-10-29).** [Product definition v3.0](./product-definition.md) re-centers SavePoint on **mindful gaming**: choose the next game deliberately from what you own, play at your own pace, remember what it gave you. Primary user = the author (weekly dogfooding). Items that conflict with its principles (no competition, few at once, dropping is fine, pause before buying, personal-first) are ticked `[x]` as superseded with a note below — not deleted. AWOS no longer manages this file (`/awos:roadmap` was removed); it is maintained by hand.

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

## Phase 2: Internal Depth & Polish _(Closed by vision reset 2026-10-29)_

_Everything we could ship on our own data + IGDB. The shipped list stands; the remaining backlog was re-triaged against product definition v3.0._

### Shipped

- [x] **Next.js 16 Feature Adoption** _(Spec 010)_ — `cacheComponents`, `"use cache"` directive, view transitions.
- [x] **Code Health & DX Round 2** _(Spec 006)_
- [x] **Star Ratings** _(Spec 011)_ — 1–10 ratings on library entries with sort/filter and rating histogram.
- [x] **Patient-Gamer UX Overhaul** _(post-011)_ — UX pass shipped on top of star ratings.
- [x] **UX Audit — Round 1** _(Spec 012)_ — library scannability, mobile filters, dashboard hero, onboarding entry, library card redesign, quick add.
- [x] **UX Audit — Round 2** _(Spec 014)_ — game detail / journal / profile / settings / auth surfaces; navigational connective tissue; Raycast-style command center direction. 12 pinned findings (3 High / 7 Medium / 2 Low).
- [x] **Unified Design System (Light + Dark)** _(Spec 022)_ — consolidated 5 themes → warm-cream Light + warm-charcoal Dark on one swappable accent (sage, baked in), Space Grotesk headings, crisp 3px radii, layered shadows, new Save Glow logo. Retired-theme users fall back to System. _Supersedes the "Theme Variants & Density Modes" archive note below — the product now ships exactly two themes by design, not Terminal Green._
- [x] **Game Detail — Enrichment Pass** _(Spec 023)_ — recomposed the tabbed game-detail page into an inline bento dashboard surfacing data the app already had: critic-score ring, screenshot gallery + lightbox, About, Themes & Tags (family-colored platform badges), consolidated "Your Record" (playtime / sessions / rating), in-place status pill (popover desktop / sheet mobile), "Log a session" with optional minutes, you-vs-benchmark Times to Beat with a "Your Pace" fallback, related games, and full graceful degradation. No migration. _Ships independently of and partially ahead of the fuller "Game Detail Redesign" (#4); accent = "you" design rule._ **Vision v3 conflict:** the you-vs-benchmark / "Your Pace" framing contradicts "not a competition" — reframed by Mindful Core #6.
- [x] **Mobile-First Responsive Redesign** _(Spec 025)_ — UX/PWA quality pass re-thinking 8 core surfaces (global nav, dashboard, library, game detail, journal, profile, settings, and the log/add/compose flows) thumb-first, then scaled additively to desktop: 5-slot bottom nav with a center floating **Log** action + desktop sidebar with a pinned "Log a session" CTA, URL-driven global action host (open Log/Add from anywhere), single `md` (768px) phone↔desktop boundary for chrome AND filters, 2-up library shelf with a sticky status lens, game-detail stacked hero + jump spine + sticky action bar (mobile) / sticky right rail (desktop), keyboard-aware compose sheet, compact profile header, iOS-style grouped settings, and PWA manifest wiring. Presentation-only — no new server fns/AppError subclasses/migrations beyond the slug→playthroughs read path for global Log. Live responsive visual pass (Light/Dark/System × phone/desktop) deferred to author per the IGDB/Twitch-sandbox posture (specs 016/023).

### Re-triaged Backlog

1. [x] **Per-Playthrough Logs** — multiple playthroughs per library entry, each with start/end dates, rating, platform, optional notes. Playthrough timeline on game detail. Journal/review entries can attach to a specific playthrough. _Data primitive — unblocks Reviews and Aggregate Game Stats._ **Shipped (spec 016, 2026-06-11):** run-derived library status with manual-override-that-sticks; per-run journal + full-width run-aware feed; library-card quick-add; public-profile timeline. Live chrome-MCP verifies deferred (IGDB/Twitch OAuth unreachable in sandbox); verified via unit+integration+component gate. Known follow-up: library-level rating editing was dropped from the game-detail page (superseded by per-run ratings) — revisit if a library-rating control on game-detail is still wanted._ **Vision v3:** playthrough bookkeeping is hidden from the primary flow by Mindful Core #1–#2.

2. [x] **Reviews** — _Superseded 2026-10-29 (vision v3: personal-first, public reviews are a non-goal). Spec 024 stays Draft, not pursued._

3. [x] **Public Reflections** — _Superseded 2026-10-29 (vision v3: community reflection feeds are a non-goal)._

4. [x] **Game Detail Redesign** — _Superseded 2026-10-29. Catalog/personal parts shipped in spec 023; the remaining community layer (community stats, reviews feed) is a non-goal, and the playthrough timeline is hidden by Mindful Core #1._

5. [x] **Aggregate Game Stats** — _Superseded 2026-10-29 (vision v3: aggregate community stats are a non-goal)._

6. [x] **Bento Dashboard Reflow** — _Superseded 2026-10-29 by Mindful Core #4 ("What's Next" Home)._

7. [x] **Upcoming Releases Widget** — countdowns for unreleased wishlisted games using IGDB release dates. _Delivered 2026-11-13 as Spec 029 (Release Days) in the form vision v3 allowed: plain release-date information only, no countdowns. Honest-precision date labels on cards and the game page, a Home "Coming soon" section (next 30 days), an Upcoming releases page, refresh-on-open, a quiet "Moved from …" line, and Continue? skipping games that aren't out yet._

8. [x] **YTD Stats Card** — _Superseded 2026-10-29 (vision v3 anti-metric: no yearly counters of games finished or hours logged)._

9. [x] **Pick Up Where You Left Off** — _Superseded 2026-10-29: folded into Mindful Core #4 (Playing games surface on the "What's Next" Home, without guilt framing)._

10. [ ] **Gaming Events Calendar** — IGDB events endpoint integration; dashboard widget; `/events` page; event detail. _Parked (vision v3): not part of the choose → play → reflect loop._

11. [x] **Similar Games Discovery** — _Superseded 2026-10-29: related games shipped in spec 023; recommendations from the owned backlog are Mindful Core #8._

12. [ ] **Browse / Catalog** — first-class IGDB browse surface (trending, recent releases, by genre). _Parked (vision v3): discovery of new games conflicts with "pause before buying"; suggestions come from what you own._

13. [ ] **Curated Collections** — personal themed collections from library. _Parked (vision v3): personal-only collections may return if the Up Next queue proves too flat._

14. [ ] **First-Time User Onboarding** _(Spec 013, Draft)_ — server-persisted guided tour. _Parked (vision v3): re-scope after the simplified model lands; the tour should teach the new loop, not the old surfaces._

15. [ ] **Library View Modes** — grid / compact / dense list. _Parked (vision v3)._

16. [ ] **Bulk Library Actions** — multi-select with bulk status change / delete. _Parked (vision v3): may return as part of Steam import curation if needed._

17. [x] **Global Quick-Log CTA** — _Shipped via spec 025 (center Log action + URL-driven global action host)._

---

## Phase 3: Mindful Core _(Vision v3 — active)_

_Make SavePoint the place the author picks his next game every week. Simplification first, because the main pains are "too many concepts", "slow to add/mark", and "the main thing isn't visible"._

1. [ ] **Simplified Game Model** — three statuses **Want / Playing / Done** (Done = finished _or_ let go) + an ordered **Up Next** flag on Want games. Replaces the five-status model and run-derived status from spec 016 in the primary flow.

2. [ ] **Simple Journal** — free-form notes on a game; drop entry kinds, moods, and playthrough linkage from the UI. Optional prompts: "why do I want this?" on add, "what stayed with me?" on Done.

3. [ ] **Instant Add & Mark** — search → tap → in library; status change in one tap from anywhere.

4. [ ] **"What's Next" Home** — home screen = Playing games + the Up Next queue + a slot for suggestions. _Supersedes Bento Dashboard Reflow and Pick Up Where You Left Off._

5. [ ] **Soft Playing Limit** — starting a game beyond the limit asks whether to put one aside. _Assumption: limit 3, soft; validate in use._

6. [ ] **Reframe Times to Beat** — show length as "about N evenings"; remove you-vs-benchmark and "Your Pace" comparisons shipped in spec 023. _Partially done 2026-11-04: Your Pace and the you-vs-benchmark comparison removed; the "about N evenings" framing remains._

7. [ ] **Steam Import on the Simplified Model** — the in-app Steam import (rebuilt without Lambda in spec 021, curation from spec 003) feeds Want/Playing/Done; re-verify end to end and adapt smart status. _Corrects the stale "blocked — pipeline removed" note: import no longer depends on Lambda._

8. [ ] **Suggestions from the Owned Backlog** — rule-based picks from game length vs. available time, taste (genres, ratings, notes), mild urgency, and what friends play or praise. _Partially revives the archived Mood-Based Recommendations, without a mood filter._

9. [ ] **Wishlist "Already Waiting" Context** — wishlist shows the size of the queue ("4 games, about 20 evenings") before buying.

---

## Phase 4: Ownership Expansion

_Know what the author owns beyond Steam. Gated on external APIs. Ordered by readiness._

1. [x] **Steam Library — Stages 2 & 3: Curation** _(Spec 003)_ — _Completed (spec 003); carried into the TanStack app in spec 021. Remaining work is Mindful Core #7._

2. [ ] **Steam Library — Stage 4: Ongoing Sync** — re-import detects new games only; optional periodic sync for new purchases.

3. [ ] **Subscription Catalog Awareness** — Game Pass / PS+ availability and "leaving soon" dates, shown as information on queued games — never as a "hurry" push.

4. [ ] **PlayStation Trophy Integration** _(Research Complete)_ — PSN username + "About Me" verification via `psn-api`; fetch trophy list; match to IGDB; reuse Steam curation UI. See [research/playstation-integration.md](../research/playstation-integration.md).

5. [ ] **Xbox Game Pass Integration** _(Research Complete)_ — OpenXBL OAuth ("Login with Xbox"); fetch full title history; match to IGDB; achievement enrichment; reuse Steam curation UI. See [research/xbox-integration.md](../research/xbox-integration.md).

---

## Phase 5: Community Scaling _(Superseded)_

1. [x] **Community Collections** — _Superseded 2026-10-29 (vision v3: public collections are a non-goal; friends matter as a signal for suggestions, not as an audience)._

---

## Phase 6: Tech Health & Hygiene

_Audit-driven tech debt and process improvements. Sourced from `context/audits/2026-04-28/recommendations.md`. Non-blocking on product work but pays compounding interest. Runs in parallel with feature work. Ordered P1 → P2._

1. [x] **Architecture Doc Refresh** _(P1, SDD-03)_ — back-propagate spec 010 (Next.js 16) into `context/architecture.md`; correct "Next.js 15" → "Next.js 16"; move Upstash Redis from "Future considerations" to active stack.

2. [x] **Spec Status Reconciliation** _(P1, SDD-06)_ — mark spec 002 as Completed (55/55 tasks done); audit specs 009 and 012 against shipped state; run `/awos:verify` to formalize.

3. [ ] **Cross-Layer Vertical Slices** _(P1, E2E-01)_ — for items requiring data-pipeline or infra changes (PSN/Xbox imports, ongoing Steam sync), keep work in a single branch spanning the app + `infra` rather than per-layer PRs.

4. [ ] **Terraform CI Parity** _(P2, E2E-05)_ — path-conditional job in `.github/workflows/pr-checks.yml` running `terraform fmt -check -recursive` and `terraform validate` from `infra/envs/dev/`.

5. [x] **Decompose Oversized Lambda Modules** _(P2, ARCH-06)_ — resolved by deletion in spec 015; `lambdas-py/services/database.py`, `handlers/database_import.py`, and `models/db.py` were removed along with the rest of the Lambda pipeline.

6. [ ] **Tighten FSD Type Boundaries** _(P2, ARCH-02)_ — move shared types out of repository layer for `features/social/ui/{followers,following}-list.tsx`; import from `entities/social/types`.

---

## Archive — Not Pursuing

_Items previously on the roadmap that have been dropped to keep the working list focused. Documented here so the decision is traceable; revisit if context changes._

- **Mood-Based Recommendations** — speculative; no clear signal users want a "cozy tonight" filter over their own library. _(Partially revived 2026-10-29 as rule-based suggestions from the owned backlog — Mindful Core #8 — without a mood filter.)_
- **Year-in-Review / Wrapped** — seasonal one-shot; high cost relative to once-a-year payoff. _(Reinforced 2026-10-29: yearly counters are a vision v3 anti-metric.)_
- **Theme Variants & Density Modes** — Terminal Green is the brand; alternative themes dilute identity for marginal user value. _(Superseded 2026-06-02 by Spec 022: the brand was re-based on a unified warm Light + Dark system with a single sage accent — not Terminal Green — and the surplus themes were retired. The "alternative themes dilute identity" instinct held; the resolution was consolidation, not a single theme.)_
- **Logged-Out Landing Page** — marketing surface, not core loop; defer until there's a growth motion to support.
- **Profile Slug Resolution** — minor polish on a low-traffic 404 path; not worth bespoke "did you mean…" infrastructure.
- **Keyboard Navigation Palette** _(g l, g j, n, etc.)_ — power-user shortcut layer; ⌘K already covers the same intent.
- **Fallback Cover Rendering** — folded into Game Detail Redesign / UX Audit as needed; not its own roadmap line.
- **Enhanced Game Details** _(franchise / series / expansions)_ — folded into Game Detail Redesign.
- **In-Page Status Toggles** — folded into Game Detail Redesign.
