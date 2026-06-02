# SavePoint — Design System

> **SavePoint** is a personal gaming library and journal for *patient gamers* —
> players who treat their collections as opportunities, not obligations. The
> product helps you curate games across platforms, journal what each one meant,
> and track where you are in every world you've started.
>
> *"A library, not a backlog."*

This folder is a **design system**: brand foundations, color + type tokens,
iconography, real assets, and high-fidelity UI-kit recreations of the product's
screens. Use it to design new SavePoint surfaces — production or throwaway — that
look and feel like the real thing.

---

## Sources

Everything here was reverse-engineered from the live codebase. Explore these to
go deeper:

- **GitHub — `NeiruBugz/play-later-v2`** (`main`) — the SavePoint monorepo.
  - `savepoint-tanstack/` — **the app.** TanStack Start v1 + React, Prisma,
    Better Auth, shadcn/ui ("new-york" style), Tailwind v4, Lucide icons.
  - `savepoint-tanstack/src/styles.css` — **the single source of truth** for all
    six themes and every token. ~2000 lines; this design system distills it.
  - FSD architecture: `src/shared/ui` (primitives) → `src/entities` →
    `src/features` → `src/widgets` (composite blocks) → `src/routes` (pages).
  - `infra/` — Terraform (Cognito + S3). Not design-relevant.

> The reader is encouraged to browse `NeiruBugz/play-later-v2` directly —
> particularly `savepoint-tanstack/src/styles.css`, `src/shared/ui/*`, and
> `src/widgets/*` — to build SavePoint designs with higher fidelity than this
> distillation alone allows.

No Figma file, slide template, or decks were provided.

---

## CONTENT FUNDAMENTALS

How SavePoint writes. The voice is **warm, literary, and unhurried** — it treats
games as worlds to inhabit, never tasks to clear. It is the anti-backlog app, and
the copy never lets you forget it.

- **Person:** Second person, conversational. Speaks *to* you and asks real
  questions: *"What did you play, {name}?"*, *"Log tonight's session."* First
  person only inside journal entries (the user's own voice).
- **Casing:** Sentence case for almost everything — headings, buttons, nav.
  `UPPERCASE` is reserved for **overlines / eyebrows / metadata** with wide
  letter-spacing (`TEAM CHERRY · 2017`, `APR 22 · JOURNAL ENTRY`,
  `FOR PATIENT GAMERS`) and for **status badges** (`PLAYING`, `WISHLIST`). This
  uppercase-metadata pattern is a signature.
- **The journey lexicon — never "backlog".** Library states are framed as a
  *journey*, not a to-do list. The five canonical statuses:
  - **Wishlist** — curious about
  - **Shelf** — owned, not started
  - **Up Next** — queued (doubles as **Replay** for finished games)
  - **Playing** — currently exploring
  - **Played** — experienced
- **Reflection, not review.** A core tagline: *"Journal — reflect, don't review."*
  The journal is for memory and feeling, not scoring. Microcopy is permissive:
  *"playtime is enough, thoughts are optional"*, *"Reflections can come later."*
- **Terminal / catalog flourishes.** Section labels in game detail render as
  monospace comments: `// GAME.DETAIL`, `// GENRES`, `// PLATFORMS`,
  `// LIBRARY`. A subtle nod to the dev-tool / retro-console heritage.
- **Tone of empty states:** encouraging, never nagging. *"Nothing in progress.
  Start something from the shelf and it'll show up here."*
- **Emoji:** **None.** SavePoint does not use emoji anywhere in product copy.
  Meaning is carried by Lucide icons and the status color system.
- **Example hero copy:** *"A library, not a backlog."* / *"Curate your collection
  across every platform. Journal what made each game matter. SavePoint is for
  patient gamers who treat games as worlds, not chores."*

---

## VISUAL FOUNDATIONS

> **v2 — unified.** The system is now **one identity expressed as two surfaces**:
> a warm **Light** mode (cozy cream "curation desk") and a warm **Dark** mode
> (dim charcoal "reading room"). They are true light/dark inversions — same
> accent, same type, same radii, same shadow tiers — only the surface values and
> the accent's lightness flip between them. The four extra themes (Cartridge,
> Y2K, Jewel, Aurora) from v1 were **retired** to keep the product consistent.

| Mode | Class | Background | Foreground | Mood |
|---|---|---|---|---|
| **Light** (default) | `:root` | warm cream `oklch(0.96 0.014 85)` | ink `oklch(0.20 0.02 60)` | cozy curation desk |
| **Dark** | `.dark` | warm charcoal `oklch(0.17 0.008 70)` | `oklch(0.94 0.008 85)` | dim reading room |

The marketing landing page forces **Dark**.

### The accent system (one swappable brand hue)
There is a single brand accent, set via `data-accent` on `<html>` — one of
**`indigo` · `sage` · `clay` · `plum`** (default **sage**). Each preset supplies
a **light-mode tone** (`--acc-l`, mid-dark for cream) and a **dark-mode tone**
(`--acc-d`, lighter for charcoal). `--primary`, its hover/active ladder, `--ring`,
and the **`Playing`** status all derive from it. Swap the attribute and the whole
product re-skins. (`sage` reads coziest on cream; `indigo` ties to the logo.)

### Color
- **OKLCH everywhere**, for perceptual consistency. Hover/active states derive
  from `--primary` with relative-color syntax
  (`oklch(from var(--primary) calc(l - 0.05) c h)`).
- **Light darkens, dark lightens** on interaction (`--surface-hover/active`).
- **Both modes share one warm hue family** — light cream and dark charcoal both
  sit around hue 70–85 at very low chroma, so they read as the same world.
- **Primary is rationed** — the CTA, active state, `Playing`. Not sprinkled.
- **Status colors are a consistent semantic system.** The five journey states
  (`wishlist` blue · `shelf` neutral · `upNext` amber · `playing` = accent ·
  `played` green) keep the **same hue across both modes** — only lightness flips.
  Each owns a `--status-*` / `--status-*-foreground` pair.
- **Platform colors are brand-constant:** PlayStation `#0070d1`, Xbox `#107c10`,
  Nintendo `#e60012`, PC `#1b2838`.

### Type — one geometric-sans family, both modes
- **Display / headings:** **Space Grotesk** (geometric, lightly characterful).
- **Body / UI:** **Geist**. **Mono / terminal labels:** **Geist Mono**.
- No serif, no per-theme font swaps — the type is identical in light and dark.
- Full **type scale** with paired size/line-height/letter-spacing tokens:
  `display-2xl…display-lg`, `heading-xl…heading-xs`, `body-lg…body-xs`,
  `caption`, `overline`. Apply via the semantic classes (`.text-h1`, `.body-sm`,
  `.overline`). Weights: display 700, heading 600, body 400, caption 500.

### Spacing, radii, borders
- **Semantic spacing scale** (`--space-xs` 4px → `--space-5xl` 96px),
  Tailwind-aligned. Layouts use `gap`-based flex/grid, not margins.
- **Crisp radii, consistent across both modes:** 3px is the workhorse
  (`--radius-btn`, `--radius-card`), covers 2px, chips 4px. **Pills (`9999px`)
  are reserved for circles only** — avatars, status dots, progress bars.
- **Borders** are low-contrast on cards (`border-border/40` → mixed alpha) and
  strengthen on hover.

### Shadows & elevation — four layered tiers
- One elevation scale, `--shadow-1` → `--shadow-4`, with clear, increasing depth.
  Light mode uses soft neutral drops; dark mode uses deeper, darker drops. The
  legacy `--shadow-paper*` names alias onto these tiers for back-compat.
- Game-detail pages use a **screenshot backdrop** faded into the page background
  via stacked linear-gradient "protection" masks.

### Motion
- **Apple-style timing.** Durations `instant 100ms → slower 500ms`.
- **Easing:** `--ease-out-expo` for entrances, `--ease-out-back` for playful pop,
  `--ease-in-out` for symmetric transitions.
- **Hover:** surfaces shift lightness; cards raise border contrast + shadow.
  **Press:** buttons `scale(0.98)` and deepen to `--primary-active`. No bounces
  on core UI. Respect `prefers-reduced-motion`.

### Cards
The defining surface. `bg-card`, a low-contrast border that strengthens on hover,
crisp `--radius-card` corners, and a layered shadow tier. Variants: `default`,
`interactive` (cursor + brighten), `elevated` (shadow-2), `outlined`.

---

## ICONOGRAPHY

- **Lucide** is the one and only icon system (`iconLibrary: "lucide"` in
  `components.json`). Stroke icons, consistent ~1.75–2px weight, sized 16px in
  nav/buttons, 20px in section headers. Reach for Lucide first, always.
  - **CDN:** `https://unpkg.com/lucide@latest` (or `lucide-react` in React).
    The UI kit in this system loads Lucide from CDN — no icon files to copy.
  - Icons seen in product: `BookMarked` (Library), `Search`, `BookOpen`
    (Journal), `User`, `Settings`, `Library`, `Star`, `Gamepad2`, `Archive`,
    `CheckCircle`, `Bookmark`, `Plus`, `ChevronRight`, `ArrowRight`, `Check`,
    `LogOut`, `LogIn`.
- **Status icons** map 1:1 to the journey taxonomy: Up Next → `Star`, Playing →
  `Gamepad2`, Shelf → `Archive`, Played → `CheckCircle`, Wishlist → `Bookmark`.
- **The logo is the "Save Glow" mark** — a diamond-in-diamond that evokes the
  "you are here" save marker hovering over a save point in classic games. It
  carries the brand's core idea: a deliberate, rationed moment you *chose* to
  stop and keep. Drawn with `currentColor`, so it **tints to the active accent**
  (default sage). See `assets/logo.svg` (sage standalone) and
  `assets/logo-mark.svg` (currentColor, for inline tinting).
  - *Heritage note:* this replaces the v1 indigo memory-card mark. The
    `assets/og-image.png` social card still shows the old memory-card art and
    should be regenerated to match.
- **Emoji / unicode-as-icon:** not used as iconography. The only unicode chars in
  chrome are the `⌘K` kbd hint and middot `·` separators in metadata.

---

## INDEX — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — brand context, content + visual foundations, iconography |
| `SKILL.md` | Agent-Skill manifest (for Claude Code / download) |
| `colors_and_type.css` | The full token system: **Light + Dark** surfaces, the 4-way **accent** presets, type scale, spacing, crisp radii, layered shadows, motion. Copy this into any design. |
| `assets/` | Brand assets: `logo.svg` (Save Glow, sage), `logo-mark.svg` (currentColor / tinting), `og-image.png` (legacy — to regenerate), `default-avatar.png` |
| `preview/` | Design-system spec cards (rendered in the Design System tab) |
| `ui_kits/app/` | **The SavePoint app UI kit** — high-fidelity, interactive recreation of core screens (landing, dashboard, library, game detail, journal) with reusable JSX components. Open `ui_kits/app/index.html`. |

### Theme note
`colors_and_type.css` (v2) ships the unified system: **Light** + **Dark** as true
inversions, plus four swappable **accents** (`data-accent="indigo|sage|clay|plum"`,
default sage). The four extra v1 themes (Cartridge, Y2K, Jewel, Aurora) were
retired for consistency; their original token bodies still live in the source
`savepoint-tanstack/src/styles.css` if ever needed. Fonts (Geist, Geist Mono,
Space Grotesk) load from Google Fonts — no local font files required.
