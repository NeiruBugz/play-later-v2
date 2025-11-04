# Technical Specification: Game Metadata Foundation

- **Functional Specification:** [001-game-metadata-foundation/functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

This feature implements a public game search interface using the existing IGDB service integration. The implementation follows the established three-layer architecture pattern (Consumer → Service → Repository) with a feature-based code organization.

**Core Pattern:**
```
Public Page (/games/search)
  ↓ renders
Feature Module (features/game-search/)
  ↓ calls via fetch
API Route (/api/games/search)
  ↓ delegates to
IGDB Service (data-access-layer/services/igdb/)
  ↓ makes authenticated requests to
IGDB API (external)
```

**Key Technical Decisions:**
- **Public access** with IP-based rate limiting (20 searches/hour for unauthenticated users)
- **API Route** pattern instead of Server Action (more appropriate for public GET endpoints)
- **TanStack Query** for client-side state management with infinite scroll capability
- **Feature-based structure** at `features/game-search/` consumed by page at `app/games/search/page.tsx`
- **Minimal service changes** - only adjust result limit from 20 to 10 in existing `IgdbService`

**Affected Systems:**
- Feature modules (new `features/game-search/`)
- API routes (new `app/api/games/search/route.ts`)
- Pages (new `app/games/search/page.tsx`)
- IGDB Service (minor configuration change)
- Shared utilities (new rate limiting utility)

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Feature Module Structure

Create new feature module at `savepoint-app/features/game-search/`:

```
features/game-search/
├── ui/
│   ├── game-search-input.tsx       # Client Component with debounced input
│   ├── game-search-results.tsx     # Client Component for results list
│   ├── game-card.tsx               # Individual search result card
│   ├── platform-badges.tsx         # Platform badge display (max 5 + tooltip)
│   └── game-cover-placeholder.tsx  # Fallback for missing cover art
├── hooks/
│   └── use-game-search.ts          # TanStack Query infinite query hook
├── schemas.ts                       # Zod validation schemas
└── types.ts                         # Feature-specific TypeScript types
```

### 2.2 API Route Implementation

**Endpoint:** `GET /api/games/search?q={query}&offset={offset}`

**Location:** `savepoint-app/app/api/games/search/route.ts`

**Request Parameters:**
- `q` (string, required): Search query (min 3 characters)
- `offset` (number, optional): Pagination offset (default: 0)

**Response Format:**
```typescript
// Success (200)
{
  games: Array<{
    id: number;
    name: string;
    cover?: { image_id: string };
    platforms?: Array<{ name: string }>;
    first_release_date?: number;
  }>;
  count: number;
}

// Rate limit exceeded (429)
{
  error: "Rate limit exceeded. Try again later."
}

// Validation error (400)
{
  error: "Invalid search parameters"
}

// Server error (500)
{
  error: "Game search is temporarily unavailable. Please try again later."
}
```

**Implementation:**

```typescript
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { IgdbService } from '@/data-access-layer/services/igdb';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { SearchGamesSchema } from '@/features/game-search/schemas';

export async function GET(request: NextRequest) {
  try {
    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const validation = SearchGamesSchema.safeParse({ query, offset });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters' },
        { status: 400 }
      );
    }

    // Rate limiting for public endpoint
    const { allowed } = checkRateLimit(request);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Call IGDB service
    const igdbService = new IgdbService();
    const result = await igdbService.searchGamesByName({
      name: validation.data.query,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Game search is temporarily unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}
```

### 2.3 Service Layer Changes

**File:** `savepoint-app/data-access-layer/services/igdb/igdb-service.ts`

**Change Required:**
Modify `SEARCH_RESULTS_LIMIT` constant from 20 to 10:

```typescript
// Before
const SEARCH_RESULTS_LIMIT = 20;

// After
const SEARCH_RESULTS_LIMIT = 10;
```

**Existing Method (No Changes Needed):**
The `searchGamesByName()` method already implements:
- Token management with 60-second safety margin
- Case-insensitive search with normalization
- Cover art filtering (`cover.image_id != null`)
- Platform and release date field fetching

### 2.4 Data Model / Database Changes

**No database changes required** for this feature. Game search results are fetched directly from IGDB API without local caching. Future enhancement may add a `Game` table cache, but this is out of scope for Phase 1.

### 2.5 Component Breakdown

#### Game Search Input Component

**File:** `features/game-search/ui/game-search-input.tsx`

**Responsibilities:**
- Controlled input with debounced onChange (500ms delay)
- Minimum 3 characters before triggering search
- Loading indicator during search
- Renders `GameSearchResults` with query prop

**Implementation:**

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { GameSearchResults } from './game-search-results';

export const GameSearchInput = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 500);

  return (
    <div className="space-y-6">
      <Input
        type="search"
        placeholder="Search for games (minimum 3 characters)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-2xl"
      />
      {debouncedQuery.length >= 3 && (
        <GameSearchResults query={debouncedQuery} />
      )}
    </div>
  );
};
```

#### Game Search Results Component

**File:** `features/game-search/ui/game-search-results.tsx`

**Responsibilities:**
- Uses `useGameSearch` hook with TanStack Query
- Displays loading state (pulse animation skeletons)
- Renders game cards in grid layout
- "Load More" button for pagination
- Error state display

**Implementation:**

```typescript
'use client';

import { Button } from '@/shared/components/ui/button';
import { useGameSearch } from '../hooks/use-game-search';
import { GameCard } from './game-card';

export const GameSearchResults = ({ query }: { query: string }) => {
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage } =
    useGameSearch(query);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive">
        {error instanceof Error
          ? error.message
          : 'Game search is temporarily unavailable. Please try again later.'}
      </div>
    );
  }

  const games = data?.pages.flatMap(page => page.games) ?? [];

  if (games.length === 0) {
    return (
      <div className="text-muted-foreground">
        No games found matching "{query}". Try a different search term.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button onClick={() => fetchNextPage()} variant="outline">
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
};
```

#### Game Card Component

**File:** `features/game-search/ui/game-card.tsx`

**Responsibilities:**
- Display cover art with fallback placeholder
- Game title
- Release year (if available)
- Platform badges (max 5 visible + tooltip for overflow)

**Implementation:**

```typescript
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { GameCoverPlaceholder } from './game-cover-placeholder';
import { PlatformBadges } from './platform-badges';
import type { SearchGameResult } from '../types';

export const GameCard = ({ game }: { game: SearchGameResult }) => {
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;

  const platforms = game.platforms?.map(p => p.name) ?? [];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        {game.cover?.image_id ? (
          <img
            src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`}
            alt={`${game.name} cover`}
            className="w-full h-48 object-cover"
          />
        ) : (
          <GameCoverPlaceholder title={game.name} />
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-2">
          {game.name}
        </h3>
        {releaseYear && (
          <p className="text-sm text-muted-foreground">
            {releaseYear}
          </p>
        )}
        {platforms.length > 0 && (
          <PlatformBadges platforms={platforms} />
        )}
      </CardContent>
    </Card>
  );
};
```

#### Platform Badges Component

**File:** `features/game-search/ui/platform-badges.tsx`

**Responsibilities:**
- Display max 5 platform badges
- Show "+N more" badge with tooltip for overflow

**Implementation:**

```typescript
import { Badge } from '@/shared/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

const MAX_VISIBLE_PLATFORMS = 5;

export const PlatformBadges = ({ platforms }: { platforms: string[] }) => {
  const visible = platforms.slice(0, MAX_VISIBLE_PLATFORMS);
  const remaining = platforms.slice(MAX_VISIBLE_PLATFORMS);

  return (
    <div className="flex gap-1 flex-wrap">
      {visible.map(name => (
        <Badge key={name} variant="secondary" className="text-xs">
          {name}
        </Badge>
      ))}
      {remaining.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs cursor-help">
              +{remaining.length} more
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{remaining.join(', ')}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
```

#### Game Cover Placeholder Component

**File:** `features/game-search/ui/game-cover-placeholder.tsx`

**Responsibilities:**
- Display fallback UI when cover art is unavailable
- Show game icon and truncated title

**Implementation:**

```typescript
import { Gamepad2 } from 'lucide-react';

export const GameCoverPlaceholder = ({ title }: { title: string }) => {
  return (
    <div className="w-full h-48 bg-muted flex flex-col items-center justify-center gap-2 p-4">
      <Gamepad2 className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-center line-clamp-2">
        {title}
      </p>
    </div>
  );
};
```

### 2.6 TanStack Query Integration

**File:** `features/game-search/hooks/use-game-search.ts`

**Implementation:**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export const useGameSearch = (query: string) => {
  return useInfiniteQuery({
    queryKey: ['game-search', query],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/games/search?q=${encodeURIComponent(query)}&offset=${pageParam}`
      );

      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Try again later.');
      }

      if (!response.ok) {
        throw new Error('Game search is temporarily unavailable. Please try again later.');
      }

      return response.json();
    },
    enabled: query.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.games?.length === 10
        ? allPages.length * 10
        : undefined;
    },
  });
};
```

### 2.7 Rate Limiting Utility

**File:** `savepoint-app/shared/lib/rate-limit.ts`

**Strategy:** IP-based rate limiting with in-memory Map

**Configuration:**
- Unauthenticated users: 20 requests/hour
- Authenticated users: Unlimited (future enhancement)
- Window: 1 hour (3600000ms)

**Implementation:**

```typescript
import type { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimit = new Map<string, RateLimitRecord>();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimit.entries()) {
    if (now > record.resetAt) {
      rateLimit.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export function checkRateLimit(
  request: NextRequest,
  limit: number = 20,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): { allowed: boolean; remaining: number } {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();

  const record = rateLimit.get(ip);

  // No existing record or window expired
  if (!record || now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  // Rate limit exceeded
  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  record.count++;
  return { allowed: true, remaining: limit - record.count };
}
```

**Limitations:**
- In-memory storage (resets on server restart)
- Single-instance deployment only
- Not suitable for multi-instance horizontal scaling

**Future Enhancement:**
Migrate to Redis-based rate limiting if deploying to multi-instance ECS/Fargate environment.

### 2.8 Page Consumer

**File:** `savepoint-app/app/games/search/page.tsx`

**Implementation:**

```typescript
import type { Metadata } from 'next';
import { GameSearchInput } from '@/features/game-search/ui/game-search-input';

export const metadata: Metadata = {
  title: 'Search Games | SavePoint',
  description: 'Search our extensive game database powered by IGDB',
};

export default function GameSearchPage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Games</h1>
          <p className="text-muted-foreground mt-2">
            Find games to add to your SavePoint library
          </p>
        </div>

        <GameSearchInput />
      </div>
    </div>
  );
}
```

### 2.9 Validation Schemas

**File:** `features/game-search/schemas.ts`

**Implementation:**

```typescript
import { z } from 'zod';

export const SearchGamesSchema = z.object({
  query: z.string().min(3, 'Search query must be at least 3 characters'),
  offset: z.number().int().min(0).optional().default(0),
});

export type SearchGamesInput = z.infer<typeof SearchGamesSchema>;
```

### 2.10 Type Definitions

**File:** `features/game-search/types.ts`

**Implementation:**

```typescript
export interface SearchGameResult {
  id: number;
  name: string;
  cover?: {
    image_id: string;
  };
  platforms?: Array<{
    name: string;
  }>;
  first_release_date?: number;
}

export interface GameSearchResponse {
  games: SearchGameResult[];
  count: number;
}
```

---

## 3. Impact and Risk Analysis

### System Dependencies

**Internal Dependencies:**
- **IGDB Service** (`data-access-layer/services/igdb/igdb-service.ts`)
  - Impact: Reduced result limit from 20 to 10
  - Risk: Existing consumers may expect 20 results (mitigation: verify no other features depend on this limit)
- **TanStack Query** (`@tanstack/react-query`)
  - Impact: Client-side state management and caching
  - Risk: Version compatibility with React 19 (mitigation: already in use throughout app)
- **shadcn/ui Components** (Badge, Card, Input, Tooltip)
  - Impact: UI component dependencies
  - Risk: None (already established pattern)

**External Dependencies:**
- **IGDB API** (https://api.igdb.com)
  - Impact: Primary data source for game metadata
  - Risk: API downtime or rate limiting (mitigation: error handling with user-friendly messages)
- **Twitch OAuth** (for IGDB token management)
  - Impact: Required for IGDB API authentication
  - Risk: Token expiry (mitigation: existing 60-second safety margin in `IgdbService`)

### Potential Risks & Mitigations

#### Risk 1: IGDB API Rate Limiting
**Severity:** High
**Description:** IGDB enforces rate limits (4 requests/second). Public endpoint could trigger rate limiting with concurrent users.
**Mitigation:**
- Client-side debouncing (500ms delay)
- TanStack Query caching (5-minute staleTime)
- Application-level rate limiting (20 searches/hour per IP)
- Future enhancement: Implement Redis-based distributed rate limiting for multi-instance deployments

#### Risk 2: Abuse of Public Endpoint
**Severity:** Medium
**Description:** Unauthenticated endpoint vulnerable to automated scraping or DoS attacks.
**Mitigation:**
- IP-based rate limiting (20 requests/hour)
- Cloudflare DDoS protection at infrastructure level
- Monitor CloudWatch metrics for anomalous traffic patterns
- Future enhancement: Implement CAPTCHA after threshold (e.g., 10 searches in 1 minute)

#### Risk 3: Data Quality from IGDB
**Severity:** Low
**Description:** IGDB data may contain missing cover art, incomplete platforms, or inconsistent naming.
**Mitigation:**
- Graceful fallback UI (placeholder component for missing covers)
- Filter games with `cover.image_id != null` in IGDB query (already implemented)
- Display "No games found" message with helpful prompt to try different search terms

#### Risk 4: Mobile Performance
**Severity:** Low
**Description:** Rendering multiple high-resolution cover images could impact mobile performance.
**Mitigation:**
- Use IGDB's `t_cover_big` thumbnail size (264x352px) instead of full resolution
- Lazy loading for images (browser-native `loading="lazy"` attribute)
- Grid layout with responsive breakpoints (1 column mobile, 3 columns desktop)

#### Risk 5: Search Relevance
**Severity:** Low
**Description:** IGDB search algorithm may not match user expectations for relevance.
**Mitigation:**
- Display results in order returned by IGDB (already relevance-sorted)
- Future enhancement: Implement client-side filtering options (platform, release year)
- Provide clear messaging: "Powered by IGDB"

#### Risk 6: Memory Leak in Rate Limiting
**Severity:** Low
**Description:** In-memory `Map` for rate limiting could grow unbounded over time.
**Mitigation:**
- Periodic cleanup: `setInterval` to remove expired entries every 10 minutes
- Bounded by IP uniqueness and 1-hour window expiry
- Monitor heap usage in CloudWatch metrics

---

## 4. Testing Strategy

### 4.1 Unit Tests

**Scope:** Service layer, utilities, validation schemas

**Test Files:**
- `data-access-layer/services/igdb/igdb-service.unit.test.ts`
  - Test `searchGamesByName()` with mocked Prisma client
  - Validate empty query returns validation error
  - Verify Result type error handling
- `shared/lib/rate-limit.unit.test.ts`
  - Test rate limit enforcement (21st request denied)
  - Verify window expiry resets counter
  - Test IP extraction from headers
- `features/game-search/schemas.unit.test.ts`
  - Validate minimum 3 characters requirement
  - Test offset boundary conditions (negative, non-integer)

**Example Test:**

```typescript
describe('checkRateLimit', () => {
  it('should allow first 20 requests within window', () => {
    const mockRequest = createMockRequest('192.168.1.1');

    for (let i = 0; i < 20; i++) {
      const { allowed } = checkRateLimit(mockRequest);
      expect(allowed).toBe(true);
    }
  });

  it('should deny 21st request within window', () => {
    const mockRequest = createMockRequest('192.168.1.1');

    // Make 20 requests
    for (let i = 0; i < 20; i++) {
      checkRateLimit(mockRequest);
    }

    // 21st request should be denied
    const { allowed } = checkRateLimit(mockRequest);
    expect(allowed).toBe(false);
  });
});
```

### 4.2 Integration Tests

**Scope:** API route with real IGDB service (mocked external API calls)

**Test File:** `app/api/games/search/route.integration.test.ts`

**Test Cases:**
- Valid search query returns 200 with game results
- Query with <3 characters returns 400 validation error
- Rate limit exceeded returns 429 error
- IGDB service failure returns 500 error

**MSW Setup:**

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const igdbHandlers = [
  http.post('https://api.igdb.com/v4/games', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'The Legend of Zelda: Breath of the Wild',
        cover: { image_id: 'co1234' },
        platforms: [{ name: 'Nintendo Switch' }],
        first_release_date: 1488326400,
      },
    ]);
  }),

  http.post('https://id.twitch.tv/oauth2/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      expires_in: 5000000,
    });
  }),
];

const server = setupServer(...igdbHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Example Test:**

```typescript
describe('GET /api/games/search', () => {
  it('should return games for valid search query', async () => {
    const response = await fetch('/api/games/search?q=zelda');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toHaveLength(1);
    expect(data.games[0].name).toContain('Zelda');
  });

  it('should return 400 for query with <3 characters', async () => {
    const response = await fetch('/api/games/search?q=ze');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid search parameters',
    });
  });
});
```

### 4.3 Component Tests

**Scope:** React components with user interactions

**Test Files:**
- `features/game-search/ui/game-search-input.test.tsx`
  - Verify debouncing (input "zelda" with 500ms delay)
  - Ensure no search triggered for <3 characters
  - Test loading state display
- `features/game-search/ui/game-search-results.test.tsx`
  - Render game cards for successful query
  - Display "No games found" for empty results
  - Show error message on fetch failure
  - "Load More" button triggers pagination
- `features/game-search/ui/platform-badges.test.tsx`
  - Display max 5 badges
  - Show "+N more" badge with tooltip for overflow

**MSW Handlers:**

```typescript
const handlers = [
  http.get('/api/games/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (query === 'zelda') {
      return HttpResponse.json({
        games: [{ id: 1, name: 'Zelda', cover: { image_id: 'co1234' } }],
        count: 1,
      });
    }

    return HttpResponse.json({ games: [], count: 0 });
  }),
];
```

**Example Test:**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameSearchInput } from './game-search-input';

describe('GameSearchInput', () => {
  it('should debounce search input', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <GameSearchInput />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/search for games/i);
    await userEvent.type(input, 'zelda');

    // Should not trigger search immediately
    expect(screen.queryByText(/zelda/i)).not.toBeInTheDocument();

    // Should trigger search after 500ms debounce
    await waitFor(() => {
      expect(screen.getByText(/zelda/i)).toBeInTheDocument();
    }, { timeout: 600 });
  });
});
```

### 4.4 E2E Tests (Future Phase)

**Scope:** Critical user journey (Playwright)

**Test Scenario:**
1. Navigate to `/games/search`
2. Type "zelda" in search input
3. Wait for debounced search (500ms)
4. Verify game cards rendered
5. Click "Load More" button
6. Verify additional results appended

**Deferred Reason:** Requires authentication flow and "Add to Library" feature to be implemented first for meaningful end-to-end testing.

### 4.5 Coverage Requirements

- **Global threshold:** ≥80% for branches, functions, lines, statements
- **Service layer:** 100% coverage of `searchGamesByName()` error paths
- **Rate limiting utility:** 100% coverage of limit enforcement logic
- **Components:** ≥80% coverage of user interactions and conditional rendering

### 4.6 CI Integration

**GitHub Actions Workflow:**

```yaml
# .github/workflows/pr-checks.yml
- name: Run Unit Tests
  run: pnpm --filter savepoint test --project=unit --coverage

- name: Start Test Database
  run: docker-compose up -d

- name: Run Integration Tests
  run: pnpm --filter savepoint test --project=integration

- name: Run Component Tests
  run: pnpm --filter savepoint test --project=components

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

---

## Implementation Checklist

- [ ] Create feature module structure at `features/game-search/`
- [ ] Implement API route at `app/api/games/search/route.ts`
- [ ] Add rate limiting utility at `shared/lib/rate-limit.ts`
- [ ] Modify `SEARCH_RESULTS_LIMIT` in `igdb-service.ts`
- [ ] Implement UI components (search input, results, cards, badges, placeholder)
- [ ] Create TanStack Query hook with infinite scroll
- [ ] Add Zod validation schemas
- [ ] Create page at `app/games/search/page.tsx`
- [ ] Write unit tests for rate limiting utility
- [ ] Write integration tests for API route with MSW
- [ ] Write component tests for search UI
- [ ] Verify ESLint boundaries enforcement
- [ ] Update `.env.example` if new environment variables needed (not required)
- [ ] Test mobile responsiveness at 375px, 768px, 1024px breakpoints
- [ ] Verify accessibility (keyboard navigation, screen reader labels)
- [ ] Performance testing (Lighthouse score ≥90 for Performance)
