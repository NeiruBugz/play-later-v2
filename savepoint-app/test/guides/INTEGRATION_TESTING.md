>[toc]
# Integration Testing Guide

## Philosophy: What to Test

Integration tests validate interactions between your repository layer and the actual PostgreSQL database. Unlike unit tests that mock Prisma, integration tests ensure your queries work correctly against real data.

### When to Write Integration Tests

**✅ DO write integration tests for:**
- Complex queries with joins, filters, or aggregations
- Multi-table operations and transactions
- Database constraints and unique indexes
- Edge cases involving null values or data types
- Repository functions with conditional logic based on data

**❌ DON'T write integration tests for:**
- Simple CRUD operations (e.g., `prisma.user.findUnique()`)
- Operations already covered by Prisma's own tests
- Business logic (test in service layer with mocked repositories)
- External API calls (use unit tests with mocks)

### Key Principles

1. **Test database behavior, not business logic** - Integration tests verify database interactions work correctly
2. **Use real data** - Factory functions create actual database records
3. **Isolate each test** - Reset database between tests to prevent interference
4. **Test edge cases** - Null values, unique constraint violations, cascading deletes
5. **Verify persistence** - Query database after operations to confirm changes

## Database Setup

Integration tests use a dedicated PostgreSQL database managed by Docker Compose.

### Docker Compose Configuration

The project's `docker-compose.yml` runs PostgreSQL on port **6432** (not the standard 5432):

```yaml
# From repository root
docker-compose up -d
```

**Connection details:**
- Host: `localhost:6432`
- Database: Generated dynamically per test suite (e.g., `test_abc123`)
- User: `postgres`
- Password: `postgres`

### Database Lifecycle

Integration tests follow a strict lifecycle to ensure isolation:

```typescript
import {
  setupDatabase,
  cleanupDatabase,
  resetTestDatabase,
} from "@/test/setup/database";

describe("UserRepository - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase(); // Create test database + run migrations
  });

  afterAll(async () => {
    await cleanupDatabase(); // Drop test database
  });

  beforeEach(async () => {
    await resetTestDatabase(); // Truncate all tables
  });

  // Your tests here
});
```

**What each function does:**

| Function | Purpose | When to Use |
|----------|---------|-------------|
| `setupDatabase()` | Creates unique test database, runs Prisma migrations | `beforeAll()` - Once per test suite |
| `cleanupDatabase()` | Drops test database, disconnects Prisma client | `afterAll()` - Once per test suite |
| `resetTestDatabase()` | Truncates all tables (keeps schema) | `beforeEach()` - Before every test |

### Mocking the Prisma Client

Integration tests must replace the application's Prisma client with the test database client:

```typescript
// At top of test file
vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    ...actual,
    get prisma() {
      return getTestDatabase(); // Returns test database client
    },
  };
});
```

**Why this works:**
- `@/shared/lib` exports the main Prisma client used by repositories
- We import the actual module but override only the `prisma` property
- `getTestDatabase()` returns the test database client initialized in `setupDatabase()`

## Factory Functions

Factory functions create test data with sensible defaults and automatic unique values.

### Available Factories

Located in `test/setup/db-factories/`:

```typescript
import {
  createUser,
  createGame,
  createLibraryItem,
  createReview,
  createJournalEntry,
} from "@/test/setup/db-factories";
```

### Basic Usage

**Create with defaults:**

```typescript
const user = await createUser();
// => { id: "cm...", email: "user-1234567890-abc123@example.com", ... }

const game = await createGame();
// => { id: "cm...", title: "Test Game 1234567890", slug: "test-game-1234567890-1", ... }
```

**Create with custom values:**

```typescript
const user = await createUser({
  username: "johndoe",
  usernameNormalized: "johndoe",
  email: "john@example.com",
  name: "John Doe",
});

const game = await createGame({
  title: "The Legend of Zelda",
  slug: "legend-of-zelda",
  igdbId: 12345,
});
```

**Create related records:**

```typescript
const user = await createUser();
const game = await createGame({ title: "Dark Souls" });

const libraryItem = await createLibraryItem({
  userId: user.id,
  gameId: game.id,
  status: "CURRENTLY_EXPLORING",
  platform: "PlayStation 5",
});

const review = await createReview({
  userId: user.id,
  gameId: game.id,
  rating: 9,
  content: "Masterpiece of game design",
});
```

### Factory Implementation Pattern

Factories use **timestamps + random suffixes** to ensure uniqueness across concurrent tests:

```typescript
// From test/setup/db-factories/user.ts
export const createUser = async (options: UserFactoryOptions = {}): Promise<User> => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  const username = options.username ?? `testuser${timestamp}${randomSuffix}`;

  const defaultData = {
    email: `user-${timestamp}-${randomSuffix}@example.com`,
    name: `Test User ${timestamp}`,
    username,
    usernameNormalized: options.usernameNormalized ?? username.toLowerCase(),
    ...options,
  };

  return getTestDatabase().user.create({ data: defaultData });
};
```

## Testing Complex Queries

Integration tests validate repository functions that perform non-trivial database operations.

### Example: Testing Updates with Constraints

**Repository function being tested:**

```typescript
// From data-access-layer/repository/user/user-repository.ts
export async function updateUserProfile(
  userId: string,
  data: { username?: string; image?: string | null }
): Promise<Result<User>> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return { ok: true, data: user };
  } catch (error) {
    if (error.code === "P2025") {
      return { ok: false, error: { code: "NOT_FOUND", message: "User not found" } };
    }
    return { ok: false, error: { code: "DATABASE_ERROR", message: "Failed to update" } };
  }
}
```

**Integration test:**

```typescript
describe("updateUserProfile", () => {
  it("should update username and usernameNormalized", async () => {
    const user = await createUser({
      username: "originaluser",
      usernameNormalized: "originaluser",
    });

    const result = await updateUserProfile(user.id, {
      username: "NewUsername",
      usernameNormalized: "newusername",
    });

    // Test function result
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({
        id: user.id,
        username: "NewUsername",
        usernameNormalized: "newusername",
      });
    }

    // Verify persistence in database
    const dbUserResult = await findUserById(user.id, {
      select: { id: true, username: true, usernameNormalized: true },
    });
    expect(dbUserResult.ok).toBe(true);
    if (dbUserResult.ok) {
      expect(dbUserResult.data?.username).toBe("NewUsername");
      expect(dbUserResult.data?.usernameNormalized).toBe("newusername");
    }
  });

  it("should enforce unique constraint on username field", async () => {
    await createUser({
      username: "uniqueuser",
      usernameNormalized: "uniqueuser",
    });
    const user2 = await createUser({
      username: "anotheruser",
      usernameNormalized: "anotheruser",
    });

    const result = await updateUserProfile(user2.id, {
      username: "uniqueuser",
      usernameNormalized: "uniqueuser",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DATABASE_ERROR");
      expect(result.error.message).toContain("Failed to update user profile");
    }
  });

  it("should return error with non-existent user ID", async () => {
    const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

    const result = await updateUserProfile(nonExistentId, {
      username: "newusername",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toBe("User not found");
    }
  });
});
```

### Testing Patterns

**1. Test success cases with verification:**

```typescript
it("should update library item status", async () => {
  const user = await createUser();
  const game = await createGame();
  const item = await createLibraryItem({
    userId: user.id,
    gameId: game.id,
    status: "CURIOUS_ABOUT",
  });

  const result = await updateLibraryItemStatus(item.id, "CURRENTLY_EXPLORING");

  expect(result.ok).toBe(true);

  // Verify in database
  const dbItem = await getLibraryItemById(item.id);
  expect(dbItem.data?.status).toBe("CURRENTLY_EXPLORING");
});
```

**2. Test constraint violations:**

```typescript
it("should fail when creating duplicate game with same IGDB ID", async () => {
  await createGame({ igdbId: 12345 });

  const result = await createGameFromIgdb({ igdbId: 12345, title: "Duplicate" });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe("UNIQUE_CONSTRAINT_VIOLATION");
  }
});
```

**3. Test null handling:**

```typescript
it("should handle updating field to null", async () => {
  const user = await createUser({ image: "https://example.com/avatar.jpg" });

  const result = await updateUserProfile(user.id, {
    image: null,
  });

  expect(result.ok).toBe(true);

  const dbUser = await findUserById(user.id);
  expect(dbUser.data?.image).toBeNull();
});
```

**4. Test sequential operations:**

```typescript
it("should handle multiple sequential updates", async () => {
  const user = await createUser({ username: "user1" });

  await updateUserProfile(user.id, { username: "user2" });
  await updateUserProfile(user.id, { image: "https://example.com/avatar.jpg" });
  await updateUserProfile(user.id, { username: "user3" });

  const dbUser = await findUserById(user.id);
  expect(dbUser.data).toMatchObject({
    username: "user3",
    image: "https://example.com/avatar.jpg",
  });
});
```

## Result Type Assertions

Repositories return `Result<TData, TError>` types for safe error handling.

### Type Guard Pattern

Use the `isRepositorySuccess` type guard from `data-access-layer/repository/types.ts`:

```typescript
import { isRepositorySuccess } from "../types";

const result = await updateUserProfile(userId, { username: "newname" });

if (isRepositorySuccess(result)) {
  // TypeScript knows result.data exists
  expect(result.data.username).toBe("newname");
} else {
  // TypeScript knows result.error exists
  expect(result.error.code).toBe("DATABASE_ERROR");
}
```

### Testing Both Success and Error Paths

**Success path:**

```typescript
it("should return success result with user data", async () => {
  const user = await createUser();

  const result = await findUserById(user.id);

  expect(result.ok).toBe(true); // Runtime check
  expect(isRepositorySuccess(result)).toBe(true); // Type guard check

  if (result.ok) {
    expect(result.data).toMatchObject({
      id: user.id,
      email: user.email,
    });
  }
});
```

**Error path:**

```typescript
it("should return error result when user not found", async () => {
  const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

  const result = await findUserById(nonExistentId);

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.error.code).toBe("NOT_FOUND");
    expect(result.error.message).toContain("not found");
  }
});
```

### Standard Error Codes

| Error Code | Meaning | Example Scenario |
|------------|---------|------------------|
| `NOT_FOUND` | Entity doesn't exist | `findUserById("invalid-id")` |
| `DATABASE_ERROR` | Prisma/DB error | Unique constraint violation |
| `VALIDATION_ERROR` | Invalid input data | Missing required field |

## Common Patterns

### Pattern 1: Testing Joins and Relations

```typescript
it("should include related library items when fetching user", async () => {
  const user = await createUser();
  const game1 = await createGame({ title: "Game 1" });
  const game2 = await createGame({ title: "Game 2" });

  await createLibraryItem({ userId: user.id, gameId: game1.id });
  await createLibraryItem({ userId: user.id, gameId: game2.id });

  const result = await getUserWithLibrary(user.id);

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data.libraryItems).toHaveLength(2);
    expect(result.data.libraryItems[0].game.title).toBeDefined();
  }
});
```

### Pattern 2: Testing Cascading Deletes

```typescript
it("should delete library items when user is deleted", async () => {
  const user = await createUser();
  const game = await createGame();
  const item = await createLibraryItem({ userId: user.id, gameId: game.id });

  await deleteUser(user.id);

  const itemResult = await getLibraryItemById(item.id);
  expect(itemResult.ok).toBe(false);
  if (!itemResult.ok) {
    expect(itemResult.error.code).toBe("NOT_FOUND");
  }
});
```

### Pattern 3: Testing Pagination

```typescript
it("should return paginated library items", async () => {
  const user = await createUser();

  // Create 25 games and library items
  for (let i = 0; i < 25; i++) {
    const game = await createGame({ title: `Game ${i}` });
    await createLibraryItem({ userId: user.id, gameId: game.id });
  }

  const page1 = await getLibraryItems(user.id, { limit: 10, offset: 0 });
  const page2 = await getLibraryItems(user.id, { limit: 10, offset: 10 });

  expect(page1.data).toHaveLength(10);
  expect(page2.data).toHaveLength(10);
  expect(page1.data[0].game.title).not.toBe(page2.data[0].game.title);
});
```

### Pattern 4: Testing Search Queries

```typescript
it("should filter games by partial title match", async () => {
  await createGame({ title: "The Legend of Zelda" });
  await createGame({ title: "Zelda: Breath of the Wild" });
  await createGame({ title: "Dark Souls" });

  const result = await searchGames({ query: "zelda" });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data).toHaveLength(2);
    expect(result.data.every((g) => g.title.toLowerCase().includes("zelda"))).toBe(true);
  }
});
```

## File Naming Convention

Integration test files must use the `.integration.test.ts` suffix:

```
✅ user-repository.integration.test.ts
✅ game-repository.integration.test.ts
❌ user-repository.test.ts (will run as unit test with mocked Prisma)
```

This naming triggers the correct Vitest configuration:
- Runs in `node` environment
- Uses real database (not mocked Prisma)
- Executed sequentially (prevents database conflicts)
- 15-second timeout (vs 10s for unit tests)

## Running Integration Tests

**Run all integration tests:**

```bash
cd savepoint-app
pnpm test -- --grep="\.integration\.test\.ts$"
```

**Run specific integration test file:**

```bash
pnpm test data-access-layer/repository/user/user-repository.integration.test.ts
```

**Run with watch mode:**

```bash
pnpm test:watch -- --grep="\.integration\.test\.ts$"
```

**View database during tests:**

```bash
pnpm exec prisma studio
# Opens browser at http://localhost:5555
```

## Troubleshooting

### Issue: "Test database not initialized"

**Cause:** `setupDatabase()` not called in `beforeAll()` or test file doesn't mock `@/shared/lib`.

**Fix:**

```typescript
// Add to top of test file
vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    ...actual,
    get prisma() {
      return getTestDatabase();
    },
  };
});

// Add lifecycle hooks
describe("YourRepository - Integration Tests", () => {
  beforeAll(async () => await setupDatabase());
  afterAll(async () => await cleanupDatabase());
  beforeEach(async () => await resetTestDatabase());
});
```

### Issue: Tests fail with unique constraint violations

**Cause:** Database not reset between tests, or tests running in parallel.

**Fix 1:** Ensure `resetTestDatabase()` is called in `beforeEach()`:

```typescript
beforeEach(async () => {
  await resetTestDatabase(); // Truncates all tables
});
```

**Fix 2:** Verify integration tests run sequentially in `vitest.config.ts`:

```typescript
{
  test: {
    include: ["**/*.integration.test.ts"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Sequential execution
      },
    },
  },
}
```

### Issue: Docker Compose database not running

**Symptoms:** `ECONNREFUSED localhost:6432`

**Fix:**

```bash
# Check Docker containers
docker ps

# Start database
docker-compose up -d

# Verify PostgreSQL is running
docker logs savepoint-postgres
```

### Issue: Stale test databases not cleaned up

**Cause:** `cleanupDatabase()` not called or test process killed.

**Fix:**

```bash
# Connect to PostgreSQL via Docker
docker exec -it savepoint-postgres psql -U postgres

# List all databases
\l

# Drop stale test databases
DROP DATABASE test_abc123;
DROP DATABASE test_def456;
```

## Best Practices

### ✅ DO:
- Use factory functions for all test data creation
- Call `resetTestDatabase()` in `beforeEach()` for isolation
- Verify results by querying database after operations
- Test both success and error paths
- Test edge cases (null values, constraints, cascades)
- Use descriptive test names explaining the scenario

### ❌ DON'T:
- Rely on data created by previous tests
- Test business logic (use service layer tests)
- Mock the database or Prisma client
- Skip database lifecycle hooks (`beforeAll`, `afterAll`, `beforeEach`)
- Create test data manually with raw Prisma calls (use factories)
- Test simple CRUD operations already validated by Prisma

## Complete Integration Test Template

```typescript
import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createUser, createGame, createLibraryItem } from "@/test/setup/db-factories";

import { isRepositorySuccess } from "../types";
import { getLibraryItemsByUser, updateLibraryItemStatus } from "./library-repository";

// Mock Prisma client to use test database
vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    ...actual,
    get prisma() {
      return getTestDatabase();
    },
  };
});

describe("LibraryRepository - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("getLibraryItemsByUser", () => {
    it("should return all library items for user", async () => {
      const user = await createUser();
      const game1 = await createGame({ title: "Game 1" });
      const game2 = await createGame({ title: "Game 2" });

      await createLibraryItem({ userId: user.id, gameId: game1.id });
      await createLibraryItem({ userId: user.id, gameId: game2.id });

      const result = await getLibraryItemsByUser(user.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should return empty array when user has no library items", async () => {
      const user = await createUser();

      const result = await getLibraryItemsByUser(user.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("updateLibraryItemStatus", () => {
    it("should update status and persist to database", async () => {
      const user = await createUser();
      const game = await createGame();
      const item = await createLibraryItem({
        userId: user.id,
        gameId: game.id,
        status: "CURIOUS_ABOUT",
      });

      const result = await updateLibraryItemStatus(item.id, "CURRENTLY_EXPLORING");

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.status).toBe("CURRENTLY_EXPLORING");
      }

      // Verify persistence
      const items = await getLibraryItemsByUser(user.id);
      if (items.ok) {
        expect(items.data[0].status).toBe("CURRENTLY_EXPLORING");
      }
    });

    it("should return error with non-existent library item ID", async () => {
      const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      const result = await updateLibraryItemStatus(nonExistentId, "EXPERIENCED");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });
  });
});
```

## Additional Resources

- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Vitest API Reference](https://vitest.dev/api/)
- Repository type definitions: [data-access-layer/repository/types.ts](../../data-access-layer/repository/types.ts)
- Database utilities: [test/setup/database.ts](../../test/setup/database.ts)
- Factory functions: [test/setup/db-factories/](../../test/setup/db-factories/)

---

**Last updated:** January 2025
