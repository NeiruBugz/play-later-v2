# Technical Specification: FSD Architecture Compliance

- **Functional Specification:** [functional-spec.md](functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail

---

## 1. High-Level Technical Approach

This is a **pure refactoring effort** — no new features, database changes, or API changes. All work is file moves + import rewrites + configuration updates.

**Strategy:** Execute as a series of atomic, independently-testable moves organized by dependency order:
1. **Configuration first** — ESLint boundaries + tsconfig (enables new layers)
2. **Leaf moves** — types, lib utilities, dead code cleanup (no cascading imports)
3. **Component/hook moves** — command palette, GameCard widget
4. **Server action moves** — profile actions out of shared
5. **Barrel files** — add `index.ts` / `index.server.ts` to all features
6. **Documentation** — CLAUDE.md files, update features/CLAUDE.md

**Build verification:** Run `pnpm build` + `pnpm lint` + `pnpm test` after each logical group to catch import breakage early.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### Architecture Changes

**New layer: `widgets/`**

Position in FSD hierarchy: `app/ → widgets/ → features/ → data-access-layer/ → shared/`

```
widgets/
└── game-card/
    ├── ui/           # GameCard compound component + skeleton + genre-badges
    ├── lib/          # Variants, type guards (if any)
    ├── index.ts      # Public API
    └── CLAUDE.md
```

**New feature: `features/command-palette/`**

```
features/command-palette/
├── ui/               # CommandPalette, desktop/mobile variants, GameResultItem, Provider
├── server-actions/   # get-recent-games.ts
├── index.ts          # Client exports (CommandPalette, Provider, useContext, types)
├── index.server.ts   # Server exports (getRecentGames)
└── CLAUDE.md
```

### ESLint Boundaries Changes

File: `eslint.config.mjs`

Add `widget` element type:

| Element Type | Pattern | Mode |
|---|---|---|
| `widget` (NEW) | `widgets/**/*` | `file` |

Update import rules — add `widget` to allowed imports for:

| From | Add `widget` to allowed? |
|---|---|
| `app-route` | Yes |
| `ui-component` | Yes |
| `widget` | Can import: `shared` only |

No tsconfig changes needed — `@/widgets/` already resolves via `@/*` → `./*`.

### Dead Code Cleanup

Delete `shared/lib/game/` directory entirely:
- `get-game-url.ts` — zero consumers outside shared/lib/index.ts re-export
- `is-external-game.ts` — zero consumers outside shared/lib/index.ts re-export
- `index.ts` — barrel file

Remove re-exports from `shared/lib/index.ts`.

### File Moves — Command Palette

| Source | Destination |
|---|---|
| `shared/components/command-palette/command-palette.tsx` | `features/command-palette/ui/command-palette.tsx` |
| `shared/components/command-palette/command-palette.types.ts` | `features/command-palette/ui/command-palette.types.ts` |
| `shared/components/command-palette/command-palette-provider.tsx` | `features/command-palette/ui/command-palette-provider.tsx` |
| `shared/components/command-palette/desktop-command-palette.tsx` | `features/command-palette/ui/desktop-command-palette.tsx` |
| `shared/components/command-palette/mobile-command-palette.tsx` | `features/command-palette/ui/mobile-command-palette.tsx` |
| `shared/components/command-palette/game-result-item.tsx` | `features/command-palette/ui/game-result-item.tsx` |
| `shared/components/command-palette/actions/get-recent-games.ts` | `features/command-palette/server-actions/get-recent-games.ts` |

Consumers to update:
- `app/(protected)/layout.tsx` — `CommandPaletteProvider` import
- `app/games/layout.tsx` — `CommandPaletteProvider` import
- `shared/components/header.tsx` — `CommandPalette`, `useCommandPaletteContext` imports

Note: `header.tsx` stays in `shared/` but will import from `@/features/command-palette`. This creates a new upward import in shared → features. **Resolution needed at implementation time:** evaluate whether Header should also move to `app/` or become a widget.

### File Moves — GameCard Widget

| Source | Destination |
|---|---|
| `shared/components/game-card/*.tsx` (all component files) | `widgets/game-card/ui/` |
| `shared/components/game-card/*.types.ts` | `widgets/game-card/ui/` |
| `shared/components/game-card/*.variants.ts` | `widgets/game-card/lib/` |
| `shared/components/genre-badges.tsx` | `widgets/game-card/ui/genre-badges.tsx` |

**Stays in `shared/`:**
- `platform-badges.tsx` — used by both GameCard (widget) and `app/games/[slug]/page.tsx` independently
- `game-cover-image.tsx` — generic image component used by GameCard and command palette independently

Consumers to update:
- `features/journal/ui/journal-entry-detail.tsx` — GameCard import
- `features/game-search/ui/game-card.tsx` — GameCard, GameCardFooter import
- `features/browse-related-games/ui/related-games.tsx` — GameCard import
- `app/games/[slug]/page.tsx` — GenreBadges import

### File Moves — Profile Server Actions

| Source | Destination |
|---|---|
| `shared/server-actions/profile/check-username-availability.ts` | `features/profile/server-actions/check-username-availability.ts` |
| `shared/server-actions/profile/upload-avatar.ts` | `features/profile/server-actions/upload-avatar.ts` |
| `shared/server-actions/profile/*.integration.test.ts` | `features/profile/server-actions/` |

**Stays in `shared/`:**
- `shared/components/profile/avatar-upload.tsx` — consumed by both features/profile/ and features/setup-profile/
- `shared/components/profile/username-input.tsx` — same reason
- `shared/hooks/use-username-validation.ts` — consumed by username-input in shared/

Consumers to update:
- `shared/hooks/use-username-validation.ts` — update import of `checkUsernameAvailability`
- `shared/components/profile/avatar-upload.tsx` — update import of `uploadAvatar`
- `features/profile/ui/profile-settings-form.test.tsx` — update mock paths
- `features/setup-profile/server-actions/upload-avatar.integration.test.ts` — update import

**Note:** This means `shared/` will import from `features/profile/server-actions/` — a new upward import. Resolution options at implementation time:
1. Accept as documented exception (shared profile UI needs profile server actions)
2. Move profile UI components to `features/profile/` (reconsider the decision)
3. Pass server actions as props/callbacks instead of direct imports

### File Moves — Domain Types

| Source | Destination | Rationale |
|---|---|---|
| `shared/types/library.ts` → extract `LibraryItemDomain`, `LibraryItemWithGameDomain` | `features/library/types.ts` | Feature-specific composed types |
| `shared/types/journal.ts` → extract `JournalEntry` composed type | `features/journal/types.ts` | Feature-specific composed type |
| `shared/types/profile.ts` → extract `ProfileWithStats`, `UpdateProfileFormState` | `features/profile/types.ts` | Feature-specific types |
| `shared/types/game.ts` → extract `TimesToBeatData` | `features/game-detail/types.ts` | Feature-specific type |

Enums (`LibraryItemStatus`, `AcquisitionType`, `JournalMood`, `JournalVisibility`, `GameCategory`) **remain in `shared/types/`**.

### File Moves — Domain Business Logic

| Source | Destination |
|---|---|
| `shared/lib/profile/` (validation, profanity, schemas, constants) | `features/profile/lib/` |

**Stays in `shared/`:**
- `shared/lib/library-status.ts` — used by 8 features, genuinely cross-cutting
- `shared/lib/platform/` — used by platform-badges (shared) and GameCard (widget)

### Barrel Files Strategy

**Split barrel pattern** for Next.js server/client boundary:

```typescript
// features/X/index.ts (client-safe)
export { ComponentA } from "./ui/component-a";
export { useHookA } from "./hooks/use-hook-a";
export type { TypeA } from "./types";

// features/X/index.server.ts (server-only)
export { serverActionA } from "./server-actions/action-a";
export { useCaseA } from "./use-cases/use-case-a";
```

Features needing new barrel files:

| Feature | `index.ts` (client) | `index.server.ts` (server) |
|---|---|---|
| `auth` | UI components, schemas | sign-in, sign-up actions |
| `dashboard` | UI components | server actions |
| `game-search` | UI components, hooks, schemas | — |
| `journal` | UI components, hooks | server actions |
| `library` | UI components, hooks | server actions |
| `manage-library-entry` | UI components, hooks | server actions, use-cases |
| `profile` | UI components | server actions |
| `command-palette` (new) | UI components, provider, context hook | get-recent-games action |

Features with existing barrels to audit: `browse-related-games`, `game-detail`, `onboarding`, `setup-profile`, `steam-import`, `whats-new` — check for wildcard exports and add `index.server.ts` if missing.

---

## 3. Impact and Risk Analysis

### System Dependencies

- **ESLint boundaries plugin** — must be updated before any moves, or lint will fail on new paths
- **Next.js build** — barrel files must respect server/client boundary or build will error
- **Existing tests** — mock paths reference current locations; must update mocks in test files
- **CI pipeline** — all 3 test projects (unit, integration, components) must pass after changes

### Potential Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Circular dependency after moves | Build failure | Map dependency graph before each move; verify with `pnpm build` |
| Server code in client barrel | Next.js build error | Split `index.ts` / `index.server.ts`; verify with `pnpm build` |
| shared/ → features/ new violations from profile server actions | Architecture regression | Decision needed: either move profile UI to features/ or accept as exception |
| Header component still in shared/ importing from features/command-palette | New upward violation | Evaluate at implementation: may need to move Header |
| Test mock paths broken | CI failure | Update mock paths in test files alongside source moves |
| Large PR too hard to review | Review fatigue | Split into 3-4 PRs by phase (config, moves, barrels, docs) |

### Key Decision Points at Implementation

1. **Header location** — after command palette moves to features/, Header in shared/ creates a new upward import. May need to move Header to `app/` components or a widget.
2. **Profile server action consumers** — after moving server actions to features/profile/, shared UI components that call them create upward imports. May need to reconsider keeping profile UI in shared/ vs moving everything to features/profile/.

---

## 4. Testing Strategy

**No new tests needed** — this is a pure refactoring. Existing tests validate behavior correctness.

**Verification approach:**
1. `pnpm lint` — ESLint boundaries catch any remaining import violations
2. `pnpm build` — Next.js build catches server/client boundary issues and unresolved imports
3. `pnpm test` — all 3 test projects (unit, integration, components) catch behavioral regressions
4. Manual smoke test — command palette, game cards, profile settings, library filters

**Test file moves:** Tests co-located with source files (e.g., `*.test.tsx` alongside `*.tsx`) move with their source. Tests referencing moved modules via mocks need mock path updates.

**CI gate:** All existing PR checks must pass on the final branch before merge.
