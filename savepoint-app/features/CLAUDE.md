# Features Layer

User-facing functionality organized by business domain. Each feature co-locates UI, server actions, hooks, use-cases, schemas, and types.

## Architectural Rules

**Import hierarchy** (features can only import from lower layers):
- `shared/` -- reusable utilities, UI primitives, types
- `data-access-layer/services` -- cross-domain data access
- Features must NOT import from `data-access-layer/repository` directly
- Features must NOT import from `widgets/` or `app/`

**Features CANNOT import from other features** except documented exceptions below.

### Cross-Feature Import Exceptions

These features are authorized for cross-feature imports. Only import from their public API (barrel exports).

| Feature | Rationale | Authorized Consumers |
|---------|-----------|---------------------|
| `manage-library-entry` | Shared UI library for library operations (modal, forms, status controls) | `game-detail/ui/`, `library/ui/`, `game-search/ui/`, `game-search/hooks/` |
| `onboarding` | Getting-started components for new users | `app/(protected)/dashboard/page.tsx` |
| `journal` | Journal entries displayed alongside game info | `game-detail/ui/`, `app/(protected)/dashboard/page.tsx` |
| `library` | Library display components (LibraryCard) on dashboard | `app/(protected)/dashboard/page.tsx` |
| `whats-new` | App-wide announcement modal | `app/(protected)/layout.tsx` |
| `profile` | Profile UI components (AvatarUpload, UsernameInput) and server actions | `setup-profile/ui/` |
| `command-palette` | App-wide Cmd+K search palette | `widgets/sidebar/`, `widgets/mobile-topbar/`, `app/(protected)/layout.tsx`, `app/games/layout.tsx`, `app/u/[username]/layout.tsx`, `onboarding/ui/` |
| `game-search` | Search hooks reused by command palette | `command-palette/ui/` |
| `social` | Follow system, activity feed, public profile interactions | `profile/ui/`, `app/(protected)/dashboard/page.tsx`, `app/u/[username]/` |

`profile → social` is authorized: `profile/ui/profile-header` consumes `FollowButton` from `social`'s public API.

**Rules for all exceptions:**
1. Only import from the feature's public API (barrel exports)
2. Do not create new cross-feature dependencies without documenting here
3. If more features need cross-feature imports, consider moving to `shared/`

## Use-Cases

Create a use-case when a feature needs to orchestrate multiple services. Use-cases live in `features/[name]/use-cases/`. See existing examples in `game-detail/use-cases/` and `manage-library-entry/use-cases/`.

## Server Actions

All mutations use `next-safe-action` with `authorizedActionClient`. Pattern: Zod schema + `.action()` handler. See existing examples in any feature's `server-actions/` directory.

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Feature directory | kebab-case | `manage-library-entry/` |
| Component files | kebab-case | `add-entry-form.tsx` |
| Component names | PascalCase | `AddEntryForm` |
| Hook files | `use-` prefix | `use-library-modal.ts` |
| Action files | `-action` suffix | `add-to-library-action.ts` |
| Type files | `.types.ts` suffix | `add-entry-form.types.ts` |
| Schema files | `schemas.ts` | `schemas.ts` |

## Testing

| Test Type | Location | Purpose |
|-----------|----------|---------|
| Unit tests | `use-cases/*.unit.test.ts` | Use-case logic |
| Component tests | `ui/*.test.tsx` | UI component behavior |
| Integration tests | `*.integration.test.ts` | Full flow with database |

## Trip-wires

Non-obvious gotchas that have caused real bugs. Read before editing features.

1. **`RepositoryResult.ok` vs `HandlerResult.success` vs `ServiceResult.success`** — three different result shapes. Repository functions discriminate on `.ok`; services and handlers discriminate on `.success`. Destructuring the wrong key returns `undefined`. See `data-access-layer/CLAUDE.md` for the full table.
2. **Some repository functions return plain objects, not `RepositoryResult`** — e.g. `updateUserProfile` in `data-access-layer/repository/user/user-repository.ts` returns the row directly. Always check the return type before assuming a Result wrapper.
3. **Features must NOT import from `data-access-layer/repository` directly** — go through services or use-cases.
4. **Cross-feature imports require an entry in the allowlist table above** — adding one without updating the table will fail review and confuse future agents.
5. **`auth` uses dual barrel exports**: `index.ts` for client modules, `index.server.ts` for server-only modules. Server-only code in the wrong barrel breaks builds with bundler errors that don't point to the real cause.
6. **`setup-profile` is a thin shim** — delegates to `profile`'s server actions. Don't reimplement profile logic there.
7. **Server actions use `next-safe-action` `authorizedActionClient`** — not raw `async` functions. Pattern: Zod schema → `.action()` handler.
8. **Use-cases compose multiple services**. A single-service call belongs in a hook or server action, not a use-case. Services may NOT call other services — that's what use-cases are for.

## Key Patterns

- **Form submissions**: Server actions with Zod validation via `authorizedActionClient`
- **Optimistic updates**: TanStack Query `useMutation` with `onMutate`/`onError` rollback
- **Infinite scroll**: TanStack Query `useInfiniteQuery`
- **Error handling in hooks**: Message-based pattern matching with `ErrorHandler[]` arrays
- **Cache invalidation**: Server actions use `revalidatePath()`, hooks use `queryClient.invalidateQueries()`
- **Exports**: Each feature exports its public API via `index.ts` barrel file

## Next.js 16 conventions

- `"use cache"` directive sits at the top of cached server functions / fetchers (e.g. `data-access-layer/handlers/igdb/igdb-handler.ts`, `data-access-layer/handlers/platform/get-platforms-handler.ts`, `features/game-detail/use-cases/get-game-details.ts`). These functions call `cacheLife`/`cacheTag` at runtime.
- `cacheComponents: true` is set in `savepoint-app/next.config.mjs`.
- View transitions adopted in spec 010 (commit 4f37dff) — see `context/spec/010-nextjs-16-feature-adoption/`.

## Recent spec lineage

- 007 — DAL FSD architecture compliance (`context/spec/007-fsd-architecture-compliance/`)
- 009 — unified profile view at `/u/[username]` (`context/spec/009-unified-profile-view/`)
- 010 — Next.js 16 feature adoption: `cacheComponents`, `use cache`, view transitions (`context/spec/010-nextjs-16-feature-adoption/`)
- 011 — star ratings + patient-gamer overhaul (`context/spec/011-star-ratings/`)
- 012 — UI/UX audit improvements, library card redesign, quick add (`context/spec/012-ui-ux-audit-improvements/`)
- 014 — UI/UX audit v2 + public profile shell (`context/spec/014-ui-ux-audit-v2-improvements/`)
