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

## Anti-Patterns to Avoid

1. ❌ Testing implementation details (internal state)
2. ❌ Over-mocking (mock only external boundaries)
3. ❌ Tight coupling to test IDs
4. ❌ Large, unfocused test suites
5. ❌ Ignoring error paths
