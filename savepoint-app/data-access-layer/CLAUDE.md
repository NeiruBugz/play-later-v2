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

## Directory Structure

```
data-access-layer/
├── handlers/             # HTTP request orchestration
│   ├── game-search/      # Game search handler
│   ├── library/          # Library handlers
│   ├── platform/         # Platform handlers
│   └── types.ts          # Handler types (HandlerResult)
│
├── services/             # Business logic layer
│   ├── auth/             # Authentication service
│   ├── igdb/             # IGDB API client
│   ├── library/          # Library operations
│   ├── journal/          # Journal service
│   ├── profile/          # Profile service
│   ├── platform/         # Platform service
│   ├── game-detail/      # Game detail aggregation
│   └── types.ts          # Service types (ServiceResult)
│
├── repository/           # Data access (Prisma only)
│   ├── game/             # Game repository
│   ├── library/          # Library repository
│   ├── journal/          # Journal repository
│   ├── platform/         # Platform repository
│   ├── user/             # User repository
│   └── genre/            # Genre repository
│
├── domain/               # Domain models and mappers
│   ├── library/          # LibraryItem mapper
│   ├── journal/          # JournalEntry mapper
│   └── platform/         # Platform mapper
│
└── index.ts              # Main exports
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

## Testing Strategy

| Layer | Test Type | Database |
|-------|-----------|----------|
| Handlers | Unit + Integration | Mocked / Real |
| Services | Unit | Mocked repositories |
| Repository | Integration | Real database |
| Domain | Unit | None |

See individual layer CLAUDE.md files for detailed testing guidance.
