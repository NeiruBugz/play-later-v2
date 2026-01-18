# Service Layer

This directory contains the service layer implementation for SavePoint's business logic. Services provide structured abstractions over repository functions, implementing validation, error handling, and business rules.

## Overview

The service layer follows a **Result pattern** with consistent error handling and structured return types. All services extend `BaseService` and return `ServiceResult<TData, TError>` types for type-safe error handling.

### Core Principles

1. **Stateless Operations**: Services are instantiated per request/operation
2. **Result-Based Errors**: No thrown exceptions - all errors returned as Result types
3. **Repository Delegation**: Services call repository functions, never direct Prisma
4. **Input Validation**: Zod schemas validate all inputs at service boundaries
5. **Structured Logging**: Pino logger with contextual metadata

## Available Services

### 1. **ProfileService** — User Profile Management

**Purpose**: Fetch and manage user profile data with library statistics

**Methods**:

- `getProfile(input)` - Get basic profile information
- `getProfileWithStats(input)` - Get profile with library stats and recent games

**Usage**:

```typescript
const service = new ProfileService();
const result = await service.getProfileWithStats({ userId });

if (result.success) {
  console.log(result.data.profile.username);
  console.log(result.data.profile.stats.statusCounts);
}
```

### 2. **AuthService** — Authentication

**Purpose**: Handle user sign-up and sign-in

**Methods**:

- `signUp(input)` - Register new user (credentials auth)
- `signIn(input)` - Authenticate user (credentials auth)

**Note**: Only used when `AUTH_ENABLE_CREDENTIALS=true` (dev/test environments)

### 3. **IgdbService** — IGDB API Integration

**Purpose**: Comprehensive IGDB API client with OAuth management

See [IGDB Service](#igdb-service) section below for detailed documentation.

## Common Usage Patterns

### Service Instantiation

Services are instantiated per operation (stateless):

```typescript
// Profile service (per request)
const profileService = new ProfileService();
const result = await profileService.getProfileWithStats({ userId });

// IGDB service — reuse within a single request to benefit from token caching
const igdbService = new IgdbService();
const search = await igdbService.searchGamesByName({ name: "Zelda" });
if (search.success && search.data.games.length > 0) {
  await igdbService.getGameDetails({ gameId: search.data.games[0].id });
}
```

### Server Actions Integration

Services are the primary way server actions interact with business logic:

```typescript
"use server";

import { ProfileService } from "@/data-access-layer/services";
import { authorizedActionClient } from "@/shared/lib/safe-action";

export const getProfileWithStats = authorizedActionClient
  .inputSchema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput }) => {
    const service = new ProfileService();
    const result = await service.getProfileWithStats(parsedInput);
    if (!result.success) throw new Error(result.error);
    return result.data;
  });
```

### Error Handling Pattern

All services return `ServiceResult<TData, TError>`:

```typescript
const result = await service.getProfile({ userId });

if (result.success) {
  // TypeScript knows result.data exists
  const profile = result.data.profile;
  console.log(profile.username);
} else {
  // TypeScript knows result.error exists
  switch (result.code) {
    case ServiceErrorCode.NOT_FOUND:
      console.log("User not found");
      break;
    case ServiceErrorCode.UNAUTHORIZED:
      console.log("Unauthorized access");
      break;
    default:
      console.error(result.error);
  }
}
```

### Type-Safe Access with Result Helpers

```typescript
import { isErrorResult, isSuccessResult } from "@/data-access-layer/services";

const result = await new ProfileService().getProfile({ userId });

if (isSuccessResult(result)) {
  console.log(result.data.profile.username);
}

if (isErrorResult(result)) {
  console.error(result.code);
}
```

### Page Components (App Router)

Use services in Server Components:

```typescript
// app/(protected)/profile/page.tsx
import { ProfileService } from "@/data-access-layer/services";
import { getServerUserId } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/login");

  const service = new ProfileService();
  const result = await service.getProfileWithStats({ userId });

  if (!result.success) {
    console.error("Failed to load profile:", result.error);
    redirect("/login");
  }

  return <ProfileView profile={result.data.profile} />;
}
```

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

if (result.success) {
  console.log(`Found ${result.data.count} games`);
  result.data.games.forEach((game) => {
    console.log(`- ${game.name} (ID: ${game.id})`);
  });
} else {
  console.error(`Error: ${result.error}`);
}
```

#### Getting Game Details by ID

```typescript
const result = await igdbService.getGameDetails({
  gameId: 1905,
});

if (result.success) {
  const { game } = result.data;
  console.log(`Title: ${game.name}`);
  console.log(`Summary: ${game.summary}`);
  console.log(`Rating: ${game.aggregated_rating}/100`);
} else {
  console.error(`Failed to fetch game: ${result.error}`);
}
```

#### Looking Up Game by Steam App ID (Critical for Steam Import)

```typescript
const result = await igdbService.getGameBySteamAppId({
  steamAppId: 570940,
});

if (result.success) {
  const { game } = result.data;
  console.log(`Steam game maps to IGDB ID: ${game.id}`);
  console.log(`Game name: ${game.name}`);
} else if (result.code === "NOT_FOUND") {
  console.log("No IGDB mapping found for this Steam app ID");
} else {
  console.error(`Error: ${result.error}`);
}
```

#### Fetching Similar Games for Recommendations

```typescript
const result = await igdbService.getSimilarGames({
  gameId: 1905,
});

if (result.success) {
  const { similarGames } = result.data;
  if (similarGames.length > 0) {
    console.log(`Found ${similarGames.length} similar games`);
  } else {
    console.log("No similar games available");
  }
} else {
  console.error(`Error: ${result.error}`);
}
```

#### Getting Top-Rated Games

```typescript
const result = await igdbService.getTopRatedGames();

if (result.success) {
  result.data.games.forEach((game, index) => {
    console.log(
      `${index + 1}. ${game.name} - ${game.aggregated_rating?.toFixed(1)}/100`
    );
  });
} else {
  console.error(`Error: ${result.error}`);
}
```

### Error Handling

All methods return `ServiceResult<TData, TError>` with the following structure:

```typescript
// Success response
type Success = {
  success: true;
  data: TData;
};

// Error response
type Error = {
  success: false;
  error: string;
  code?: ServiceErrorCode;
};
```

### Error Code Usage

The `code` field is populated for all programmatic errors that can be handled by callers:

- `VALIDATION_ERROR` - Invalid input data (malformed request, schema violation)
- `NOT_FOUND` - Requested resource doesn't exist (game, user, etc.)
- `UNAUTHORIZED` - Authentication required or insufficient permissions
- `RATE_LIMITED` - Too many requests to external API

For unexpected internal errors (database failures, unhandled exceptions), the code may be omitted and only the `error` message is provided. This distinction helps callers determine whether to show user-friendly messages (known error codes) or generic error messages (unknown errors).

```typescript
if (!result.success) {
  if (result.code) {
    // Known, handleable error - can show specific message
    handleKnownError(result.code, result.error);
  } else {
    // Unexpected error - show generic message, log details
    logger.error({ error: result.error }, "Unexpected service error");
    showGenericError();
  }
}
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

if (result.success) {
  // Handle success - TypeScript knows result.data exists
  const games = result.data.games;
} else {
  // Handle error - TypeScript knows result.error exists
  switch (result.code) {
    case "VALIDATION_ERROR":
      console.error("Invalid input:", result.error);
      break;
    case "NOT_FOUND":
      console.log("No games found");
      break;
    case "INTERNAL_ERROR":
      console.error("API error:", result.error);
      break;
    default:
      console.error("Unexpected error:", result.error);
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

2. **Always Check `result.success`**: The Result pattern ensures type-safe error handling

   ```typescript
   // ✅ Good: Type-safe access
   const result = await service.getGameDetails({ gameId: 1905 });
   if (result.success) {
     console.log(result.data.game.name);
   }

   // ❌ Bad: Ignores potential errors
   const result = await service.getGameDetails({ gameId: 1905 });
   console.log(result.data.game.name); // TypeScript error!
   ```

3. **Use Typed Error Codes**: Switch on error codes for programmatic handling

   ```typescript
   if (!result.success) {
     if (result.code === "NOT_FOUND") {
       // Handle missing resource gracefully
     } else if (result.code === "RATE_LIMIT") {
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
   if (result.success) {
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

    if (!result.success) {
      throw new Error(result.error);
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

## Security Guidelines

### Repository Layer Security

When calling repository functions from services, always ensure proper security boundaries:

#### User Authentication & Authorization

**CRITICAL**: All repository functions that access user data MUST receive `userId` from authenticated session context. Services are responsible for:

1. **Validating userId exists** before calling repository functions
2. **Verifying userId matches authenticated session** (from `getServerUserId()` or action context)
3. **Never accepting userId from client input** without validation

#### Repository Function Security Features

**`findUserById(userId, options?)`**

- Enforces restrictive default select to prevent exposing sensitive fields
- Default returns: `id`, `name`, `username`, `email`, `steamProfileURL`, `steamConnectedAt`
- Explicitly requested fields via `select` option override defaults
- **Services must validate**: `userId` is from authenticated session

**`updateUserProfile(userId, data)`**

- Validates `userId` is required (throws if missing)
- Allowed update fields: `username`, `usernameNormalized`, `steamProfileURL`
- Disallowed fields: `image` (managed through OAuth providers only), `password`, `steamAvatar`
- **Services must validate**: `userId` matches authenticated session before calling

#### Example: Secure Service Implementation

```typescript
export class ProfileService extends BaseService {
  async updateUsername(input: { userId: string; username: string }) {
    // ✅ Validate userId is provided (service layer responsibility)
    if (!input.userId) {
      return this.error("Unauthorized", ServiceErrorCode.UNAUTHORIZED);
    }

    // ✅ Normalize username for case-insensitive uniqueness
    const normalized = input.username.toLowerCase().trim();

    // ✅ Check uniqueness before updating
    const existing = await findUserByNormalizedUsername(normalized);
    if (existing && existing.id !== input.userId) {
      return this.error(
        "Username already taken",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    // ✅ Call repository with validated userId
    const user = await updateUserProfile(input.userId, {
      username: input.username,
      usernameNormalized: normalized,
    });

    return this.success({ user });
  }
}
```

#### Common Mistakes to Avoid

```typescript
// ❌ BAD: Accepting userId from client without validation
export const updateProfileAction = actionClient
  .inputSchema(z.object({ userId: z.string(), name: z.string() }))
  .action(async ({ parsedInput }) => {
    // Client could send any userId!
    return await updateUserProfile(parsedInput.userId, {
      name: parsedInput.name,
    });
  });

// ✅ GOOD: Using authenticated session context
export const updateProfileAction = authorizedActionClient
  .inputSchema(z.object({ name: z.string() }))
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // userId comes from verified session
    return await updateUserProfile(userId, { name: parsedInput.name });
  });
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
