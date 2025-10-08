# Two-Pattern Architecture Guide

**Version**: 1.0
**Date**: 2025-10-08
**Status**: Official Guideline

---

## Overview

Play Later v2 supports **two valid architectural patterns** for building features:

1. **Pattern 1: Server Actions** (Default) - For most features
2. **Pattern 2: API Routes + React Query** (Advanced) - For specific use cases

Both patterns **must integrate with the service layer** for business logic. The choice between patterns depends on specific feature requirements.

---

## Pattern 1: Server Actions (Default)

### When to Use

✅ **Use Server Actions when your feature has:**

- Simple CRUD operations
- Form submissions and mutations
- Server-rendered pages (RSC)
- SEO-critical content
- Single-purpose operations
- Straightforward data fetching

### Architecture Flow

```
┌─────────────────────┐
│   Next.js Page      │
│  (Server Component) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Server Action     │
│   (Thin Wrapper)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Service Layer     │
│ (Business Logic)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Repository Layer   │
│  (Data Access)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Prisma → DB       │
└─────────────────────┘
```

### Example Implementation

#### Feature Structure

```
features/add-review/
├── components/
│   └── create-review-form.tsx
├── server-actions/
│   ├── create-review.ts          # Server action
│   └── index.ts
├── lib/
│   └── validation.ts              # Feature-specific Zod schemas
├── types.ts                       # Feature types
├── index.ts
└── CLAUDE.md
```

#### Server Action (Thin Wrapper)

```typescript
// features/add-review/server-actions/create-review.ts
"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { ReviewService } from "@/shared/services";

import { createReviewSchema } from "../lib/validation";

/**
 * Create a new review for a game
 *
 * This is a thin wrapper around ReviewService.
 * Validation is feature-specific and stays here.
 */
export const createReviewAction = authorizedActionClient
  .metadata({
    actionName: "createReview",
    requiresAuth: true,
  })
  .inputSchema(createReviewSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // Instantiate service
    const reviewService = new ReviewService();

    // Call service method - business logic lives in service
    const review = await reviewService.createReview({
      ...parsedInput,
      userId,
    });

    // Revalidate cache if needed
    revalidatePath("/game/[id]", "page");

    return review;
  });
```

#### Service Layer (Business Logic)

```typescript
// shared/services/review/review-service.ts
export class ReviewService {
  private reviewRepository: ReturnType<typeof getReviewRepository>;

  constructor() {
    this.reviewRepository = getReviewRepository();
  }

  /**
   * Create a new review
   *
   * Business logic:
   * - Validates review doesn't already exist
   * - Creates review with proper defaults
   * - Handles errors consistently
   */
  async createReview(input: CreateReviewInput): Promise<Review> {
    // Check for existing review
    const existing = await this.reviewRepository.findByUserAndGame({
      userId: input.userId,
      gameId: input.gameId,
    });

    if (existing) {
      throw new Error("Review already exists for this game");
    }

    // Create review through repository
    return this.reviewRepository.create({
      userId: input.userId,
      gameId: input.gameId,
      rating: input.rating,
      content: input.content,
      isPublic: input.isPublic ?? false,
    });
  }
}
```

#### Component Usage

```typescript
// features/add-review/components/create-review-form.tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { createReviewAction } from "../server-actions";

export function CreateReviewForm({ gameId }: { gameId: string }) {
  const { execute, isExecuting } = useAction(createReviewAction, {
    onSuccess: () => {
      toast.success("Review created!");
    },
  });

  const handleSubmit = (data: FormData) => {
    execute({
      gameId,
      rating: Number(data.get("rating")),
      content: data.get("content") as string,
    });
  };

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isExecuting}>
        Submit Review
      </button>
    </form>
  );
}
```

### Pros and Cons

**Pros:**

- ✅ Simpler architecture (fewer files)
- ✅ Better for SEO (server-rendered)
- ✅ Automatic code splitting
- ✅ Direct integration with React Server Components
- ✅ Less client-side JavaScript
- ✅ Easier to reason about
- ✅ Built-in form handling

**Cons:**

- ❌ No client-side caching (refetches on navigation)
- ❌ Harder to implement optimistic updates
- ❌ Less suitable for complex filtering/searching
- ❌ Can't leverage React Query features
- ❌ Less control over request timing

---

## Pattern 2: API Routes + React Query (Advanced)

### When to Use

✅ **Use API Routes + React Query when your feature has:**

- Complex filtering/searching with many parameters
- Need for client-side caching (repeated queries)
- Optimistic updates that significantly improve UX
- Progressive loading or infinite scroll
- Real-time data updates
- Client-heavy interactions
- Performance benefits from request deduplication

### Architecture Flow

```
┌─────────────────────┐
│   Next.js Page      │
│ (Client Component)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  React Query Hook   │
│  (Data Fetching)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    API Route        │
│  (Thin Wrapper)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Service Layer     │
│ (Business Logic)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Repository Layer   │
│  (Data Access)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Prisma → DB       │
└─────────────────────┘
```

### Example Implementation

#### Feature Structure

```
features/view-imported-games/
├── components/
│   ├── imported-games.tsx         # Client component
│   └── imported-game-card.tsx
├── hooks/
│   └── use-imported-games.ts      # React Query hook
├── lib/
│   └── validation.ts              # Shared validation
├── types.ts
├── index.ts
├── CLAUDE.md
└── REFACTOR.md

app/api/imported-games/
└── route.ts                        # API route handler
```

#### API Route Handler (Thin Wrapper)

```typescript
// app/api/imported-games/route.ts
import { getServerUserId } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

import { searchParamsSchema } from "@/features/view-imported-games/lib/validation";
import { ImportedGameService } from "@/shared/services";

/**
 * GET /api/imported-games
 *
 * Fetches imported games with filtering, sorting, and pagination.
 * This is a thin wrapper around ImportedGameService.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // Authenticate
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate request parameters (feature-specific validation)
    const parsedInput = searchParamsSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      storefront: searchParams.get("storefront") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? "name",
      sortOrder: searchParams.get("sortOrder") ?? "asc",
    });

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: parsedInput.error.format(),
        },
        { status: 400 }
      );
    }

    // Call service - business logic lives in service
    const importedGameService = new ImportedGameService();
    const result = await importedGameService.getImportedGames({
      userId,
      ...parsedInput.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch imported games:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch imported games",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

#### Service Layer (Business Logic)

```typescript
// shared/services/imported-game/imported-game-service.ts
export class ImportedGameService {
  private importedGameRepository: ReturnType<typeof getImportedGameRepository>;

  constructor() {
    this.importedGameRepository = getImportedGameRepository();
  }

  /**
   * Get imported games with filtering, sorting, and pagination
   *
   * Business logic:
   * - Builds complex where clauses
   * - Handles sorting logic
   * - Coordinates pagination
   */
  async getImportedGames(
    input: GetImportedGamesInput
  ): Promise<ImportedGamesResponse> {
    // Build where clause (business logic)
    const where = {
      userId: input.userId,
      ...(input.storefront && { storefront: input.storefront }),
      ...(input.search && {
        name: {
          contains: input.search,
          mode: "insensitive" as const,
        },
      }),
      deletedAt: null,
    };

    // Build orderBy clause (business logic)
    const orderBy = this.buildOrderByClause(input.sortBy, input.sortOrder);

    // Fetch data through repository
    const [totalGames, games] = await Promise.all([
      this.importedGameRepository.count({ where }),
      this.importedGameRepository.findMany({
        where,
        orderBy,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
    ]);

    return {
      games,
      totalGames,
      page: input.page,
      limit: input.limit,
    };
  }

  private buildOrderByClause(sortBy: string, sortOrder: "asc" | "desc") {
    // Business logic for sorting
    switch (sortBy) {
      case "name":
        return { name: sortOrder };
      case "playtime":
        return { playtime: sortOrder };
      case "storefront":
        return { storefront: sortOrder };
      case "createdAt":
        return { createdAt: sortOrder };
      default:
        return { name: sortOrder };
    }
  }
}
```

#### React Query Hook

```typescript
// features/view-imported-games/hooks/use-imported-games.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface UseImportedGamesParams {
  page: number;
  limit: number;
  search?: string;
  storefront?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ImportedGamesResponse {
  games: ImportedGame[];
  totalGames: number;
  page: number;
  limit: number;
}

/**
 * React Query hook for fetching imported games
 *
 * Features:
 * - Automatic caching (30s stale time)
 * - Background refetching
 * - Request deduplication
 * - Loading and error states
 */
export function useImportedGames(params: UseImportedGamesParams) {
  return useQuery({
    queryKey: [
      "imported-games",
      params.page,
      params.limit,
      params.search,
      params.storefront,
      params.sortBy,
      params.sortOrder,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("page", params.page.toString());
      searchParams.set("limit", params.limit.toString());
      if (params.search) searchParams.set("search", params.search);
      if (params.storefront) searchParams.set("storefront", params.storefront);
      if (params.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

      const { data } = await axios.get<ImportedGamesResponse>(
        `/api/imported-games?${searchParams.toString()}`
      );
      return data;
    },
    staleTime: 30_000, // Data fresh for 30 seconds
    gcTime: 300_000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}
```

#### Component Usage

```typescript
// features/view-imported-games/components/imported-games.tsx
"use client";

import { useImportedGames } from "../hooks/use-imported-games";
import { useSearchParams } from "next/navigation";

export function ImportedGames({ limit = 24 }: { limit?: number }) {
  const searchParams = useSearchParams();

  // Extract params from URL
  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? undefined;
  const storefront = searchParams.get("storefront") ?? undefined;
  const sortBy = searchParams.get("sortBy") ?? "name";
  const sortOrder = (searchParams.get("sortOrder") ?? "asc") as "asc" | "desc";

  // Use React Query hook - automatic caching and refetching
  const { data, isLoading, isFetching, error } = useImportedGames({
    page,
    limit,
    search,
    storefront,
    sortBy,
    sortOrder,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      <ImportedGamesFilters />

      {/* Show loading overlay during background refetch */}
      {isFetching && <LoadingOverlay />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.games.map((game) => (
          <ImportedGameCard key={game.id} game={game} />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalItems={data?.totalGames ?? 0}
        itemsPerPage={limit}
      />
    </div>
  );
}
```

### Pros and Cons

**Pros:**

- ✅ Excellent client-side caching (instant repeated queries)
- ✅ Optimistic updates for better perceived performance
- ✅ Background refetching without blocking UI
- ✅ Request deduplication (multiple components can use same query)
- ✅ Automatic retry with exponential backoff
- ✅ Better for complex filtering/searching
- ✅ Fine-grained loading states (isLoading vs isFetching)
- ✅ Easy to implement infinite scroll with useInfiniteQuery

**Cons:**

- ❌ More complex architecture (more files)
- ❌ Additional client-side JavaScript
- ❌ Not ideal for SEO-critical content
- ❌ Requires understanding React Query concepts
- ❌ More setup and configuration needed
- ❌ Potential for stale data if cache not managed properly

---

## Decision Matrix

Use this decision tree to choose the right pattern:

```
Does your feature need client-side caching?
├─ NO → Pattern 1 (Server Actions)
└─ YES
    │
    Does it have complex filtering/searching?
    ├─ NO → Pattern 1 (Server Actions)
    └─ YES
        │
        Will optimistic updates significantly improve UX?
        ├─ NO → Pattern 1 (Server Actions might be sufficient)
        └─ YES → Pattern 2 (API Routes + React Query)
```

### Quick Reference Table

| Requirement         | Pattern 1    | Pattern 2   |
| ------------------- | ------------ | ----------- |
| Simple CRUD         | ✅ Best      | ❌ Overkill |
| Complex filtering   | ⚠️ Possible  | ✅ Best     |
| SEO critical        | ✅ Best      | ❌ Avoid    |
| Form submission     | ✅ Best      | ⚠️ Possible |
| Real-time updates   | ❌ Difficult | ✅ Best     |
| Optimistic updates  | ⚠️ Possible  | ✅ Best     |
| Client-side caching | ❌ None      | ✅ Built-in |
| Progressive loading | ⚠️ Difficult | ✅ Easy     |
| Infinite scroll     | ❌ Difficult | ✅ Easy     |
| Simplicity          | ✅ Simpler   | ❌ Complex  |

---

## Real Examples from Codebase

### Pattern 1 Examples

1. **`add-review`** - Simple form submission
   - Why: Single create operation, no caching needed
   - Files: Server action → ReviewService → Repository

2. **`manage-library-item`** - CRUD operations
   - Why: Form-based create/update/delete, server-rendered
   - Files: Server actions → LibraryService → Repository

3. **`dashboard`** - Analytics display
   - Why: Server-rendered stats, no client interaction needed
   - Files: Multiple server actions → Multiple services → Repository

### Pattern 2 Examples

1. **`view-imported-games`** - Complex filtering
   - Why: Advanced search/filter/sort, benefits from caching
   - Files: React Query hook → API route → ImportedGameService → Repository
   - See: `features/view-imported-games/REFACTOR.md`

2. **`view-collection`** (potential candidate)
   - Why: Complex filtering, repeated queries, user frequently navigates back
   - Would benefit from: Client-side caching, optimistic updates
   - Decision pending

---

## Service Layer Integration (Both Patterns)

**Critical Rule**: Both patterns **MUST** integrate with the service layer.

### Pattern 1 Integration

```typescript
// ❌ BAD - Direct repository call from server action
import { getLibraryRepository } from "@/shared/lib/repository";
// ✅ GOOD - Service layer call from server action
import { LibraryService } from "@/shared/services";

export const getLibraryItems = authorizedActionClient.action(
  async ({ ctx: { userId } }) => {
    const repo = getLibraryRepository();
    return repo.findMany({ where: { userId } }); // ❌ Business logic in action
  }
);

export const getLibraryItems = authorizedActionClient.action(
  async ({ ctx: { userId } }) => {
    const libraryService = new LibraryService();
    return libraryService.getLibraryItems({ userId }); // ✅ Logic in service
  }
);
```

### Pattern 2 Integration

```typescript
// ❌ BAD - Direct repository call from API route
import { getImportedGameRepository } from "@/shared/lib/repository";
// ✅ GOOD - Service layer call from API route
import { ImportedGameService } from "@/shared/services";

export async function GET(request: NextRequest) {
  const repo = getImportedGameRepository();
  const games = await repo.findMany({ where: { userId } }); // ❌ Logic in route
  return NextResponse.json(games);
}

export async function GET(request: NextRequest) {
  const service = new ImportedGameService();
  const result = await service.getImportedGames({ userId }); // ✅ Logic in service
  return NextResponse.json(result);
}
```

---

## Migration Paths

### Migrating from Direct Repository to Pattern 1

1. Keep existing server action structure
2. Import appropriate service
3. Replace repository calls with service calls
4. Move business logic to service
5. Update tests to mock service instead of repository

### Migrating from Server Actions to Pattern 2

1. Create API route handler
2. Move server action logic to API route
3. Integrate with service layer in API route
4. Create React Query hook
5. Update components to use hook instead of server action
6. Update tests

### Migrating from Direct Repository to Pattern 2

1. Create API route handler with service integration
2. Create React Query hook
3. Update components to use hook
4. Update/create tests for all layers

---

## Testing Strategies

### Testing Pattern 1

```typescript
// Test server action (mock service)
describe("createReviewAction", () => {
  it("should create review via ReviewService", async () => {
    const mockCreate = vi.fn().mockResolvedValue(mockReview);
    vi.spyOn(ReviewService.prototype, "createReview").mockImplementation(
      mockCreate
    );

    const result = await createReviewAction({ gameId: "1", rating: 5 });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: "1", rating: 5 })
    );
  });
});
```

### Testing Pattern 2

```typescript
// Test API route (mock service)
describe("GET /api/imported-games", () => {
  it("should return imported games via service", async () => {
    const mockGetGames = vi.fn().mockResolvedValue(mockGamesResponse);
    vi.spyOn(
      ImportedGameService.prototype,
      "getImportedGames"
    ).mockImplementation(mockGetGames);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(mockGetGames).toHaveBeenCalled();
    expect(data.games).toEqual(mockGamesResponse.games);
  });
});

// Test React Query hook
describe("useImportedGames", () => {
  it("should fetch and cache data", async () => {
    const { result } = renderHook(
      () => useImportedGames({ page: 1, limit: 24 }),
      {
        wrapper: createQueryWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.games).toBeDefined();
  });
});
```

---

## Performance Considerations

### Pattern 1 Performance

- ✅ Server-rendered (faster initial load)
- ✅ Less client JavaScript
- ❌ Full page refetch on navigation
- ❌ No caching between navigations

**Best for**: Content that changes frequently, SEO pages, forms

### Pattern 2 Performance

- ⚠️ Client-rendered (slower initial load)
- ⚠️ More client JavaScript
- ✅ Instant cache hits for repeated queries
- ✅ Background refetching without blocking
- ✅ Request deduplication

**Best for**: Data that doesn't change often, complex UIs, frequent navigation

---

## Common Pitfalls

### Pattern 1 Pitfalls

1. **Bypassing service layer** - Always use services, never call repositories directly
2. **Too much logic in server actions** - Server actions should be thin wrappers
3. **Not revalidating cache** - Remember `revalidatePath()` after mutations
4. **Overusing for client-heavy UIs** - Consider Pattern 2 for complex interactions

### Pattern 2 Pitfalls

1. **Overusing for simple operations** - Don't use for basic CRUD if Pattern 1 is simpler
2. **Not configuring cache properly** - Set appropriate `staleTime` and `gcTime`
3. **Forgetting to invalidate queries** - Use `queryClient.invalidateQueries()` after mutations
4. **Not handling loading states** - Use both `isLoading` and `isFetching`
5. **Bypassing service layer** - API routes must call services, not repositories directly

---

## Summary

| Aspect                  | Pattern 1 (Server Actions) | Pattern 2 (API Routes + React Query) |
| ----------------------- | -------------------------- | ------------------------------------ |
| **Default choice**      | ✅ Yes                     | ❌ No                                |
| **Complexity**          | Low                        | High                                 |
| **Use cases**           | Most features              | Complex filtering/caching needs      |
| **SEO**                 | Excellent                  | Poor                                 |
| **Caching**             | None                       | Excellent                            |
| **Learning curve**      | Easy                       | Moderate                             |
| **Service integration** | Required                   | Required                             |

**Default to Pattern 1 unless you have specific requirements that Pattern 2 addresses better.**

---

**Document Owner**: Architecture Team
**Last Updated**: 2025-10-08
**Next Review**: After first Pattern 2 migration (view-collection decision)
