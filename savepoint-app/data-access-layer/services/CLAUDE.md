# Services Layer - Claude Guidelines

See [README.md](./README.md) for comprehensive documentation on the service layer.

## Quick Reference

**Purpose**: Business logic layer implementing the Result pattern for type-safe error handling.

**Core Principles**:
- Stateless operations (instantiated per request)
- Result-based errors (no thrown exceptions)
- Repository delegation (never direct Prisma)
- Input validation (Zod schemas at boundaries)
- Structured logging (Pino with LOGGER_CONTEXT.SERVICE)

## Available Services

| Service | Purpose |
|---------|---------|
| `ProfileService` | User profile and library stats |
| `AuthService` | Sign-up/sign-in (credentials only) |
| `IgdbService` | IGDB API client (game search, details, franchises) |
| `LibraryService` | Library item operations |
| `JournalService` | Journal entry management |
| `PlatformService` | Platform metadata |
| `GameDetailService` | Game detail aggregation |
| `GameService` | Basic game lookups by ID |
| `OnboardingService` | 5-step onboarding checklist tracking |
| `SteamService` | Steam Web API (owned games, player summary, connect/disconnect) |
| `SteamOpenIdService` | Steam OpenID authentication flow |
| `ImportedGameService` | Imported games management (find, dismiss, status updates) |

## When Working on Services

### Creating a New Service

1. Create directory: `services/[domain]/`
2. Define types: `services/[domain]/types.ts`
3. Implement service extending `BaseService`
4. Export from `services/index.ts`
5. Add unit tests with mocked repositories

### Service Template

```typescript
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";
import { findSomething } from "@/data-access-layer/repository";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "MyService" });

export class MyService extends BaseService {
  async getSomething(input: Input): Promise<ServiceResult<Output>> {
    logger.info({ ...input }, "Getting something");

    // 1. Validate input
    const validation = MySchema.safeParse(input);
    if (!validation.success) {
      return this.error("Invalid input", ServiceErrorCode.VALIDATION_ERROR);
    }

    // 2. Call repository
    const data = await findSomething(validation.data.id);
    if (!data) {
      return this.error("Not found", ServiceErrorCode.NOT_FOUND);
    }

    // 3. Return success
    return this.success({ data });
  }
}
```

## Import Rules

```typescript
// ✅ Services can import
import { findGameById } from "@/data-access-layer/repository";
import { LibraryItemMapper } from "@/data-access-layer/domain";

// ❌ Services CANNOT import
import { OtherService } from "@/data-access-layer/services/other";  // Use use-cases
import { gameHandler } from "@/data-access-layer/handlers";          // Wrong direction
```

**Services NEVER call other services** - use use-cases for orchestration.

## Result Pattern

```typescript
// Success
return this.success({ profile, stats });

// Error
return this.error("User not found", ServiceErrorCode.NOT_FOUND);
```

## Testing Requirements

- Unit tests with mocked repositories
- Test all error paths
- Verify logging calls

```typescript
vi.mock("@/data-access-layer/repository");

describe("ProfileService", () => {
  it("returns NOT_FOUND when user does not exist", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);

    const result = await service.getProfile({ userId: "xxx" });

    expect(result.success).toBe(false);
    expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
  });
});
```

## Security Guidelines

1. **Always validate userId** from authenticated session
2. **Never accept userId from client input** without verification
3. Use `authorizedActionClient` in server actions
4. Repository functions enforce restrictive defaults

## Common Mistakes to Avoid

1. ❌ Calling other services (use use-cases)
2. ❌ Direct Prisma calls (use repositories)
3. ❌ Throwing errors (return ServiceResult)
4. ❌ Trusting client-provided userId
