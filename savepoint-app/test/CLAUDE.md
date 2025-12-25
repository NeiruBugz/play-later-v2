# Test Directory - Claude Guidelines

See [README.md](./README.md) for comprehensive testing documentation.

## Quick Reference

**Purpose**: Testing infrastructure, utilities, factories, and fixtures.

**Key Files**:
- `setup/` - Test environment setup
- `setup/db-factories/` - Database factory functions
- `fixtures/` - Mock data and fixtures
- `guides/` - Detailed testing guides

## Test Types Summary

| Type | Suffix | Database | Speed |
|------|--------|----------|-------|
| Unit | `.unit.test.ts` | Mocked | Fast |
| Integration | `.integration.test.ts` | Real | Slow |
| Component | `.test.tsx` | N/A | Medium |
| Server Action | `.server-action.test.ts` | Varies | Medium |

## When Writing Tests

### Use Factory Functions

```typescript
import { createGame, createUser, createLibraryItem } from "@/test/setup/db-factories";

const user = await createUser({ username: "testuser" });
const game = await createGame({ title: "Test Game", igdbId: 12345 });
const item = await createLibraryItem({ userId: user.id, gameId: game.id });
```

### Use Fixtures

```typescript
import { mockGameSearchResult, mockLibraryItem } from "@/test/fixtures";
```

### Vitest Globals

Vitest globals are available without import:
- `describe`, `it`, `test`
- `expect`, `vi`
- `beforeEach`, `afterEach`, `beforeAll`, `afterAll`

## Common Test Patterns

### Service Unit Test

```typescript
vi.mock("@/data-access-layer/repository");

describe("GameService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns NOT_FOUND when game does not exist", async () => {
    vi.mocked(findGameById).mockResolvedValue(null);

    const result = await service.getGame({ id: "xxx" });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(ServiceErrorCode.NOT_FOUND);
  });
});
```

### Repository Integration Test

```typescript
describe("game-repository", () => {
  beforeEach(async () => {
    await prisma.game.deleteMany();
  });

  it("creates and finds a game", async () => {
    const created = await createGame({ igdbId: 12345, name: "Test" });
    const found = await findGameByIgdbId(12345);

    expect(found?.id).toBe(created.id);
  });
});
```

### Component Test (BDD Style)

```typescript
describe("GameCard", () => {
  const elements = {
    title: () => screen.getByRole("heading"),
    addButton: () => screen.getByRole("button", { name: /add/i }),
  };

  const actions = {
    clickAdd: () => userEvent.click(elements.addButton()),
  };

  it("renders game title", () => {
    render(<GameCard game={mockGame} />);
    expect(elements.title()).toHaveTextContent(mockGame.name);
  });
});
```

## Running Tests

```bash
pnpm test                    # All tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage
pnpm test path/to/file      # Single file
pnpm test -t "pattern"      # Filter by name
```

## Coverage Requirements

- **Threshold**: 80% for branches, functions, lines, statements
- **Excludes**: `.next/`, `app/`, `test/`, config files

## Detailed Guides

- [Component Testing](./guides/COMPONENT_TESTING.md) - React Testing Library patterns
- [Integration Testing](./guides/INTEGRATION_TESTING.md) - Database testing
- [Backend Testing](./guides/BACKEND_TESTING.md) - Service/server action testing

## Advanced Testing Patterns

### AWS SDK Mocking

For testing AWS services (S3, DynamoDB, etc.), use `aws-sdk-client-mock` with Vitest matchers.

**Setup:**
```typescript
import { mockClient } from "aws-sdk-client-mock";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Mock = mockClient(S3Client);

beforeEach(() => {
  s3Mock.reset();
  s3Mock.on(PutObjectCommand).resolves({});
});
```

**Available Matchers:**
- `toHaveReceivedCommandWith(Command, params)` - Assert command was called with specific parameters
- `toHaveReceivedCommandTimes(Command, count)` - Assert command was called N times
- `toHaveReceivedCommand(Command)` - Assert command was called at least once

**Example:**
```typescript
it("should upload file to S3 with correct parameters", async () => {
  await uploadAvatar("user-123", file);

  expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
  expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
    Bucket: "test-bucket",
    Key: "user-avatars/user-123/avatar.jpg",
    ContentType: "image/jpeg",
    Body: expect.any(Buffer),
  });
});
```

**Reference:** See `shared/lib/storage/avatar-storage.unit.test.ts` for complete examples.

### Faker.js for Test Data

Use Faker.js with seeding for deterministic, realistic test data.

**Import:**
```typescript
import { faker, seedFaker } from "@/test/setup/faker";
```

**Seeded vs Non-Seeded:**
```typescript
// Non-seeded: Different data each run (default)
const game = createGameData();
// => { title: "Fantastic Steel Pizza", slug: "fantastic-steel-pizza-1", ... }

// Seeded: Same data with same seed (reproducible tests)
const game = createSeededGameData(12345);
// => Always returns: { title: "Incredible Granite Shirt", slug: "...", ... }
```

**When to Use Each:**
| Pattern | Use Case |
|---------|----------|
| `createGameData()` | Integration tests, unique data per test |
| `createSeededGameData(seed)` | Snapshot tests, deterministic outputs |
| Manual factory options | Specific test scenarios (custom title, igdbId, etc.) |

**Factory Pattern:**
```typescript
// Factory functions come in pairs:
// 1. Data generator (no DB call)
const gameData = createGameData({ title: "Dark Souls" });

// 2. Seeded variant
const seededData = createSeededGameData(12345, { title: "Dark Souls" });

// 3. Database creator (calls createGameData internally)
const game = await createGame({ title: "Dark Souls" });
```

**Available in Factories:**
- `createGameData()` / `createSeededGameData()`
- `createUserData()` / `createSeededUserData()`
- `createLibraryItemData()` / `createSeededLibraryItemData()`
- `createReviewData()` / `createSeededReviewData()`
- `createJournalData()` / `createSeededJournalData()`

**Reference:** See `test/setup/db-factories/` for all factory implementations.

### MSW Handler Organization

Mock Service Worker (MSW) handlers are organized by domain in `test/mocks/handlers/`.

**Directory Structure:**
```
test/mocks/
├── handlers/
│   ├── igdb.ts          # IGDB API mocks
│   ├── twitch.ts        # Twitch OAuth token mocks
│   ├── next-api.ts      # Next.js API route mocks
│   ├── library-api.ts   # Library API mocks
│   └── index.ts         # Combined exports
└── server.ts            # MSW server setup
```

**Using Default Handlers:**
```typescript
import { server } from "@/test/mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("searches for games via IGDB", async () => {
  // Uses default igdbHandlers from test/mocks/handlers/igdb.ts
  const result = await searchGames("zelda");
  expect(result).toHaveLength(2);
});
```

**Overriding Handlers for Specific Tests:**
```typescript
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";

it("handles IGDB API timeout", async () => {
  server.use(
    http.post("https://api.igdb.com/v4/games", () => {
      return HttpResponse.error();
    })
  );

  await expect(searchGames("zelda")).rejects.toThrow("Network error");
});
```

**Creating New Handlers:**
```typescript
// test/mocks/handlers/my-api.ts
import { http, HttpResponse } from "msw";

export const myApiHandlers = [
  http.get("https://api.example.com/data", () => {
    return HttpResponse.json({ data: "mocked response" });
  }),
];

// test/mocks/handlers/index.ts
export const allHandlers = [
  ...igdbHandlers,
  ...twitchHandlers,
  ...myApiHandlers, // Add your handlers
];
```

**Reference:** See `test/mocks/handlers/` for handler examples and `test/mocks/server.ts` for setup.

## Anti-Patterns to Avoid

1. ❌ Testing implementation details (internal state)
2. ❌ Over-mocking (mock only external boundaries)
3. ❌ Tight coupling to test IDs
4. ❌ Large, unfocused test suites
5. ❌ Ignoring error paths
