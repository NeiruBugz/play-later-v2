>[toc]
# Backend & Service Testing Guide

## Overview

Backend tests cover business logic in the service layer and server actions. Unlike component tests (UI-focused) or integration tests (database-focused), backend tests validate business rules, data transformations, and error handling.

### Test Types Covered

| Test Type | Focus | Environment | Example |
|-----------|-------|-------------|---------|
| **Service Tests** | Business logic with mocked dependencies | Node | `auth-service.unit.test.ts` |
| **Server Action Tests** | Next.js server actions with mocked services | Node | `sign-up.server-action.test.ts` |
| **Utility Tests** | Pure functions and helpers | jsdom/Node | `date-utils.test.ts` |

## Service Layer Tests

Services contain business logic and orchestrate repository operations. Service tests use mocked repositories and dependencies to verify logic in isolation.

### Service Architecture

Services follow this pattern:

```typescript
// From data-access-layer/services/auth/auth-service.ts
export class AuthService extends BaseService {
  async signUp(input: SignUpInput): Promise<SignUpResult> {
    // 1. Validate input
    const normalizedEmail = input.email.toLowerCase();

    // 2. Check business rules
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists",
        code: ServiceErrorCode.CONFLICT,
      };
    }

    // 3. Perform operation
    const hashedPassword = await hashPassword(input.password);
    const user = await prisma.user.create({ data: { ... } });

    // 4. Return result
    return {
      success: true,
      data: { user, message: "Account created successfully" },
    };
  }
}
```

### Setting Up Service Tests

**File naming:** `<service-name>.unit.test.ts`

**Basic structure:**

```typescript
import { prisma } from "@/shared/lib";
import { AuthService } from "./auth-service";

describe("AuthService", () => {
  let service: AuthService;
  let mockPrismaFindUnique: ReturnType<typeof vi.fn>;
  let mockPrismaCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();

    // Mock Prisma methods
    mockPrismaFindUnique = vi.mocked(prisma.user.findUnique);
    mockPrismaCreate = vi.mocked(prisma.user.create);
  });

  // Tests here
});
```

### Mocking Prisma Client

Services use Prisma for database operations. In unit tests, mock Prisma to isolate business logic:

```typescript
import { prisma } from "@/shared/lib";

// Mock the entire Prisma client
vi.mock("@/shared/lib", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    game: {
      findMany: vi.fn(),
      // ... other methods
    },
  },
}));

// In beforeEach, get typed mock references
const mockPrismaFindUnique = vi.mocked(prisma.user.findUnique);
```

### Testing Success Paths

**Pattern: Mock dependencies → Call service → Assert result**

```typescript
it("should successfully create a new user with hashed password", async () => {
  const givenHashedPassword = "$2a$10$hashedpassword";

  // Arrange: Mock dependencies
  mockPrismaFindUnique.mockResolvedValue(null); // No existing user
  vi.mocked(hashPassword).mockResolvedValue(givenHashedPassword);
  mockPrismaCreate.mockResolvedValue({
    id: "user-123",
    email: "newuser@example.com",
    name: "John Doe",
  });

  // Act: Call service method
  const result = await service.signUp({
    email: "NewUser@Example.com", // Test case normalization
    password: "securepassword123",
    name: "John Doe",
  });

  // Assert: Verify result
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.user.email).toBe("newuser@example.com");
    expect(result.data.message).toBe("Account created successfully");
  }

  // Assert: Verify calls
  expect(mockPrismaFindUnique).toHaveBeenCalledWith({
    select: { id: true },
    where: { email: "newuser@example.com" }, // Normalized
  });
  expect(hashPassword).toHaveBeenCalledWith("securepassword123");
  expect(mockPrismaCreate).toHaveBeenCalledWith({
    data: {
      email: "newuser@example.com",
      password: givenHashedPassword,
      name: "John Doe",
    },
    select: { id: true, email: true, name: true },
  });
});
```

### Testing Error Paths

**Pattern 1: Business rule violations**

```typescript
it("should return error when user already exists", async () => {
  // Arrange: Existing user found
  mockPrismaFindUnique.mockResolvedValue({ id: "existing-user-123" });

  // Act
  const result = await service.signUp({
    email: "existing@example.com",
    password: "password123",
  });

  // Assert: Error result
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toBe("An account with this email already exists");
    expect(result.code).toBe(ServiceErrorCode.CONFLICT);
  }

  // Assert: No user created
  expect(mockPrismaCreate).not.toHaveBeenCalled();
});
```

**Pattern 2: Database errors**

```typescript
it("should handle database errors during user creation", async () => {
  mockPrismaFindUnique.mockResolvedValue(null);
  vi.mocked(hashPassword).mockResolvedValue("hashed");
  mockPrismaCreate.mockRejectedValue(new Error("Database connection failed"));

  const result = await service.signUp({
    email: "user@example.com",
    password: "password123",
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toContain("Failed to create user");
    expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
  }
});
```

**Pattern 3: Prisma-specific errors**

```typescript
import { Prisma } from "@prisma/client";

it("should handle unique constraint violation from database", async () => {
  mockPrismaFindUnique.mockResolvedValue(null);

  const prismaError = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed on the fields: (`email`)",
    {
      code: "P2002", // Unique constraint violation
      clientVersion: "5.0.0",
    }
  );
  mockPrismaCreate.mockRejectedValue(prismaError);

  const result = await service.signUp({
    email: "duplicate@example.com",
    password: "password123",
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toContain("already exists");
    expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
  }
});
```

### Testing Optional Fields

```typescript
it("should create user without name when name is not provided", async () => {
  mockPrismaFindUnique.mockResolvedValue(null);
  vi.mocked(hashPassword).mockResolvedValue("hashed");
  mockPrismaCreate.mockResolvedValue({
    id: "user-123",
    email: "user@example.com",
    name: null,
  });

  const result = await service.signUp({
    email: "user@example.com",
    password: "password123",
    // name omitted
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.user.name).toBeNull();
  }

  expect(mockPrismaCreate).toHaveBeenCalledWith({
    data: {
      email: "user@example.com",
      password: "hashed",
      name: null,
    },
    select: expect.any(Object),
  });
});
```

### Testing Data Normalization

Services often normalize input (e.g., lowercase emails, trim whitespace):

```typescript
it("should normalize email casing before lookup and creation", async () => {
  mockPrismaFindUnique.mockResolvedValue(null);
  vi.mocked(hashPassword).mockResolvedValue("hashed");
  mockPrismaCreate.mockResolvedValue({
    id: "user-123",
    email: "user@example.com",
    name: "John",
  });

  await service.signUp({
    email: "User@Example.COM", // Mixed case
    password: "password123",
    name: "John",
  });

  // Verify normalization happened
  expect(mockPrismaFindUnique).toHaveBeenCalledWith({
    select: { id: true },
    where: { email: "user@example.com" }, // Lowercase
  });
  expect(mockPrismaCreate).toHaveBeenCalledWith({
    data: expect.objectContaining({
      email: "user@example.com", // Lowercase
    }),
    select: expect.any(Object),
  });
});
```

## Server Action Tests

Server actions are Next.js "use server" functions that handle form submissions and mutations. They typically call service layer methods and handle authentication.

### Server Action Architecture

```typescript
// From features/auth/server-actions/sign-up.ts
"use server";

import { signIn } from "@/auth";
import { AuthService } from "@/data-access-layer/services";

export async function signUpAction(data: SignUpInput) {
  // 1. Call service layer
  const authService = new AuthService();
  const result = await authService.signUp(data);

  // 2. Handle errors
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 3. Side effects (auto sign-in)
  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirectTo: "/dashboard",
  });

  // 4. Return success
  return { success: true, message: result.data.message };
}
```

### Setting Up Server Action Tests

**File naming:** `<action-name>.server-action.test.ts`

**Environment:** Node (not jsdom) - Next.js server actions run in Node environment

**Basic structure:**

```typescript
import * as authModule from "@/auth";
import { AuthService } from "@/data-access-layer/services";
import { signUpAction } from "./sign-up";

// Mock service layer
vi.mock("@/data-access-layer/services", () => ({
  AuthService: vi.fn(),
}));

// Mock Next.js auth
vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

describe("signUpAction", () => {
  let mockAuthService: {
    signUp: ReturnType<typeof vi.fn>;
  };
  let mockSignIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup service mock
    mockAuthService = { signUp: vi.fn() };
    vi.mocked(AuthService).mockImplementation(
      () => mockAuthService as unknown as AuthService
    );

    // Setup auth mock
    mockSignIn = vi.mocked(authModule.signIn);
  });

  // Tests here
});
```

### Testing Success Path

```typescript
it("should successfully sign up a user and auto sign in", async () => {
  const signUpData = {
    email: "newuser@example.com",
    password: "securepassword123",
    name: "John Doe",
  };

  // Mock service success
  mockAuthService.signUp.mockResolvedValue({
    success: true,
    data: {
      user: {
        id: "user-123",
        email: "newuser@example.com",
        name: "John Doe",
      },
      message: "Account created successfully",
    },
  });

  // Mock signIn (no errors)
  mockSignIn.mockResolvedValue(undefined);

  // Call server action
  const result = await signUpAction(signUpData);

  // Assert result
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.message).toBe("Account created successfully");
  }

  // Assert service called correctly
  expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpData);

  // Assert auto sign-in happened
  expect(mockSignIn).toHaveBeenCalledWith("credentials", {
    email: "newuser@example.com",
    password: "securepassword123",
    redirectTo: "/dashboard",
  });
});
```

### Testing Error Path

```typescript
it("should return error when user already exists", async () => {
  const signUpData = {
    email: "existing@example.com",
    password: "password123",
    name: "John Doe",
  };

  // Mock service error
  mockAuthService.signUp.mockResolvedValue({
    success: false,
    error: "An account with this email already exists",
    code: "CONFLICT",
  });

  const result = await signUpAction(signUpData);

  // Assert error propagated
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toBe("An account with this email already exists");
  }

  // Assert signIn NOT called on error
  expect(mockSignIn).not.toHaveBeenCalled();
});
```

### Testing Validation (next-safe-action)

If using `next-safe-action`, validation happens automatically:

```typescript
it("should return validation error for invalid email", async () => {
  const signUpData = {
    email: "invalid-email", // Not a valid email
    password: "securepassword123",
    name: "John Doe",
  };

  const result = await signUpAction(signUpData);

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toContain("email");
  }

  // Service should not be called if validation fails
  expect(mockAuthService.signUp).not.toHaveBeenCalled();
  expect(mockSignIn).not.toHaveBeenCalled();
});
```

### Testing Authentication Requirements

For authorized actions (require logged-in user):

```typescript
import { authorizedActionClient } from "@/shared/lib/safe-action";

// Mock the safe action client
vi.mock("@/shared/lib/safe-action", () => ({
  authorizedActionClient: {
    inputSchema: vi.fn(() => ({
      action: vi.fn((handler) => handler),
    })),
  },
}));

it("should reject unauthenticated user", async () => {
  // Mock auth context as unauthenticated
  vi.mocked(getServerUserId).mockResolvedValue(null);

  const result = await updateProfileAction({ username: "newname" });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toContain("Unauthorized");
  }
});
```

## Utility Tests

Utility functions are pure functions without external dependencies. These tests are straightforward and don't require mocking.

### Example: Date Utilities

```typescript
import { formatDate, isExpired, addDays } from "./date-utils";

describe("Date Utilities", () => {
  describe("formatDate", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date("2024-01-15T12:00:00Z");
      expect(formatDate(date)).toBe("2024-01-15");
    });

    it("should handle edge case of last day of month", () => {
      const date = new Date("2024-02-29T23:59:59Z"); // Leap year
      expect(formatDate(date)).toBe("2024-02-29");
    });
  });

  describe("isExpired", () => {
    it("should return true for past date", () => {
      const pastDate = new Date("2020-01-01");
      expect(isExpired(pastDate)).toBe(true);
    });

    it("should return false for future date", () => {
      const futureDate = new Date(Date.now() + 86400000); // +1 day
      expect(isExpired(futureDate)).toBe(false);
    });
  });

  describe("addDays", () => {
    it("should add days correctly", () => {
      const date = new Date("2024-01-15");
      const result = addDays(date, 10);
      expect(formatDate(result)).toBe("2024-01-25");
    });

    it("should handle negative days (subtract)", () => {
      const date = new Date("2024-01-15");
      const result = addDays(date, -5);
      expect(formatDate(result)).toBe("2024-01-10");
    });
  });
});
```

### Example: Validation Helpers

```typescript
import { isValidEmail, sanitizeUsername } from "./validation-utils";

describe("Validation Utilities", () => {
  describe("isValidEmail", () => {
    it("should accept valid emails", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
    });
  });

  describe("sanitizeUsername", () => {
    it("should trim and lowercase username", () => {
      expect(sanitizeUsername("  JohnDoe  ")).toBe("johndoe");
    });

    it("should remove special characters", () => {
      expect(sanitizeUsername("john@doe!")).toBe("johndoe");
    });

    it("should handle empty string", () => {
      expect(sanitizeUsername("")).toBe("");
    });
  });
});
```

## Result Type Patterns

Services and server actions return structured result types for predictable error handling.

### Service Result Type

```typescript
type ServiceResult<TData, TError = ServiceError> =
  | { success: true; data: TData }
  | { success: false; error: TError; code: ServiceErrorCode };
```

### Testing Result Types

**Pattern: Use type guards to assert success/failure**

```typescript
it("should return success result with user data", async () => {
  mockPrismaFindUnique.mockResolvedValue({ id: "user-123", email: "user@example.com" });

  const result = await service.getUser("user-123");

  // Runtime check
  expect(result.success).toBe(true);

  // Type guard narrows type
  if (result.success) {
    // TypeScript knows result.data exists
    expect(result.data.email).toBe("user@example.com");
  } else {
    // This branch never executes
    fail("Expected success result");
  }
});
```

**Pattern: Test error codes**

```typescript
it("should return NOT_FOUND error when user doesn't exist", async () => {
  mockPrismaFindUnique.mockResolvedValue(null);

  const result = await service.getUser("nonexistent-id");

  expect(result.success).toBe(false);

  if (!result.success) {
    expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
    expect(result.error).toContain("User not found");
  }
});
```

### Common Service Error Codes

| Code | Usage | HTTP Equivalent |
|------|-------|-----------------|
| `VALIDATION_ERROR` | Invalid input data | 400 Bad Request |
| `UNAUTHORIZED` | Not authenticated | 401 Unauthorized |
| `FORBIDDEN` | Insufficient permissions | 403 Forbidden |
| `NOT_FOUND` | Resource doesn't exist | 404 Not Found |
| `CONFLICT` | Duplicate resource | 409 Conflict |
| `INTERNAL_ERROR` | Unexpected error | 500 Internal Server Error |

## Mocking Strategy

### Mocking Layers

```
Server Action Tests
  ↓ Mocks AuthService, GameService, etc.
Service Layer Tests
  ↓ Mocks Prisma, external APIs, utility functions
Repository Tests
  ↓ Integration tests (no mocks, real database)
```

**Key principle:** Only mock external dependencies of the layer you're testing.

### Mock Hierarchy Examples

**Server Action Test:**

```typescript
// Mock service layer
vi.mock("@/data-access-layer/services", () => ({
  AuthService: vi.fn(),
  GameService: vi.fn(),
}));

// Mock Next.js auth
vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  getServerUserId: vi.fn(),
}));
```

**Service Test:**

```typescript
// Mock Prisma client
vi.mock("@/shared/lib", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
  hashPassword: vi.fn(),
}));
```

**Utility Test:**

```typescript
// No mocks needed - pure functions
```

### Partial Mocks

When you need to mock only specific methods:

```typescript
vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");

  return {
    ...actual, // Keep all actual exports
    hashPassword: vi.fn(), // Override specific function
  };
});
```

## Error Handling

### Testing Error Scenarios

**1. Expected errors (business logic):**

```typescript
it("should return CONFLICT error when email already exists", async () => {
  mockPrismaFindUnique.mockResolvedValue({ id: "existing-user" });

  const result = await service.signUp({
    email: "existing@example.com",
    password: "password123",
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.code).toBe(ServiceErrorCode.CONFLICT);
    expect(result.error).toContain("already exists");
  }
});
```

**2. Unexpected errors (infrastructure):**

```typescript
it("should handle database connection errors", async () => {
  mockPrismaFindUnique.mockRejectedValue(new Error("Connection refused"));

  const result = await service.getUser("user-123");

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
    expect(result.error).toContain("Failed to fetch user");
  }
});
```

**3. Third-party API errors:**

```typescript
it("should handle IGDB API timeout", async () => {
  vi.mocked(fetch).mockRejectedValue(new Error("Request timeout"));

  const result = await igdbService.searchGames("zelda");

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.code).toBe(ServiceErrorCode.EXTERNAL_API_ERROR);
  }
});
```

### Error Logging

Services should log errors for debugging:

```typescript
it("should log error when database operation fails", async () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  mockPrismaCreate.mockRejectedValue(new Error("DB error"));

  await service.signUp({ email: "user@example.com", password: "pass" });

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining("Failed to create user"),
    expect.any(Error)
  );

  consoleErrorSpy.mockRestore();
});
```

## Common Patterns

### Pattern 1: Testing Conditional Logic

```typescript
it("should skip email notification if user opted out", async () => {
  const mockSendEmail = vi.fn();
  vi.mocked(emailService.send).mockImplementation(mockSendEmail);

  const user = { id: "user-123", emailOptOut: true };
  mockPrismaFindUnique.mockResolvedValue(user);

  await notificationService.sendWelcomeEmail("user-123");

  expect(mockSendEmail).not.toHaveBeenCalled();
});
```

### Pattern 2: Testing Retry Logic

```typescript
it("should retry failed API call up to 3 times", async () => {
  const mockFetch = vi.mocked(fetch);

  // Fail twice, succeed on third
  mockFetch
    .mockRejectedValueOnce(new Error("Network error"))
    .mockRejectedValueOnce(new Error("Timeout"))
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: "success" })));

  const result = await apiService.fetchData();

  expect(result.success).toBe(true);
  expect(mockFetch).toHaveBeenCalledTimes(3);
});
```

### Pattern 3: Testing Data Transformations

```typescript
it("should transform IGDB game data to internal format", async () => {
  const igdbGameData = {
    id: 12345,
    name: "The Legend of Zelda",
    first_release_date: 851990400, // Unix timestamp
    cover: { image_id: "co3p2d" },
  };

  const result = transformIgdbGame(igdbGameData);

  expect(result).toMatchObject({
    igdbId: 12345,
    title: "The Legend of Zelda",
    releaseDate: new Date("1997-01-01"),
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg",
  });
});
```

### Pattern 4: Testing Pagination

```typescript
it("should paginate results correctly", async () => {
  const mockGames = Array.from({ length: 25 }, (_, i) => ({
    id: `game-${i}`,
    title: `Game ${i}`,
  }));

  mockPrismaFindMany.mockResolvedValue(mockGames.slice(0, 10));

  const result = await service.getGames({ limit: 10, offset: 0 });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toHaveLength(10);
  }

  expect(mockPrismaFindMany).toHaveBeenCalledWith({
    take: 10,
    skip: 0,
  });
});
```

## Best Practices

### ✅ DO:
- Mock only the layer immediately below what you're testing
- Test both success and error paths
- Verify mock calls with correct arguments
- Use type guards to narrow result types
- Test data normalization (lowercase emails, trim whitespace)
- Test edge cases (null values, empty arrays, boundary conditions)
- Use descriptive test names explaining the scenario
- Clear all mocks in `beforeEach()` to prevent test interference

### ❌ DON'T:
- Test implementation details (internal variables, private methods)
- Mock more than one layer deep (e.g., don't mock repositories in server action tests)
- Skip error path testing
- Test third-party library logic (trust Prisma, Zod, etc.)
- Use real database connections in unit tests
- Share mock state between tests (always use `beforeEach()`)

## Running Backend Tests

**Run all backend tests:**

```bash
cd savepoint-app
pnpm test -- --grep="\.unit\.test\.ts$|\.server-action\.test\.ts$"
```

**Run service tests only:**

```bash
pnpm test data-access-layer/services
```

**Run server action tests only:**

```bash
pnpm test -- --grep="\.server-action\.test\.ts$"
```

**Run with coverage:**

```bash
pnpm test:coverage
```

## Complete Service Test Template

```typescript
import { Prisma } from "@prisma/client";
import { prisma, hashPassword } from "@/shared/lib";
import { ServiceErrorCode } from "../types";
import { AuthService } from "./auth-service";

// Mock Prisma client
vi.mock("@/shared/lib", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  hashPassword: vi.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let mockHashPassword: ReturnType<typeof vi.fn>;
  let mockPrismaFindUnique: ReturnType<typeof vi.fn>;
  let mockPrismaCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
    mockHashPassword = vi.mocked(hashPassword);
    mockPrismaFindUnique = vi.mocked(prisma.user.findUnique);
    mockPrismaCreate = vi.mocked(prisma.user.create);
  });

  describe("signUp", () => {
    it("should successfully create a new user", async () => {
      const hashedPassword = "$2a$10$hashed";

      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockPrismaCreate.mockResolvedValue({
        id: "user-123",
        email: "newuser@example.com",
        name: "John Doe",
      });

      const result = await service.signUp({
        email: "NewUser@Example.com",
        password: "securepassword123",
        name: "John Doe",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe("newuser@example.com");
      }

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        select: { id: true },
        where: { email: "newuser@example.com" },
      });
      expect(mockHashPassword).toHaveBeenCalledWith("securepassword123");
    });

    it("should return error when user already exists", async () => {
      mockPrismaFindUnique.mockResolvedValue({ id: "existing-user" });

      const result = await service.signUp({
        email: "existing@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.CONFLICT);
        expect(result.error).toContain("already exists");
      }

      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue("hashed");
      mockPrismaCreate.mockRejectedValue(new Error("DB connection failed"));

      const result = await service.signUp({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });
});
```

## Additional Resources

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [next-safe-action Documentation](https://next-safe-action.dev/)
- Service type definitions: [data-access-layer/services/types.ts](../../data-access-layer/services/types.ts)
- Server action examples: [features/auth/server-actions/](../../features/auth/server-actions/)

---

**Last updated:** January 2025
