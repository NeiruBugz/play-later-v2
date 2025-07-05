# 08 - Caching and Performance Strategies

## Problem Statement

The codebase lacks a **comprehensive caching strategy**, leading to repeated expensive operations, unnecessary API calls to external services (IGDB), and poor performance for frequently accessed data.

### Current Performance Issues

#### ❌ Issue 1: No IGDB API Response Caching

```typescript
// shared/lib/igdb.ts
// Every search hits the IGDB API without caching
async search({ name, fields }) {
  const query = new QueryBuilder()
    .fields(["name", "platforms.name", "cover.image_id"])
    .search(name)
    .build();

  // ❌ No caching - hits external API every time
  return this.request<SearchResponse[]>({
    body: query,
    resource: "/games",
  });
}
```

#### ❌ Issue 2: Repeated Database Queries

```typescript
// features/dashboard/components/collection-stats.tsx
// Same user collection queried multiple times
const stats = await getUserCollectionStats(userId); // Query 1
const recentGames = await getRecentlyAddedGames(userId); // Query 2
const platformBreakdown = await getPlatformBreakdown(userId); // Query 3

// ❌ These could share cached data or be combined into one query
```

#### ❌ Issue 3: Inconsistent Revalidation

```typescript
// Multiple files with manual revalidation
revalidatePath("/collection");
revalidatePath("/dashboard");
revalidatePath(`/game/${gameId}`);

// ❌ No centralized cache invalidation strategy
// ❌ Over-revalidation causes unnecessary re-renders
```

## Comprehensive Caching Strategy

### 1. External API Response Caching

#### ✅ IGDB API with Redis Caching

```typescript
// shared/lib/cache/igdb-cache.ts
import { Redis } from "ioredis";
import { SearchResponse, FullGameInfoResponse } from "@/shared/types/igdb";

class IGDBCache {
  private redis: Redis;
  private readonly TTL = {
    SEARCH: 60 * 60 * 24, // 24 hours
    GAME_DETAILS: 60 * 60 * 24 * 7, // 1 week
    POPULAR_GAMES: 60 * 60 * 12, // 12 hours
  };

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  private generateKey(type: string, params: Record<string, any>): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join("|");
    return `igdb:${type}:${paramString}`;
  }

  async getSearchResults(
    query: string,
    filters?: Record<string, any>
  ): Promise<SearchResponse[] | null> {
    const key = this.generateKey("search", { query, ...filters });

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn("Cache read error:", error);
    }

    return null;
  }

  async setSearchResults(
    query: string,
    results: SearchResponse[],
    filters?: Record<string, any>
  ): Promise<void> {
    const key = this.generateKey("search", { query, ...filters });

    try {
      await this.redis.setex(key, this.TTL.SEARCH, JSON.stringify(results));
    } catch (error) {
      console.warn("Cache write error:", error);
    }
  }

  async getGameDetails(gameId: number): Promise<FullGameInfoResponse | null> {
    const key = this.generateKey("game", { id: gameId });

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn("Cache read error:", error);
    }

    return null;
  }

  async setGameDetails(
    gameId: number,
    details: FullGameInfoResponse
  ): Promise<void> {
    const key = this.generateKey("game", { id: gameId });

    try {
      await this.redis.setex(key, this.TTL.GAME_DETAILS, JSON.stringify(details));
    } catch (error) {
      console.warn("Cache write error:", error);
    }
  }

  async invalidateGame(gameId: number): Promise<void> {
    const pattern = `igdb:game:id:${gameId}*`;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn("Cache invalidation error:", error);
    }
  }

  async invalidateSearch(query: string): Promise<void> {
    const pattern = `igdb:search:query:${query}*`;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn("Cache invalidation error:", error);
    }
  }
}

export const igdbCache = new IGDBCache();
```

#### ✅ Enhanced IGDB Service with Caching

```typescript
// shared/lib/igdb.ts (Enhanced with caching)
import { igdbCache } from "./cache/igdb-cache";

const igdbApi = {
  async search({
    name,
    fields
  }: {
    name: string;
    fields?: Record<string, string>;
  }): Promise<SearchResponse[] | undefined> {
    if (!name) return [];

    // ✅ Check cache first
    const cached = await igdbCache.getSearchResults(name, fields);
    if (cached) {
      console.log("Cache hit for search:", name);
      return cached;
    }

    // Build and execute query
    const query = new QueryBuilder()
      .fields([
        "name",
        "platforms.name",
        "release_dates.human",
        "first_release_date",
        "category",
        "cover.image_id",
      ])
      .where(`cover.image_id != null ${this.buildFilters(fields)}`)
      .search(normalizeTitle(normalizeString(name)))
      .limit(100)
      .build();

    const results = await this.request<SearchResponse[]>({
      body: query,
      resource: "/games",
    });

    // ✅ Cache the results
    if (results) {
      await igdbCache.setSearchResults(name, results, fields);
    }

    return results;
  },

  async getGameById(gameId: number): Promise<FullGameInfoResponse | undefined> {
    if (!gameId) return;

    // ✅ Check cache first
    const cached = await igdbCache.getGameDetails(gameId);
    if (cached) {
      console.log("Cache hit for game:", gameId);
      return cached;
    }

    // Execute query
    const query = new QueryBuilder()
      .fields([
        "name",
        "summary",
        "aggregated_rating",
        "cover.image_id",
        "genres.name",
        "screenshots.image_id",
        // ... other fields
      ])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<FullGameInfoResponse[]>({
      body: query,
      resource: "/games",
    });

    const result = response?.[0];

    // ✅ Cache the result
    if (result) {
      await igdbCache.setGameDetails(gameId, result);
    }

    return result;
  },
};
```

### 2. Next.js Cache Optimization

#### ✅ Centralized Revalidation Service

```typescript
// shared/lib/cache/revalidation-service.ts
import { revalidatePath, revalidateTag } from "next/cache";

export class CacheRevalidationService {
  // User-specific revalidations
  static revalidateUserData(userId: string) {
    revalidateTag(`user:${userId}`);
    revalidatePath(`/user/${userId}`);
  }

  static revalidateUserCollection(userId: string) {
    revalidateTag(`collection:${userId}`);
    revalidatePath("/collection");
    revalidatePath("/dashboard");
  }

  static revalidateUserBacklog(userId: string) {
    revalidateTag(`backlog:${userId}`);
    revalidatePath("/backlog");
    revalidatePath(`/backlog/${userId}`);
  }

  // Game-specific revalidations
  static revalidateGame(gameId: string) {
    revalidateTag(`game:${gameId}`);
    revalidatePath(`/game/${gameId}`);
  }

  static revalidateGameReviews(gameId: string) {
    revalidateTag(`reviews:${gameId}`);
    revalidatePath(`/game/${gameId}`);
  }

  // Global revalidations
  static revalidatePopularGames() {
    revalidateTag("popular-games");
    revalidatePath("/");
  }

  static revalidateSearchResults(query: string) {
    revalidateTag(`search:${query}`);
  }

  // Batch revalidation for complex operations
  static async revalidateAfterGameAdd(userId: string, gameId: string) {
    this.revalidateUserCollection(userId);
    this.revalidateGame(gameId);

    // Invalidate external cache too
    await igdbCache.invalidateGame(parseInt(gameId));
  }

  static async revalidateAfterReviewAdd(userId: string, gameId: string) {
    this.revalidateUserData(userId);
    this.revalidateGameReviews(gameId);
  }
}
```

#### ✅ Server Component Caching with Tags

```typescript
// features/view-collection/server-actions/get-cached-collection.ts
"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/shared/lib/db";

const getCachedUserCollection = unstable_cache(
  async (userId: string, filters: CollectionFilters) => {
    const games = await prisma.backlogItem.findMany({
      where: {
        userId,
        ...(filters.status && { status: filters.status }),
        ...(filters.platform && { platform: filters.platform }),
      },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            igdbId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 20,
      skip: ((filters.page || 1) - 1) * (filters.limit || 20),
    });

    return games;
  },
  ["user-collection"],
  {
    tags: (userId: string) => [`collection:${userId}`],
    revalidate: 60 * 5, // 5 minutes
  }
);

export { getCachedUserCollection };
```

### 3. React Query for Client-Side Caching

#### ✅ Query Client Configuration

```typescript
// app/providers/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60, // 1 hour
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: "always",
          },
          mutations: {
            retry: 1,
            onError: (error) => {
              console.error("Mutation error:", error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### ✅ Custom Hooks with Caching

```typescript
// features/search/hooks/use-game-search.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSearchResults } from "../lib/fetch-search-results";

export const useGameSearch = (
  query: string,
  filters?: Record<string, any>
) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["game-search", query, filters],
    queryFn: () => fetchSearchResults(query, filters),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes

    // Prefetch popular searches
    onSuccess: (data) => {
      data.forEach((game) => {
        queryClient.setQueryData(
          ["game-details", game.id],
          game,
          {
            updatedAt: Date.now(),
            dataUpdatedAt: Date.now(),
          }
        );
      });
    },
  });
};

export const useGameDetails = (gameId: number) => {
  return useQuery({
    queryKey: ["game-details", gameId],
    queryFn: () => fetchGameDetails(gameId),
    enabled: !!gameId,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

// Prefetch commonly accessed data
export const usePrefetchGameDetails = () => {
  const queryClient = useQueryClient();

  return {
    prefetchGame: (gameId: number) => {
      queryClient.prefetchQuery({
        queryKey: ["game-details", gameId],
        queryFn: () => fetchGameDetails(gameId),
        staleTime: 1000 * 60 * 60,
      });
    },
  };
};
```

### 4. Image Optimization and CDN

#### ✅ IGDB Image Caching Component

```typescript
// shared/components/igdb-image.tsx (Enhanced)
"use client";

import Image from "next/image";
import { useState } from "react";

interface IGDBImageProps {
  imageId: string;
  size: "cover_small" | "cover_big" | "screenshot_med" | "screenshot_big";
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function IGDBImage({
  imageId,
  size,
  alt,
  width = 300,
  height = 400,
  className,
  priority = false,
}: IGDBImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageUrl = `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">No Image</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse"
          style={{ width, height }}
        />
      )}

      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        // ✅ Next.js automatic optimization with caching
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
```

### 5. Cache Warming and Preloading

#### ✅ Cache Warming Service

```typescript
// shared/lib/cache/cache-warming.ts
import { prisma } from "@/shared/lib/db";
import { igdbApi } from "@/shared/lib/igdb";
import { igdbCache } from "./igdb-cache";

export class CacheWarmingService {
  // Warm popular game data
  static async warmPopularGames() {
    try {
      const popularGames = await igdbApi.getGamesByRating();

      if (popularGames) {
        // Preload detailed info for popular games
        const gameDetailsPromises = popularGames.slice(0, 10).map(async (game) => {
          const details = await igdbApi.getGameById(game.id);
          return details;
        });

        await Promise.allSettled(gameDetailsPromises);
        console.log("Warmed popular games cache");
      }
    } catch (error) {
      console.error("Failed to warm popular games cache:", error);
    }
  }

  // Warm user-specific data
  static async warmUserData(userId: string) {
    try {
      // Preload user collection
      const collection = await prisma.backlogItem.findMany({
        where: { userId },
        include: {
          game: {
            select: {
              id: true,
              title: true,
              igdbId: true,
            },
          },
        },
        take: 20,
      });

      // Preload IGDB details for user's games
      const igdbPromises = collection
        .filter(item => item.game.igdbId)
        .slice(0, 10)
        .map(item => igdbApi.getGameById(item.game.igdbId!));

      await Promise.allSettled(igdbPromises);
      console.log(`Warmed cache for user ${userId}`);
    } catch (error) {
      console.error("Failed to warm user cache:", error);
    }
  }

  // Schedule cache warming
  static scheduleWarmup() {
    // Warm popular games every hour
    setInterval(this.warmPopularGames, 1000 * 60 * 60);

    // Initial warm on startup
    setTimeout(this.warmPopularGames, 1000);
  }
}
```

## Performance Optimization Implementation

### Phase 1: External API Caching (Week 1)

1. Implement Redis caching for IGDB API responses
2. Add cache warming for popular games
3. Set up cache invalidation strategies

### Phase 2: Server-Side Caching (Week 2)

1. Implement Next.js unstable_cache for database queries
2. Add centralized revalidation service
3. Optimize server component caching

### Phase 3: Client-Side Optimization (Week 3)

1. Implement React Query for client state management
2. Add prefetching for commonly accessed data
3. Optimize image loading and caching

### Phase 4: Monitoring and Optimization (Week 4)

1. Add cache hit/miss metrics
2. Implement performance monitoring
3. Optimize cache TTL based on usage patterns

## Critical Performance Improvements

### High Priority

- IGDB API responses without caching (expensive external calls)
- Collection queries repeated across components
- No image optimization for IGDB images

### Medium Priority

- Dashboard aggregations calculated on each request
- Search results not cached
- No prefetching for commonly accessed data

## Benefits After Caching Implementation

- ✅ **Reduced API Costs**: Fewer external IGDB API calls
- ✅ **Faster Load Times**: Cached data serves instantly
- ✅ **Better User Experience**: Smoother navigation and interactions
- ✅ **Improved Scalability**: Less database load through caching
- ✅ **Offline Resilience**: Cached data available when external services fail

---

**This completes the comprehensive codebase improvement documentation. All 8 critical areas have been covered with detailed implementation guides, migration strategies, and best practices.**
