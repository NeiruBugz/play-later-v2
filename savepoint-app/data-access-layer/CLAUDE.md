# Data Access Layer

This directory contains the abstraction layer between the application and data sources. It provides a clean separation between business logic and data persistence through four sublayers.

## Purpose

The Data Access Layer:
- Abstracts database operations behind clean interfaces
- Implements business logic that throws typed errors on failure
- Provides HTTP request orchestration for API routes
- Maps between Prisma models and domain types

## Architecture Overview

```
API Routes / Server Actions
         ↓
┌─────────────────────────────────────────┐
│           DATA ACCESS LAYER             │
├─────────────────────────────────────────┤
│  handlers/    │ HTTP orchestration      │
│               │ (validation, rate limit)│
├───────────────┼─────────────────────────┤
│  services/    │ Business logic          │
│               │ (typed-throw)           │
├───────────────┼─────────────────────────┤
│  repository/  │ Data access             │
│               │ (Prisma operations)     │
├───────────────┼─────────────────────────┤
│  domain/      │ Domain models           │
│               │ (Mappers, enums)        │
└─────────────────────────────────────────┘
         ↓
    PostgreSQL
```

## Layer Responsibilities

| Layer | Responsibility | Returns |
|-------|---------------|---------|
| **Handlers** | Request validation, rate limiting, orchestration | `HandlerResult<TData>` |
| **Services** | Business logic, external APIs | Raw data; throws typed errors on failure |
| **Repository** | Direct Prisma operations, no business logic | Raw data (`T`, `T \| null`, `T[]`); throws typed errors on failure |
| **Domain** | Type mapping, enums, DTOs | Domain types |

## Data Flow Rules

```typescript
// ✅ Correct flow
API Route → Handler → Service → Repository → Database

// ✅ Server actions can skip handlers
Server Action → Service → Repository → Database

// ✅ Use-cases orchestrate services
Use-Case → [Service A, Service B] → Repository → Database

// ❌ Wrong: Handler accessing repository directly
Handler → Repository  // Skip service layer

// ❌ Wrong: Service calling another service
Service A → Service B  // Use use-cases instead
```

## Import Rules (ESLint Enforced)

```typescript
// handlers/ can import:
import { SomeService } from "@/data-access-layer/services";
import { someUseCase } from "@/features/x/use-cases";

// handlers/ CANNOT import:
import { gameRepository } from "@/data-access-layer/repository";  // ❌

// services/ can import:
import { findGameById } from "@/data-access-layer/repository";

// services/ CANNOT import:
import { otherService } from "@/data-access-layer/services/other";  // ❌

// repository/ can import:
import { prisma } from "@/shared/lib/db";

// Only API routes can import handlers:
// app/api/**/*.ts → handlers ✅
// features/**/*.ts → handlers ❌
```

## Error Model

Repositories and services throw **typed errors** on failure. Edges (server actions, API route handlers, RSC pages) catch and serialize. The full design rationale is in [`context/decisions/DAL_TYPED_THROW.md`](../../context/decisions/DAL_TYPED_THROW.md).

### Catalog

Generic typed errors live in `@/shared/lib/errors`, all extending an abstract `DomainError` with a structured `context` field:

| Class | Default HTTP status (via `mapErrorToHandlerResult`) |
|---|---|
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `UnauthorizedError` | 401 |
| `RateLimitError` | 429 (surfaces `Retry-After` from `context.retryAfter`) |
| `ExternalServiceError` | 503 |
| `ZodError` (from Zod itself) | 400 |

Domain-specific subclasses are co-located with their service:
- `services/igdb/errors.ts` — `IgdbRateLimitError extends RateLimitError`
- `services/steam/errors.ts` — `SteamProfilePrivateError extends ExternalServiceError`, `SteamApiUnavailableError extends ExternalServiceError`

### How errors propagate

```typescript
// repository
async function requireGameById(id: string): Promise<Game> {
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) throw new NotFoundError("Game not found", { gameId: id });
  return game;
}

// service — no Result wrapping
async function getGameDetails(id: string): Promise<Game> {
  return requireGameById(id);
}

// handler — catches and maps to HandlerResult
try {
  const game = await gameService.getGameDetails(id);
  return { success: true, data: game, status: 200 };
} catch (error) {
  return mapErrorToHandlerResult(error, logger);
}

// server action — wrapper at shared/lib/server-action/create-server-action.ts
//                 already catches and serializes throws into ActionResult.error

// RSC page — try-then-render (react-hooks/error-boundaries lint rule
//            forbids JSX inside try/catch)
let game: Game;
try {
  game = await gameService.getGameDetails(id);
} catch (error) {
  if (error instanceof NotFoundError) notFound();
  throw error;
}
return <GameView game={game} />;
```

### Per-handler status overrides

Handlers can override the default `mapErrorToHandlerResult` mapping with explicit `instanceof` checks before delegating. Example: `fetch-steam-games.handler.ts` returns 403 for `SteamProfilePrivateError` instead of the default 503 for `ExternalServiceError`.

## Adding New Functionality

### Adding a New Service
1. Create directory: `services/[domain]/`
2. Create types: `services/[domain]/types.ts`
3. Create service: `services/[domain]/[domain]-service.ts`
4. Export from `services/index.ts`
5. Add unit tests with mocked repositories

### Adding a New Repository
1. Create directory: `repository/[domain]/`
2. Create repository: `repository/[domain]/[domain]-repository.ts`
3. Create types if needed: `repository/[domain]/types.ts`
4. Export from `repository/index.ts`
5. Add integration tests

### Adding a New Handler
1. Create directory: `handlers/[domain]/`
2. Create handler: `handlers/[domain]/[domain]-handler.ts`
3. Create types: `handlers/[domain]/types.ts`
4. Export from `handlers/index.ts`
5. Add unit and integration tests

## Logging

Use structured logging with the appropriate context:

```typescript
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

// In services
const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "GameService" });

// In handlers
const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "GameSearchHandler" });
```

Errors are logged **once at the edge** (server action wrapper, handler `catch`, page error boundary). Typed errors carry structured `context` so the edge log line has full data without re-deriving it. Do not log-and-rethrow inside services or repositories.

## Trip-wires

Non-obvious gotchas that have caused real bugs.

### Class identity matters for typed errors

Always import typed errors from `@/shared/lib/errors` (or the co-located `services/<domain>/errors.ts` for domain-specific subclasses). Never import them via any other path. `instanceof` checks compare prototype chains; the same class name imported via two different module paths is not the same class — `instanceof` will silently return `false` and `mapErrorToHandlerResult` will fall through to 500.

### Service-to-service calls are forbidden

If service A needs service B, create a use-case in `features/<name>/use-cases/` that orchestrates both. Services that import other services trigger ESLint errors and indicate a missing use-case.

### Handlers must skip the repository

Handlers → services → repositories. A handler importing from `repository/` is always wrong; lift the call into a service.

### Server actions skip handlers

Server actions go directly: action → service (or use-case) → repository. Handlers exist only for API routes.

### Logging context is mandatory

Use `createLogger({ [LOGGER_CONTEXT.SERVICE]: "Name" })` (or `.HANDLER` / `.REPOSITORY`). Untagged logs make production debugging painful.

## Testing Strategy

| Layer | Test Type | Database |
|-------|-----------|----------|
| Handlers | Unit + Integration | Mocked / Real |
| Services | Unit | Mocked repositories |
| Repository | Integration | Real database |
| Domain | Unit | None |

See individual layer CLAUDE.md files for detailed testing guidance.
