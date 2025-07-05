# 03 - Authentication Security Patterns

## Problem Statement

The codebase has **critical security vulnerabilities** due to inconsistent authentication patterns and insufficient user ownership verification. Some operations don't properly verify that users can only access/modify their own data.

### Critical Security Issues Identified

#### ❌ Issue 1: Inconsistent User Ownership Verification

```typescript
// ❌ CRITICAL: No ownership verification
// features/manage-user-info/server-actions/get-user-info.ts
export async function getUserInfo(userId?: string) {
  try {
    const serverUserId = await getServerUserId();
    if (!serverUserId) {
      throw new Error("Can't find user");
    }
    // BUG: Can access ANY user's info by passing different userId
    const user = await prisma.user.findUnique({
      where: { id: userId ?? serverUserId }, // ❌ No ownership check!
      select: { id: true, name: true, username: true, email: true },
    });
    return user;
  } catch (error) {
    console.error(error); // ❌ Silent failure
  }
}
```

#### ❌ Issue 2: Silent Authentication Failures

```typescript
// ❌ CRITICAL: Silent failures allow unauthorized access
// features/view-collection/server-actions/get-uniques-platforms.ts
export async function getUserUniquePlatforms(): Promise<(string | null)[]> {
  const userId = await getServerUserId();

  try {
    const platforms = await prisma.backlogItem.findMany({
      where: {
        userId: userId, // ❌ If userId is undefined, returns ALL platforms!
      },
      select: { platform: true },
      distinct: ["platform"],
    });
    return platforms.map((item) => item.platform).filter(Boolean);
  } catch (error) {
    console.error("Error fetching user game collection:", error);
    return []; // ❌ Silent failure
  }
}
```

#### ❌ Issue 3: Database Queries Without Proper Filtering

```typescript
// ❌ CRITICAL: Potential data leakage
// features/manage-user-info/server-actions/get-user-by-username.ts
export async function getUserByUsername(username: string) {
  try {
    return await prisma.user.findFirst({
      where: { username },
    }); // ❌ Returns full user object including sensitive data
  } catch (error) {
    console.error(error);
  }
}
```

## Security Standards and Patterns

### 1. User Ownership Verification Pattern

#### ✅ Standard Pattern for User Data Access

```typescript
// shared/lib/security-utils.ts
import { getServerUserId } from "@/auth";
import { AuthenticationError, AuthorizationError } from "@/domain/shared/errors";
import { failure, Result, success } from "@/domain/shared/result";

export const requireUserOwnership = async (
  resourceUserId: string
): Promise<Result<string, AuthenticationError | AuthorizationError>> => {
  const currentUserId = await getServerUserId();

  if (!currentUserId) {
    return failure(new AuthenticationError("User not authenticated"));
  }

  if (currentUserId !== resourceUserId) {
    return failure(new AuthorizationError("Access denied: insufficient permissions"));
  }

  return success(currentUserId);
};

export const requireAuthentication = async (): Promise<Result<string, AuthenticationError>> => {
  const userId = await getServerUserId();

  if (!userId) {
    return failure(new AuthenticationError("User not authenticated"));
  }

  return success(userId);
};
```

#### ✅ Secure User Info Access

```typescript
// features/manage-user-info/server-actions/get-user-info.ts (FIXED)
"use server";

import { authenticatedActionClient } from "@/shared/lib/safe-action-client";
import { requireUserOwnership } from "@/shared/lib/security-utils";
import { prisma } from "@/shared/lib/db";
import { z } from "zod";

const GetUserInfoSchema = z.object({
  userId: z.string().optional(),
});

export const getUserInfo = authenticatedActionClient
  .metadata({
    actionName: "getUserInfo",
  })
  .inputSchema(GetUserInfoSchema)
  .action(async ({ parsedInput: { userId }, ctx: { userId: currentUserId } }) => {
    const targetUserId = userId ?? currentUserId;

    // ✅ SECURITY: Verify user can only access their own data
    const ownershipResult = await requireUserOwnership(targetUserId);
    if (ownershipResult.isFailure) {
      throw new Error(ownershipResult.error.message);
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        username: true,
        steamProfileURL: true,
        steamConnectedAt: true,
        email: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return { user };
  });
```

### 2. Secure Database Query Patterns

#### ✅ Always Filter by Authenticated User

```typescript
// features/view-collection/server-actions/get-uniques-platforms.ts (FIXED)
"use server";

import { authenticatedActionClient } from "@/shared/lib/safe-action-client";
import { prisma } from "@/shared/lib/db";

export const getUserUniquePlatforms = authenticatedActionClient
  .metadata({
    actionName: "getUserUniquePlatforms",
  })
  .inputSchema(z.object({})) // No input required
  .action(async ({ ctx: { userId } }) => {
    // ✅ SECURITY: Always filter by authenticated user
    const platforms = await prisma.backlogItem.findMany({
      where: {
        userId, // ✅ userId is guaranteed to exist from auth middleware
      },
      select: {
        platform: true,
      },
      distinct: ["platform"],
    });

    return {
      platforms: platforms.map((item) => item.platform).filter(Boolean),
    };
  });
```

#### ✅ Secure Public Data Access

```typescript
// features/manage-user-info/server-actions/get-user-by-username.ts (FIXED)
"use server";

import { publicActionClient } from "@/shared/lib/safe-action-client";
import { prisma } from "@/shared/lib/db";
import { z } from "zod";

const GetUserByUsernameSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export const getUserByUsername = publicActionClient
  .metadata({
    actionName: "getUserByUsername",
    requiresAuth: false,
  })
  .inputSchema(GetUserByUsernameSchema)
  .action(async ({ parsedInput: { username } }) => {
    const user = await prisma.user.findFirst({
      where: { username },
      select: {
        // ✅ SECURITY: Only return safe, public fields
        id: true,
        username: true,
        name: true,
        // ❌ Never return: email, steamId64, internal IDs
      },
    });

    return { user };
  });
```

### 3. Enhanced Error Types for Security

```typescript
// domain/shared/errors.ts (Enhanced)
export class AuthorizationError extends DomainError {
  constructor(message = "Access denied", cause?: unknown) {
    super(message, cause);
  }
}

export class ForbiddenError extends DomainError {
  constructor(resource: string, action: string, cause?: unknown) {
    super(`Forbidden: Cannot ${action} ${resource}`, cause);
  }
}

export class ResourceNotFoundError extends DomainError {
  constructor(resource: string, identifier: string, cause?: unknown) {
    super(`${resource} not found: ${identifier}`, cause);
  }
}
```

### 4. Secure Action Client Configuration

```typescript
// shared/lib/safe-action-client.ts (Enhanced Security)
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { getServerUserId } from "@/auth";

// Enhanced error handling with security considerations
const safeActionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
      requiresAuth: z.boolean().default(true),
      requiresOwnership: z.boolean().default(false),
    });
  },
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error, { metadata }) => {
    // ✅ SECURITY: Don't leak internal error details
    if (error.message.includes("Authentication") || error.message.includes("Authorization")) {
      return error.message; // Safe to return auth errors
    }

    // Log internal errors for debugging but don't expose them
    console.error("Server action error:", {
      actionName: metadata?.actionName,
      error: error.message,
      stack: error.stack,
    });

    return "Something went wrong. Please try again.";
  },
});

export const authenticatedActionClient = safeActionClient.use(async ({ next, metadata }) => {
  if (metadata.requiresAuth) {
    const userId = await getServerUserId();
    if (!userId) {
      throw new Error("Authentication required. Please sign in to continue.");
    }
    return next({ ctx: { userId } });
  }
  return next({ ctx: {} });
});
```

## Critical Files Requiring Immediate Security Fixes

### High Priority (Data Breach Risk)

#### 1. Authentication Operations

```typescript
// ❌ CRITICAL SECURITY RISK - Fix immediately
features/manage-user-info/server-actions/get-user-info.ts
- Issue: Can access any user's data
- Fix: Add ownership verification
- Risk: Personal data exposure

features/manage-user-info/server-actions/get-user-by-username.ts
- Issue: Returns sensitive user data
- Fix: Limit to public fields only
- Risk: Email/personal data leakage
```

#### 2. Data Access Operations

```typescript
// ❌ SECURITY RISK - Silent failures allow unauthorized access
features/view-collection/server-actions/get-uniques-platforms.ts
- Issue: Silent auth failure returns all platforms
- Fix: Proper auth verification
- Risk: Data enumeration

features/view-collection/server-actions/get-game-with-backlog-items.ts
- Issue: console.error instead of proper error handling
- Fix: Structured error handling
- Risk: Silent data access failures

features/view-backlogs/server-actions/get-backlogs.ts
- Issue: No ownership verification patterns
- Fix: Verify user can only see their backlogs
- Risk: Cross-user data access
```

#### 3. Integration Operations

```typescript
// ❌ POTENTIAL SECURITY RISK
features/steam-integration/server-actions/get-achievements.ts
- Issue: Limited validation of Steam data
- Fix: Enhanced input validation
- Risk: API abuse/data injection

features/manage-integrations/components/integrations-list.tsx
- Issue: Inline server action without proper validation
- Fix: Extract to proper server action with validation
- Risk: CSRF/data tampering
```

## Security Implementation Checklist

### For Each Server Action:

#### Authentication & Authorization

- [ ] ✅ Uses `authenticatedActionClient` for protected operations
- [ ] ✅ Verifies user ownership for user-specific data
- [ ] ✅ Uses `publicActionClient` only for genuinely public data
- [ ] ✅ Never returns sensitive fields in public operations

#### Input Validation

- [ ] ✅ All inputs validated with Zod schemas
- [ ] ✅ No direct FormData access without validation
- [ ] ✅ SQL injection prevention through Prisma
- [ ] ✅ XSS prevention through proper sanitization

#### Error Handling

- [ ] ✅ No sensitive information leaked in error messages
- [ ] ✅ Authentication/authorization errors properly handled
- [ ] ✅ Database errors logged but not exposed
- [ ] ✅ No silent failures that could indicate security issues

#### Database Queries

- [ ] ✅ Always filter by authenticated user ID
- [ ] ✅ Use select to limit returned fields
- [ ] ✅ Verify ownership before update/delete operations
- [ ] ✅ Use transactions for multi-step operations

## Security Testing Strategy

### Unit Tests Required for Each Secure Action:

```typescript
describe("Security Tests", () => {
  it("should reject unauthenticated requests", async () => {
    // Mock no authentication
    // Verify error is thrown
  });

  it("should reject cross-user access attempts", async () => {
    // Mock different user ID in request
    // Verify ownership error is thrown
  });

  it("should not leak sensitive data in responses", async () => {
    // Verify response only contains expected fields
  });

  it("should handle database errors securely", async () => {
    // Mock database error
    // Verify generic error message returned
  });
});
```

## Migration Priority Order

### Week 1: Critical Data Breach Risks

1. `get-user-info.ts` - Can access any user's data
2. `get-user-by-username.ts` - Leaks sensitive data
3. `get-uniques-platforms.ts` - Silent auth failures

### Week 2: Data Access Patterns

4. `get-game-with-backlog-items.ts` - Improve error handling
5. `get-backlogs.ts` - Add ownership verification
6. `integrations-list.tsx` - Extract inline actions

### Week 3: Enhancement & Validation

7. `steam-integration` actions - Enhanced validation
8. Add security middleware for cross-cutting concerns
9. Implement security audit logging

---

**Next Document**: [04-error-handling-standardization.md](./04-error-handling-standardization.md)
