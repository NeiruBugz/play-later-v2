# Service Layer for Boundary Violation Elimination

This service layer provides abstractions to eliminate architectural boundary violations between features. It implements the service layer pattern with dependency injection to decouple features and maintain clean architecture.

## Overview

We're using two complementary approaches to eliminate 7 boundary violations:

### **Business Logic Services** (This Directory)

2. `view-imported-games` → `add-game` (server actions)
3. `manage-integrations` → `steam-integration` (server actions)

### **Component Recomposition** (Separate Strategy)

1. `view-game-details` → `add-game` (modal components) → **Move modals to shared/components**
2. `view-game-details` → `manage-backlog-item` (modal components) → **Move modals to shared/components**
3. `view-game-details` → `add-review` (modal components) → **Move modals to shared/components**
4. `view-game-details` → `steam-integration` (achievement component) → **Move to shared/components**
5. `shared/components` → various features (type definitions) → **Move types to shared/types**

## Architecture

### **Real Business Services** (This Directory)

1. **Game Management Service** - Consolidates game creation and backlog operations
2. **Steam Integration Adapter** - Abstracts Steam platform operations

### Migration Strategy

The service layer is implemented in phases:

#### Phase 1: Infrastructure (CURRENT)

- ✅ Service interfaces defined in `types.ts`
- ✅ Service registry created in `service-registry.ts`
- ✅ Stub implementations that throw errors
- ✅ No boundary violations introduced

#### Phase 2: Type Migration

- Move shared types from features to `shared/types`
- Update imports in shared components
- Fix 2 boundary violations (grid-view, list-view)

#### Phase 3: Component Services

- Implement modal service with lazy loading
- Update view-game-details components
- Implement navigation service
- Fix 3 more boundary violations

#### Phase 4: Business Logic Services

- Implement game management service
- Implement Steam integration adapter
- Migrate remaining components
- Fix final 2 boundary violations

## Usage

### Service Registry

```typescript
import { createBoundaryViolationServices } from "@/shared/services/service-registry";

// Create service instance
const services = createBoundaryViolationServices();

// Use services (once implemented)
const result = await services.gameManagement.createGameAndAddToBacklog(
  input,
  userId
);
```

### Component Integration

```typescript
// Phase 3+ usage in components
export function GameQuickActions({ game, backlogItems }) {
  const services = createBoundaryViolationServices();

  return (
    <div>
      <services.modals.AddToCollectionModal
        gameTitle={game.name}
        igdbId={game.igdbId}
      />
    </div>
  );
}
```

### Server Action Integration

```typescript
// Phase 4+ usage in server actions
export const importToApplication = authorizedActionClient
  .inputSchema(ImportToApplicationSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const services = createBoundaryViolationServices();

    return await services.gameManagement.importSteamGameToCollection(
      parsedInput.steamAppId,
      userId
    );
  });
```

## Testing

### Service Layer Tests

Service implementations include comprehensive unit tests:

```typescript
// Example: shared/services/service-registry.test.ts
describe("BoundaryViolationServiceRegistry", () => {
  it("should create all required services", () => {
    const services = createBoundaryViolationServices();

    expect(services.gameManagement).toBeDefined();
    expect(services.steamIntegration).toBeDefined();
    expect(services.modals).toBeDefined();
    expect(services.navigation).toBeDefined();
  });
});
```

### Integration Testing

Each phase includes validation that existing functionality remains unchanged:

1. All 313+ tests must pass
2. Build must succeed with reduced boundary violations
3. Performance must remain under 8 seconds
4. No functionality regressions

## Implementation Status

### Current Phase: 1 (Infrastructure) ✅

- [x] Service interfaces defined
- [x] Service registry implementation
- [x] Stub service implementations
- [x] Documentation complete
- [x] Foundation tests ready

### Next Phase: 2 (Type Migration)

- [ ] Move `features/view-wishlist/types` → `shared/types/wishlist.ts`
- [ ] Update grid-view.tsx imports
- [ ] Update list-view.tsx imports
- [ ] Verify 2 boundary violations eliminated

## Safety Measures

### Rollback Strategy

Each phase is atomic and can be rolled back:

```bash
# Rollback current phase
git revert HEAD

# Verify rollback success
pnpmrun test
pnpmrun lint
```

### Validation Checkpoints

After each commit:

```bash
# Required validation sequence
pnpmrun test                    # All tests pass
pnpmrun lint                    # Check boundary violations
pnpmrun typecheck               # No TypeScript errors
pnpmrun build                   # Successful build
```

## Future Enhancements

The service layer architecture enables:

1. **Platform Extensibility** - Easy addition of new gaming platforms
2. **Service Composition** - Combining services for complex workflows
3. **Testing Isolation** - Mock services for unit testing
4. **Feature Flags** - Gradual rollout of new implementations
5. **Performance Monitoring** - Service-level metrics and tracing

## IGDB Service

The IGDB service provides a comprehensive interface to the Internet Games Database (IGDB) API, supporting game search, metadata retrieval, and platform information.

### Overview

`IgdbService` is a class-based service that:

- Manages OAuth token lifecycle with automatic refresh
- Returns structured `ServiceResult<TData, TError>` types for error handling
- Provides 21 public methods for accessing IGDB data
- Includes comprehensive logging for debugging and monitoring
- Uses QueryBuilder for type-safe API query construction

### Instantiation

```typescript
import { IgdbService } from "@/data-access-layer/services/igdb";

const igdbService = new IgdbService();
```

**Best Practice**: Reuse service instances within a request context to benefit from token caching.

### Common Usage Examples

#### Searching Games by Name

```typescript
const result = await igdbService.searchGamesByName({
  name: "The Legend of Zelda",
  fields: {
    platform: "130", // Nintendo Switch
  },
});

if (result.ok) {
  console.log(`Found ${result.data.count} games`);
  result.data.games.forEach((game) => {
    console.log(`- ${game.name} (ID: ${game.id})`);
  });
} else {
  console.error(`Error: ${result.error.message}`);
}
```

#### Getting Game Details by ID

```typescript
const result = await igdbService.getGameDetails({
  gameId: 1905,
});

if (result.ok) {
  const { game } = result.data;
  console.log(`Title: ${game.name}`);
  console.log(`Summary: ${game.summary}`);
  console.log(`Rating: ${game.aggregated_rating}/100`);
} else {
  console.error(`Failed to fetch game: ${result.error.message}`);
}
```

#### Looking Up Game by Steam App ID (Critical for Steam Import)

```typescript
const result = await igdbService.getGameBySteamAppId({
  steamAppId: 570940,
});

if (result.ok) {
  const { game } = result.data;
  console.log(`Steam game maps to IGDB ID: ${game.id}`);
  console.log(`Game name: ${game.name}`);
} else if (result.error.code === "NOT_FOUND") {
  console.log("No IGDB mapping found for this Steam app ID");
} else {
  console.error(`Error: ${result.error.message}`);
}
```

#### Fetching Similar Games for Recommendations

```typescript
const result = await igdbService.getSimilarGames({
  gameId: 1905,
});

if (result.ok) {
  const { similarGames } = result.data;
  if (similarGames.length > 0) {
    console.log(`Found ${similarGames.length} similar games`);
  } else {
    console.log("No similar games available");
  }
} else {
  console.error(`Error: ${result.error.message}`);
}
```

#### Getting Top-Rated Games

```typescript
const result = await igdbService.getTopRatedGames();

if (result.ok) {
  result.data.games.forEach((game, index) => {
    console.log(
      `${index + 1}. ${game.name} - ${game.aggregated_rating?.toFixed(1)}/100`
    );
  });
} else {
  console.error(`Error: ${result.error.message}`);
}
```

### Error Handling

All methods return `ServiceResult<TData, TError>` with the following structure:

```typescript
// Success response
type Success = {
  ok: true;
  data: TData;
};

// Error response
type Error = {
  ok: false;
  error: {
    code: ServiceErrorCode;
    message: string;
    details?: unknown;
  };
};
```

**Error Codes**:

- `VALIDATION_ERROR`: Invalid input parameters
- `NOT_FOUND`: Resource not found (game, platform, etc.)
- `INTERNAL_ERROR`: API request failed or returned undefined
- `NETWORK_ERROR`: Network connectivity issues
- `TOKEN_ERROR`: OAuth token acquisition failed
- `RATE_LIMIT`: API rate limit exceeded
- `PARSE_ERROR`: Response parsing failed

**Pattern**:

```typescript
const result = await igdbService.searchGamesByName({ name: "Zelda" });

if (result.ok) {
  // Handle success - TypeScript knows result.data exists
  const games = result.data.games;
} else {
  // Handle error - TypeScript knows result.error exists
  switch (result.error.code) {
    case "VALIDATION_ERROR":
      console.error("Invalid input:", result.error.message);
      break;
    case "NOT_FOUND":
      console.log("No games found");
      break;
    case "INTERNAL_ERROR":
      console.error("API error:", result.error.message);
      break;
    default:
      console.error("Unexpected error:", result.error.message);
  }
}
```

### Best Practices

1. **Reuse Service Instances**: Create one instance per request context to benefit from token caching

   ```typescript
   // ✅ Good: Reuse instance
   const service = new IgdbService();
   const games = await service.searchGamesByName({ name: "Zelda" });
   const details = await service.getGameDetails({
     gameId: games.data.games[0].id,
   });

   // ❌ Bad: Creating multiple instances loses token cache
   const games = await new IgdbService().searchGamesByName({ name: "Zelda" });
   const details = await new IgdbService().getGameDetails({ gameId: 1 });
   ```

2. **Always Check `result.ok`**: The Result pattern ensures type-safe error handling

   ```typescript
   // ✅ Good: Type-safe access
   const result = await service.getGameDetails({ gameId: 1905 });
   if (result.ok) {
     console.log(result.data.game.name);
   }

   // ❌ Bad: Ignores potential errors
   const result = await service.getGameDetails({ gameId: 1905 });
   console.log(result.data.game.name); // TypeScript error!
   ```

3. **Use Typed Error Codes**: Switch on error codes for programmatic handling

   ```typescript
   if (!result.ok) {
     if (result.error.code === "NOT_FOUND") {
       // Handle missing resource gracefully
     } else if (result.error.code === "RATE_LIMIT") {
       // Implement retry logic
     }
   }
   ```

4. **Validate Inputs Early**: Services perform validation, but validate at the boundary

   ```typescript
   // ✅ Good: Validate before calling service
   if (!steamAppId || steamAppId <= 0) {
     return { error: "Invalid Steam app ID" };
   }
   const result = await service.getGameBySteamAppId({ steamAppId });
   ```

5. **Handle Empty Results**: Many methods return empty arrays for valid "no results" scenarios
   ```typescript
   const result = await service.getGameScreenshots({ gameId: 1905 });
   if (result.ok) {
     if (result.data.screenshots.length === 0) {
       console.log("No screenshots available for this game");
     }
   }
   ```

### Available Methods

#### Game Search & Retrieval

- `searchGamesByName(params)` - Search games by name with optional platform filter
- `getGameDetails(params)` - Get comprehensive game details by IGDB ID
- `getGameBySteamAppId(params)` - Look up IGDB game by Steam app ID (critical for Steam library import)
- `getTopRatedGames()` - Get top-rated games sorted by aggregated rating

#### Game Metadata

- `getGameScreenshots(params)` - Get screenshot images for a game
- `getGameAggregatedRating(params)` - Get rating score and count
- `getSimilarGames(params)` - Get array of similar game IDs for recommendations
- `getGameGenres(params)` - Get genre metadata for a game
- `getGameCompletionTimes(params)` - Get HowLongToBeat time estimates
- `getGameExpansions(params)` - Get DLC and expansion content
- `getGameArtworks(params)` - Get artwork images for galleries
- `getFranchiseGames(params)` - Get all games in a franchise

#### Platform Information

- `getPlatforms()` - Get all available gaming platforms
- `searchPlatformByName(params)` - Search for platforms by name

#### Release & Event Information

- `getUpcomingReleasesByIds(params)` - Get release dates for specified game IDs
- `getUpcomingGamingEvents()` - Get future gaming events (conferences, showcases)
- `getEventLogo(params)` - Get logo image for a gaming event

#### Legacy Methods (Maintained for Compatibility)

- `searchGames(params)` - Alias for `searchGamesByName` (use `searchGamesByName` in new code)

**All methods**:

- Accept typed parameter objects
- Return `ServiceResult<TData, TError>` for consistent error handling
- Include comprehensive logging for debugging
- Perform input validation before making API requests

### Integration with App Router

Use IGDB service in Next.js server actions:

```typescript
"use server";

import { IgdbService } from "@/data-access-layer/services/igdb";
import { z } from "zod";

import { authorizedActionClient } from "@/shared/lib/safe-action";

const SearchGamesSchema = z.object({
  query: z.string().min(1),
});

export const searchGamesAction = authorizedActionClient
  .inputSchema(SearchGamesSchema)
  .action(async ({ parsedInput }) => {
    const igdbService = new IgdbService();

    const result = await igdbService.searchGamesByName({
      name: parsedInput.query,
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return result.data;
  });
```

### Token Management

The service automatically manages OAuth tokens:

- Tokens are cached at the instance level
- Automatic refresh when token expires (with 60-second safety margin)
- Token errors are surfaced through the Result type
- No manual token management required

### Logging

The service uses structured logging with Pino:

- `info`: Key operations (search, fetch, success)
- `warn`: Validation failures, empty results
- `error`: API failures, token errors, exceptions
- `debug`: Token acquisition, internal state changes

Logs include contextual data:

```typescript
logger.info({ gameId, gameName: "Zelda" }, "Game details fetched successfully");
```

## Maintenance

### Adding New Services

1. Define interface in `types.ts`
2. Add to `BoundaryViolationServiceRegistry`
3. Implement service class
4. Update `createBoundaryViolationServices()` factory
5. Add comprehensive tests
6. Update documentation

### Service Dependencies

Services follow dependency injection patterns:

- Services depend on repositories, not other services
- UI services use lazy loading for performance
- Business logic services are stateless
- All external dependencies are injected via constructor

This approach maintains loose coupling and high testability throughout the service layer.
