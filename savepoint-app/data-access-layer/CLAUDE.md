# Data Access Layer

This directory contains the abstraction layer between the application and data sources. It provides a clean separation between business logic and data persistence through four sublayers.

## Purpose

The Data Access Layer:
- Abstracts database operations behind clean interfaces
- Implements business logic with the Result pattern
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
│               │ (Result pattern)        │
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
| **Services** | Business logic, external APIs, validation | `ServiceResult<TData, TError>` |
| **Repository** | Direct Prisma operations, no business logic | Prisma types or domain types |
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

## Result Pattern

All services return structured results instead of throwing errors:

```typescript
// Type definition
type ServiceResult<TData, TError = ServiceError> =
  | { success: true; data: TData }
  | { success: false; error: TError };

// Usage
const result = await gameService.searchGames(query);
if (result.success) {
  return result.data;
} else {
  console.error(result.error.code, result.error.message);
}
```

## Adding New Functionality

### Adding a New Service
1. Create directory: `services/[domain]/`
2. Create types: `services/[domain]/types.ts`
3. Create service: `services/[domain]/[domain]-service.ts`
4. Export from `services/index.ts`
5. Add unit tests

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

## Trip-wires

Non-obvious gotchas that have caused real bugs.

### Result type shapes are NOT interchangeable

| Type | Discriminator | Defined in |
|------|---------------|------------|
| `RepositoryResult<T>` | `.ok` (true/false) | `repository/errors.ts` |
| `ServiceResult<T, E>` | `.success` (true/false) | `services/types.ts` |
| `HandlerResult<T>` | `.success` (true/false) | `handlers/types.ts` |

Destructuring `.ok` on a `ServiceResult` or `HandlerResult` yields `undefined` — silent bug. When forwarding a repository result up through a service, transform the shape; do not pass it through.

### Some repository functions return plain rows, not `RepositoryResult`

For example, `updateUserProfile` in `repository/user/user-repository.ts` returns the user row directly. Always read the function's return type before assuming a Result wrapper. Tests that call these via `expect(result.ok).toBe(true)` are buggy (see `test/guides/INTEGRATION_TESTING.md` — known stale).

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
