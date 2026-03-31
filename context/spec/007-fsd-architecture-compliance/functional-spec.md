# Functional Specification: FSD Architecture Compliance

- **Roadmap Item:** Code Health & Developer Experience (Round 2) — FSD layer violations, missing public APIs, and domain code cleanup
- **Status:** Completed
- **Author:** Nail

---

## 1. Overview and Rationale (The "Why")

SavePoint's codebase follows a modified Feature-Sliced Design (FSD) architecture with four layers: `app/`, `features/`, `data-access-layer/`, and `shared/`. An architectural audit revealed significant structural drift from FSD principles:

- **5 upward import violations** — `shared/` importing from `features/` and `data-access-layer/`, breaking the fundamental rule that lower layers cannot depend on upper layers
- **7 of 13 features missing public APIs** — no `index.ts` barrel files, causing 26+ direct internal imports from `app/` pages into feature internals
- **~25 domain-specific files leaked into `shared/`** — types, business logic, components, hooks, and server actions that belong in owning features or a widgets layer
- **No per-slice documentation** — none of the 13 feature slices have a CLAUDE.md file

**Problem:** These violations make the codebase harder to navigate, increase coupling between layers, and create risk of cascading changes. A developer (or AI agent) cannot trust the layer boundaries — `shared/` contains business logic, features lack encapsulation, and import direction is inconsistent.

**Desired outcome:** Every layer contains only what belongs there, imports flow strictly downward, each feature exposes a clean public API, and the codebase is self-documenting through CLAUDE.md files.

**Success criteria:**
- Zero upward import violations (shared → features, shared → DAL)
- All 13+ features have public API barrel files (split: `index.ts` + `index.server.ts`)
- `shared/` contains only domain-agnostic infrastructure code
- New `widgets/` layer exists for composite UI blocks
- Every feature/widget slice has a CLAUDE.md file

---

## 2. Functional Requirements (The "What")

### Requirement 1: Resolve Upward Import Violations

The 5 files in `shared/` that import from upper layers must be relocated to the correct layer.

**1a. Command Palette → new `features/command-palette/`**
- `shared/components/command-palette/` currently imports `useGameSearch` from `features/game-search` and `LibraryService` from `data-access-layer/services`
- Move the entire command palette directory to `features/command-palette/`
- Organize into FSD segments: `ui/` (desktop + mobile components), `hooks/` (search integration), `server-actions/` (get-recent-games)
- Update all consumers (`app/(protected)/layout.tsx`) to import from the new location

  **Acceptance Criteria:**
  - [x] `features/command-palette/` exists with `ui/`, `hooks/`, `server-actions/` segments
  - [x] `shared/components/command-palette/` is deleted
  - [x] No file in `shared/` imports from `@/features/` or `@/data-access-layer/`
  - [ ] Command palette functions identically in the app (desktop + mobile)

**1b. Profile Server Actions → `features/profile/server-actions/` or `features/setup-profile/server-actions/`**
- `shared/server-actions/profile/check-username-availability.ts` and `upload-avatar.ts` import from `data-access-layer/services/profile`
- Move to the feature that owns them (profile or setup-profile, whichever is the primary consumer)

  **Acceptance Criteria:**
  - [x] `shared/server-actions/` directory is empty or deleted
  - [x] Profile server actions live in the owning feature's `server-actions/` segment
  - [x] All consumers updated to import from the new location
  - [ ] Username availability check and avatar upload function correctly

### Requirement 2: Introduce `widgets/` Layer

Create a new `widgets/` layer between `features/` and `app/` for composite UI blocks reused across multiple pages.

**2a. GameCard widget**
- Move `shared/components/game-card/` (GameCard, GameCardContent, GameCardCover, GameCardFooter, GameCardHeader, GameCardMeta) to `widgets/game-card/ui/`
- Move related helper logic (search result type guards, release year extraction, platform normalization) to `widgets/game-card/lib/`

  **Acceptance Criteria:**
  - [x] `widgets/game-card/` exists with `ui/`, `lib/` segments and `index.ts` public API
  - [x] `shared/components/game-card/` is deleted
  - [x] All consumers (dashboard, library, game-search) import from `@/widgets/game-card`
  - [ ] GameCard renders identically in all locations

**2b. Related shared domain components**
- Move `shared/components/genre-badges.tsx` and `shared/components/platform-badges.tsx` to `widgets/game-card/ui/` (if only used alongside GameCard) or to the owning feature

  **Acceptance Criteria:**
  - [x] Genre and platform badge components are not in `shared/` (genre-badges moved to widgets; platform-badges intentionally kept in shared — used independently by `app/games/[slug]`)
  - [ ] Components render identically after relocation

### Requirement 3: Migrate Domain Code from `shared/` to Owning Features

Domain-specific logic, components, hooks, and server actions must move to the features that own them. Cross-cutting enums (`LibraryItemStatus`, `JournalMood`, `AcquisitionType`, etc.) remain in `shared/types/`.

**3a. Domain types — move composed/feature-specific types, keep enums**
- Keep in `shared/types/`: `LibraryItemStatus`, `AcquisitionType`, `JournalMood`, `JournalVisibility`, `GameCategory`, and other enums used by 2+ features
- Move to owning features: `LibraryItemDomain`, `LibraryItemWithGameDomain` → `features/library/`, `JournalEntry` composed type → `features/journal/`, `ProfileWithStats`, `UpdateProfileFormState` → `features/profile/`, `TimesToBeatData` → `features/game-detail/`

  **Acceptance Criteria:**
  - [x] `shared/types/` contains only enums and types used by 2+ features
  - [x] Feature-specific composed types live in their owning feature
  - [x] All imports compile and resolve correctly

**3b. Domain business logic**
- Move `shared/lib/library-status.ts` (status config, state machine, icon/label/variant mapping) → `features/library/lib/`
- Move `shared/lib/platform/` (platform mapper, badge variants, colors, unique platforms) → `features/game-detail/lib/` or `widgets/game-card/lib/`
- Move `shared/lib/game/` (URL generation, external game detection) → `features/game-detail/lib/`
- Move `shared/lib/profile/` (validation, profanity checking, schemas, constants) → `features/profile/lib/`

  **Acceptance Criteria:**
  - [x] `shared/lib/` contains only domain-agnostic utilities (auth, db, rate-limit, rich-text, ui/utils, storage infrastructure)
  - [x] All moved logic functions identically in its new location (1502 tests pass)
  - [x] No circular dependencies introduced (build passes)

**3c. Domain components**
- Move `shared/components/profile/avatar-upload.tsx` and `username-input.tsx` → `features/profile/ui/` or `features/setup-profile/ui/`

  **Acceptance Criteria:**
  - [x] `shared/components/profile/` is deleted
  - [ ] Avatar upload and username input work correctly in profile and setup-profile flows

**3d. Domain hooks**
- Move `shared/hooks/use-username-validation.ts` → `features/profile/hooks/`
- Move `shared/hooks/game/use-get-platforms.ts` → owning feature's `hooks/`

  **Acceptance Criteria:**
  - [x] `shared/hooks/` contains only domain-agnostic hooks (useMediaQuery, useDebouncedValue, useFormSubmission)
  - [ ] Moved hooks function correctly

### Requirement 4: Add Public API Barrel Files to All Features

Every feature must have split barrel files respecting the Next.js server/client boundary:
- `index.ts` — exports client-safe code (UI components, hooks, types, schemas)
- `index.server.ts` — exports server-only code (server actions, use-cases)

Features currently missing public APIs: `auth`, `dashboard`, `game-search`, `journal`, `library`, `manage-library-entry`, `profile`.

All `app/` page files must be updated to import from barrel exports instead of internal paths.

  **Acceptance Criteria:**
  - [x] All 14 features have `index.ts` and `index.server.ts` (where applicable — game-search and whats-new are client-only)
  - [x] No wildcard re-exports (`export * from`) — all exports are explicit named exports
  - [x] All `app/` page and layout files import from feature barrel exports, not internal segment paths
  - [x] Application builds and runs without errors
  - [x] No server code is pulled into client bundles (build passes)

### Requirement 5: Add CLAUDE.md to All Feature and Widget Slices

Every feature and widget slice must have a short CLAUDE.md documenting: what this slice is for + anything non-obvious. Keep it under 20 lines.

  **Acceptance Criteria:**
  - [x] All 14 features have a CLAUDE.md file
  - [x] All widget slices have a CLAUDE.md file (game-card + header)
  - [x] Each CLAUDE.md states the slice's purpose and any non-obvious context
  - [x] Layer-level CLAUDE.md files (`features/CLAUDE.md`, `shared/CLAUDE.md`) are updated to reflect the new structure

### Requirement 6: Update Cross-Feature Import Documentation

The `features/CLAUDE.md` authorized imports table must be updated to reflect all changes:
- Add `command-palette` as a new feature with its authorized imports
- Update any imports that changed due to relocations
- Add `widgets/` layer to the import hierarchy documentation

  **Acceptance Criteria:**
  - [x] `features/CLAUDE.md` cross-feature import table is accurate and complete
  - [x] New `widgets/CLAUDE.md` documents the layer's purpose and import rules
  - [x] No undocumented cross-feature imports exist

---

## 3. Scope and Boundaries

### In-Scope

- Relocating all 5 upward import violations
- Introducing `widgets/` layer with GameCard as first widget
- Migrating ~25 domain-specific files from `shared/` to owning features
- Adding split barrel files (`index.ts` + `index.server.ts`) to all features
- Adding CLAUDE.md to all feature and widget slices
- Updating all consumer imports in `app/`
- Updating `features/CLAUDE.md` and `shared/CLAUDE.md` documentation
- Domain-agnostic enums remain in `shared/types/`

### Out-of-Scope

- **Steam Library Integration (Stage 2-4)** — separate roadmap item
- **PlayStation Trophy Integration** — separate roadmap item
- **Xbox Game Pass Integration** — separate roadmap item
- **Discovery & Exploration** — separate roadmap item
- **Curated Collections** — separate roadmap item
- **Community & Social Features (Phase 3)** — separate roadmap item
- **Code Health Round 2 non-FSD items** — root CLAUDE.md creation, dev server instructions, repository bypass fixes, .gitignore additions, dead link fixes, Makefile creation
- **Introducing an `entities/` layer** — could be revisited later but not in this spec
- **Migrating Header/MobileNav to widgets/** — evaluate after GameCard migration
- **ESLint rule enforcement for import direction** — desirable but separate tooling concern
- **data-access-layer internal restructuring** — out of scope for this spec
