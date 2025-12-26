# Tasks: Status Simplification

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Technical Specification:** [technical-considerations.md](./technical-considerations.md)
- **Status:** Ready for Implementation

---

## Slice 1: Update domain enum and central configuration (foundation)
*After this slice: App compiles with new statuses, but UI still references old ones via config.*

- [ ] **Sub-task 1.1:** Update `LibraryItemStatus` enum in `data-access-layer/domain/library/enums.ts` to 4 new values. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 1.2:** Update `LIBRARY_STATUS_CONFIG` in `shared/lib/library-status.ts` with new 4 statuses (labels, descriptions, icons, badgeVariants, ariaLabels). Add `getStatusConfig()`, `getStatusLabel()`, `getStatusIcon()`, `getStatusVariant()` helpers. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 1.3:** Update CSS theme variables in `shared/globals.css` — replace 6 status colors with 4 new ones (`wantToPlay`, `owned`, `playing`, `played`). **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 1.4:** Update Badge component variants in `shared/components/ui/badge.tsx` to use new 4 variants. **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 1.5:** Update test fixtures in `test/fixtures/enum-test-cases.ts` with new status values. **[Agent: testing-expert]**

---

## Slice 2: Update Prisma schema and create migration
*After this slice: Database supports new statuses, existing data migrated, app runs with new schema.*

- [ ] **Sub-task 2.1:** Update `LibraryItemStatus` enum in `prisma/schema.prisma` to 4 new values, change default to `PLAYED`. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 2.2:** Create Prisma migration with raw SQL to: add new enum values, transform existing data, update default. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 2.3:** Write migration integration test to verify data transformation correctness. **[Agent: testing-expert]**

---

## Slice 3: Update repository layer
*After this slice: All repository queries work with new statuses.*

- [ ] **Sub-task 3.1:** Update `getRecentlyCompletedLibraryItems` to filter by `PLAYED`. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 3.2:** Rename and update `getWishlistedItemsByUsername` → `getWantToPlayItemsByUsername`, filter by `WANT_TO_PLAY`. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 3.3:** Rename and update `findWishlistItemsForUser` → `findWantToPlayItemsForUser`, filter by `WANT_TO_PLAY`. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 3.4:** Rename and update `findUpcomingWishlistItems` → `findUpcomingWantToPlayItems`, filter by `WANT_TO_PLAY`. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 3.5:** Update `findCurrentlyPlayingGames` to filter by `PLAYING`. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 3.6:** Update `getLibraryStatsByUserId` to filter by `PLAYING` and return counts for 4 statuses. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 3.7:** Update repository integration tests to use new status values and verify renamed functions. **[Agent: testing-expert]**

---

## Slice 4: Update service layer
*After this slice: Business logic supports all status transitions.*

- [ ] **Sub-task 4.1:** Update `validateStatusTransition` in `LibraryService` to allow all transitions (remove WISHLIST restriction). **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 4.2:** Update service unit tests to verify all 12 status transitions are allowed. **[Agent: testing-expert]**

---

## Slice 5: Update feature schemas and server actions
*After this slice: All mutations work with new statuses.*

- [ ] **Sub-task 5.1:** Update Zod schemas in `features/manage-library-entry/schemas.ts` (automatic via enum change, verify). **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 5.2:** Update any hardcoded status references in server actions. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 5.3:** Update server action tests to use new status values. **[Agent: testing-expert]**

---

## Slice 6: Update status selection UI components
*After this slice: Users can select from 4 statuses in modal and forms.*

- [ ] **Sub-task 6.1:** Refactor `StatusChipGroup` to use `LIBRARY_STATUS_CONFIG` (should work automatically with new config). **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 6.2:** Refactor `StatusSelect` to use `LIBRARY_STATUS_CONFIG`. **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 6.3:** Update `StatusChipGroup` component tests for 4 statuses. **[Agent: testing-expert]**
- [ ] **Sub-task 6.4:** Update `StatusSelect` component tests for 4 statuses. **[Agent: testing-expert]**

---

## Slice 7: Update quick action buttons (game detail page)
*After this slice: Game detail page shows 4 status buttons in 2x2 grid.*

- [ ] **Sub-task 7.1:** Refactor `QuickActionButtons` to use `LIBRARY_STATUS_CONFIG` and render 2x2 grid. Remove hardcoded `STATUS_CONFIG` and `STATUS_ORDER`. **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 7.2:** Update `LibraryStatusDisplay` to use `getStatusConfig()` for icon. Remove hardcoded `STATUS_ICONS`. **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 7.3:** Update `QuickActionButtons` component tests for 4 statuses. **[Agent: testing-expert]**

---

## Slice 8: Update library filters
*After this slice: Library page filters show 4 statuses.*

- [ ] **Sub-task 8.1:** Refactor `LibraryFilters` to derive styles from `LIBRARY_STATUS_CONFIG.badgeVariant`. Remove hardcoded `STATUS_FILTER_STYLES`. **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 8.2:** Update `LibraryFilters` component tests for 4 statuses + "All Statuses". **[Agent: testing-expert]**

---

## Slice 9: Update library card components
*After this slice: Library cards show 4 status options.*

- [ ] **Sub-task 9.1:** Refactor `LibraryCardQuickActions` to use `LIBRARY_STATUS_CONFIG`. **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 9.2:** Refactor `LibraryCardActionBar` to use `LIBRARY_STATUS_CONFIG`. **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 9.3:** Refactor `LibraryCardInteractiveBadge` to use `LIBRARY_STATUS_CONFIG`. **[Agent: nextjs-ui-expert]**

---

## Slice 10: Update dashboard stats
*After this slice: Dashboard shows stats for 4 statuses.*

- [ ] **Sub-task 10.1:** Update `DashboardStatsServer` to fetch counts for 4 statuses instead of 6. **[Agent: nextjs-ui-expert]**
- [ ] **Sub-task 10.2:** Update `DashboardStatsCards` to display 4 status cards. **[Agent: nextjs-ui-expert]**

---

## Slice 11: Cleanup and final verification
*After this slice: No references to old statuses remain, all tests pass.*

- [ ] **Sub-task 11.1:** Delete `LibraryStatusMapper` from `shared/lib/ui/enum-mappers.ts`. **[Agent: nextjs-backend-expert]**
- [ ] **Sub-task 11.2:** Grep codebase for old enum values (`WISHLIST`, `CURIOUS_ABOUT`, `CURRENTLY_EXPLORING`, `REVISITING`, `TOOK_A_BREAK`, `EXPERIENCED`) and fix any remaining references. **[Agent: general-purpose]**
- [ ] **Sub-task 11.3:** Run full test suite (`pnpm test`) and verify all pass. **[Agent: testing-expert]**
- [ ] **Sub-task 11.4:** Run type check (`pnpm typecheck`) and verify no errors. **[Agent: general-purpose]**
- [ ] **Sub-task 11.5:** Run lint (`pnpm lint`) and verify no errors. **[Agent: general-purpose]**
