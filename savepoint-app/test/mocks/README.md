# MSW Mock Handlers

This directory contains Mock Service Worker (MSW) handlers for external API mocking in tests.

## Structure

```
test/mocks/
├── handlers/
│   ├── igdb.ts          # IGDB API handlers
│   ├── twitch.ts        # Twitch OAuth handlers
│   └── index.ts         # Re-exports all handlers
└── server.ts            # MSW server setup
```

## Usage

### In Integration Tests

```typescript
import { setupServer } from "msw/node";
import { igdbHandlers, twitchHandlers } from "@/test/mocks/handlers";

const server = setupServer(...igdbHandlers, ...twitchHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Override Handlers for Specific Tests

```typescript
import { http, HttpResponse } from "msw";

it("should handle IGDB API error", async () => {
  server.use(
    http.post("https://api.igdb.com/v4/games", () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  // Test error handling
});
```

### Use Pre-configured Server

```typescript
import { server } from "@/test/mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Available Handlers

### Twitch Handlers

- `POST https://id.twitch.tv/oauth2/token` - OAuth token endpoint

### IGDB Handlers

- `POST https://api.igdb.com/v4/games` - Game search endpoint
- `POST https://api.igdb.com/v4/platforms` - Platform metadata endpoint

## Adding New Handlers

1. Create handler file in `handlers/` (e.g., `handlers/steam.ts`)
2. Export handler array: `export const steamHandlers = [...]`
3. Add to `handlers/index.ts`:
   ```typescript
   export * from "./steam";
   import { steamHandlers } from "./steam";
   export const allHandlers = [...igdbHandlers, ...twitchHandlers, ...steamHandlers];
   ```

## MSW Version

This project uses MSW v2+ patterns:
- `http` instead of `rest`
- `HttpResponse` instead of `res()`
- Async request body parsing with `await request.text()` or `await request.json()`
