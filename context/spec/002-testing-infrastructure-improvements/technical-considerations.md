# Technical Specification: Testing Infrastructure Improvements

- **Functional Specification:** N/A (Infrastructure improvement - no user-facing changes)
- **Status:** Draft
- **Author(s):** Claude

---

## 1. High-Level Technical Approach

This specification outlines improvements to the SavePoint testing infrastructure to leverage modern Vitest 4.x features, improve AWS SDK mocking, enhance test factories, and optimize test performance.

**Systems Affected:**
- Test configuration (`vitest.config.ts`, `vitest.coverage.config.ts`)
- Test setup files (`test/setup/*.ts`)
- Test factories (`test/setup/db-factories/`)
- Unit and integration tests across the codebase

**Goals:**
1. Add `aws-sdk-client-mock-vitest` for better S3 test assertions
2. Leverage Vitest 4.0's `expect.schemaMatching` for Zod schema validation
3. Add Faker.js for realistic, deterministic test data
4. Organize MSW handlers into domain-specific modules
5. Add TypeScript declarations for custom matchers

---

## 2. Proposed Solution & Implementation Plan

### 2.1 AWS SDK Testing Enhancement

**Current State:** S3 tests in `shared/lib/storage/avatar-storage.unit.test.ts` manually mock `getS3Client` and assert on `mockS3Send.mock.calls`.

**Proposed Change:** Add `aws-sdk-client-mock` and `aws-sdk-client-mock-vitest` for idiomatic AWS SDK v3 testing.

**Dependencies to Add:**
```bash
pnpm add -D aws-sdk-client-mock aws-sdk-client-mock-vitest
```

**New Files:**

```typescript
// test/vitest.d.ts
import "vitest";
import { CustomMatcher } from "aws-sdk-client-mock-vitest";

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatcher<T> {}
  interface AsymmetricMatchersContaining extends CustomMatcher {}
}
```

**Modified Files:**

```typescript
// test/setup/global.ts - Add after existing imports
import { expect } from "vitest";
import { allCustomMatcher } from "aws-sdk-client-mock-vitest";

expect.extend(allCustomMatcher);
```

**Example Test Refactor:**

```typescript
// Before (current pattern)
expect(mockS3Send).toHaveBeenCalledWith(
  expect.objectContaining({
    input: expect.objectContaining({
      Key: expect.stringContaining(userId),
    }),
  })
);

// After (with aws-sdk-client-mock-vitest)
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Mock = mockClient(S3Client);

expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
  Bucket: "test-bucket",
  Key: expect.stringContaining(userId),
  ContentType: "image/jpeg",
});
```

---

### 2.2 Vitest 4.0 Schema Matching

**Current State:** Service tests manually check response structure with multiple assertions.

**Proposed Change:** Use `expect.schemaMatching()` with existing Zod schemas for type-safe assertions.

**Example Usage:**

```typescript
// In service tests
import { GameSearchResponseSchema } from "@/data-access-layer/services/igdb/schemas";

const result = await igdbService.searchGamesByName({ name: "zelda" });

expect(result).toEqual({
  success: true,
  data: expect.schemaMatching(GameSearchResponseSchema),
});
```

**Benefits:**
- Validates response matches defined schema
- Catches schema drift between implementation and types
- More maintainable than manual property assertions

---

### 2.3 Test Factory Enhancement with Faker.js

**Current State:** Factories in `test/setup/db-factories/` use hardcoded or semi-random values.

**Proposed Change:** Add Faker.js for realistic, seedable test data.

**Dependencies to Add:**
```bash
pnpm add -D @faker-js/faker
```

**New File:**

```typescript
// test/setup/faker.ts
import { faker } from "@faker-js/faker";

// Default seed for deterministic tests
export const seedFaker = (seed: number = 12345) => {
  faker.seed(seed);
};

export { faker };
```

**Modified Factory Pattern:**

```typescript
// test/setup/db-factories/game.ts
import { faker, seedFaker } from "../faker";

export const createGameData = (overrides?: Partial<GameCreateInput>) => ({
  igdbId: faker.number.int({ min: 1, max: 999999 }),
  name: faker.commerce.productName(),
  slug: faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),
  summary: faker.lorem.paragraph(),
  coverUrl: faker.image.url(),
  firstReleaseDate: faker.date.past(),
  ...overrides,
});

// For snapshot tests - deterministic output
export const createSeededGameData = (seed: number = 12345) => {
  seedFaker(seed);
  return createGameData();
};
```

---

### 2.4 MSW Handler Organization

**Current State:** MSW handlers are defined inline in test files or in `test/setup/client-setup.ts`.

**Proposed Change:** Organize handlers by domain for reusability.

**New Directory Structure:**

```
test/
├── mocks/
│   ├── handlers/
│   │   ├── igdb.ts          # IGDB API handlers
│   │   ├── twitch.ts        # Twitch OAuth handlers
│   │   ├── steam.ts         # Steam API handlers (future)
│   │   └── index.ts         # Re-exports all handlers
│   └── server.ts            # MSW server setup
├── setup/
│   ├── client-setup.ts      # Import from mocks/server.ts
│   └── ...
```

**Example Handler Module:**

```typescript
// test/mocks/handlers/igdb.ts
import { http, HttpResponse } from "msw";

export const igdbHandlers = [
  http.post("https://api.igdb.com/v4/games", async ({ request }) => {
    const body = await request.text();
    // Parse and respond based on query
    return HttpResponse.json([/* mock games */]);
  }),

  http.post("https://api.igdb.com/v4/platforms", () => {
    return HttpResponse.json([/* mock platforms */]);
  }),
];

// test/mocks/handlers/twitch.ts
export const twitchHandlers = [
  http.post("https://id.twitch.tv/oauth2/token", () => {
    return HttpResponse.json({
      access_token: "mock-token",
      expires_in: 5000000,
      token_type: "bearer",
    });
  }),
];

// test/mocks/handlers/index.ts
export * from "./igdb";
export * from "./twitch";
export const allHandlers = [...igdbHandlers, ...twitchHandlers];
```

---

### 2.5 TypeScript Configuration Updates

**Modified Files:**

```jsonc
// tsconfig.json - Add to include array
{
  "include": [
    // ... existing entries
    "test/vitest.d.ts"
  ]
}
```

---

## 3. Impact and Risk Analysis

### System Dependencies

| Component | Impact |
|-----------|--------|
| `test/setup/global.ts` | Modified to register AWS matchers |
| `test/setup/db-factories/*` | Refactored to use Faker.js |
| `vitest.config.ts` | No changes required |
| Service unit tests | Can adopt schema matching |
| S3 tests | Can adopt aws-sdk-client-mock |

### Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing tests during refactor | Medium | Medium | Incremental migration - new patterns for new tests first |
| Faker.js output changes between versions | Low | Low | Pin Faker.js version, use seeded values for snapshots |
| AWS mock library compatibility | Low | Low | Library is well-maintained, recommended by AWS |
| MSW handler changes break tests | Medium | Low | Keep handler modules focused, document expected behavior |

### Backward Compatibility

All changes are **additive** - existing test patterns continue to work. Teams can adopt new patterns incrementally:

1. New tests should use new patterns
2. Existing tests can be migrated opportunistically
3. No forced migration required

---

## 4. Testing Strategy

### Verification Approach

1. **Run full test suite** after each change to ensure no regressions
2. **Coverage check** - Ensure 80%+ coverage maintained
3. **CI validation** - All changes must pass `pnpm ci:check`

### Test Commands

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific project
pnpm test:backend
pnpm test:integration
```

### Success Criteria

- [ ] All existing tests pass
- [ ] Coverage remains at or above 80%
- [ ] TypeScript compilation succeeds
- [ ] New patterns documented in `test/CLAUDE.md` or `test/README.md`

---

## 5. Implementation Order

**Phase 1: Foundation (Low Risk)**
1. Add `aws-sdk-client-mock` and `aws-sdk-client-mock-vitest` dependencies
2. Create `test/vitest.d.ts` with TypeScript declarations
3. Update `test/setup/global.ts` to register matchers
4. Add Faker.js dependency and `test/setup/faker.ts`

**Phase 2: MSW Organization (Medium Risk)**
5. Create `test/mocks/handlers/` directory structure
6. Extract handlers from existing files
7. Update imports in `client-setup.ts`

**Phase 3: Adoption (Ongoing)**
8. Update `avatar-storage.unit.test.ts` as reference implementation
9. Document patterns in `test/CLAUDE.md`
10. Apply patterns to new tests going forward

---

## 6. Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `test/vitest.d.ts` | Create | High |
| `test/setup/global.ts` | Modify | High |
| `test/setup/faker.ts` | Create | High |
| `test/mocks/handlers/igdb.ts` | Create | Medium |
| `test/mocks/handlers/twitch.ts` | Create | Medium |
| `test/mocks/handlers/index.ts` | Create | Medium |
| `test/mocks/server.ts` | Create | Medium |
| `test/setup/db-factories/game.ts` | Modify | Medium |
| `test/setup/db-factories/user.ts` | Modify | Medium |
| `test/CLAUDE.md` | Modify | Low |
| `shared/lib/storage/avatar-storage.unit.test.ts` | Modify (reference) | Low |

---

## 7. References

- [Vitest 4.0 Announcement](https://vitest.dev/blog/vitest-4)
- [aws-sdk-client-mock GitHub](https://github.com/m-radzikowski/aws-sdk-client-mock)
- [aws-sdk-client-mock-vitest npm](https://www.npmjs.com/package/aws-sdk-client-mock-vitest)
- [MSW Best Practices](https://mswjs.io/docs/best-practices/avoid-request-assertions/)
- [Faker.js Frameworks Guide](https://fakerjs.dev/guide/frameworks)
- [Prisma Testing Series](https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o)
