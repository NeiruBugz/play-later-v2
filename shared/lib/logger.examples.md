# Pino Logger Usage Examples

This document provides practical examples of using the Pino logger in the Play Later application.

## Basic Service Integration

### 1. Creating a Service Logger

```typescript
import { createLogger } from "@/shared/lib/logger";

export class GameService extends BaseService {
  private logger = createLogger({ service: "GameService" });

  constructor() {
    super();
    this.logger.debug("GameService initialized");
  }
}
```

### 2. Logging Method Entry/Exit

```typescript
async searchGames(query: string): Promise<ServiceResult<Game[]>> {
  this.logger.info({ query }, "Searching games");

  try {
    const games = await this.repository.search(query);

    this.logger.info(
      { query, resultCount: games.length },
      "Game search completed"
    );

    return this.success(games);
  } catch (error) {
    this.logger.error({ error, query }, "Error searching games");
    return this.handleError(error, "Failed to search games");
  }
}
```

### 3. Logging External API Calls

```typescript
private async fetchFromIGDB(endpoint: string): Promise<Response> {
  this.logger.debug({ endpoint }, "Making IGDB API request");

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: this.buildHeaders(),
  });

  if (!response.ok) {
    this.logger.error(
      {
        endpoint,
        status: response.status,
        statusText: response.statusText
      },
      "IGDB API request failed"
    );
    throw new Error(`API error: ${response.statusText}`);
  }

  this.logger.debug(
    { endpoint, status: response.status },
    "IGDB API request successful"
  );

  return response;
}
```

## Log Level Guidelines

### INFO - Key Business Events

```typescript
// User actions
logger.info({ userId, gameId }, "User added game to library");
logger.info({ userId, reviewId }, "User published review");

// Successful operations
logger.info({ gameId, source: "igdb" }, "Game details fetched");
logger.info({ userId, count: 42 }, "Library items loaded");

// Important state changes
logger.info({ tokenExpiresIn: 3600 }, "OAuth token refreshed");
```

### WARN - Recoverable Issues

```typescript
// Validation warnings
logger.warn({ query: "" }, "Search attempted with empty query");
logger.warn({ userId, gameId }, "User attempted to add duplicate game");

// Performance warnings
logger.warn(
  { duration: 5000, threshold: 3000 },
  "Slow database query detected"
);

// Missing optional data
logger.warn({ gameId }, "Game has no cover image");
```

### ERROR - Failures Requiring Attention

```typescript
// API failures
logger.error(
  { error, endpoint: "/games", statusCode: 503 },
  "External API unavailable"
);

// Database errors
logger.error({ error, operation: "createGame" }, "Database operation failed");

// Unexpected conditions
logger.error(
  { userId, expectedRole: "admin", actualRole: "user" },
  "Authorization check failed"
);
```

### DEBUG - Development Details

```typescript
// Internal state
logger.debug({ cacheSize: 150, maxSize: 200 }, "Cache status");

// Processing steps
logger.debug(
  { original: "The Legend of Zelda", normalized: "legend zelda" },
  "Search query normalized"
);

// Configuration
logger.debug({ retries: 3, timeout: 5000 }, "HTTP client configured");
```

## Advanced Patterns

### 1. Request Context Tracking

```typescript
// In server actions or API routes
import { nanoid } from "nanoid";

import { logger } from "@/shared/lib/logger";

export async function serverAction(input: Input) {
  const requestId = nanoid();
  const requestLogger = logger.child({ requestId });

  requestLogger.info({ input }, "Server action started");

  try {
    const result = await processRequest(input);
    requestLogger.info({ result }, "Server action completed");
    return result;
  } catch (error) {
    requestLogger.error({ error }, "Server action failed");
    throw error;
  }
}
```

### 2. Performance Monitoring

```typescript
async performExpensiveOperation(): Promise<Result> {
  const startTime = Date.now();

  try {
    const result = await this.expensiveLogic();
    const duration = Date.now() - startTime;

    this.logger.info(
      { duration, operation: "expensiveOperation" },
      "Operation completed"
    );

    if (duration > 3000) {
      this.logger.warn(
        { duration, threshold: 3000 },
        "Slow operation detected"
      );
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    this.logger.error(
      { error, duration, operation: "expensiveOperation" },
      "Operation failed"
    );
    throw error;
  }
}
```

### 3. Batch Operation Logging

```typescript
async importGames(games: ImportedGame[]): Promise<Result> {
  this.logger.info(
    { totalGames: games.length },
    "Starting batch game import"
  );

  let successCount = 0;
  let errorCount = 0;

  for (const game of games) {
    try {
      await this.importSingleGame(game);
      successCount++;
    } catch (error) {
      errorCount++;
      this.logger.error(
        { error, gameId: game.id, gameName: game.name },
        "Failed to import game"
      );
    }
  }

  this.logger.info(
    {
      totalGames: games.length,
      successCount,
      errorCount
    },
    "Batch game import completed"
  );

  return { successCount, errorCount };
}
```

## Testing with Logger

### Silence Logs in Tests

The logger automatically runs in `silent` mode when `NODE_ENV=test`. No additional configuration needed!

```typescript
// vitest.config.ts already sets NODE_ENV=test
// Logs are automatically silenced in test runs
describe("GameService", () => {
  it("should search games", async () => {
    // Logger won't output anything during tests
    const result = await gameService.searchGames("zelda");
    expect(result.ok).toBe(true);
  });
});
```

### Testing Log Output (if needed)

```typescript
import { vi } from "vitest";

import { logger } from "@/shared/lib/logger";

describe("Logger behavior", () => {
  it("should log errors", () => {
    const errorSpy = vi.spyOn(logger, "error");

    // Trigger error condition
    service.handleError(new Error("test"));

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      "Error message"
    );
  });
});
```

## Production Best Practices

### 1. Don't Log Sensitive Data

```typescript
// ❌ Bad: Exposes sensitive data
logger.info(
  { password: user.password, apiKey: config.apiKey },
  "User authenticated"
);

// ✅ Good: Omit sensitive fields
logger.info({ userId: user.id, method: "credentials" }, "User authenticated");
```

### 2. Use Structured Data

```typescript
// ❌ Bad: String interpolation (not queryable)
logger.info(`User ${userId} searched for "${query}" and found ${count} games`);

// ✅ Good: Structured fields (queryable in log aggregators)
logger.info(
  { userId, query, resultCount: count },
  "User performed game search"
);
```

### 3. Include Context for Debugging

```typescript
// ❌ Bad: Minimal context
logger.error({ error }, "Error");

// ✅ Good: Rich context
logger.error(
  {
    error,
    userId,
    gameId,
    operation: "addToLibrary",
    timestamp: Date.now(),
  },
  "Failed to add game to library"
);
```

## Environment-Specific Output

### Development Mode

```bash
# Set in .env.local
NODE_ENV=development

# Optional: Override log level
LOG_LEVEL=debug
```

**Output Example:**

```
[14:23:45] INFO (GameService): Searching games
    query: "zelda"
[14:23:45] DEBUG (GameService): Normalized search query
    original: "The Legend of Zelda"
    normalized: "legend zelda"
```

### Production Mode

```bash
# Set in production environment
NODE_ENV=production
LOG_LEVEL=info
```

**Output Example (JSON):**

```json
{
  "level": "info",
  "time": "2025-01-15T14:23:45.123Z",
  "service": "GameService",
  "query": "zelda",
  "msg": "Searching games",
  "env": "production"
}
```

## Integration with Log Aggregators

The JSON output in production is compatible with:

- **Datadog**: Parse JSON and filter by `service`, `level`, etc.
- **AWS CloudWatch**: Searchable JSON fields
- **Splunk**: Automatic field extraction
- **Elasticsearch**: Native JSON ingestion

Example CloudWatch Insights query:

```
fields @timestamp, service, msg, error
| filter service = "GameService"
| filter level = "error"
| sort @timestamp desc
```

---

For more information, see:

- [Pino Documentation](https://getpino.io/)
- [CLAUDE.md Logging Section](../../CLAUDE.md#logging)
