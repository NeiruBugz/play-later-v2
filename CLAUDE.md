# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Status

**Recent Changes** (as of Jan 2025):
- ✅ Monorepo restructuring complete (`savepoint-app/` for main app)
- ✅ AWS Cognito integration complete (primary auth provider)
- ✅ Terraform infrastructure setup for dev/prod environments
- ✅ Service layer architecture clarified (use-case pattern for multi-service orchestration)
- 🚧 Google OAuth being phased out (legacy support maintained)

## Project Overview

**SavePoint** is a Next.js 15 application for managing video game backlogs with Steam/IGDB integration. The project uses a three-layer architecture: App Router → Service Layer → Repository Layer → Prisma → PostgreSQL.

**Project Structure**: Monorepo with main application in `savepoint-app/` and infrastructure in `infra/` (Terraform for AWS resources)

**Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Prisma, PostgreSQL, NextAuth v5 (AWS Cognito), TanStack Query, Zod, Vitest, Tailwind CSS, shadcn/ui.

**Development Server**: `http://localhost:6060` (non-standard port)

**Reference Files**: See [README.md](README.md) for feature list and setup instructions. See [AGENTS.md](AGENTS.md) for detailed repository guidelines.

## Project Structure

```bash
tree -L 2 -I 'node_modules|.git|.next' --gitignore
```

**Monorepo Layout**:
- `savepoint-app/`: Main Next.js application
- `infra/`: Terraform infrastructure as code (AWS Cognito, etc.)
- `context/`: Product documentation and specifications
- Root: Shared tooling (commitlint)

### Key Architecture Layers (within `savepoint-app/`)

The project implements a **modified Feature-Sliced Design (FSD)** architecture adapted for Next.js 15. See [context/product/architecture.md](context/product/architecture.md#9-feature-sliced-design-fsd-architecture) for full FSD documentation.

**1. App Router (`app/`)**

- Next.js 15 App Router with React Server Components
- Minimal API routes (auth only)
- Pages delegate to features and services

**2. Features Layer (`features/`)**

- Business domain slices organized by user-facing functionality
- Each feature contains: `ui/`, `server-actions/`, `hooks/`, `use-cases/`, `schemas.ts`
- Features are isolated (no cross-feature imports, with documented exceptions)
- See [features/CLAUDE.md](savepoint-app/features/CLAUDE.md) for detailed rules

**3. Data Access Layer (`data-access-layer/`)**

- `handlers/`: Request handlers for API routes (validation, rate limiting, orchestration)
- `repository/`: Direct Prisma operations organized by domain (game, library, user, review, journal, imported-game)
- `services/`: Business logic services implementing service patterns with Result types
- `domain/`: Domain models and types (planned for future enhancement)

**4. Shared Layer (`shared/`)**

- `components/`: Reusable UI components (shadcn/ui based)
- `lib/`: Utilities including IGDB integration, date functions, platform mappers
- `types/`: Shared TypeScript types
- `hooks/`: React hooks for common patterns
- `config/`: Application configuration

**5. Context (`context/product/`)**

- Product documentation and roadmap (not runtime code)

**6. Tests (`test/`)**

- Vitest setup with dual modes: unit (mocked Prisma) and integration (real DB)
- Test factories and fixtures for consistent test data

### Import Aliases

All imports use `@/` alias from `savepoint-app/` directory:

```typescript
import { createGame } from "@/data-access-layer/repository";
import { GameService } from "@/data-access-layer/services";

import { cn } from "@/shared/lib/tailwind-merge";
```

**Working Directory**: Most development commands should be run from the `savepoint-app/` directory

## Common Development Commands

**Note**: Run commands from `savepoint-app/` directory (or use `pnpm --filter savepoint <command>` from root)

### Core Development

```bash
pnpm dev              # Start dev server at localhost:6060 (Turbopack)
pnpm build            # Production build with Turbopack
pnpm start            # Start production server
pnpm preview          # Build and preview on port 6060
pnpm postinstall      # Generate Prisma client (runs after install)
```

### Code Quality

```bash
pnpm lint             # Run ESLint checks
pnpm lint:fix         # Auto-fix ESLint issues
pnpm typecheck        # TypeScript type checking
pnpm format:check     # Check Prettier formatting
pnpm format:write     # Auto-format with Prettier
pnpm ci:check       # Run all checks: format + lint + typecheck
pnpm code-fix         # Auto-fix: format + lint
pnpm knip             # Detect unused dependencies and exports
```

### Testing

```bash
pnpm test             # Run all tests (unit + integration)
pnpm test:watch       # Watch mode for tests
pnpm test:coverage    # Run tests with coverage report (≥80% required)
```

**Test File Conventions**:

- `*.test.ts(x)` or `*.spec.ts(x)`: Standard tests
- `*.unit.test.ts`: Unit tests with mocked Prisma
- `*.integration.test.ts`: Integration tests with real database
- `*.server-action.test.ts`: Server action tests (Node environment)

**Test Database**: Managed via Docker Compose (see Database section)

### Database Management

```bash
# Start local development database (PostgreSQL on port 6432)
# Run from repository root
docker-compose up -d

# Prisma commands (run from savepoint-app/)
pnpm exec prisma migrate dev      # Create and apply migration
pnpm exec prisma migrate deploy   # Apply migrations (production)
pnpm exec prisma db push          # Sync schema without migration (dev only)
pnpm exec prisma studio           # Open Prisma Studio GUI
pnpm exec prisma generate         # Regenerate Prisma client
```

**Database Access**:

- PostgreSQL: `localhost:6432` (user: postgres, pass: postgres, db: savepoint-db)
- pgAdmin: `http://localhost:5050` (email: admin@admin.com, pass: admin)

## Architecture Guidelines

### Four-Layer Data Flow

```
App Router Pages/API Routes (HTTP adapter)
  - NextResponse transformation
  - Server-side caching (unstable_cache)
  - Security headers
         ↓
Handler Layer (data-access-layer/handlers/)
  - Input validation with Zod
  - Rate limiting
  - Request orchestration
  - Returns HandlerResult<TData> types
  - ⚠️ ONLY imported by API routes (enforced by ESLint)
         ↓
Service Layer (data-access-layer/services/)
  - Business logic with Zod validation
  - Returns ServiceResult<TData, TError> types
  - Stateless, injectable services
         ↓
Repository Layer (data-access-layer/repository/)
  - Direct Prisma operations
  - Domain-organized (game, library, user, etc.)
  - No business logic
         ↓
Prisma ORM → PostgreSQL
```

### Service Pattern with Result Types

Services return structured results instead of throwing errors:

```typescript
type ServiceResult<TData, TError = ServiceError> =
  | { ok: true; data: TData }
  | { ok: false; error: TError };

// Usage example
const result = await GameService.searchGames(params);
if (result.ok) {
  console.log(result.data);
} else {
  console.error(result.error.code, result.error.message);
}
```

### Repository Pattern

Repositories provide clean abstractions over Prisma:

```typescript
// ✅ Good: Use repository functions
import { findGameByIgdbId } from "@/data-access-layer/repository";

// ❌ Avoid: Direct Prisma calls in features
import { prisma } from "@/shared/lib/db";

const game = await findGameByIgdbId(igdbId);

const game = await prisma.game.findUnique({ where: { igdbId } });
```

### Server Actions Pattern

Server actions live in feature directories and use the service layer:

```typescript
"use server";

import { GameService } from "@/data-access-layer/services";

import { authorizedActionClient } from "@/shared/lib/safe-action";

export const searchGames = authorizedActionClient
  .inputSchema(SearchGamesSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const result = await GameService.searchGames(parsedInput);
    return result; // Service already returns Result type
  });
```

### Use-Case Pattern

**Use-cases** are the orchestration layer for coordinating multiple services to fulfill complex business operations. They sit between the presentation layer (pages, server actions) and the service layer.

**Architecture Rule**: Services should NEVER call other services. When multiple services need to be coordinated, use a use-case.

```
App Router / Server Actions
         ↓
Use-Cases (features/*/use-cases/)
  - Orchestrate multiple services
  - Handle cross-domain business logic
  - Return structured results
         ↓
Services (data-access-layer/services/)
  - Single-domain operations only
  - Never call other services
```

**Example: Game Details Use-Case**

See [features/game-detail/use-cases/get-game-details.ts](savepoint-app/features/game-detail/use-cases/get-game-details.ts) for a real-world example.

```typescript
// features/game-detail/use-cases/get-game-details.ts
export async function getGameDetails(params: {
  slug: string;
  userId?: string;
}): Promise<
  { success: true; data: GameDetailsResult } | { success: false; error: string }
> {
  // Orchestrate multiple services
  const igdbService = new IgdbService();
  const igdbResult = await igdbService.getGameDetailsBySlug({ slug: params.slug });

  if (!igdbResult.ok) {
    return { success: false, error: igdbResult.error.message };
  }

  // Coordinate library and journal services if user is authenticated
  if (params.userId) {
    const libraryService = new LibraryService();
    const journalService = new JournalService();

    const [libraryResult, journalResult] = await Promise.all([
      libraryService.getLibraryItemsForGame({ userId: params.userId, gameId: game.id }),
      journalService.getEntriesForGame({ userId: params.userId, gameId: game.id }),
    ]);

    // Combine results from all three services
    return {
      success: true,
      data: {
        game: igdbResult.data,
        libraryItems: libraryResult.ok ? libraryResult.data : [],
        journalEntries: journalResult.ok ? journalResult.data : [],
      },
    };
  }

  return { success: true, data: { game: igdbResult.data } };
}
```

**When to Use Handlers vs Use-Cases vs Services**:

| Scenario | Use | Import Allowed By |
|----------|-----|-------------------|
| API route logic (validation, rate limiting, orchestration) | **Handler** | API routes only |
| Single-domain operation (e.g., search games) | **Service** | Handlers, use-cases, server actions |
| Multi-service coordination (e.g., game details with library + journal) | **Use-Case** | Handlers, server actions, pages |
| External API call (IGDB, Steam) | **Service** | Handlers, use-cases, other services (types only) |
| Complex business workflow spanning domains | **Use-Case** | Handlers, server actions, pages |
| CRUD operations on single entity | **Repository** | Services only |

**Use-Case Guidelines**:

1. **Location**: Place use-cases in `features/[feature-name]/use-cases/`
2. **Naming**: Use descriptive verb-noun patterns (e.g., `getGameDetails`, `importSteamLibrary`)
3. **Return Types**: Use structured results similar to services (`{ success: boolean, data?: T, error?: string }`)
4. **Error Handling**: Aggregate errors from multiple services gracefully
5. **Testing**: Mock services at the boundary, test orchestration logic

**Anti-Patterns to Avoid**:

```typescript
// ❌ BAD: Service calling another service
class LibraryService {
  async addGameToLibrary(params) {
    const gameService = new GameService(); // ❌ Service-to-service call
    const game = await gameService.getGame(params.gameId);
    // ...
  }
}

// ✅ GOOD: Use-case orchestrating services
// See features/manage-library-entry/use-cases/add-game-to-library.ts
async function addGameToLibrary(params) {
  const gameService = new GameService();
  const libraryService = new LibraryService();

  const gameResult = await gameService.getGame(params.gameId);
  if (!gameResult.ok) return { success: false, error: gameResult.error };

  const addResult = await libraryService.createLibraryItem({
    userId: params.userId,
    game: gameResult.data,
  });

  return addResult;
}
```

## TypeScript Conventions

### Naming Standards

- **Files/directories**: kebab-case (`my-component.tsx`, `components/auth-wizard/`)
- **Variables/functions**: camelCase (`myVariable`, `getUserById()`)
- **Types/interfaces**: PascalCase (`GameSearchResult`, `ServiceError`)
- **Constants/enums**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `Color.RED`)
- **Generic type parameters**: Prefix with `T` (`TItem`, `TKey`, `TValue`)

### Type Import Style

Always use top-level `import type` (not inline):

```typescript
// ✅ Good
// ❌ Bad
import { type User, type User } from "./user";
```

### Function Return Types

Declare return types for all top-level functions (except React components):

```typescript
// ✅ Good
const getUserById = (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};

// ✅ Good (React component - no return type needed)
const MyComponent = () => {
  return <div>Hello</div>;
};
```

### Error Handling Philosophy

Prefer Result types over throwing errors in business logic:

```typescript
// ✅ Preferred for services
type Result<T, E extends Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// ❌ Avoid manual try/catch in business logic
// Only throw errors if your framework handles them (e.g., Next.js error boundaries)
```

## Code Style Preferences

### General

- Use self-descriptive names, instead of JSDoc/TSDoc or inline comments

### React and Next.js

- Prefer functional components and declarative patterns (no classes)
- Minimize `'use client'` directives - favor React Server Components
- Use dynamic imports for code splitting
- Implement early returns and guard clauses for error conditions
- Use descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)

### Project Structure

- Files: kebab-case with dashes (`game-service.ts`)
- Directories: lowercase with dashes (`features/add-game/`)
- Organize by feature, not by technical layer within features
- Keep related code (components, types, actions) colocated within features

### Styling

- Tailwind CSS for all styling (no CSS modules or styled-components)
- Mobile-first responsive design
- Use shadcn/ui components as base (located in `shared/components/ui/`)

## Environment Configuration

**Validation**: All environment variables are validated using `@t3-oss/env-nextjs` in `env.mjs`

**Required Variables** (see `.env.example`):

```bash
# Authentication (NextAuth v5)
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_URL=http://localhost:6060

# AWS Cognito (Primary Auth Provider)
AUTH_COGNITO_ID=                # Application client ID from AWS Cognito
AUTH_COGNITO_SECRET=            # Application client secret
AUTH_COGNITO_ISSUER=            # https://cognito-idp.<region>.amazonaws.com/<userPoolId>

# Development/Testing Only
AUTH_ENABLE_CREDENTIALS=false   # Enable email/password for E2E tests (set to 'true' for local dev)

# Legacy (Optional - Google OAuth being phased out)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Database (PostgreSQL)
POSTGRES_URL=postgresql://postgres:postgres@localhost:6432/savepoint-db
POSTGRES_PRISMA_URL=            # For Prisma migrations
POSTGRES_URL_NO_SSL=            # Non-SSL connection
POSTGRES_URL_NON_POOLING=       # Direct connection
POSTGRES_HOST=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=savepoint-db

# External APIs
IGDB_CLIENT_ID=                 # Twitch/IGDB API credentials
IGDB_CLIENT_SECRET=
STEAM_API_KEY=                  # Optional for Steam integration
```

## Testing Architecture

### Test Environment Setup

The project uses Vitest with two distinct test modes:

**1. Unit Tests** (`.unit.test.ts`, `.mock.test.ts`):

- Mocked Prisma client for fast execution
- `jsdom` environment for component tests
- `node` environment for server logic
- 10s timeout
- Parallel execution with thread pool

**2. Integration Tests** (`.integration.test.ts`):

- Real PostgreSQL database with Docker
- Automatic database creation/cleanup per test suite
- Sequential execution to prevent conflicts
- 15s timeout

**Server Action Tests** (`.server-action.test.ts`):

- Node environment (excluded from jsdom project)
- Can be unit or integration style

**Handler Tests** (located in `data-access-layer/handlers/`):

- **Unit tests** (`*.unit.test.ts`): Mock services, fast execution, test validation/error handling
- **Integration tests** (`*.integration.test.ts`): Real services with MSW-mocked external APIs
- Run in "backend" (unit) and "integration" (integration) Vitest projects
- No tests in `app/` directory - handler tests live with handler code

### Test Factories

Use factory functions for consistent test data:

```typescript
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";

const user = await createUser({ username: "testuser" });
const game = await createGame({ title: "Test Game", igdbId: 12345 });
const item = await createLibraryItem({ userId: user.id, gameId: game.id });
```

### Coverage Requirements

- **Global threshold**: ≥80% for branches, functions, lines, statements
- Coverage excludes: `.next/`, `app/`, `test/`, config files, type definitions

### Running Specific Tests

```bash
# Run single test file
pnpm test path/to/file.test.ts

# Run tests matching pattern
pnpm test -t "service name"

# Run with UI mode
pnpm test --ui
```

## Git Workflow

### Commit Convention

This project uses **Conventional Commits** enforced by commitlint:

```bash
feat: add Steam library import functionality
feat(auth): implement Steam OAuth integration
fix: resolve game search API timeout issue
fix(ui): correct modal overlay z-index problem
docs: update API integration guide
refactor: migrate to repository pattern
test: add integration tests for Steam API
chore: update dependencies
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Scopes** (optional): `auth`, `ui`, `api`, `db`, feature names

### CI Checks (no local hooks)

- Pre-commit hooks are removed. CI enforces:
  - `format:check`, `lint`, and `typecheck`
  - Vitest projects (`components`, `backend`, `utilities`)
  - Migration safety checks
  
Commit message conventions are validated locally with `pnpm exec commitlint`.

- Runs linting on staged files
- Runs type checking
- Enforces commit message format

## Infrastructure

### Terraform (AWS)

The `infra/` directory contains Terraform configurations for AWS resources:

```bash
infra/
├── modules/           # Reusable Terraform modules
│   └── cognito/      # AWS Cognito User Pool configuration
└── envs/             # Environment-specific configurations
    ├── dev/          # Development environment
    └── prod/         # Production environment
```

**Key Resources**:
- **AWS Cognito User Pools**: Authentication and user management
- Separate configurations for dev and prod environments
- Managed through Infrastructure as Code (IaC)

**Common Terraform Commands** (from `infra/envs/{env}/`):
```bash
terraform init        # Initialize Terraform
terraform plan        # Preview changes
terraform apply       # Apply changes
terraform destroy     # Tear down resources
```

## Key Integrations

### IGDB (Internet Games Database)

- API client: `shared/lib/igdb.ts`
- Handles game search, details, and metadata
- OAuth token management with caching
- Rate limiting and error handling built-in

### Steam Integration

- OpenID authentication via NextAuth
- Steam Web API for library import
- Achievement tracking
- User profile synchronization

### NextAuth v5 (Beta)

- Configuration: [`auth.ts`](savepoint-app/auth.ts)
- **Primary Provider**: AWS Cognito (managed via Terraform in `infra/`)
- **Development Provider**: Credentials (email/password) when `AUTH_ENABLE_CREDENTIALS=true`
- **Legacy Provider**: Google OAuth (being phased out)
- Prisma adapter for session management
- Server-side session access: `getServerUserId()`

**Infrastructure**: Cognito User Pools managed in [`infra/`](infra/) with separate dev/prod environments

## Common Patterns

### Feature Module Structure

```
features/feature-name/
├── ui/                          # React components
│   ├── feature-component.tsx
│   └── feature-modal.tsx
├── server-actions/              # Next.js server actions
│   └── feature-action.ts
├── hooks/                       # Feature-specific hooks
│   └── use-feature.ts
├── use-cases/                   # Business orchestration (optional)
│   └── feature-use-case.ts
├── types.ts                     # Feature types
└── schemas.ts                   # Zod validation schemas
```

**Key Features**:

- **`game-detail`**: Game display and details (imports library modal from `manage-library-entry`)
- **`manage-library-entry`**: Library entry CRUD operations (modal UI, server actions, add-to-library use-case)
- **`library`**: User's game library views and management
- **`journal`**: Journal entry management

### Adding a New Service

1. Define types in `data-access-layer/services/[domain]/types.ts`
2. Create service class extending `BaseService`
3. Implement methods returning `ServiceResult<TData, TError>`
4. Export from `data-access-layer/services/index.ts`
5. Add comprehensive unit tests

### Adding a New Repository Function

1. Create function in `data-access-layer/repository/[domain]/[domain]-repository.ts`
2. Keep functions focused and single-purpose
3. Export from `data-access-layer/repository/index.ts`
4. Add integration tests with real database

### API Routes vs Server Actions - Architectural Decision

**When to Use API Routes:**
- ✅ Public endpoints requiring rate limiting (e.g., `/api/games/search`)
- ✅ Webhook handlers from external services
- ✅ Non-React consumers (mobile apps, external integrations)
- ✅ Explicit HTTP semantics (REST-style endpoints)

**When to Use Server Actions:**
- ✅ Form submissions and mutations from React components
- ✅ Authenticated user operations
- ✅ Data fetching consumed only by React Server Components
- ✅ Operations requiring progressive enhancement

**Current Game Search Implementation:**
The game search feature (`/api/games/search`) uses an API Route instead of Server Actions because:
1. Public access with IP-based rate limiting
2. Standard REST-style GET endpoint
3. May be consumed by non-React clients in the future
4. Explicit caching control with `unstable_cache`

**Future Migration Path:**
When rate limiting moves to middleware, consider migrating to Server Actions for:
- Server-side rendering of initial search results
- Simplified data flow with React `cache()`
- Better integration with Next.js 15 data fetching patterns

### Caching Strategy

**Client-Side Caching (TanStack Query):**
```typescript
// Used for client-side state management and infinite scroll
staleTime: 5 * 60 * 1000,  // 5 minutes
gcTime: 10 * 60 * 1000,     // 10 minutes garbage collection
```

**Server-Side Caching (Next.js `unstable_cache`):**
```typescript
// API routes use unstable_cache for server-side caching
const getCachedGameSearch = unstable_cache(
  async (query: string, offset: number) => {
    // ... IGDB service call
  },
  ["game-search"],
  {
    revalidate: 300,  // Cache for 5 minutes
    tags: ["game-search"]  // Enable cache invalidation
  }
);
```

**Cache Invalidation:**
```typescript
import { revalidateTag } from 'next/cache';

// Invalidate all game search caches
revalidateTag('game-search');
```

**Benefits:**
- Reduced external API calls (IGDB)
- Faster response times for repeated searches
- Cost savings on API usage
- Works across server instances (when deployed with proper cache backend)

## Important Notes

### Package Manager

This project uses **pnpm** (version 10), not npm or yarn. The `pnpm` commands are used throughout.

**Monorepo Setup**: Uses pnpm workspaces. The main app is `savepoint` in the `savepoint-app/` directory.

**Exact Versions**: Always install dependencies with the `-E` flag to pin exact versions (no caret `^` or tilde `~`):

```bash
pnpm add -E package-name        # Production dependency
pnpm add -DE package-name       # Dev dependency
```

### Port Configuration

- Development server: **6060** (not standard 3000)
- PostgreSQL: **6432** (mapped from container 5432)
- pgAdmin: **5050**

### Build System

- Uses **Turbopack** for faster builds (`--turbopack` flag in dev/build)
- React 19 and Next.js 15 are recent versions - check docs for latest patterns

### Logging

The project uses **Pino** for production-grade structured logging with standardized context keys.

**Logger Location**: `shared/lib/logger.ts`

**Standardized Context Keys**: Always use `LOGGER_CONTEXT` constants for consistent logging across the application.

```typescript
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

// Services
const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "GameService" });

// Server Actions
const logger = createLogger({ [LOGGER_CONTEXT.SERVER_ACTION]: "addGameAction" });

// Pages
const logger = createLogger({ [LOGGER_CONTEXT.PAGE]: "ProfilePage" });

// Error Boundaries
const logger = createLogger({ [LOGGER_CONTEXT.ERROR_BOUNDARY]: "GlobalError" });

// Storage Utilities
const logger = createLogger({ [LOGGER_CONTEXT.STORAGE]: "AvatarStorage" });

// Log at different levels
logger.debug("Detailed debug info", { gameId: 123 });
logger.info("Key application event", { action: "game_searched" });
logger.warn("Warning condition", { issue: "rate_limit_approaching" });
logger.error({ error: err }, "Error message");
```

**Available Context Keys**:
- `LOGGER_CONTEXT.SERVICE` - Data access layer services
- `LOGGER_CONTEXT.SERVER_ACTION` - Next.js server actions
- `LOGGER_CONTEXT.PAGE` - Next.js pages
- `LOGGER_CONTEXT.ERROR_BOUNDARY` - React error boundaries
- `LOGGER_CONTEXT.STORAGE` - Storage utilities (S3, etc.)

**Log Levels** (in order of severity):

- `fatal`: System crashes (application cannot continue)
- `error`: Errors requiring attention (but application continues)
- `warn`: Recoverable issues, deprecations
- `info`: Key business events (user actions, API calls)
- `debug`: Detailed debugging information
- `trace`: Very detailed (function entry/exit)
- `silent`: Disable logging (tests)

**When to Log**:

| Level   | Use Case                                          | Example                                       |
| ------- | ------------------------------------------------- | --------------------------------------------- |
| `info`  | Service method entry/exit with key params         | `"Searching games", { query: "zelda" }`       |
| `info`  | Successful operations                             | `"Game details fetched", { gameId }`          |
| `warn`  | Validation failures, missing optional data        | `"Game search with empty name"`               |
| `error` | Exceptions, API failures, database errors         | `{ error }, "IGDB API request failed"`        |
| `debug` | Internal state changes, token refreshes           | `"Twitch token acquired"`                     |
| `debug` | Request/response details (not in production info) | `{ resource, status }, "API request success"` |

**Structured Logging Pattern**:

Always use the pattern: `logger.level({ contextObject }, "message")`

```typescript
// ✅ Good: Structured data + message
logger.info({ userId, gameId, action: "added_to_library" }, "Game added");

// ❌ Bad: String interpolation (not searchable)
logger.info(`User ${userId} added game ${gameId}`);
```

**Service Integration**:

Services should create a logger with the appropriate context key:

```typescript
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export class GameService extends BaseService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "GameService" });

  async searchGames(query: string) {
    this.logger.info({ query }, "Searching games");
    // ... implementation
  }
}
```

**Server Action Integration**:

```typescript
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export async function addGameAction(data: AddGameInput) {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "addGameAction",
  });

  logger.info({ gameId: data.gameId }, "Adding game to library");
  // ... implementation
}
```

**Environment Configuration**:

- **Development**: Pretty-printed colored output with timestamps
- **Production**: JSON structured logs (for log aggregators like Datadog, CloudWatch)
- **Test**: Silent mode (no output)
- **Custom Level**: Set `LOG_LEVEL` env var to override (optional)

**Performance**: Pino is 5-10x faster than alternatives like Winston, with minimal CPU overhead.

### Boundary Enforcement

- ESLint plugin `eslint-plugin-boundaries` enforces architectural boundaries
- Prevents cross-feature imports and maintains clean architecture
- Handler layer enforces that only API routes can import handlers

**Handler Layer Restrictions** (enforced by ESLint):
- ✅ Handlers can import: other handlers, use-cases, services, shared utilities
- ❌ Handlers cannot import: repositories, Prisma client
- ⚠️ Only API routes (`app/api/**`) can import handlers

**Violations will fail ESLint checks in CI**. This prevents:
- Services from calling handlers (wrong direction)
- Handlers from bypassing services to call repositories
- UI components from directly using handler logic

### Current Development Focus

The project is actively refactoring to eliminate architectural boundary violations by:

1. Moving shared types from features to `shared/types/`
2. Implementing service layer abstractions
3. Extracting reusable components to `shared/components/`

See `data-access-layer/services/README.md` for migration strategy.
