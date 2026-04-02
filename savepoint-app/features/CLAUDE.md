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
| `command-palette` | App-wide Cmd+K search palette | `widgets/header/`, `app/(protected)/layout.tsx`, `app/games/layout.tsx` |
| `game-search` | Search hooks reused by command palette | `command-palette/ui/` |
| `social` | Follow system, activity feed, public profile interactions | `profile/ui/`, `app/(protected)/dashboard/page.tsx`, `app/u/[username]/` |

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

## Key Patterns

- **Form submissions**: Server actions with Zod validation via `authorizedActionClient`
- **Optimistic updates**: TanStack Query `useMutation` with `onMutate`/`onError` rollback
- **Infinite scroll**: TanStack Query `useInfiniteQuery`
- **Error handling in hooks**: Message-based pattern matching with `ErrorHandler[]` arrays
- **Cache invalidation**: Server actions use `revalidatePath()`, hooks use `queryClient.invalidateQueries()`
- **Exports**: Each feature exports its public API via `index.ts` barrel file
