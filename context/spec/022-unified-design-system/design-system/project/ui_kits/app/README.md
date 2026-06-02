# SavePoint — App UI Kit

A high-fidelity, interactive recreation of the **SavePoint** web app
(`NeiruBugz/play-later-v2`, `savepoint-tanstack/`). Cosmetic-only — no real data
or auth — built to be lifted into mocks and prototypes.

## Run it
Open `index.html`. You land on the marketing **landing page** (forced **Dark**,
exactly like production). "Sign in" / "Start your library" drops you into
the authenticated app. Use the left sidebar to move between surfaces, the
**theme toggle** (bottom of the sidebar) to flip **Light ↔ Dark**, and the
**accent swatches** to switch the brand hue (indigo / sage / clay / plum) live.

## Screens recreated
- **Landing** — hero (*"A library, not a backlog."*), three-up features strip,
  and the decorative "currently exploring" preview card.
- **Dashboard** — the *"What did you play, {name}?"* quick-log hero, the
  `// LIBRARY` stats card with the status-distribution bar, and Playing / Up Next
  / Recently Added game sections.
- **Library** — filter chips by journey status + responsive cover grid.
- **Game detail** — screenshot backdrop fading into the page, cover, uppercase
  eyebrow metadata, serif title, the **status switcher** segmented control, and
  Overview / Journal / Related tabs (note the `// GAME.DETAIL` terminal labels).
- **Journal** — chronological timeline of reflection cards.

## Files
| File | What |
|---|---|
| `index.html` | App shell — sidebar, nav state, theme toggle, mounts React |
| `kit.jsx` | Primitives + brand: `Icon` (Lucide), `LogoMark`, `Wordmark`, `Button`, `Card`, `Badge`, `StatusBadge`, `PlatformBadge`, `RatingStars`, `GameCover`; the status taxonomy + sample game/journal data |
| `screens.jsx` | Composite screens + `LibraryItemCard`, `GameSection` |
| `kit.css` | Component styles (shell, sidebar, button, card, badge, cover, tabs) |
| `tokens.css` | Copy of the design-system foundations (`../../colors_and_type.css`) |
| `assets/` | Logo, OG image, default avatar |

## Conventions
- **Icons:** Lucide via CDN (`lucide@0.460.0`). The `Icon` component reads
  `window.lucide.icons[Name]` (PascalCase) and renders the SVG. Pass `name`,
  `size`, `strokeWidth`.
- **Status system:** five journey states — Wishlist, Shelf, Up Next, Playing,
  Played — each backed by a `--status-*` token pair that shifts per theme.
- **Covers:** use the app's real colored-accent fallback (title on a gradient),
  so no external IGDB image fetch is needed. Swap in real cover URLs by giving a
  `GAMES` entry an image and rendering an `<img>` in `GameCover`.
- **Components export to `window`** (Babel multi-file pattern) — `kit.jsx` loads
  before `screens.jsx` before the inline app script.

## Fidelity notes / caveats
- Search, Profile, and Settings are stubbed with a placeholder (the product has
  them; they weren't recreated here).
- The kit reflects the **unified v2 system**: Light + Dark only, with four
  swappable accents. The four extra v1 themes (Cartridge, Y2K, Jewel, Aurora)
  were retired.
- Sample library/journal content is illustrative (patient-gamer favorites), not
  from the real database.
