# Tasks: Library Status Redesign — Shelf + Up Next Model

- **Spec:** [functional-spec.md](functional-spec.md) | [technical-considerations.md](technical-considerations.md)
- **Status:** Ready

---

- [ ] **Slice 1: Schema Migration + Domain Layer (Sequential — must complete first)**
  - [ ] Update Prisma enum: replace `WANT_TO_PLAY`/`OWNED` with `WISHLIST`/`SHELF`/`UP_NEXT`, add `hasBeenPlayed` boolean field, change default status to `SHELF` **[Agent: prisma-database]**
  - [ ] Create migration SQL that renames enum values (not drop/recreate) and backfills `hasBeenPlayed = true` for existing `PLAYED` items **[Agent: prisma-database]**
  - [ ] Apply migration and regenerate Prisma client **[Agent: prisma-database]**
  - [ ] Update domain enum in `data-access-layer/domain/library/enums.ts` to 5-status model **[Agent: nextjs-fullstack]**
  - [ ] Add `hasBeenPlayed: boolean` to `LibraryItemDomain` in `library-item.model.ts` **[Agent: nextjs-fullstack]**
  - [ ] Update `LibraryItemMapper.toDomain()` to map `hasBeenPlayed` field **[Agent: nextjs-fullstack]**
  - [ ] Update mapper unit tests with new enum values and `hasBeenPlayed` mapping **[Agent: testing]**
  - [ ] Verify: `pnpm vitest run data-access-layer/domain/library/library-item.mapper.unit.test.ts` passes **[Agent: testing]**

- [ ] **Slice 2: Repository + Service Layer (Sequential — depends on Slice 1)**
  - [ ] Rename `findWantToPlayItemsForUser` to `findUpNextItemsForUser` in `library-repository.ts`, update query to filter by `UP_NEXT` **[Agent: nextjs-fullstack]**
  - [ ] Update repository barrel export for renamed function **[Agent: nextjs-fullstack]**
  - [ ] Add `hasBeenPlayed` enforcement in `updateLibraryItem` service: set `true` when transitioning to `PLAYED`, never reset **[Agent: nextjs-fullstack]**
  - [ ] Update `startedAt`/`completedAt` handling for replay flows in service layer **[Agent: nextjs-fullstack]**
  - [ ] Rename `getRandomWantToPlayGame` to `getRandomUpNextGame` in `library-service.ts` **[Agent: nextjs-fullstack]**
  - [ ] Update repository `updateLibraryItem` signature to accept optional `hasBeenPlayed` field **[Agent: nextjs-fullstack]**
  - [ ] Write and run service unit tests for `hasBeenPlayed` enforcement (set on PLAYED transition, preserved on other transitions) **[Agent: testing]**
  - [ ] Verify: `pnpm vitest run data-access-layer/services/library/library-service.unit.test.ts` passes **[Agent: testing]**

- [ ] **Slice 3: Shared Config, CSS Variables, Badge Variants (Parallelizable after Slice 2)**
  - [ ] Replace `LIBRARY_STATUS_CONFIG` in `shared/lib/library-status.ts` with 5-status config in tab order: Up Next, Playing, Shelf, Played, Wishlist **[Agent: react-frontend]**
  - [ ] Update `StatusBadgeVariant` type to include `wishlist`, `shelf`, `upNext`, `playing`, `played` **[Agent: react-frontend]**
  - [ ] Add status CSS variables to `globals.css` for both light and dark mode (`--status-wishlist`, `--status-shelf`, `--status-upNext`, etc.) **[Agent: react-frontend]**
  - [ ] Update `badge.tsx` variants: replace `wantToPlay`/`owned` with new status variants **[Agent: react-frontend]**
  - [ ] Update `progress-ring.tsx`: `GameStatus` type, `statusColors`, `statusDefaults`, and `mapLibraryStatusToGameStatus` **[Agent: react-frontend]**
  - [ ] Update `profile/constants.ts`: `statusLabels` with new 5-status names **[Agent: react-frontend]**
  - [ ] Verify: `pnpm --filter savepoint typecheck` passes **[Agent: testing]**

- [ ] **Slice 4: Library UI — Filters, Cards, Action Bars (Parallelizable after Slice 2)**
  - [ ] Verify `library-filters.tsx` tab order is driven by `LIBRARY_STATUS_CONFIG` (auto-updated from Slice 3) **[Agent: react-frontend]**
  - [ ] Update `library-card.tsx`: add "Replay" badge when `status === UP_NEXT && hasBeenPlayed`, hide badge for Shelf and Wishlist **[Agent: react-frontend]**
  - [ ] Replace action bar in `library-card-action-bar.tsx` with curated per-status actions using `getActionsForStatus()` function **[Agent: react-frontend]**
  - [ ] Update `library-card-mobile-actions.tsx` with same curated per-status action pattern **[Agent: react-frontend]**
  - [ ] Update `use-update-library-status.ts` optimistic update to set `hasBeenPlayed: true` when targeting PLAYED **[Agent: react-frontend]**
  - [ ] Verify: `pnpm vitest run features/library/` passes **[Agent: testing]**

- [ ] **Slice 5: Manage Library Entry — Forms + Server Actions (Parallelizable after Slice 2)**
  - [ ] Update `entry-form.tsx` default status from `WANT_TO_PLAY` to `SHELF` **[Agent: nextjs-fullstack]**
  - [ ] Verify `update-library-status-action.ts` has no hardcoded old enum references **[Agent: nextjs-fullstack]**
  - [ ] Update `add-game-to-library.ts` use case: replace any `WANT_TO_PLAY`/`OWNED` references with `WISHLIST`/`SHELF` **[Agent: nextjs-fullstack]**
  - [ ] Update all manage-library-entry test files with new enum values and labels **[Agent: testing]**
  - [ ] Verify: `pnpm vitest run features/manage-library-entry/` passes **[Agent: testing]**

- [ ] **Slice 6: Steam Import (Parallelizable after Slice 2)**
  - [ ] Update `calculate-smart-status.ts`: `OWNED` → `SHELF`, keep `PLAYING`/`PLAYED` as-is **[Agent: nextjs-fullstack]**
  - [ ] Update `import-game-to-library.ts`: status map `want_to_play` → `WISHLIST`, `owned` → `SHELF`, set `hasBeenPlayed: true` when status is PLAYED **[Agent: nextjs-fullstack]**
  - [ ] Update smart status and import use-case unit tests with new enum values **[Agent: testing]**
  - [ ] Verify: `pnpm vitest run features/steam-import/` passes **[Agent: testing]**

- [ ] **Slice 7: Dashboard (Parallelizable after Slice 2)**
  - [ ] Update `dashboard-stats-cards.tsx`: `statusMap` with `WISHLIST`, `SHELF`, `UP_NEXT` entries **[Agent: react-frontend]**
  - [ ] Update `dashboard-stats.tsx`: replace old status references **[Agent: react-frontend]**
  - [ ] Update `get-random-want-to-play.ts`: call `getRandomUpNextGame` instead of `getRandomWantToPlayGame` **[Agent: nextjs-fullstack]**
  - [ ] Verify: dashboard components render without errors **[Agent: testing]**

- [ ] **Slice 8: Remaining Test Updates + Full Test Run (After Slices 3-7)**
  - [ ] Bulk update ~24 test files: `WANT_TO_PLAY` → `WISHLIST`, `OWNED` → `SHELF`, update labels and function name references **[Agent: testing]**
  - [ ] Run full test suite: `pnpm vitest run` — all tests must pass **[Agent: testing]**
  - [ ] Fix any remaining test failures from missed enum references **[Agent: testing]**

- [ ] **Slice 9: Type Check + Lint + Final Validation (Last)**
  - [ ] Run `pnpm --filter savepoint typecheck` — zero errors **[Agent: nextjs-fullstack]**
  - [ ] Run `pnpm --filter savepoint lint` — no new errors **[Agent: nextjs-fullstack]**
  - [ ] Start dev server and verify: 5 tabs in correct order, card actions per status, "Replay" badge, add game with 5 statuses, status transitions work end-to-end **[Agent: general-purpose]**
