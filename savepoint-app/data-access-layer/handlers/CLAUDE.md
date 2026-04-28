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

- `igdb/` - Public IGDB game search with rate limiting (`igdbSearchHandler`)
- `game-search/` - Shared Zod schemas for IGDB search inputs (no handler)
- `library/` - Library operations (`getLibraryHandler`, `getStatusCountsHandler`)
- `platform/` - Platform metadata (`getPlatformsHandler`, `getUniquePlatformsHandler`)
- `social/` - Activity feed (`activityFeedHandler`)
- `steam-import/` - Steam library import flow
  - `fetch-steam-games.handler.ts` - Fetch & import Steam library to DB
  - `steam-connect.handler.ts` - Steam account connection via OpenID
  - `imported-games.handler.ts` - Query paginated imported games
