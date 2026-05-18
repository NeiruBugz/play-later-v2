# Layer survey: widgets/

## Widget inventory

| Widget | Purpose | Primary consumer | Composes | Tests | CVA |
| --- | --- | --- | --- | --- | --- |
| `app-shell` | Root layout | `__root.tsx` | shared/ui | N | N |
| `app-sidebar` | Persistent nav + user menu | `app-shell` | features/auth-sign-out, entities/session, shared/ui | Y | N |
| `auth-page` | Branded auth layout | `routes/login.tsx` | shared/ui (slot-based) | Y | N |
| `game-card` | Compound card (cover + header + meta + footer) | `features/browse-related-games` | shared/ui, shared/lib/igdb-image | Y | **Y** |
| `game-detail` | Game detail composer | `routes/games.$slug.tsx` | entities/game + library-item + journal-entry, features/add-game + manage-library-entry | Y | N |
| `landing-features` | Landing feature blocks | `routes/index.tsx` | shared/ui | Y | N |
| `landing-hero` | Landing hero | `routes/index.tsx` | shared/ui | Y | N |
| `library-item-card` | Per-item library card | `library-page` (sibling — intentional) | `widgets/game-card` (sibling — intentional), entities/library-item, features/manage-library-entry | Y | N |
| `library-page` | Library grid + filters + empty | `routes/_authed/library.tsx` | `widgets/library-item-card` (sibling), features/filter-library | Y | N |
| `profile-overview` | Profile composition | `routes/_authed/profile.tsx`, `routes/u.$username.tsx` | features/upload-avatar, entities/profile + library-item | Y | N |

Test coverage: 8/10 (80%).

## Dominant patterns (from code)

- One-component-per-folder + barrel + `.type.ts`/`.utility.ts`/`.test.tsx`: 100%.
- Slot-based composition for templates (`game-detail`, `auth-page`).
- Features for CTAs, entities for display.
- elements/actions/given-when-then test convention.
- CVA isolated to `game-card`; all axes declared; compound entries populated only for current consumers.
- No upward imports.
- Two intentional widget-to-widget imports: `library-page → library-item-card → game-card`. Documented in DIVERGENCES.md, NOT in widgets/README.md.
- Cover alt-text `"Cover for {title}"` consistent.
- Link-rendering tests mock `@tanstack/react-router`.

## Drifts

1. **Widget-to-widget imports undocumented in README (LOW).** Two exist, enforced by linter, justified in DIVERGENCES.md.
2. **`app-shell` lacks `.type.ts` (LOW).**
3. **`landing-features` inlines 3 components in one file (LOW).** Borderline.
4. **CVA compound variants partially populated in `game-card` (LOW).** Intentional + documented.
5. **One arbitrary Tailwind gradient in `landing-features` (INFO).**

## Proposed rules

- Rule: every widget = own folder + barrel + colocated test.
- Rule: widgets compose features (CTAs) + entities (display) + shared/ui (primitives); no business logic.
- Rule: prefer slot props (`ReactNode`) for template widgets.
- Rule: widget-to-widget imports allowed only when importer fundamentally extends importee; document with inline comment + DIVERGENCES.md link.
- Rule: CVA — all axes declared; compound entries marked "Deferred" when not populated.
- Rule: no arbitrary Tailwind values.
- Rule: cover alt-text `"Cover for {title}"` everywhere.
- Rule: Link-rendering tests mock `@tanstack/react-router`.
- Rule: routes own `<Suspense>` + per-section error boundaries; widgets accept resolved data as props.
- Rule: CVA configs colocated with their widget.

## README accuracy

~75%. Underdocuments widget-to-widget exceptions. Add a "Composition exceptions" subsection linking DIVERGENCES.md.
