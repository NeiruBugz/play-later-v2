# Services Layer - Claude Guidelines

See [README.md](./README.md) for comprehensive documentation on the service layer.

## Quick Reference

**Purpose**: Business logic layer implementing the Result pattern for type-safe error handling.

**Core Principles**:
- Stateless operations (instantiated per request)
- Result-based errors (no thrown exceptions)
- Repository delegation (never direct Prisma)
- Input validation (Zod schemas at boundaries)
- Structured logging (Pino with LOGGER_CONTEXT.SERVICE)

## Available Services

| Service | Purpose |
|---------|---------|
| `ProfileService` | User profile and library stats |
| `AuthService` | Sign-up/sign-in (credentials only) |
| `IgdbService` | IGDB API client (game search, details, franchises) |
| `LibraryService` | Library item operations |
| `JournalService` | Journal entry management |
| `PlatformService` | Platform metadata |
| `GameDetailService` | Game detail aggregation |
| `GameService` | Basic game lookups by ID |
| `OnboardingService` | 5-step onboarding checklist tracking |
| `SteamService` | Steam Web API (owned games, player summary, connect/disconnect) |
| `SteamOpenIdService` | Steam OpenID authentication flow |
| `ImportedGameService` | Imported games management (find, dismiss, status updates) |

## When Working on Services

### Creating a New Service

1. Create directory: `services/[domain]/`
2. Define types: `services/[domain]/types.ts`
3. Implement service extending `BaseService`
4. Export from `services/index.ts`
5. Add unit tests with mocked repositories

## Key Patterns

- Services extend `BaseService` and return `ServiceResult` via `this.success()` / `this.error()`
- Services NEVER call other services -- use use-cases for orchestration
- Unit tests mock repositories; test all error paths and verify logging calls

## Security Guidelines

1. **Always validate userId** from authenticated session
2. **Never accept userId from client input** without verification
3. Use `authorizedActionClient` in server actions
4. Repository functions enforce restrictive defaults

## Common Mistakes to Avoid

1. ❌ Calling other services (use use-cases)
2. ❌ Direct Prisma calls (use repositories)
3. ❌ Throwing errors (return ServiceResult)
4. ❌ Trusting client-provided userId
