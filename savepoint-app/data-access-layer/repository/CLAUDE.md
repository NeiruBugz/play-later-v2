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
| Find single/multiple | `find` | `findGameById`, `findLibraryItemsByUserId` |
| Create | `create` | `createGame` |
| Update | `update` | `updateLibraryItem` |
| Delete | `delete` | `deleteLibraryItem` |
| Check existence | `exists` | `gameExists` |
| Count | `count` | `countLibraryItems` |
| Upsert | `upsert` | `upsertGame` |

## Not-Found Handling

Two patterns:

| Scenario | Pattern | Return |
|----------|---------|--------|
| Cache/display lookups (may miss) | Null in Success | `RepositoryResult<Game \| null>` — `repositorySuccess(game)` even if null |
| Modification/authorized access | NOT_FOUND Error | `repositoryError(RepositoryErrorCode.NOT_FOUND, "...")` |

**Rule of thumb**: Use NOT_FOUND error when the operation cannot proceed without the item (updates, deletes, ownership checks). Use null-in-success for pure lookups.

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

## Testing

- Integration tests only (`.integration.test.ts`) against real PostgreSQL via Docker
- Run with: `pnpm test --project=integration`
- Tests use isolated database; `beforeEach` cleans relevant tables
- All repositories are exported from `repository/index.ts`
