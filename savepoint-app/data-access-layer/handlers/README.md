# Handlers Layer

The handlers layer sits between HTTP endpoints (API routes, potentially server actions) and business logic (services, use-cases). Handlers orchestrate requests by handling cross-cutting concerns and coordinating business operations.

## Purpose

Handlers provide a clean separation between HTTP transport concerns and business logic by:

- **Input validation** - Using Zod schemas to validate and parse request data
- **Rate limiting** - Applying request throttling at the handler level
- **Request orchestration** - Coordinating calls to services and use-cases
- **Response formatting** - Structuring responses with appropriate HTTP status codes
- **Error handling** - Converting service/use-case errors to handler results
- **Logging** - Structured logging with `LOGGER_CONTEXT.HANDLER`

## Architecture Position

```
┌─────────────────────────────────┐
│  App Router / API Routes        │  HTTP adapter (NextResponse, headers, caching)
│  (app/api/**/route.ts)          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Handlers Layer                  │  ◄─── YOU ARE HERE
│  (data-access-layer/handlers/)  │  Validation, rate limiting, orchestration
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Service / Use-Case Layer        │  Business logic, external APIs
│  (data-access-layer/services/)  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Repository Layer                │  Data access (Prisma)
│  (data-access-layer/repository/)│
└─────────────────────────────────┘
```

## When to Use Handlers

| Use Handlers For | Don't Use Handlers For |
|------------------|------------------------|
| ✅ API route business logic | ❌ Direct usage in React components |
| ✅ Public endpoints with rate limiting | ❌ Server Actions (use services/use-cases) |
| ✅ Request validation and orchestration | ❌ Internal service-to-service calls |
| ✅ Coordinating multiple services | ❌ Direct database operations |

## Handler vs Service vs Use-Case

| Concern | Handler | Service | Use-Case |
|---------|---------|---------|----------|
| **Purpose** | HTTP request orchestration | Single-domain business logic | Multi-service orchestration |
| **Validation** | Request-level (Zod) | Business-level (Zod) | Coordination logic |
| **Rate Limiting** | ✅ Yes | ❌ No | ❌ No |
| **Can Import** | Handlers, use-cases, services, shared | Services, repositories, shared | Services, shared |
| **Imported By** | API routes only | Handlers, use-cases, server actions | Handlers, server actions, pages |
| **Returns** | `HandlerResult<T>` (with HTTP status) | `ServiceResult<T>` | Custom result types |
| **Example** | `gameSearchHandler` | `IgdbService` | `getGameDetails` |

## File Structure

```
handlers/
├── types.ts                       # Shared handler types
├── index.ts                       # Exports
├── README.md                      # This file
└── game-search/                   # Feature-specific handler
    ├── game-search-handler.ts     # Handler implementation
    ├── game-search-handler.unit.test.ts
    ├── game-search-handler.integration.test.ts
    └── types.ts                   # Handler input/output types
```

## Creating a New Handler

### 1. Define Types

```typescript
// handlers/my-feature/types.ts
export interface MyFeatureHandlerInput {
  query: string;
  options?: MyOptions;
}

export interface MyFeatureHandlerOutput {
  results: MyResult[];
  metadata: Metadata;
}
```

### 2. Implement Handler

```typescript
// handlers/my-feature/my-feature-handler.ts
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import type { HandlerResult, RequestContext } from "../types";
import type { MyFeatureHandlerInput, MyFeatureHandlerOutput } from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "MyFeatureHandler" });

export async function myFeatureHandler(
  input: MyFeatureHandlerInput,
  context: RequestContext
): Promise<HandlerResult<MyFeatureHandlerOutput>> {
  logger.info({ ...input, ip: context.ip }, "Processing request");

  // 1. Validate input
  const validation = MyFeatureSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid input parameters",
      status: 400,
    };
  }

  // 2. Check rate limiting (if applicable)
  const rateLimitResult = checkRateLimit({
    ip: context.ip,
    headers: context.headers,
  });

  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: "Rate limit exceeded",
      status: 429,
      headers: {
        "X-RateLimit-Limit": "20",
        "Retry-After": "3600",
      },
    };
  }

  // 3. Call service/use-case
  const service = new MyService();
  const result = await service.doSomething(validation.data);

  if (!result.success) {
    logger.error({ err: result.error }, "Service error");
    return {
      success: false,
      error: result.error || "Operation failed",
      status: 500,
    };
  }

  logger.info({ resultCount: result.data.length }, "Request successful");

  return {
    success: true,
    data: result.data,
    status: 200,
  };
}
```

### 3. Use in API Route

```typescript
// app/api/my-feature/route.ts
import { myFeatureHandler } from "@/data-access-layer/handlers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";

  // Extract request context
  const context = {
    ip: request.ip ?? "127.0.0.1",
    headers: request.headers,
    url: request.nextUrl,
  };

  // Call handler
  const result = await myFeatureHandler({ query }, context);

  // Transform to NextResponse
  if (!result.success) {
    const response = NextResponse.json(
      { error: result.error },
      { status: result.status }
    );

    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        response.headers.set(key, String(value));
      });
    }

    return response;
  }

  return NextResponse.json(result.data, { status: result.status });
}
```

### 4. Write Tests

Create both unit and integration tests:

**Unit Tests** (`*.unit.test.ts`):
- Mock all services
- Fast execution
- Test validation, error handling, rate limiting logic
- Run in "backend" Vitest project

**Integration Tests** (`*.integration.test.ts`):
- Real services with MSW-mocked external APIs
- Test end-to-end flow
- Slower execution
- Run in "integration" Vitest project

## ESLint Boundaries

The project enforces architectural boundaries using `eslint-plugin-boundaries`:

### Handler Restrictions

✅ **Handlers can import:**
- Other handlers (for shared utilities)
- Use-cases (for multi-service orchestration)
- Services (for single-domain operations)
- Shared utilities

❌ **Handlers cannot import:**
- Repositories (must go through services)
- Prisma client (must use repositories via services)

### Who Can Import Handlers

✅ **Only API routes** (`app/api/**/*`) can import handlers

❌ **Cannot import handlers:**
- Server Actions (use services/use-cases instead)
- UI Components (use server actions)
- Services (wrong direction)
- Use-cases (wrong direction)

**Violations will fail ESLint checks**. This prevents architectural mistakes like:
- Services calling handlers (wrong direction)
- Handlers bypassing services to call repositories
- UI components directly using handler logic

## Best Practices

### Do's ✅

1. **Use structured logging** with `LOGGER_CONTEXT.HANDLER`
2. **Validate all inputs** with Zod schemas
3. **Return structured results** with `HandlerResult<T>` type
4. **Keep handlers thin** - delegate to services/use-cases
5. **Test comprehensively** - both unit and integration tests
6. **Use TypeScript strictly** - no `any` types

### Don'ts ❌

1. **Don't put business logic** in handlers - use services
2. **Don't import repositories** - use services instead
3. **Don't bypass validation** - always validate inputs
4. **Don't throw errors** - return `HandlerResult` with error status
5. **Don't call other handlers** for business logic - use services
6. **Don't use handlers in server actions** - they're for API routes

## Testing Strategy

### Unit Tests
```typescript
// Mock all dependencies
vi.mock("@/data-access-layer/services/my-service");

describe("myFeatureHandler", () => {
  it("should validate input", async () => {
    const result = await myFeatureHandler(
      { query: "ab" }, // Too short
      mockContext
    );

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
  });

  it("should handle service errors", async () => {
    mockService.mockResolvedValue({
      success: false,
      error: "Service unavailable",
    });

    const result = await myFeatureHandler(validInput, mockContext);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
  });
});
```

### Integration Tests
```typescript
// Use MSW to mock external APIs
const server = setupServer(
  http.post("https://api.example.com/endpoint", () => {
    return HttpResponse.json({ data: "mock" });
  })
);

describe("myFeatureHandler Integration", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("should handle end-to-end flow", async () => {
    const result = await myFeatureHandler(validInput, mockContext);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

## Related Documentation

- [Service Layer README](../services/README.md)
- [Use-Case Pattern](../../features/game-detail/use-cases/)
- [CLAUDE.md Architecture Guidelines](../../../CLAUDE.md)

## Examples

For a complete working example, see:
- [game-search-handler.ts](./game-search/game-search-handler.ts)
- [game-search-handler.unit.test.ts](./game-search/game-search-handler.unit.test.ts)
- [game-search-handler.integration.test.ts](./game-search/game-search-handler.integration.test.ts)
