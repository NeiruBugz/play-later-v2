# Test Directory

Testing infrastructure, utilities, factories, and fixtures for the SavePoint app.

## Test Types

| Type | Suffix | Environment | Database | Timeout |
|------|--------|-------------|----------|---------|
| Unit | `.unit.test.ts` | Node | Mocked | 5s |
| Integration | `.integration.test.ts` | Node | Real PostgreSQL (Docker) | 15s |
| Component | `.test.tsx` | jsdom | N/A | 10s |

## Running Tests

```bash
pnpm test                        # All tests
pnpm test --project=unit         # Unit only
pnpm test --project=integration  # Integration only (needs Docker)
pnpm test --project=components   # Component only
pnpm test:watch                  # Watch mode
pnpm test:coverage               # With coverage report
pnpm test path/to/file           # Single file
```

## Coverage

Threshold: 80% for branches, functions, lines, statements. Excludes: `.next/`, `app/`, `test/`, config files.

## Factories (test/setup/db-factories/)

```typescript
import { createGame, createUser, createLibraryItem } from "@/test/setup/db-factories";

const user = await createUser({ username: "testuser" });
const game = await createGame({ title: "Test Game", igdbId: 12345 });
const item = await createLibraryItem({ userId: user.id, gameId: game.id });
```

**Data-only variants** (no DB call): `createGameData()`, `createUserData()`, etc.
**Seeded variants** (deterministic): `createSeededGameData(seed)`, etc.

## Fixtures (test/fixtures/)

```typescript
import { mockGameSearchResult, mockLibraryItem } from "@/test/fixtures";
```

## MSW Mocks (test/mocks/)

Handlers organized by domain: `handlers/igdb.ts`, `handlers/twitch.ts`, `handlers/next-api.ts`, `handlers/library-api.ts`.

```typescript
import { server } from "@/test/mocks/server";
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Override for specific tests with `server.use(http.get(...))`.

## AWS SDK Mocking

Use `aws-sdk-client-mock` with matchers: `toHaveReceivedCommandWith`, `toHaveReceivedCommandTimes`. See `shared/lib/storage/avatar-storage.unit.test.ts`.

## Vitest Globals

Available without import: `describe`, `it`, `test`, `expect`, `vi`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`.

## Key Patterns

- **Service unit tests**: Mock repository with `vi.mock("@/data-access-layer/repository")`
- **Integration tests**: Use factories, clean tables in `beforeEach`
- **Component tests**: BDD-style with `elements` and `actions` objects

## Anti-Patterns

- Testing implementation details (internal state)
- Over-mocking (mock only external boundaries)
- Large, unfocused test suites
- Ignoring error paths

## Notes on Relocated Code

- `shared/lib/profile/` was moved to `features/profile/lib/`. Tests for that code now sit alongside the feature.
- `shared/lib/game/` was removed (dead code) — no tests should target it.
