# Services Layer - Claude Guidelines

See [README.md](./README.md) for comprehensive documentation on the service layer.

## Quick Reference

**Purpose**: Business logic layer. Services return raw data on success and throw typed errors on failure.

**Core Principles**:
- Stateless operations (instantiated per request)
- Typed-throw error model (no Result wrappers)
- Repository delegation (never direct Prisma)
- Trust typed input (validation lives at the request edge — no defensive re-parsing)
- Structured logging (Pino with `LOGGER_CONTEXT.SERVICE`)

## Available Services

| Service | Purpose |
|---------|---------|
| `ProfileService` | User profile and library stats |
| `AuthService` | Sign-up (credentials only) |
| `IgdbService` | IGDB API client (game search, details, franchises) |
| `LibraryService` | Library item operations |
| `JournalService` | Journal entry management |
| `PlatformService` | Platform metadata |
| `GameDetailService` | Game detail aggregation |
| `OnboardingService` | 5-step onboarding checklist tracking |
| `SteamService` | Steam Web API (owned games, player summary, connect/disconnect) |
| `SteamOpenIdService` | Steam OpenID authentication flow |
| `ImportedGameService` | Imported games management (find, dismiss, status updates) |
| `SocialService` | Follow / unfollow |
| `ActivityFeedService` | Activity feed query helpers |

## When Working on Services

### Creating a New Service

1. Create directory: `services/[domain]/`
2. Define types: `services/[domain]/types.ts`
3. Implement the service. Each method either returns its data type directly or throws a typed error from `@/shared/lib/errors` (or a co-located `services/[domain]/errors.ts` for domain-specific subclasses).
4. Export from `services/index.ts`
5. Add unit tests with mocked repositories — assert returned values directly; assert error paths via `await expect(...).rejects.toThrow(NotFoundError)` etc. Use `vi.resetAllMocks()` (not `clearAllMocks()`) in `beforeEach` to drain `mockResolvedValueOnce` queues between tests.

## Key Patterns

- Services NEVER call other services — use a use-case in `features/<name>/use-cases/` for orchestration
- Unit tests mock repositories; tests assert raw return values for happy paths and typed throws for error paths
- Import typed errors from `@/shared/lib/errors` (or co-located `errors.ts`), NEVER from other paths — class identity matters

## Security Guidelines

1. **Always validate userId** from authenticated session
2. **Never accept userId from client input** without verification
3. Use `authorizedActionClient` in server actions
4. Repository functions enforce restrictive defaults

## Common Mistakes to Avoid

1. ❌ Calling other services (use use-cases)
2. ❌ Direct Prisma calls (use repositories)
3. ❌ Returning a Result-shaped object from a service (the service throws on failure)
4. ❌ Re-parsing input that the action edge already validated with Zod
5. ❌ Trusting client-provided userId
6. ❌ Importing typed errors from `data-access-layer/repository/...` paths (use `@/shared/lib/errors` or co-located `errors.ts`)
