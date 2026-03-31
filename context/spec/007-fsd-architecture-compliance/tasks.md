# Tasks: FSD Architecture Compliance

- **Spec:** [functional-spec.md](functional-spec.md) | [technical-considerations.md](technical-considerations.md)
- **Status:** Ready

---

- [x] **Slice 1: ESLint Boundaries + Dead Code Cleanup**
  - [x] Add `widget` element type (`widgets/**/*`, mode `file`) to `eslint.config.mjs` **[Agent: nextjs-fullstack]**
  - [x] Update ESLint boundary import rules: `app-route` and `ui-component` can import `widget`; `widget` can import `shared` only **[Agent: nextjs-fullstack]**
  - [x] Delete dead code: `shared/lib/game/` directory (`get-game-url.ts`, `is-external-game.ts`, `index.ts`) **[Agent: nextjs-fullstack]**
  - [x] Remove dead re-exports from `shared/lib/index.ts` **[Agent: nextjs-fullstack]**
  - [x] Verify: `pnpm lint` passes; `shared/lib/game/` does not exist **[Agent: nextjs-fullstack]**

- [x] **Slice 2: Domain Types Migration (REQ 3a)**
  - [x] Extract `LibraryItemDomain`, `LibraryItemWithGameDomain` from `shared/types/library.ts` → `features/library/types.ts` **[Agent: nextjs-fullstack]**
  - [x] Extract `JournalEntry` composed type from `shared/types/journal.ts` → `features/journal/types.ts` **[Agent: nextjs-fullstack]**
  - [x] Extract `ProfileWithStats`, `UpdateProfileFormState` from `shared/types/profile.ts` → `features/profile/types.ts` **[Agent: nextjs-fullstack]**
  - [x] Extract `TimesToBeatData` from `shared/types/game.ts` → `features/game-detail/types.ts` **[Agent: nextjs-fullstack]**
  - [x] Update all consumer imports across the codebase **[Agent: nextjs-fullstack]**
  - [x] Verify: `pnpm build` passes; `pnpm lint` passes; `pnpm test` passes **[Agent: nextjs-fullstack]**

- [x] **Slice 3: Domain Business Logic Migration (REQ 3b)**
  - [x] Move `shared/lib/profile/` (validation, profanity, schemas, constants) → `features/profile/lib/` **[Agent: nextjs-fullstack]**
  - [x] Update all consumer imports **[Agent: nextjs-fullstack]**
  - [x] Verify: `pnpm build` passes; `pnpm test` passes **[Agent: nextjs-fullstack]**

- [x] **Slice 4: Command Palette → `features/command-palette/` (REQ 1a)**
  - [x] Create `features/command-palette/` with `ui/`, `server-actions/` segments **[Agent: nextjs-fullstack]**
  - [x] Move all component files from `shared/components/command-palette/` → `features/command-palette/ui/` **[Agent: nextjs-fullstack]**
  - [x] Move `shared/components/command-palette/actions/get-recent-games.ts` → `features/command-palette/server-actions/` **[Agent: nextjs-fullstack]**
  - [x] Update consumers: `app/(protected)/layout.tsx`, `app/games/layout.tsx` **[Agent: nextjs-fullstack]**
  - [x] **Decision point:** Header + MobileNav moved to `widgets/header/` to avoid shared → features violation. ESLint widget rules updated to allow feature imports. **[Agent: nextjs-fullstack]**
  - [x] Delete `shared/components/command-palette/` **[Agent: nextjs-fullstack]**
  - [x] Verify: `pnpm build` passes; `pnpm lint` passes; command palette opens on desktop + mobile **[Agent: nextjs-fullstack]**

- [x] **Slice 5: GameCard → `widgets/game-card/` (REQ 2a, 2b)**
  - [x] Create `widgets/game-card/` with `ui/`, `lib/` segments **[Agent: nextjs-fullstack]**
  - [x] Move all `shared/components/game-card/*.tsx` → `widgets/game-card/ui/` **[Agent: nextjs-fullstack]**
  - [x] Move `*.types.ts` → `widgets/game-card/ui/`, `*.variants.ts` → `widgets/game-card/lib/` **[Agent: nextjs-fullstack]**
  - [x] Move `shared/components/genre-badges.tsx` → `widgets/game-card/ui/` **[Agent: nextjs-fullstack]**
  - [x] Keep `platform-badges.tsx` and `game-cover-image.tsx` in `shared/` (used independently) **[Agent: nextjs-fullstack]**
  - [x] Update consumers: journal, game-search, browse-related-games, `app/games/[slug]` **[Agent: nextjs-fullstack]**
  - [x] Create `widgets/game-card/index.ts` barrel file **[Agent: nextjs-fullstack]**
  - [x] Delete `shared/components/game-card/` **[Agent: nextjs-fullstack]**
  - [x] Create `widgets/CLAUDE.md` documenting layer purpose and import rules **[Agent: nextjs-fullstack]**
  - [x] Verify: `pnpm build` passes; `pnpm lint` passes; GameCard renders in library, dashboard, search results **[Agent: nextjs-fullstack]**

- [x] **Slice 6: Profile Server Actions + Domain Components/Hooks (REQ 1b, 3c, 3d)**
  - [x] Move `shared/server-actions/profile/check-username-availability.ts` → `features/profile/server-actions/` **[Agent: nextjs-fullstack]**
  - [x] Move `shared/server-actions/profile/upload-avatar.ts` → `features/profile/server-actions/` **[Agent: nextjs-fullstack]**
  - [x] Move associated integration tests to `features/profile/server-actions/` **[Agent: nextjs-fullstack]**
  - [x] **Decision: (a) moved profile UI to `features/profile/ui/`** — avatar-upload, username-input, and use-username-validation all moved to features/profile/ **[Agent: nextjs-fullstack]**
  - [x] Move `shared/hooks/use-username-validation.ts` → `features/profile/hooks/` **[Agent: nextjs-fullstack]**
  - [x] Move `shared/hooks/game/use-get-platforms.ts` → `features/manage-library-entry/hooks/` **[Agent: nextjs-fullstack]**
  - [x] Update all consumer imports and test mock paths **[Agent: nextjs-fullstack]**
  - [x] Delete emptied directories in `shared/server-actions/`, `shared/components/profile/`, `shared/hooks/game/` **[Agent: nextjs-fullstack]**
  - [x] Verify: `pnpm build` passes; `pnpm test` passes; username check and avatar upload work correctly **[Agent: nextjs-fullstack]**

- [x] **Slice 7: Public API Barrel Files for All Features (REQ 4)**
  - [x] Create `index.ts` (client-safe) + `index.server.ts` (server-only) for: `auth`, `dashboard`, `game-search`, `journal`, `library`, `manage-library-entry`, `profile`, `command-palette` **[Agent: nextjs-fullstack]**
  - [x] Audit existing barrels (`browse-related-games`, `game-detail`, `onboarding`, `setup-profile`, `steam-import`, `whats-new`) — remove wildcard exports, add `index.server.ts` if missing **[Agent: nextjs-fullstack]**
  - [x] Update all `app/` page and layout files to import from barrel exports instead of internal segment paths **[Agent: nextjs-fullstack]**
  - [x] Verify: `pnpm build` passes (server/client boundary); `pnpm lint` passes; no direct internal imports from `app/` into feature segments **[Agent: nextjs-fullstack]**

- [x] **Slice 8: CLAUDE.md Files + Documentation Updates (REQ 5, 6)**
  - [x] Create CLAUDE.md for all 13+ features (under 20 lines each: purpose + non-obvious context) **[Agent: general-purpose]**
  - [x] Create CLAUDE.md for `widgets/game-card/` **[Agent: general-purpose]**
  - [x] Update `features/CLAUDE.md` cross-feature import table: add `command-palette`, update relocated imports, add `widgets/` layer **[Agent: general-purpose]**
  - [x] Update `shared/CLAUDE.md` to reflect cleaned structure **[Agent: general-purpose]**
  - [x] Verify: every feature and widget dir has a CLAUDE.md; `features/CLAUDE.md` is accurate; no undocumented cross-feature imports **[Agent: general-purpose]**

- [x] **Slice 9: Final Validation**
  - [x] Run full `pnpm build && pnpm lint && pnpm test` — all pass **[Agent: nextjs-fullstack]**
  - [x] Verify zero upward imports: `grep -r "@/features/" savepoint-app/shared/` and `grep -r "@/data-access-layer/" savepoint-app/shared/` return zero matches **[Agent: nextjs-fullstack]**
  - [x] Verify all features have `index.ts` and `index.server.ts` barrel files **[Agent: nextjs-fullstack]**
  - [x] Verify `shared/` contains only domain-agnostic code **[Agent: nextjs-fullstack]**
  - [ ] Manual smoke test: command palette, game cards, profile settings, library filters **[Agent: nextjs-fullstack]**
