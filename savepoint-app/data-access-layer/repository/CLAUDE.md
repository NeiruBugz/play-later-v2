# Repository Layer

The only layer that directly interacts with Prisma and the database. Provides clean abstractions over Prisma operations organized by domain.

## Architectural Rules

- **Only services can import repositories** (never handlers, features, or app routes)
- Repository functions contain NO business logic — only data access
- Import `prisma` from `@/shared/lib/db` and types from `@prisma/client`
- Always scope user data queries by `userId`

## Naming Conventions

| Operation | Prefix | Example |
|-----------|--------|---------|
| Find single/multiple (may miss) | `find` | `findGameById`, `findLibraryItemsByUserId` |
| Find single (must exist) | `require` | `requireUserById` (throws `NotFoundError` if missing) |
| Create | `create` | `createGame` |
| Update | `update` | `updateLibraryItem` |
| Delete | `delete` | `deleteLibraryItem` |
| Check existence | `exists` | `gameExists` |
| Count | `count` | `countLibraryItems` |
| Upsert | `upsert` | `upsertGame` |

## Return Contracts

The signature alone tells the caller what to expect. Pick the contract per operation:

| Operation | Return | Empty / missing means |
|---|---|---|
| Identity lookup that may miss | `Promise<T \| null>` | `null` is a valid result |
| Identity lookup that must exist | `Promise<T>`, throws `NotFoundError` | The operation cannot proceed without the row |
| Filtered / list query | `Promise<T[]>` | `[]` is a valid result; never throws on empty |
| Aggregate / count | `Promise<number>` (or other primitive) | `0` is a valid result |
| Modification on identified entity | `Promise<T>`, throws `NotFoundError` if target missing | The operation cannot proceed without the row |

Empty filtered/list results and empty unfiltered/list results are both valid data — neither throws. Only "missing identity that the operation depends on" is an error.

## Prisma Error Translation

Inline per-operation. Each repository function catches the Prisma codes it might encounter and re-throws a typed error with operation-specific context:

| Prisma code | Typed error | Notes |
|---|---|---|
| `P2025` (record not found on update/delete) | `NotFoundError` | Include the entity id in `context` |
| `P2002` (unique-constraint violation) | `ConflictError` | Include the colliding fields in `context` |
| Other unknown codes | re-throw as-is | The service or edge handles unknowns |

There is no global `wrapPrisma` helper — operation-specific messages and `context` matter, and centralizing produces lossy fallbacks.

## Security: Restrictive Default Selects

For sensitive entities (User), define `DEFAULT_USER_SELECT` that explicitly excludes password/tokens. See `user-repository.ts` for the pattern.

## Existing Repositories

| Repository | Purpose |
|------------|---------|
| `game-repository` | Game CRUD, search, Steam/IGDB lookups |
| `library-repository` | Library items, status management |
| `journal-repository` | Journal entries |
| `user-repository` | User profiles, settings, Steam connection |
| `platform-repository` | Gaming platforms |
| `genre-repository` | Game genres |
| `imported-game-repository` | Imported games from Steam |
| `follow-repository` | Follow / unfollow |
| `activity-feed-repository` | Activity feed query helpers |

## Testing

- Integration tests only (`.integration.test.ts`) against real PostgreSQL via Docker
- Run with: `pnpm test --project=integration`
- Tests use isolated database; `beforeEach` cleans relevant tables
- Assert returned values directly; assert typed throws via `await expect(...).rejects.toThrow(NotFoundError|ConflictError|...)`
- Import typed-error classes from `@/shared/lib/errors`, never from other paths (class identity matters — `instanceof` compares prototype chains)
- All repositories are exported from `repository/index.ts`
