>[toc]

# Jewel — Synthesized Y2K Theme


Jewel is a selectable theme for SavePoint that distills the shared DNA of the three 6th-generation consoles — **PS2**, **GameCube**, and **Original Xbox** — into a single cohesive visual language. It is not a homage to any one console. It is the synthesis of what all three had in common: **a UI treated as a living, diegetic machine that's happy to see you.**


## Status

---

- **State:** experimental theme, opt-in via theme toggle (alongside `light`, `dark`, `system`)
- **Replaces:** supersedes the current `y2k` experimental theme
- **Scope:** token layer + utility classes + progressive surface opt-in
- **Non-goals:** replacing `light`/`dark` as defaults, full rebrand, sound layer (deferred)


## The Shared DNA


Three consoles, one common soul:

1. **Optimistic futurism.** The future is exciting and clean — never dystopian, glitchy, or distressed.
2. **Diegetic UI.** The interface is the machine, not an overlay on the content.
3. **Chrome, glass, neon — the material trinity.** Chrome is chassis. Glass is panel. Neon is emitted light. Each material has one job and never impersonates another.
4. **Light has a source.** Glow emanates from a point with direction and falloff — never uniform, never arbitrary.
5. **Idle breathes.** Hero elements pulse, drift, or shimmer on a slow ambient cycle. The machine is alive even when untouched.
6. **Transitions are ceremonies.** Nothing snaps. Unfold, rise, sweep, bloom.
7. **Pre-rendered 3D objects as primitives.** UI elements are treated as objects in space — z-axis is a first-class citizen.


## Seven Principles


These are laws. Every token, utility, and component obeys them.

| # | Principle | Forbids |
|---|---|---|
| 1 | Every surface is an object with weight | Flat rectangles, 1px borders with no backing |
| 2 | Light has a direction and a source | Uniform neon outlines, arbitrary text-shadow |
| 3 | Chrome frames, glass reveals, neon emits | Neon borders, hard-edged glass, chrome used as accent |
| 4 | Idle breathes (respecting `prefers-reduced-motion`) | Static hero elements, frozen stats |
| 5 | Transitions are ceremonies | `display: none` → `block`, instant state swaps |
| 6 | Sound is optional but structural (deferred) | Decorative chirps, random click sounds |
| 7 | Optimism is the mood | Gritty textures, ironic distress, glitch effects |


## Token System


Four ambient colors (green, indigo, pearl) plus **one ceremonial color** (magenta-spark) that is used rarely and deliberately.

### Palette

---

| Token | Source | Hue | Role |
|---|---|---|---|
| `--jewel-core` | OG Xbox | Radioactive green `oklch(0.72 0.22 145)` | Primary emission — the light inside the glass |
| `--jewel-core-bright` | OG Xbox | Bright green `oklch(0.82 0.28 145)` | Hover / active emission |
| `--jewel-void` | PS2 | Indigo-black `oklch(0.10 0.035 270)` | Ambient shadow, background, deep surfaces |
| `--jewel-void-raised` | PS2 | Indigo-black raised `oklch(0.14 0.035 265)` | Elevated background, card backing |
| `--jewel-pearl` | GameCube | Warm pearl `oklch(0.96 0.015 85)` | Chrome highlight, display text, warm gloss |
| `--jewel-pearl-dim` | GameCube | Dim pearl `oklch(0.72 0.02 85)` | Secondary text, meta labels |
| `--jewel-spark` | PS2 □ button | Magenta-pink `oklch(0.68 0.25 340)` | **Ceremonial only — see allowlist below** |

### Supporting tokens

---

| Token | Purpose |
|---|---|
| `--jewel-chrome-edge` | Chrome border gradient (pearl → indigo) |
| `--jewel-glass-fill` | Translucent glass fill with subtle green tint |
| `--jewel-glass-blur` | Backdrop filter strength (default `blur(16px) saturate(1.4)`) |
| `--jewel-neon-bloom` | Three-layer point-source glow |
| `--jewel-scanline-opacity` | CRT scanline strength (default `0.04`) |


## Materials


Three materials. Each has one job. They never mix roles.

### Chrome

---

The chassis. Frames, edges, dividers, outer shells.

- 1-2px width
- Gradient: `--jewel-pearl` (top-left) → `--jewel-void` (bottom-right) to imply a cool key light
- Subtle bevel hint, not skeuomorphic
- Used on: card edges, nav dividers, modal frames, button outlines

### Glass

---

The window. Content surfaces, panels, cards.

- Translucent fill (40-60% opacity)
- Backdrop blur + saturation boost
- Inner shadow for depth
- Subtle `--jewel-core` tint in fill so emission reads as coming *through* the glass from behind
- Used on: cards, panels, modals, popovers, sidebar surfaces

### Neon

---

The soul. Emitted light on accents, statuses, active states.

- Always anchored to a **point source** (typically top-left, 30° angle)
- Always three-layer falloff: tight inner (2px) / medium (10px) / far halo (30px)
- Color: `--jewel-core` (ambient) or `--jewel-spark` (ceremonial only)
- Used on: active nav, status pills, hover states, focus rings, achievement moments


## Motion Grammar


Four named motions. Each from a console. Each with a specific semantic. Rigidly applied.

| Motion | Duration | Source | When |
|---|---|---|---|
| **Unfold** | 500ms `ease-out-expo` | GameCube cube-unfold | First load, boot splash, major context switch |
| **Rise** | 400ms `ease-out-expo` | PS2 tower rise | Numerical reveals, stat counters, list items entering |
| **Sweep** | 300ms `ease-out-cubic` | Xbox blade sweep | Route/tab changes, sidebar nav, horizontal panel transitions |
| **Breathe** | 4-8s loop, `ease-in-out` | Common to all | Idle state on hero elements (scale 1.00 ↔ 1.01, glow 0.8 ↔ 1.0) |

### Reduced motion

---

`@media (prefers-reduced-motion: reduce)` disables **breathe** entirely and reduces unfold/rise/sweep to 100ms linear fades. Non-negotiable.


## Magenta-Spark Allowlist


`--jewel-spark` is ceremonial. It appears maybe 2-3 times per user session. Its rarity is what gives it meaning.

### Allowed

---

- Achievement / milestone unlock toast (full ceremony)
- "Played" status pill — **only on the game just marked played**, on first render; decays to ambient `--jewel-core` on next page load
- Rare-game / 100%-completion badge on game cards
- Boot splash climax frame (single pulse at end of unfold)

### Forbidden

---

- Buttons (any variant)
- Hover states (general)
- Links
- Borders (general)
- Focus rings
- Active nav items
- Error states (use destructive)
- Form validation
- Loading indicators

If a new surface wants spark, it earns a line in this allowlist via explicit decision, not drift.


## Surface Map


How Jewel lands on SavePoint surfaces. Progressive rollout — each row is a slice.

| Surface | Treatment | Priority |
|---|---|---|
| **Boot splash** | 1.2s unfold, once per session (`sessionStorage` flag). Indigo void → green point of light rises → unfolds into pearl-chrome wordmark. Skippable on click/key/scroll. | P2 |
| **Library grid card** | Chrome edge + glass fill + neon bloom from top-left + idle breathing + hover rise | **P0 (prototype)** |
| **Dashboard stats** | PS2 boot-tower viz. Vertical glass columns rising on mount, breathing on idle. Height = value. | P1 |
| **Game detail page** | Visor-framed (Metroid Prime homage). Chrome bezel wraps hero. Cover art behind glass. Stats as MJOLNIR-style HUD elements. | P1 |
| **Status pills** | Glass capsules with internal neon. Each status has own emission color. | P1 |
| **Route transitions** | Blade sweep on sidebar nav changes | P2 |
| **Command palette** | Glass panel in indigo void. Pearl chrome frame. Green cursor. Mono entries with tilted meta. | P2 |
| **Empty states** | GC-warmth moment. Rounded display font. Pearl+indigo, no green. The one place the language softens. | P2 |
| **Toasts** | Xbox blade slide-in top-right. Chrome frame, glass body, green jewel icon. | P2 |
| **Achievement unlock** | Full ceremony. Screen dims, magenta-spark rises, bloom sound (deferred). | P3 |


## Migration from `y2k`


- Add `.jewel` scope to `globals.css` alongside existing `.y2k`
- Add `jewel` to `next-themes` themes list
- Add `Jewel` option to `ThemeToggle` component
- Existing `y2k` theme and utilities remain functional during transition
- Once all target surfaces are migrated, `.y2k` can be removed in a follow-up


## Build Sequence


1. **Spec doc** (this file) — source of truth ✅
2. **Token layer** — `--jewel-*` tokens, `.jewel-chrome` / `.jewel-glass` / `.jewel-neon-*` utilities, `jewel-rise` / `jewel-unfold` / `jewel-sweep` / `jewel-breathe` keyframes
3. **Theme wiring** — register `jewel` in `next-themes`, add to `ThemeToggle`
4. **Prototype: library grid card** — the synthesis test. If this holds up, the rest follows
5. **Review** — does it feel designed or skinned? Adjust principles if needed
6. **Rollout** — P1 surfaces (dashboard stats, game detail, status pills)
7. **P2/P3** — boot splash, transitions, command palette, achievement ceremony


## Open Questions


- Should the `y2k` theme option be kept in the toggle during transition, or replaced outright once Jewel is working?
- Which font do we pick for the ceremonial "rounded display" role (empty states)? Current candidates: Space Grotesk, Sora, or keep Geist.
- Does the boot splash play in dev mode, or is it production-only?
