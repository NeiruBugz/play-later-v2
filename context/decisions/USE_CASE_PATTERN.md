# ADR: Use-Case Pattern for Multi-Service Orchestration

**Status**: Accepted
**Date**: 2025-01-06
**Deciders**: Architecture Team
**Related**: [CLAUDE.md - Use-Case Pattern](../../CLAUDE.md#use-case-pattern)

## Context

As the SavePoint application evolved, we encountered a critical architectural challenge: how to handle operations that require coordination across multiple domain services. Initially, there was ambiguity about whether services should call other services or if a separate orchestration layer was needed.

### Problem Statement

When implementing features like "Game Details Page," we need to:
1. Fetch game metadata from IGDB (IgdbService)
2. Fetch user's library items for that game (LibraryService)
3. Fetch user's journal entries for that game (JournalService)

**Question**: Where should this orchestration logic live?

**Options Considered**:
1. **Service-to-Service Calls**: Let one service call others (e.g., IgdbService calls LibraryService)
2. **Fat Services**: Create mega-services that handle multiple domains
3. **Use-Case Pattern**: Introduce an orchestration layer between presentation and services

## Decision

We adopt the **Use-Case Pattern** as the standard approach for orchestrating multiple services.

**Core Principle**: **Services MUST NOT call other services.** When multiple services need coordination, create a use-case.

## Rationale

### Why NOT Service-to-Service Calls?

❌ **Tight Coupling**: Services become dependent on each other, making changes risky
❌ **Hidden Dependencies**: Call chains become difficult to trace and debug
❌ **Circular Dependencies**: Risk of import cycles (A → B → C → A)
❌ **Testing Complexity**: Mocking becomes exponentially harder
❌ **Single Responsibility Violation**: Services take on orchestration concerns

### Why Use-Cases? ✅

✅ **Clear Separation of Concerns**: Services focus on single-domain logic; use-cases handle orchestration
✅ **Explicit Dependencies**: All service dependencies are visible at the use-case level
✅ **Testability**: Mock services at the boundary, test orchestration independently
✅ **Maintainability**: Changes to orchestration don't affect service implementations
✅ **Flexibility**: Easy to add/remove services from a workflow
✅ **Discoverability**: Use-cases document complete business workflows

## Architecture

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  (Pages, Server Actions, API Routes)│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Use-Case Layer                     │
│  features/*/use-cases/              │
│  - Orchestrate multiple services    │
│  - Handle cross-domain workflows    │
│  - Aggregate and transform results  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Service Layer                      │
│  data-access-layer/services/        │
│  - Single-domain business logic     │
│  - External API integrations        │
│  - NO service-to-service calls      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Repository Layer                   │
│  data-access-layer/repository/      │
│  - Direct database operations       │
│  - Domain-organized CRUD            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Data Layer                         │
│  Prisma ORM → PostgreSQL            │
└─────────────────────────────────────┘
```

## Implementation Guidelines

### When to Use a Use-Case

| Scenario | Pattern |
|----------|---------|
| Operation needs **one service** | Call service directly from presentation layer |
| Operation needs **2+ services** | Create a use-case |
| Complex business workflow spanning domains | Create a use-case |
| Simple CRUD on single entity | Call service (which calls repository) |

### Use-Case Structure

```typescript
// features/game-detail/use-cases/get-game-details.ts
export async function getGameDetails(params: {
  slug: string;
  userId?: string;
}): Promise<GameDetailsResult> {
  // 1. Initialize services (dependency injection-ready)
  const igdbService = new IgdbService();
  const libraryService = new LibraryService();
  const journalService = new JournalService();

  // 2. Fetch from first service
  const gameResult = await igdbService.getGameDetailsBySlug({ slug: params.slug });
  if (!gameResult.ok) {
    return { success: false, error: gameResult.error.message };
  }

  // 3. Parallel fetch from remaining services
  const [libraryResult, journalResult] = await Promise.all([
    libraryService.getLibraryItemsForGame({
      userId: params.userId,
      gameId: gameResult.data.id
    }),
    journalService.getEntriesForGame({
      userId: params.userId,
      gameId: gameResult.data.id
    }),
  ]);

  // 4. Aggregate results
  return {
    success: true,
    data: {
      game: gameResult.data,
      libraryItems: libraryResult.ok ? libraryResult.data : [],
      journalEntries: journalResult.ok ? journalResult.data : [],
    },
  };
}
```

### Directory Structure

```
features/
└── game-detail/
    ├── use-cases/
    │   ├── get-game-details.ts          # Use-case orchestrating services
    │   └── get-game-details.test.ts     # Mock services, test orchestration
    ├── server-actions/
    │   └── load-game-details.ts         # Calls use-case
    └── ui/
        └── game-detail-page.tsx         # Consumes server action
```

## Consequences

### Positive

- **Clearer Architecture**: Separation between orchestration and business logic
- **Better Testability**: Mock boundaries are explicit
- **Easier Onboarding**: New developers can understand workflows by reading use-cases
- **Reduced Coupling**: Services remain independent
- **Scalability**: Adding new services to workflows is straightforward

### Negative

- **Additional Layer**: One more layer of abstraction
- **More Files**: Separate files for use-cases vs services
- **Learning Curve**: Team must understand when to use use-cases vs services

### Mitigation

- Document clear guidelines (done in CLAUDE.md)
- Provide reference examples ([get-game-details.ts](../../savepoint-app/features/game-detail/use-cases/get-game-details.ts))
- Use ESLint boundaries plugin to enforce rules (see next ADR)

## Examples in Codebase

### ✅ Correct: Use-Case Orchestrating Services

**File**: `features/game-detail/use-cases/get-game-details.ts`

```typescript
// Orchestrates IgdbService, LibraryService, JournalService
export async function getGameDetails(params) {
  const igdbService = new IgdbService();
  const libraryService = new LibraryService();
  const journalService = new JournalService();

  // Coordinate all three services
  // ...
}
```

### ❌ Anti-Pattern: Service Calling Service

```typescript
// DO NOT DO THIS
class LibraryService {
  async addGameToLibrary(params) {
    const gameService = new GameService(); // ❌ Service-to-service call
    const game = await gameService.getGame(params.gameId);
    // ...
  }
}
```

**Instead, create a use-case**:

```typescript
// features/library/use-cases/add-game-to-library.ts
export async function addGameToLibrary(params) {
  const gameService = new GameService();
  const libraryService = new LibraryService();

  const gameResult = await gameService.getGame(params.gameId);
  if (!gameResult.ok) return { success: false, error: gameResult.error };

  return await libraryService.createLibraryItem({
    userId: params.userId,
    game: gameResult.data,
  });
}
```

## Related Decisions

- Service Layer Architecture (original three-layer design)
- Repository Pattern (data access abstraction)
- ESLint Boundaries Enforcement (upcoming)

## References

- [Martin Fowler - Application Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Clean Architecture - Use Cases](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Application Services](https://www.domainlanguage.com/ddd/)
- [features/game-detail/use-cases/get-game-details.ts](../../savepoint-app/features/game-detail/use-cases/get-game-details.ts) - Reference Implementation

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-06 | 1.0 | Initial ADR - Use-Case Pattern adopted |
