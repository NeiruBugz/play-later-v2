# Shared Lib Layer - Clean Code and SOLID Principles Review

## Overview

The shared/lib layer contains utilities, database configuration, repository pattern implementations, and service layer code. While there are some good architectural patterns, there are several significant violations of Clean Code and SOLID principles that need addressing.

## Clean Code Analysis

### ✅ Strengths

#### 1. **Meaningful Names**

- Functions have descriptive names: `convertReleaseDateToIsoStringDate`, `buildSteamImageUrl`, `getUserBySteamId`
- File names clearly indicate their purpose
- Variable names are generally self-documenting

#### 2. **Consistent Formatting**

- Code is consistently formatted with proper indentation and spacing
- Import statements are well-organized
- Proper TypeScript usage throughout

#### 3. **Small Functions (Some)**

- Most utility functions are focused and small (e.g., `platformMapper`, `getGameUrl`)
- Date utility functions are concise and focused
- String manipulation functions are appropriately sized

#### 4. **Proper Error Handling (Some)**

- Repository functions throw meaningful errors with descriptive messages
- Try-catch blocks used appropriately in most cases
- Error logging implemented where needed

### ⚠️ Areas for Improvement

#### 1. **Single Responsibility Principle Violations**

**File**: `igdb.ts`

**Issue**: The `igdbApi` object is massive (594 lines) and handles multiple responsibilities:

```typescript
// This object does too many things
const igdbApi = {
  token: null as TwitchTokenResponse | null,
  tokenExpiry: 0 as number,
  async fetchToken(): Promise<TwitchTokenResponse | void> { ... },
  async search({ name, fields }: {...}): Promise<SearchResponse[] | undefined> { ... },
  async getGameById(gameId: number | null): Promise<FullGameInfoResponse | undefined> { ... },
  // ... 20+ more methods
};
```

**Problems**:

- Token management
- API requests
- Game data fetching
- Platform querying
- Search functionality
- Error handling

**Recommendation**: Break down into smaller, focused services:

```typescript
class IGDBTokenService {
  async fetchToken(): Promise<TwitchTokenResponse> {
    /* ... */
  }
  async refreshToken(): Promise<void> {
    /* ... */
  }
}

class IGDBGameService {
  async searchGames(query: SearchQuery): Promise<SearchResponse[]> {
    /* ... */
  }
  async getGameById(id: number): Promise<FullGameInfoResponse> {
    /* ... */
  }
}

class IGDBPlatformService {
  async getPlatforms(): Promise<Platform[]> {
    /* ... */
  }
  async getPlatformById(id: number): Promise<Platform> {
    /* ... */
  }
}
```

#### 2. **Code Duplication**

**Files**: `platform-mapper.ts` and `platform-to-color.ts`

**Issue**: Platform detection logic repeated across multiple files:

```typescript
// In platform-mapper.ts
if (platformName.toLowerCase().includes("pc")) {
  return "PC";
}
if (platformName.toLowerCase().includes("playstation")) {
  // ...
}

// In platform-to-color.ts
if (platform.toLowerCase().includes("playstation")) {
  return "bg-playstation";
}
if (platform.toLowerCase().includes("xbox")) {
  return "bg-xbox";
}
```

**Recommendation**: Create a unified platform detection system:

```typescript
const PLATFORM_RULES = [
  { pattern: /pc/i, name: "PC", color: "bg-pc" },
  { pattern: /playstation/i, name: "PlayStation", color: "bg-playstation" },
  { pattern: /xbox/i, name: "Xbox", color: "bg-xbox" },
];

export const detectPlatform = (platformName: string) => {
  return PLATFORM_RULES.find((rule) => rule.pattern.test(platformName));
};
```

#### 3. **Long Functions**

**File**: `igdb.ts`

**Issue**: The `search` method is 55 lines long with complex logic:

```typescript
async search({
  name = "",
  fields,
}: {
  name: null | string;
  fields?: Record<string, string>;
}): Promise<SearchResponse[] | undefined> {
  if (!name) return;

  console.log("IGDB API::Search for: ", { name, fields });

  let filters = "";

  if (fields && Object.values(fields).length !== 0) {
    const filterConditions = Object.entries(fields)
      .map(([key, value]) => {
        if (!value) {
          return;
        }

        const fieldName = key === "platform" ? "platforms" : key;

        if (Array.isArray(value)) {
          return `${fieldName}=(${value.join(",")})`;
        }
        return `${fieldName} = (${value})`;
      })
      .filter((condition) => condition)
      .join(" & ");

    if (filterConditions) {
      filters = ` & ${filterConditions}`;
    }
  }

  const query = new QueryBuilder()
    .fields([
      "name",
      "platforms.name",
      "release_dates.human",
      "first_release_date",
      "category",
      "cover.image_id",
    ])
    .where(`cover.image_id != null ${filters}`)
    .search(normalizeTitle(normalizeString(name)))
    .limit(100)
    .build();

  console.log({ query });

  return this.request<SearchResponse[]>({
    body: query,
    resource: "/games",
  });
}
```

**Recommendation**: Break into smaller functions:

```typescript
private buildSearchFilters(fields: Record<string, string>): string {
  // Filter building logic
}

private buildSearchQuery(name: string, filters: string): string {
  // Query building logic
}

async search(params: SearchParams): Promise<SearchResponse[]> {
  const filters = this.buildSearchFilters(params.fields);
  const query = this.buildSearchQuery(params.name, filters);
  return this.request({ body: query, resource: "/games" });
}
```

#### 4. **Magic Numbers and Constants**

**File**: `igdb.ts`

**Issue**: Hard-coded values throughout:

```typescript
this.tokenExpiry = getTimeStamp() + token.expires_in - 60; // What is 60?
.limit(100) // Why 100?
.take(5) // Why 5?
.take(3) // Why 3?
```

**Recommendation**: Extract to constants:

```typescript
const IGDB_CONFIG = {
  TOKEN_BUFFER_SECONDS: 60,
  SEARCH_LIMIT: 100,
  FRANCHISE_LIMIT: 5,
  SIMILAR_GAMES_LIMIT: 3,
} as const;
```

#### 5. **Inappropriate Comments**

**File**: `db.ts`

**Issue**: Commented-out code that should be removed:

```typescript
// prisma.$on("query", (e) => {
//   console.log("Query: " + e.query);
//   console.log("Params: " + e.params);
//   console.log("Duration: " + e.duration + "ms");
// });
```

**Recommendation**: Remove dead code or implement proper logging.

#### 6. **Mixed Abstraction Levels**

**File**: `repository/game/game-repository.ts`

**Issue**: Function mixes high-level and low-level operations:

```typescript
export async function findOrCreateGameByIgdbId({ igdbId }: { igdbId: number }) {
  try {
    return await findGameByIgdbId({ igdbId }); // High level
  } catch {
    const gameInfo = await igdbApi.getGameById(igdbId); // External API call

    if (!gameInfo) {
      throw new Error(`Game with IGDB ID ${igdbId} not found`);
    }

    const releaseDate = convertReleaseDateToIsoStringDate(
      // Utility function
      gameInfo?.release_dates[0]?.human
    );

    const gameInput: GameInput = {
      // Data transformation
      igdbId: String(igdbId),
      title: gameInfo.name,
      coverImage: gameInfo.cover.image_id,
      description: gameInfo.summary,
      releaseDate,
    };

    return await createGame({ game: gameInput }); // Repository call
  }
}
```

**Recommendation**: Separate concerns:

```typescript
// Service layer
export class GameService {
  async findOrCreateGame(igdbId: number): Promise<Game> {
    const existingGame = await this.gameRepository.findByIgdbId(igdbId);
    if (existingGame) return existingGame;

    const gameInfo = await this.igdbService.getGameById(igdbId);
    const gameInput = this.transformGameData(gameInfo);
    return await this.gameRepository.create(gameInput);
  }
}
```

## SOLID Principles Analysis

### ✅ Strengths

#### 1. **Liskov Substitution Principle (LSP)**

- Code doesn't use inheritance extensively, so LSP violations are minimal
- Functions generally follow their contracts
- Type definitions are consistent

### ⚠️ Areas for Improvement

#### 1. **Single Responsibility Principle (SRP) Violations**

**File**: `igdb.ts`

**Issue**: `igdbApi` object handles multiple responsibilities
**File**: `platform-to-color.ts`

**Issue**: Contains two functions that do similar things:

```typescript
// These should be unified or separated into different files
export function platformToBackgroundColor(platform: string) { ... }
export function platformToColorBadge(platform: string) { ... }
```

**Recommendation**: Unify or separate these functions based on their actual purpose.

#### 2. **Open/Closed Principle (OCP) Violations**

**File**: `platform-mapper.ts`

**Issue**: Adding new platforms requires modifying the function:

```typescript
export function platformMapper(platformName: string): string {
  if (platformName.toLowerCase().includes("pc")) {
    return "PC";
  }
  if (platformName.toLowerCase().includes("playstation")) {
    const [console, version] = platformName.split(" ");
    return `PS${version}`;
  }
  if (platformName.toLowerCase().includes("xbox series")) {
    return "Xbox Series";
  }
  return platformName;
}
```

**Recommendation**: Use configuration-based approach:

```typescript
const PLATFORM_MAPPINGS = [
  { pattern: /pc/i, transform: () => "PC" },
  { pattern: /playstation/i, transform: (name) => `PS${name.split(" ")[1]}` },
  { pattern: /xbox series/i, transform: () => "Xbox Series" },
];

export function platformMapper(platformName: string): string {
  const mapping = PLATFORM_MAPPINGS.find((m) => m.pattern.test(platformName));
  return mapping ? mapping.transform(platformName) : platformName;
}
```

#### 3. **Dependency Inversion Principle (DIP) Violations**

**File**: `repository/game/game-repository.ts`

**Issue**: Direct dependency on concrete implementation:

```typescript
import igdbApi from "@/shared/lib/igdb/igdb"; // Direct dependency

export async function findOrCreateGameByIgdbId({ igdbId }: { igdbId: number }) {
  try {
    return await findGameByIgdbId({ igdbId });
  } catch {
    const gameInfo = await igdbApi.getGameById(igdbId); // Tightly coupled
    // ...
  }
}
```

**Recommendation**: Use dependency injection:

```typescript
interface IGDBService {
  getGameById(id: number): Promise<GameInfo>;
}

export class GameRepository {
  constructor(private igdbService: IGDBService) {}

  async findOrCreateGameByIgdbId(igdbId: number): Promise<Game> {
    try {
      return await this.findByIgdbId(igdbId);
    } catch {
      const gameInfo = await this.igdbService.getGameById(igdbId);
      return await this.create(this.transformGameData(gameInfo));
    }
  }
}
```

#### 4. **Interface Segregation Principle (ISP) Violations**

**File**: `repository/backlog/types.ts`

**Issue**: Large interface forcing clients to know about optional fields:

```typescript
export type CreateBacklogItemInput = {
  userId: string;
  gameId: string;
  backlogItem: {
    status: BacklogItemStatus;
    acquisitionType: AcquisitionType;
    platform?: string;
    startedAt?: Date;
    completedAt?: Date;
  };
};
```

**Recommendation**: Create focused interfaces:

```typescript
interface BasicBacklogItem {
  userId: string;
  gameId: string;
  status: BacklogItemStatus;
  acquisitionType: AcquisitionType;
}

interface ExtendedBacklogItem extends BasicBacklogItem {
  platform?: string;
  startedAt?: Date;
  completedAt?: Date;
}
```

## Specific Issues and Recommendations

### 1. **Repository Pattern Implementation**

**Issues**:

- Repositories directly use Prisma client instead of abstraction
- Business logic mixed with data access
- No interfaces defining repository contracts

**Recommendation**: Implement proper repository interfaces:

```typescript
interface IGameRepository {
  findByIgdbId(igdbId: number): Promise<Game | null>;
  create(game: GameInput): Promise<Game>;
}

class GameRepository implements IGameRepository {
  constructor(private db: DatabaseClient) {}

  async findByIgdbId(igdbId: number): Promise<Game | null> {
    return this.db.game.findUnique({ where: { igdbId } });
  }
}
```

### 2. **Service Layer Issues**

**File**: `service/backlog/backlog-service.ts`

**Issue**: Incomplete implementation:

```typescript
// Incomplete implementation
export const backlogService = {
  async getOtherUsersBacklogs({ userId }: { userId: string }) {
    // Empty function body
  },
};
```

**Recommendation**: Complete service implementation or remove if unused.

### 3. **Error Handling Inconsistencies**

**Issues**:

- Some functions throw errors, others return null/undefined
- Inconsistent error types and messages
- No centralized error handling strategy

**Recommendation**: Implement consistent error handling:

```typescript
class GameNotFoundError extends Error {
  constructor(igdbId: number) {
    super(`Game with IGDB ID ${igdbId} not found`);
    this.name = "GameNotFoundError";
  }
}

// Use consistently across all functions
```

### 4. **Testing Gaps**

**Issues**:

- Limited test coverage (only 2 test files for ~30 source files)
- No tests for critical components like `igdbApi`
- No integration tests for repositories

**Recommendation**: Add comprehensive testing:

```typescript
describe("GameRepository", () => {
  test("should find game by IGDB ID", async () => {
    // Test implementation
  });

  test("should create game when not found", async () => {
    // Test implementation
  });
});
```

## Summary

The shared/lib layer shows good intentions with the repository pattern and service layer architecture, but needs significant refactoring to properly follow Clean Code and SOLID principles.

**Main Areas for Improvement:**

1. **Break down monolithic objects** - The `igdbApi` object is too large and complex
2. **Implement dependency injection** - Reduce tight coupling between components
3. **Eliminate code duplication** - Platform detection logic is repeated
4. **Complete service layer** - Many services have incomplete implementations
5. **Add comprehensive testing** - Critical components lack test coverage
6. **Consistent error handling** - Standardize error types and handling patterns

**Priority Actions:**

1. **HIGH**: Break down `igdbApi` into smaller, focused services
2. **HIGH**: Implement dependency injection for repositories
3. **MEDIUM**: Create unified platform detection system
4. **MEDIUM**: Add comprehensive error handling
5. **LOW**: Complete service layer implementations

## Score: 5/10

- Good architectural intentions
- Strong type safety
- Major issues with component size and coupling
- Inconsistent patterns and incomplete implementations
- Needs significant refactoring for production quality
