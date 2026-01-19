# Technical Specification: Steam Library Integration - Stage 1 Technical Foundation

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Claude (AI Assistant)

---

## 1. High-Level Technical Approach

This feature establishes the technical foundation for Steam library import with two parallel paths:

1. **Manual Import Path**: Next.js API route → Handler → SteamService → Steam Web API → ImportedGame table. Always enabled, user-controlled.

2. **Background Sync Path**: Next.js API route → SQS queue → Lambda pipeline (3-stage) → ImportedGame/Game/LibraryItem tables. Feature-flagged, disabled in production.

**Key Architectural Decisions:**

- Steam authentication via standalone OpenID flow (not NextAuth provider)
- All Steam Web API interactions go through API routes with handler layer (rate limiting, validation)
- Async Lambda invocation via SQS/EventBridge for resilience
- ImportedGame schema extended with platform playtime and lastPlayedAt for filtering
- Feature flag `ENABLE_STEAM_BACKGROUND_SYNC` controls Lambda path availability

**Systems Affected:**

- `prisma/schema.prisma` - ImportedGame model extension
- `data-access-layer/` - New services, handlers, repository
- `features/steam-import/` - New feature slice
- `app/api/steam/` - New API routes
- `infra/` - SQS queue and Lambda event mapping (Terraform)
- Environment variables - New feature flag

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Architecture Changes

**New Feature Structure:**

```
features/steam-import/
├── ui/
│   ├── steam-connect-card.tsx        # Steam connection (OAuth + manual)
│   ├── import-path-selector.tsx      # Manual vs background sync choice
│   ├── imported-games-list.tsx       # Paginated list with filters
│   ├── imported-game-card.tsx        # Individual game display
│   └── import-status-toast.tsx       # Background sync notifications
├── server-actions/
│   ├── disconnect-steam.ts           # Remove Steam connection (no Steam API)
│   └── trigger-background-sync.ts    # Push to SQS (no Steam API)
├── hooks/
│   ├── use-imported-games.ts         # TanStack Query for list
│   ├── use-steam-connection.ts       # Connection status
│   └── use-fetch-steam-games.ts      # Mutation for POST /api/steam/games
├── schemas.ts                        # Zod validation
└── types.ts                          # Feature types
```

**Data Access Layer:**

```
data-access-layer/
├── handlers/steam-import/
│   ├── steam-connect.handler.ts      # Manual ID validation + profile fetch
│   ├── fetch-steam-games.handler.ts  # Fetch owned games from Steam
│   └── imported-games.handler.ts     # List/filter/search
├── services/steam/
│   ├── steam-service.ts              # Steam Web API client
│   ├── steam-openid-service.ts       # OpenID authentication
│   └── types.ts
└── repository/imported-game/
    ├── imported-game-repository.ts   # CRUD + queries
    └── types.ts
```

**API Routes (all Steam Web API interactions):**

```
app/api/steam/
├── auth/route.ts              # GET: Initiate Steam OpenID
├── auth/callback/route.ts     # GET: Handle OpenID callback → fetches profile
├── connect/route.ts           # POST: Manual Steam ID → validates & fetches profile
├── games/route.ts             # GET: List imported, POST: Fetch from Steam
└── sync/route.ts              # POST: Trigger background sync
```

### 2.2 Data Model / Database Changes

**Migration: Extend ImportedGame**

```prisma
model ImportedGame {
  // Existing fields
  id               String           @id @default(cuid())
  name             String
  storefront       Storefront
  storefrontGameId String?
  playtime         Int?             @default(0)
  img_icon_url     String?
  img_logo_url     String?
  igdbMatchStatus  IgdbMatchStatus  @default(PENDING)

  // NEW: Platform-specific playtime (minutes)
  playtimeWindows  Int?             @default(0)
  playtimeMac      Int?             @default(0)
  playtimeLinux    Int?             @default(0)

  // NEW: Last played timestamp
  lastPlayedAt     DateTime?

  // Existing
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  deletedAt        DateTime?
  userId           String
  User             User             @relation(fields: [userId], references: [id])

  @@index([userId, deletedAt])
  @@index([storefrontGameId])
  @@index([userId, playtime])      // NEW: For sorting
  @@index([userId, lastPlayedAt])  // NEW: For filtering
}
```

**User model**: No changes needed - `steamId64`, `steamUsername`, `steamAvatar`, `steamProfileURL`, `steamConnectedAt` already exist.

### 2.3 API Contracts

**Steam OpenID Authentication:**

```
GET /api/steam/auth
  → Redirects to Steam OpenID login page

GET /api/steam/auth/callback?openid.claimed_id=...
  → Validates OpenID response
  → Extracts Steam ID from claimed_id
  → Fetches profile via Steam Web API (SteamService)
  → Updates User (steamId64, steamUsername, steamAvatar, steamConnectedAt)
  → Redirects to /settings?steam=connected
```

**Manual Steam ID Connection:**

```
POST /api/steam/connect
  Auth: Required
  Body: { steamId: "76561198012345678" | "customurl" }
  Handler: steam-connect.handler.ts
  Response: { success: true, profile: { steamId64, displayName, avatarUrl } }
  Errors:
    - 400: Invalid Steam ID format
    - 404: Steam profile not found
    - 403: Steam profile is private
```

**Fetch Steam Games (Manual Import Path):**

```
POST /api/steam/games
  Auth: Required
  Body: {} (uses User.steamId64 from session)
  Handler: fetch-steam-games.handler.ts
  Response: {
    success: true,
    imported: 156,      # Games added/updated in ImportedGame
    total: 200,         # Total owned games from Steam
    filtered: 44        # DLC/demos/soundtracks skipped
  }
  Errors:
    - 400: No Steam account connected
    - 403: Steam profile game details are private
    - 502: Steam API unavailable
    - 429: Rate limited (too many requests)
```

**List Imported Games:**

```
GET /api/steam/games
  Auth: Required
  Handler: imported-games.handler.ts
  Query Parameters:
    - search: string (fuzzy name search)
    - page: number (default 1)
    - limit: number (default 25, max 100)
    - playtimeStatus: "all" | "played" | "never_played"
    - playtimeRange: "all" | "under_1h" | "1_to_10h" | "10_to_50h" | "over_50h"
    - platform: "all" | "windows" | "mac" | "linux"
    - lastPlayed: "all" | "30_days" | "1_year" | "over_1_year" | "never"
    - sortBy: "name_asc" | "name_desc" | "playtime_desc" | "playtime_asc" |
              "last_played_desc" | "last_played_asc" | "added_desc"
  Response: {
    games: ImportedGame[],
    pagination: { page, limit, total, totalPages }
  }
```

**Trigger Background Sync:**

```
POST /api/steam/sync
  Auth: Required
  Body: {}
  Response: { success: true, jobId: "uuid" }
  Errors:
    - 400: No Steam account connected
    - 403: Feature disabled (ENABLE_STEAM_BACKGROUND_SYNC=false)
    - 429: Sync already in progress for this user
```

### 2.4 Component Breakdown

| Component | Responsibility |
|-----------|----------------|
| `SteamConnectCard` | OAuth trigger button, manual ID form, connection status display, disconnect option |
| `ImportPathSelector` | Two-option cards (Fetch & Curate / Background Sync), feature flag badge, flow triggers |
| `ImportedGamesList` | Search input, filter dropdowns, sort selector, pagination controls, list rendering |
| `ImportedGameCard` | Game name, Steam icon, formatted playtime, last played relative date |
| `ImportStatusToast` | Background sync completion/error notifications via toast |

### 2.5 Feature Flag Implementation

**Environment Variable:**

```typescript
// env.mjs
export const env = createEnv({
  server: {
    // ... existing
    ENABLE_STEAM_BACKGROUND_SYNC: z.enum(["true", "false"]).default("false"),
  },
});
```

**Feature Config:**

```typescript
// features/steam-import/config.ts
import { env } from "@/env.mjs";

export const steamImportConfig = {
  isBackgroundSyncEnabled: env.ENABLE_STEAM_BACKGROUND_SYNC === "true",
};
```

**Usage in UI:**

```typescript
// import-path-selector.tsx
import { steamImportConfig } from "../config";

{steamImportConfig.isBackgroundSyncEnabled ? (
  <Button onClick={handleBackgroundSync}>Start Background Sync</Button>
) : (
  <div className="relative">
    <Badge variant="secondary" className="absolute -top-2 -right-2">
      Coming Soon
    </Badge>
    <Button disabled>Background Sync</Button>
  </div>
)}
```

**Usage in API Route:**

```typescript
// app/api/steam/sync/route.ts
import { steamImportConfig } from "@/features/steam-import/config";

export async function POST(request: Request) {
  if (!steamImportConfig.isBackgroundSyncEnabled) {
    return NextResponse.json(
      { error: "Background sync is not available yet" },
      { status: 403 }
    );
  }
  // ... trigger SQS
}
```

### 2.6 AWS Infrastructure (SQS/EventBridge)

**Terraform Configuration:**

```hcl
# infra/modules/steam-import/main.tf

resource "aws_sqs_queue" "steam_import_dlq" {
  name                      = "savepoint-steam-import-dlq-${var.environment}"
  message_retention_seconds = 1209600  # 14 days
}

resource "aws_sqs_queue" "steam_import_queue" {
  name                       = "savepoint-steam-import-${var.environment}"
  visibility_timeout_seconds = 900  # 15 min for Lambda processing
  message_retention_seconds  = 86400  # 1 day

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.steam_import_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_lambda_event_source_mapping" "steam_import_trigger" {
  event_source_arn = aws_sqs_queue.steam_import_queue.arn
  function_name    = aws_lambda_function.steam_import.arn
  batch_size       = 1
  enabled          = var.enable_steam_background_sync
}
```

**SQS Message Format:**

```json
{
  "userId": "cuid_abc123",
  "steamId64": "76561198012345678",
  "requestedAt": "2025-01-19T12:00:00Z"
}
```

**Lambda Pipeline Flow:**

```
SQS Message
    ↓
Lambda 1: steam_import
    → Fetch Steam library via Steam Web API
    → Upload raw CSV to S3
    → Return s3_location
    ↓
Lambda 2: igdb_enrichment
    → Download raw CSV from S3
    → Query IGDB for each game
    → Upload enriched CSV to S3
    → Return s3_enriched_location
    ↓
Lambda 3: database_import
    → Download enriched CSV from S3
    → Upsert ImportedGame records
    → Create Game + LibraryItem for matched games
    → Return statistics
```

### 2.7 Service Layer Design

**SteamService:**

```typescript
// data-access-layer/services/steam/steam-service.ts
export class SteamService extends BaseService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "SteamService" });

  async getPlayerSummary(steamId64: string): Promise<ServiceResult<SteamProfile>>;
  async getOwnedGames(steamId64: string): Promise<ServiceResult<SteamOwnedGame[]>>;
  async resolveVanityURL(vanityUrl: string): Promise<ServiceResult<string>>;
  async validateSteamId(input: string): Promise<ServiceResult<string>>; // Returns steamId64
}
```

**SteamOpenIdService:**

```typescript
// data-access-layer/services/steam/steam-openid-service.ts
export class SteamOpenIdService extends BaseService {
  getAuthUrl(returnUrl: string): string;
  validateCallback(params: URLSearchParams): ServiceResult<string>; // Returns steamId64
}
```

**ImportedGameRepository:**

```typescript
// data-access-layer/repository/imported-game/imported-game-repository.ts
export const importedGameRepository = {
  upsertMany(userId: string, games: CreateImportedGameInput[]): Promise<RepositoryResult<number>>;
  findByUserId(userId: string, options: ImportedGameQueryOptions): Promise<RepositoryResult<PaginatedResult<ImportedGame>>>;
  countByUserId(userId: string): Promise<RepositoryResult<number>>;
  softDelete(id: string): Promise<RepositoryResult<void>>;
};
```

---

## 3. Impact and Risk Analysis

### System Dependencies

| Dependency | Impact | Mitigation |
|------------|--------|------------|
| Steam Web API | Rate limits (100k/day), availability | Caching profile data, exponential backoff, graceful degradation |
| AWS SQS | Message delivery, Lambda triggers | Dead letter queue, CloudWatch monitoring, manual retry option |
| PostgreSQL | Schema migration, query performance | Rollback-safe migration, new indexes for filter/sort queries |
| NextAuth/Session | Auth for all endpoints | Existing patterns, well-tested flows |
| Existing Lambda Pipeline | 3-stage processing | Already implemented and tested locally |

### Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Steam profile privacy blocks import | High | User frustration | Clear error message with direct link to Steam privacy settings |
| Large libraries (1000+ games) cause slow fetch | Medium | Poor UX | Batch processing, progress indicator, pagination in response |
| IGDB match failures for obscure games | Medium | Incomplete data | Store unmatched in ImportedGame, future manual matching UI |
| Lambda cold starts delay background sync | Low | Slower import | User notification of async nature, provisioned concurrency if needed |
| SQS message loss | Very Low | Lost import request | Dead letter queue with 14-day retention, idempotent processing |
| Steam OpenID deprecation | Low | Auth breaks | Manual ID entry always available as fallback |
| AWS costs in production | Medium | Budget overrun | Feature flag OFF by default, CloudWatch billing alerts |
| Rate limiting on manual fetch | Medium | User blocked | Clear rate limit message, suggest trying later |

### Rollback Strategy

1. **Schema Migration**: Add columns only (no data migration), rollback is no-op
2. **Feature Flag**: Set `ENABLE_STEAM_BACKGROUND_SYNC=false` to disable Lambda path instantly
3. **API Routes**: Can be disabled via middleware or removed without affecting core app
4. **Lambda Integration**: SQS event mapping can be disabled in Terraform

---

## 4. Testing Strategy

### Unit Tests

| Component | Test Focus | Mock Dependencies |
|-----------|------------|-------------------|
| `SteamService` | API client methods, error handling, response parsing | MSW for HTTP |
| `SteamOpenIdService` | URL generation, callback validation, ID extraction | None (pure logic) |
| `ImportedGameRepository` | Query building, filter application, pagination | Prisma client |
| `steam-connect.handler` | Input validation, profile fetch orchestration | SteamService |
| `fetch-steam-games.handler` | Auth check, Steam fetch, upsert logic | SteamService, Repository |
| `imported-games.handler` | Query params parsing, filter/sort mapping | Repository |

### Integration Tests

| Flow | Test Focus | Setup |
|------|------------|-------|
| ImportedGame CRUD | Repository upsert, find, soft delete | Real PostgreSQL |
| Filter combinations | Playtime + platform + lastPlayed filters | Seeded test data (50+ games) |
| Sorting correctness | All sort options, null handling | Varied test data |
| Pagination boundaries | First/last page, empty results | 100+ test records |
| Steam fetch → ImportedGame | End-to-end manual import flow | MSW for Steam API |

### Component Tests

| Component | Test Focus |
|-----------|------------|
| `SteamConnectCard` | OAuth button click, manual form validation, loading states |
| `ImportedGamesList` | Search debounce (300ms), filter chip display, pagination navigation |
| `ImportPathSelector` | Feature flag badge visibility, disabled state styling |
| `ImportedGameCard` | Playtime formatting ("12.5 hrs", "Never played"), relative dates |

### API Route Tests

| Route | Test Focus |
|-------|------------|
| `POST /api/steam/connect` | Valid ID, invalid format, private profile, not found |
| `POST /api/steam/games` | No Steam connected, successful fetch, Steam API error |
| `GET /api/steam/games` | All filter combinations, pagination, empty results |
| `POST /api/steam/sync` | Feature flag check, already in progress, success |

### E2E Tests (Deferred to Stage 3)

- Full flow: Connect Steam → Fetch games → View list → Apply filters → Paginate
- Error recovery: Private profile → Update settings → Retry successfully

---

## Appendix: Environment Variables

**New Variables Required:**

```bash
# Feature flag (default: false in production)
ENABLE_STEAM_BACKGROUND_SYNC=false

# AWS SQS (only needed when background sync enabled)
AWS_SQS_STEAM_IMPORT_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/savepoint-steam-import-dev
```

**Existing Variables Used:**

```bash
# Already in .env.example
STEAM_API_KEY=...           # Steam Web API key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```
