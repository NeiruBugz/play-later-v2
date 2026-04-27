# Hero section refinement

_Started 2026-04-27 09:10 UTC_

---

## User

based on our audit v2, our hero section changed but if feels off

## Assistant

I'll take a look at the audit and the current hero to understand what's off.

_[tool: list_files]_

_[tool: view_image]_

_[tool: grep]_

_[tool: list_files]_

The audit file doesn't reference "hero" directly, let me search the mockups for the detail/hero section.

_[tool: grep]_

_[tool: grep]_

Let me examine the V1 hero mockup and the actual implementation in the user's codebase.

_[tool: read_file]_

_[tool: local_ls]_

Now let me find the actual hero implementation in the user's app:

_[tool: local_grep]_

_[tool: local_ls]_

_[tool: local_read]_

## Assistant

_[tool: local_read]_

I have enough now to diagnose the issue. Let me look at the audit V1 mockup choice once more carefully and the current rendered hero side-by-side.

_[tool: snip]_

Got it — so what you're showing me in the screenshot is the live build, but it doesn't match the V1 mockup we picked in the audit. Let me diagnose what's "off" by comparing them directly.

## What V1 (the picked mockup) called for

Looking back at `audit-v2/mockups-detail.jsx` → `DetailImprovedHero`, the lockup was very specific:

1. **Banner is the backdrop** — cover and title sit *inside* the gradient banner area, with the cover bottom-aligned to the banner's bottom edge (overlapping ~25%).
2. **Title sits next to the cover, vertically centered with it**, on top of the banner gradient.
3. **A small meta line above the title** (`2017 · Team Cherry`).
4. **Status pill + rating + playtime live on one row directly under the title**, all inside the hero zone.
5. **A tab strip** (`Overview / Journal / Playtime / Related`) divides the hero from the body.
6. The pinned note: *"cover, title, status, rating in a single lockup"* — meaning **one visual unit**, not two stacked zones.

## What the screenshot actually does

Looking at your build:

1. ❌ **Cover and title are below the banner**, not overlapping it. The banner is a separate empty zone with a person/desk photo, then the cover starts beneath it. Two zones, not one lockup.
2. ❌ **The banner has no darkening/gradient toward the bottom that pulls into the page bg** — the photo fades but the cover/title don't sit on top of it, so it reads as a decorative header instead of a hero backdrop.
3. ❌ **No meta line above the title** (release year · studio).
4. ❌ **Status pills row is wider than the title block and visually disconnects**: status segmented control on the left, rating stars on the far right of the same row — the title row feels stretched and unbalanced because the rating is so far from the title.
5. ❌ **No tab strip** separating hero from the long-form content (description, genres, platforms all just dump straight underneath).
6. ❌ **Cover is too small relative to the title**. In V1 it was ~86px wide for a 22px title (cover ≈ 4× title height). In the screenshot the cover is ~140px tall with a 36px title — title looks oversized next to a postage-stamp cover, and there's a lot of dead space to the right of the title.

The net effect: it looks like *the old layout with a photo banner glued on top*, not the unified V1 lockup we picked.

## The fixes (in priority order)

Looking at `game-detail-hero.tsx`:

**1. Make the cover overlap the banner.** Currently `pt-24 sm:pt-28` pushes the lockup *below* the 48/56-unit banner. It should pull *into* it. Roughly:
```tsx
// banner: keep h-48/h-56
// content wrapper: pt-20 sm:pt-24 (so cover top sits inside the banner)
// cover: aspect-[3/4] w-32/40/48 — bottom edge aligns with banner bottom
```
The gradient stop should also be tightened so the bottom 30% of the banner is solid `var(--background)` — that's what makes the cover read as "punched through" the banner instead of sitting under it.

**2. Bottom-align cover and title** (you have `sm:items-end` already, good — but the title's `space-y-3` block puts the status pills below the cover's bottom edge, breaking the lockup). Move status/rating to a single inline row directly under the title and shrink the gap.

**3. Add the meta eyebrow** (release year · primary platform/studio) above the `<h1>` — this was a key part of V1, gives the title context and reduces the "title floating in space" feeling.

**4. Tighten the title row.** Right now status-segmented and rating are on opposite sides of a `flex-wrap` row, which is what makes it feel stretched. Group them: `[status-pill] [rating] [⋯]` left-aligned, no spacer between status and rating.

**5. Add a tab strip below the hero** — even just a single `border-b` line with `Overview / Journal / Playtime` — to anchor the hero as its own zone.

**6. Drop the title size one step on desktop or bump cover one step.** `text-display` next to a `w-40` cover is the wrong ratio.

---

Want me to update the existing **UI-UX-Audit-V2.html** with a "current build vs picked mockup vs corrected V1" comparison artboard so you can see the gap and the fix side-by-side? Or would you rather I write a focused **Game-Detail-Hero-Fix.html** with a single-screen, full-fidelity desktop mock of the corrected hero (Resident Evil Requiem content) that the engineer can implement against?

## User

My Claude Code is implementing it at the moment, can we simply put a list of fixes into it?

## Assistant

Yep — let me drop a tight, implementation-ready fix list into the audit so Claude Code can just work down it.

_[tool: read_file]_

Let me check the audit-app.jsx structure to find where to add the fix list:

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

I'll add an "Implementation fixes" callout to Finding 3 (the hero) so Claude Code has a checklist to work from.

_[tool: str_replace_edit]_

_[tool: snip]_

Now wire the renderer to display this section, and add styles:

_[tool: str_replace_edit]_

Now add the styles:

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Added an **🔧 Implementation fixes** block to Finding 3 in the audit — 8 numbered items tagged `layout` / `content` / `type` / `structure` / `mobile`, with the target file path (`features/game-detail/ui/game-detail-hero.tsx`) at the top. Claude Code can work straight down the list.

## User

So, how does game detail should look like? I'd like to see a full-page mockup, because now it looks like as on the image

## Assistant

Let me look at the new screenshot and build a full-page mock.

_[tool: view_image]_

_[tool: snip]_

_[tool: local_grep]_

_[tool: local_read]_

_[tool: snip]_

I'll build a full-page mockup of the corrected game detail. Let me check brand colors briefly:

_[tool: local_grep]_

_[tool: snip]_

Let me build the full-page mockup now.

_[tool: copy_starter_component]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Built **Game-Detail-Full-Page.html** — full desktop mock showing the corrected hero in context:

- **Hero lockup**: cover overlaps the banner (banner ~280px, cover top sits ~140px down so its bottom aligns with the gradient fade); title bottom-aligned with cover; meta eyebrow above (`Feb 27, 2026 · Capcom · Action · Survival Horror`); status segmented + rating + ⋯ all clustered inline directly under the title.
- **Banner gradient** stops solid `var(--background)` at ~88% so the cover reads as punched through, not floating below.
- **Tabs strip** under the hero (Overview · Journal · Playtime · Related) anchors it as its own zone.
- **Body**: tightened release line + summary, `// Genres` and `// Platforms` meta rows, redesigned playtime cards (your-playtime as primary tinted card, averages as a 2-up grid below an "// Average times to beat" eyebrow), journal as a left-rail timeline with primary "Log session" button.
- **Sidebar**: quieter (no badges, single active state), search promoted to a ⌘K affordance per the audit.

## User

Verifier agent check completed

## Assistant

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Fixed both — sidebar search icon constrained to 14px, and journal heading no longer wraps (added `nowrap` + `flex-shrink: 0` on actions).

