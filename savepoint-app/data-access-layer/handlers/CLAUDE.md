# Handlers Layer - Claude Guidelines

See [README.md](./README.md) for comprehensive documentation on the handlers layer.

## Quick Reference

**Purpose**: HTTP request orchestration between API routes and business logic.

**Responsibilities**:
- Input validation (Zod schemas)
- Rate limiting
- Request orchestration
- Response formatting with HTTP status codes
- Structured logging

## When Working on Handlers

### Creating a New Handler

1. Create directory: `handlers/[domain]/`
2. Add types file: `handlers/[domain]/types.ts`
3. Implement handler: `handlers/[domain]/[domain]-handler.ts`
4. Export from `handlers/index.ts`
5. Write both unit and integration tests

### Handler Template

```typescript
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import type { HandlerResult, RequestContext } from "../types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "MyHandler" });

export async function myHandler(
  input: Input,
  context: RequestContext
): Promise<HandlerResult<Output>> {
  // 1. Validate input
  // 2. Check rate limiting
  // 3. Call service/use-case
  // 4. Return structured result
}
```

## Import Rules (ESLint Enforced)

```typescript
// ✅ Handlers can import
import { SomeService } from "@/data-access-layer/services";
import { someUseCase } from "@/features/x/use-cases";

// ❌ Handlers CANNOT import
import { repository } from "@/data-access-layer/repository";  // Must use services
```

**Only API routes can import handlers** - violations fail CI.

## Testing Requirements

| Test Type | Suffix | Purpose |
|-----------|--------|---------|
| Unit | `.unit.test.ts` | Mock services, test validation |
| Integration | `.integration.test.ts` | Real services, MSW-mocked APIs |

## Common Mistakes to Avoid

1. ❌ Putting business logic in handlers (use services)
2. ❌ Importing repositories directly (use services)
3. ❌ Using handlers in server actions (use services/use-cases)
4. ❌ Throwing errors (return HandlerResult with status)

## Existing Handlers

- `game-search/` - Public game search with rate limiting
- `library/` - Library operations
- `platform/` - Platform metadata
