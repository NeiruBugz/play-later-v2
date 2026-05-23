# Layer survey: features/

## Feature inventory

| Feature | Server fns exposed | Worker split | UI components | Tests |
| --- | --- | --- | --- | --- |
| `add-game` | `addGameToLibraryFn` | N | `AddGameTrigger`, `AddGameModal`, `AddFromGameDetailButton` | Y |
| `auth-cognito-sign-in` | (authClient) | n/a | `CognitoSignInButton` | Y |
| `auth-email-sign-in` | `getEmailSignInEnabledFn` | N | `EmailSignInForm` | Y |
| `auth-sign-out` | (authClient) | n/a | `LogoutButton` (unused) | Y |
| `browse-related-games` | `getRelatedGamesFn` | **Y** | `RelatedGamesInfiniteList` | Y |
| `edit-profile` | `updateProfileFn`, `checkUsernameFn` | **Y** | `EditProfileForm` | Y |
| `filter-library` | (URL params only) | n/a | `LibraryFilters`, `MobileFilterBar` | Y |
| `game-detail` | `getGameDetailPageDataFn` | N | `TimesToBeatSection` | Y |
| `library-list` | `getLibraryItemsFn` | N | `LibraryList`, `LibraryEmptyState` | **N** |
| `manage-library-entry` | `updateLibraryItemFn`, `deleteLibraryItemFn`, `ManageFromGameDetailButton` | N | `LibraryModal`, `LibraryCardMenu` | Y |
| `profile-overview` | `getProfilePageDataFn`, `getPublicProfilePageDataFn` | N | `ProfileOverview`, `ProfileHeader`, `ProfileStats` | Y |
| `search-games` | `searchGamesFn` | N | `SearchInput`, `SearchResults` | **N** |
| `toggle-theme` | (client-only) | n/a | `ThemeToggle` | Y |
| `upload-avatar` | `getAvatarUploadUrlFn`, `setAvatarUrlFn` | **Y** (both) | `AvatarUpload` | Y |

Counts: 14 features, 20 server fns, 4 use worker-split.

## Dominant patterns (from code)

### api/

- `createServerFn` → `.inputValidator()` → `.handler()` shape: 20/20.
- Validate-twice: 18/20 (2 no-input handlers exempt).
- Auth: 23 × `requireUserId()`, 5 × `getServerUserId()` direct (documented exceptions).
- `.server.ts` discipline: 100% — zero feature `createServerFn` files use the suffix (foot-gun #1).
- Worker-split: 4 features.

### model/, ui/, tests

- Zod schemas + TS types; inputs validated at feature boundary.
- One-folder-per-component + barrel: 100%.
- Mutation surfaces in features; pure display in entities.
- `useServerFn` only of own feature's fns.
- elements/actions/given-when-then convention.
- Worker-split integration tests call worker directly (foot-gun #8 mitigation).

## Drifts

1. **Cross-feature import (HIGH).** `features/game-detail/api/get-game-detail-page-data.ts` imports `getRelatedGames` from `@/features/browse-related-games`. Direct FSD violation; lift to entities or document.
2. **Missing feature barrels (MEDIUM).** 8 features lack a top-level `index.ts`.
3. **Inconsistent submodule naming (LOW).** `filter-library/lib/` vs `edit-profile/model/`.
4. **`library-list` and `search-games` lack UI tests (MEDIUM).**
5. **`LogoutButton` unused but kept (INFO).** Documented in DIVERGENCES.md.

## Proposed rules

### Server fns

- Rule: `features/<name>/api/<fn-name>.ts` (NO `.server` suffix); `createServerFn(...).inputValidator(...).handler(...)` shape.
- Rule: authed handlers use `requireUserId()` only.
- Rule: validate twice (inputValidator + re-parse in handler).
- Rule: feature server fns may compose entity queries; MUST NOT import sibling features.

### Workers

- Rule: non-trivial handlers export `<fn-name>.worker.ts` (plain async, `userId | undefined` arg); wrapper delegates.
- Rule: worker throws `UnauthorizedError` on undefined userId (owns its own gate).
- Rule: worker colocated with its wrapper in `api/`.

### UI

- Rule: feature UI in `features/<name>/ui/<component>/` (one-folder-per-component).
- Rule: feature UI invokes only its own server fns via `useServerFn`.
- Rule: mutation surfaces in features; pure display in entities.

### Imports/reuse

- Rule: no sibling-to-sibling feature imports. Lift to entities/shared.
- Rule: every feature exposes `features/<name>/index.ts` (consumer-facing surface only).
- Rule: submodules — `model/` for schemas/types, `lib/` for pure helpers, `api/` for server fns + workers, `ui/` for components.

### Tests

- Rule: every feature has a colocated UI test (elements/actions/given-when-then).
- Rule: worker-split integration tests import worker, not wrapper.

## README accuracy

Documents structure but doesn't pin the worker-split pattern, enforce per-feature barrels (8 missing), or describe cross-feature exceptions. Recommend a rewrite codifying these rules + FOOT-GUNS.md link.
