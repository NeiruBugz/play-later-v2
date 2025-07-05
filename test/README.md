# Testing Setup Guide

This directory contains the test setup and configuration for both unit tests (with mocked Prisma) and integration tests (with real database).

## Quick Start

### Prerequisites
1. Ensure Docker is running
2. Start the test database: `npm run test:db:setup`

### Running Tests

```bash
# Run all tests (default vitest config)
npm test

# Run only unit tests (fast, mocked Prisma)
npm run test:unit

# Run only integration tests (real database)
npm run test:integration

# Watch mode
npm run test:unit:watch
npm run test:integration:watch

# Coverage
npm run test:coverage
```

## Test Types

### Unit Tests (`.unit.test.ts` or `.mock.test.ts`)
- **Fast execution** (~1-5s)
- **Mocked Prisma client** 
- **Isolated logic testing**
- Use for testing business logic without database dependencies

Example:
```typescript
// features/example/service.unit.test.ts
import { prisma } from "@/shared/lib/db";
import { vi } from "vitest";

// Prisma is automatically mocked in unit tests
vi.mocked(prisma.user.create).mockResolvedValue(mockUser);
```

### Integration Tests (`.integration.test.ts`)
- **Real database** with cleanup
- **End-to-end functionality**
- **Database constraints testing**
- Use for testing actual database operations and business flows

Example:
```typescript
// domain/backlog-item/service.integration.test.ts
import { createUser, createGame, testDb } from "@/test/setup/db-factories";

// Real database operations
const user = await createUser();
const result = await BacklogItemService.create(input, user.id);
```

## Directory Structure

```
test/
├── setup/
│   ├── global.ts              # Unit test setup (mocked Prisma)
│   ├── global-integration.ts  # Integration test setup (real DB)
│   ├── database.ts            # Database management utilities
│   ├── database-global.ts     # Global DB hooks
│   ├── auth-mock.ts          # Authentication mocking
│   └── db-factories/         # Test data factories
│       ├── index.ts          # Factory exports
│       ├── user.ts           # User factory
│       └── game.ts           # Game, BacklogItem, Review factories
└── README.md                 # This file
```

## Factories Usage

Factories help create consistent test data:

```typescript
import { createUser, createGame, createBacklogItem, testDb } from "@/test/setup/db-factories";

// Create test entities
const user = await createUser({
  email: "test@example.com",
  username: "testuser"
});

const game = await createGame({
  title: "Test Game",
  igdbId: 12345
});

const backlogItem = await createBacklogItem({
  userId: user.id,
  gameId: game.id,
  status: "PLAYING"
});

// Access test database directly
const items = await testDb.backlogItem.findMany();
```

## Configuration Files

### `vitest.config.ts` (Default)
- Mixed unit and integration tests
- Uses mocked Prisma by default
- Reasonable balance of speed and coverage

### `vitest.config.unit.ts`
- Fast unit tests only
- Mocked Prisma client
- 5s timeouts
- Thread pool for parallelization

### `vitest.config.integration.ts`
- Real database tests
- 15s timeouts for database operations
- Fork pool with single fork for DB isolation
- Sequential execution to prevent DB conflicts

## Environment Variables

The test setup automatically configures:
- `NEXTAUTH_SECRET`: Test auth secret
- `POSTGRES_PRISMA_URL`: Test database connection
- `POSTGRES_URL_NON_POOLING`: Non-pooling connection

## Database Management

### Automatic Cleanup
- **beforeAll**: Creates unique test database
- **afterEach**: Resets all tables (keeps schema)
- **afterAll**: Drops test database

### Manual Database Operations
```typescript
import { testDb, resetTestDatabase } from "@/test/setup/db-factories";

// Reset database manually
await resetTestDatabase();

// Direct database access
const users = await testDb.user.findMany();
```

## Best Practices

### 1. Use Appropriate Test Types
- **Unit tests** for business logic, validation, error handling
- **Integration tests** for database operations, service flows

### 2. Factory Usage
```typescript
// ✅ Good: Use factories for consistent data
const user = await createUser({ username: "specific-name" });

// ❌ Avoid: Manual data creation
const user = await testDb.user.create({
  data: { id: "1", email: "test@..." } // Hard to maintain
});
```

### 3. Test Isolation
```typescript
// ✅ Good: Each test creates its own data
beforeEach(async () => {
  testUser = await createUser();
});

// ❌ Avoid: Sharing data between tests
const sharedUser = await createUser(); // Created once
```

### 4. Authentication Mocking
```typescript
import { getServerUserId } from "@/auth";
import { vi } from "vitest";

// Mock authentication
vi.mocked(getServerUserId).mockResolvedValue(user.id);
```

### 5. Error Testing
```typescript
// Test both success and failure cases
it("should handle database errors", async () => {
  const result = await service.create(invalidInput);
  expect(result.isFailure).toBe(true);
  expect(result.error?.message).toContain("validation");
});
```

## Troubleshooting

### Database Connection Issues
1. Ensure Docker is running: `docker ps`
2. Check database container: `docker-compose logs postgres-db`
3. Restart database: `npm run test:db:teardown && npm run test:db:setup`

### Test Timeouts
- Unit tests: 5s timeout (increase in `vitest.config.unit.ts`)
- Integration tests: 15s timeout (increase in `vitest.config.integration.ts`)

### Port Conflicts
The test database uses port `6432` (mapped from container port `5432`). If you have conflicts:
1. Change port in `docker-compose.yml`
2. Update port in `test/setup/database.ts`

### Performance Issues
- Use `npm run test:unit` for fast feedback during development
- Use `npm run test:integration` before committing
- Consider parallel execution settings in vitest configs

## Adding New Tests

### Unit Test Example
```typescript
// features/new-feature/service.unit.test.ts
import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/shared/lib/db";

describe("NewService Unit Tests", () => {
  it("should validate input", () => {
    // Test logic without database
  });
});
```

### Integration Test Example
```typescript
// features/new-feature/service.integration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createUser, testDb } from "@/test/setup/db-factories";

describe("NewService Integration Tests", () => {
  let user: any;
  
  beforeEach(async () => {
    user = await createUser();
  });
  
  it("should work with real database", async () => {
    // Test with actual database operations
  });
});
``` 