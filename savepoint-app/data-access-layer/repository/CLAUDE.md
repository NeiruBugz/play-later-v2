# Repository Layer

This directory contains the data access layer - the only layer that directly interacts with Prisma and the database.

## Purpose

The Repository Layer:
- Provides clean abstractions over Prisma operations
- Organizes data access by domain (game, library, user, etc.)
- Enforces data access patterns and security defaults
- Isolates database concerns from business logic

## Directory Structure

```
repository/
├── types.ts                # Shared repository types
├── index.ts                # Main export file
│
├── game/
│   ├── game-repository.ts
│   └── game-repository.integration.test.ts
│
├── library/
│   ├── library-repository.ts
│   ├── library-repository.integration.test.ts
│   └── types.ts
│
├── journal/
│   ├── journal-repository.ts
│   └── [test files]
│
├── platform/
│   ├── platform-repository.ts
│   └── types.ts
│
├── user/
│   ├── user-repository.ts
│   └── [test files]
│
└── genre/
    └── genre-repository.ts
```

## Architectural Rules

### What Belongs Here
- Direct Prisma queries and mutations
- Simple data transformations (if needed for Prisma)
- Query composition helpers

### What Does NOT Belong Here
- Business logic (belongs in services)
- Input validation (belongs in services/handlers)
- Error handling beyond Prisma errors
- External API calls (belongs in services)

## Import Rules

```typescript
// ✅ Repository can import
import { prisma } from "@/shared/lib/db";
import type { Game, LibraryItem } from "@prisma/client";

// ❌ Repository CANNOT import
import { SomeService } from "@/data-access-layer/services";  // Wrong direction
import { someHandler } from "@/data-access-layer/handlers";  // Wrong direction
```

**Only services can import repositories.**

## Creating Repository Functions

### Function Template

```typescript
// repository/[domain]/[domain]-repository.ts
import { prisma } from "@/shared/lib/db";
import type { Prisma } from "@prisma/client";

export async function findGameByIgdbId(
  igdbId: number
): Promise<Game | null> {
  return prisma.game.findUnique({
    where: { igdbId },
  });
}

export async function createGame(
  data: Prisma.GameCreateInput
): Promise<Game> {
  return prisma.game.create({ data });
}

export async function findGamesByIds(
  ids: string[]
): Promise<Game[]> {
  return prisma.game.findMany({
    where: { id: { in: ids } },
  });
}
```

### Naming Conventions

| Operation | Prefix | Example |
|-----------|--------|---------|
| Find single | `find` | `findGameById`, `findUserByEmail` |
| Find multiple | `find` | `findGamesByIds`, `findLibraryItemsByUserId` |
| Create | `create` | `createGame`, `createLibraryItem` |
| Update | `update` | `updateGame`, `updateLibraryItem` |
| Delete | `delete` | `deleteGame`, `deleteLibraryItem` |
| Check existence | `exists` | `gameExists`, `libraryItemExists` |
| Count | `count` | `countLibraryItems`, `countUserGames` |
| Upsert | `upsert` | `upsertGame`, `upsertPlatform` |

### Not-Found Handling

Repository functions follow two patterns for handling missing data:

**Pattern 1: Null in Success** - For pure lookups where "not found" is a valid result

```typescript
// Use when: Caller needs flexibility to handle "not found"
export async function findGameBySlug(slug: string): Promise<RepositoryResult<Game | null>> {
  const game = await prisma.game.findUnique({ where: { slug } });
  return repositorySuccess(game);  // Returns null if not found
}
```

**Pattern 2: NOT_FOUND Error** - For operations requiring existence or authorization

```typescript
// Use when: Operation cannot proceed without the item, or checking ownership
export async function findLibraryItemById(params: {
  libraryItemId: number;
  userId: string;  // Ownership check
}): Promise<RepositoryResult<LibraryItem>> {
  const item = await prisma.libraryItem.findFirst({
    where: { id: params.libraryItemId, userId: params.userId },
  });
  if (!item) {
    return repositoryError(RepositoryErrorCode.NOT_FOUND, "Library item not found");
  }
  return repositorySuccess(item);
}
```

**When to use each pattern:**

| Scenario | Pattern | Example |
|----------|---------|---------|
| Cache lookup (may miss) | Null in Success | `findGameByIgdbId` |
| Check before create | Null in Success | `findUserByEmail` |
| Get for display | Null in Success | `findGameBySlug` |
| Get for modification | NOT_FOUND Error | `findLibraryItemById` |
| Authorized access | NOT_FOUND Error | `findLibraryItemById` (with userId) |
| Delete operation | NOT_FOUND Error | `deleteLibraryItem` |
| Update operation | NOT_FOUND Error | `updateLibraryItem` |

## Security Patterns

### Restrictive Default Selects

For sensitive entities (like users), use restrictive defaults:

```typescript
// user-repository.ts
const DEFAULT_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  steamProfileURL: true,
  steamConnectedAt: true,
  // Explicitly exclude: password, tokens, etc.
} satisfies Prisma.UserSelect;

export async function findUserById(
  userId: string,
  options?: { select?: Prisma.UserSelect }
): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: options?.select ?? DEFAULT_USER_SELECT,
  });
}
```

### User Data Access

Always scope user data queries by userId:

```typescript
// ✅ Good: Scoped by userId
export async function findLibraryItemsByUserId(
  userId: string
): Promise<LibraryItem[]> {
  return prisma.libraryItem.findMany({
    where: { userId },
  });
}

// ❌ Bad: No user scope
export async function findAllLibraryItems(): Promise<LibraryItem[]> {
  return prisma.libraryItem.findMany();
}
```

## Testing Strategy

Repository tests are **integration tests** that run against a real database:

```typescript
// game-repository.integration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createGame, findGameByIgdbId } from "./game-repository";
import { prisma } from "@/shared/lib/db";

describe("game-repository", () => {
  beforeEach(async () => {
    await prisma.game.deleteMany();
  });

  it("should create and find a game", async () => {
    const created = await createGame({
      igdbId: 12345,
      name: "Test Game",
      slug: "test-game",
    });

    const found = await findGameByIgdbId(12345);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });
});
```

### Test File Naming
- Use `.integration.test.ts` suffix
- Tests run in the "integration" Vitest project
- Real PostgreSQL via Docker

## Common Patterns

### Include Related Data

```typescript
export async function findLibraryItemWithGame(
  itemId: string
): Promise<LibraryItemWithGame | null> {
  return prisma.libraryItem.findUnique({
    where: { id: itemId },
    include: {
      game: true,
      platform: true,
    },
  });
}
```

### Transactions

```typescript
export async function transferLibraryItem(
  fromUserId: string,
  toUserId: string,
  itemId: string
): Promise<LibraryItem> {
  return prisma.$transaction(async (tx) => {
    const item = await tx.libraryItem.findUnique({
      where: { id: itemId, userId: fromUserId },
    });

    if (!item) throw new Error("Item not found");

    return tx.libraryItem.update({
      where: { id: itemId },
      data: { userId: toUserId },
    });
  });
}
```

### Pagination

```typescript
export async function findLibraryItemsPaginated(
  userId: string,
  options: { skip?: number; take?: number }
): Promise<LibraryItem[]> {
  return prisma.libraryItem.findMany({
    where: { userId },
    skip: options.skip ?? 0,
    take: options.take ?? 20,
    orderBy: { createdAt: "desc" },
  });
}
```

## Existing Repositories

| Repository | Purpose |
|------------|---------|
| `game-repository` | Game CRUD, search, Steam/IGDB lookups |
| `library-repository` | Library items, status management |
| `journal-repository` | Journal entries |
| `user-repository` | User profiles, settings |
| `platform-repository` | Gaming platforms |
| `genre-repository` | Game genres |

## Exports

All repository functions are exported from `index.ts`:

```typescript
// index.ts
export * from "./game/game-repository";
export * from "./library/library-repository";
export * from "./journal/journal-repository";
export * from "./user/user-repository";
export * from "./platform/platform-repository";
export * from "./genre/genre-repository";
```

Import in services:

```typescript
import { findGameByIgdbId, createGame } from "@/data-access-layer/repository";
```
