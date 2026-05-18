# Layer survey: entities/

## Entity inventory

| Entity | Queries (api/) | Models (model/) | UI (ui/) | Throws |
| --- | --- | --- | --- | --- |
| `game` | `getGameDetails`, `getGameBySlug`, `getGameByIgdbId`, `upsertGameFromIgdb`, `upsertGameFromIgdbPayload`, `getGameCollectionsByIgdbId`, `getTimesToBeat` | `Game` types, IGDB + collection schemas | `GameCover`, `GameMetadata` | `NotFoundError`, `UpstreamError` |
| `journal-entry` | `getRecentJournalEntries` | `JournalEntry` types, `JOURNAL_TEASER_LIMIT` | `JournalTeaser` | `NotFoundError` |
| `library-item` | `getLibraryItems`, `getLibraryItemBySlug`, `getLibraryStats`, `addGameToLibrary`, `updateLibraryItem`, `deleteLibraryItem` | `LibraryItem` types, status taxonomy, `getStatusLabel` | `LibraryStatusBadge`, `LibraryStatusStrip` | `NotFoundError`, `ConflictError`, `ValidationError` |
| `profile` | `getProfileById`, `getPublicProfile`, `getProfileSettings`, `updateProfile`, `getUsernameAvailability` | `Profile` types, username constants | `ProfileHeader`, `ProfileStats`, `AvatarFallback` | `NotFoundError`, `ConflictError`, `ValidationError` |
| `session` | `getServerUserId`, `requireUserId`, `requireUserIdOrRedirectFn`, `getCurrentUserIdFn` | (none) | (none) | `UnauthorizedError` |

Total: 19 entity queries, 4 `createServerFn` wrappers (session only — drift #1).

## Dominant patterns (from code)

- `.server.ts` discipline 100% (13/13 Prisma queries suffixed; 4 session `createServerFn` wrappers correctly NOT suffixed).
- Single enforcement seam (P2002 + P2025 mapped exactly once per constraint; `error.meta?.target` scoped narrowly).
- Privacy invariants entity-owned (`getPublicProfile` throws `NotFoundError` for both missing AND denied).
- UX-hint queries clearly marked (`getUsernameAvailability` docstring states non-enforcement intent).
- Two-step ownership checks (`findUnique` + `if (row.userId !== userId) throw NotFoundError`).
- No sibling entity imports; cross-entity duplication intentional (`addGameToLibrary` inlined upsert).
- UI display-only (zero mutations, no `useServerFn`).
- TS-first types in `model/` (Prisma owns shape; Zod only for input validation + genuine schema metadata).

## Drifts

1. **`session/api/*.ts` contains `createServerFn` wrappers (MEDIUM).** Documented exception per CONTEXT.md ("session is access ticket, not domain entity"). Add a one-line pointer in `entities/README.md`.
2. **`library-item/model/status.ts:77` raw `throw new Error` (LOW).** Defensive invariant; acceptable.
3. **Hand-rolled TS types in `model/` (LOW).** Correct per TS-first pattern; README doesn't document the choice.
4. **`addGameToLibrary` inlines game-cache logic (LOW).** Intentional FSD trade-off, documented in DIVERGENCES.md.
5. **No `entities/<noun>/index.ts` barrels (LOW).** Server-side imports don't care, but inconsistent.

## Proposed rules

### api/

- Rule: every Prisma-calling query ends in `.server.ts`.
- Rule: every query throws an `AppError` subclass; raw `throw new Error` reserved for defensive invariants.
- Rule: Prisma error mapping at entity layer, scoped via `error.meta?.target`; each constraint mapped exactly once.
- Rule: privacy invariants throw `NotFoundError` for both missing AND denied.
- Rule: UX-hint queries carry a non-enforcement docstring.
- Rule: no specialized subset queries.
- Rule: ownership checks are two-step (findUnique + manual compare → NotFoundError).
- Rule: query functions are async even when not awaiting.

### model/

- Rule: domain types TS-first (`type X = Prisma.<X>WithRelations`); Zod for input validation or genuine schema metadata only.
- Rule: status taxonomies live with their label-resolver.

### ui/

- Rule: entity UI is display-only (no mutations, no `useServerFn`).
- Rule: entity UI in `entities/<noun>/ui/<component>/`.

### ID validation

- Rule: never `z.string().cuid()` for user IDs. Use `z.string().min(1)`. Why: Better Auth nanoids.

### Session exception

- Rule: `entities/session/api/*.ts` may contain `createServerFn` wrappers (no `.server.ts`). Documented exception.

## README accuracy

Accurate on structure; missing `.server.ts` requirement, privacy-invariant pattern, UX-hint distinction, TS-first philosophy, session exception. Recommend ~15-20 LOC extension.
