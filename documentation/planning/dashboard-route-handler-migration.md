# Dashboard Route Handler Migration Plan

**Date**: 2025-01-22
**Status**: Planning Phase
**Priority**: High

## Overview

This document outlines the comprehensive plan for migrating dashboard Server Actions to secure Route Handlers, focusing on performance optimization while maintaining security best practices.

## Background

### Current State

- Dashboard uses 4 separate Server Actions for statistics
- Each component triggers individual database queries
- No HTTP caching benefits
- Dashboard load time: ~800ms

### Target State

- Single secure Route Handler for dashboard statistics
- Aggregated data fetching with parallel queries
- HTTP caching with user-specific cache keys
- Expected dashboard load time: ~50ms (16x improvement)

## 🔒 Security-First Architecture

### Authentication Pattern

```typescript
// app/api/dashboard/stats/route.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // ✅ Extract userId from authenticated session (NOT query params)
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id; // Secure: from session
  // Never: const userId = searchParams.get('userId') ❌
}
```

### Security Principles

1. **No userId in URL**: Authentication via session only
2. **Private caching**: `Cache-Control: private` prevents CDN caching
3. **User-scoped cache tags**: `dashboard-stats-${userId}` for targeted invalidation
4. **Input validation**: Zod schemas for query parameters
5. **Error boundaries**: Proper error handling and status codes

### Input Validation Schema

```typescript
const StatsParamsSchema = z
  .object({
    status: z
      .enum(["BACKLOG", "PLAYING", "COMPLETED", "DROPPED", "WISHLIST"])
      .optional(),
    timeframe: z.enum(["week", "month", "year", "all"]).optional(),
  })
  .optional();
```

## 📊 Dashboard Stats Aggregation

### Core Aggregation Function

```typescript
// lib/dashboard-stats.ts
import { unstable_cache } from "next/cache";

export const getDashboardStats = unstable_cache(
  async (userId: string, params?: DashboardStatsParams) => {
    // 🚀 Execute all queries in parallel for better performance
    const [
      backlogCounts,
      platformBreakdown,
      reviewRatings,
      acquisitionBreakdown,
    ] = await Promise.all([
      getBacklogCount({ userId, status: params?.status }),
      getPlatformBreakdownCommand({ userId }),
      aggregateReviewsRatingsForUser({ userId }),
      getAcquisitionTypeBreakdownCommand({ userId }),
    ]);

    return {
      backlogCounts,
      platformBreakdown: topPlatforms,
      reviewRatings,
      acquisitionBreakdown: processedAcquisitionBreakdown,
      timestamp: new Date().toISOString(),
    };
  },
  ["dashboard-stats"],
  {
    tags: [`dashboard-stats-${userId}`],
    revalidate: 300, // 5 minutes
  }
);
```

### Cache Strategy

- **Cache Duration**: 5 minutes with stale-while-revalidate
- **Cache Scope**: Private (per-user)
- **Cache Tags**: User-specific for targeted invalidation
- **Vary Header**: Authorization for proper cache separation

## 🚀 Implementation Plan

### Phase 1: Route Handler Implementation (Week 1)

**Day 1-2: Core Route Handler**

- Create `/app/api/dashboard/stats/route.ts`
- Implement secure authentication pattern
- Add input validation and error handling

**Day 3-4: Client-side Hook**

```typescript
// features/dashboard/hooks/use-dashboard-stats.ts
export function useDashboardStats(params?: {
  status?: string;
  timeframe?: string;
}) {
  const { data, error, mutate } = useSWR(
    `/api/dashboard/stats?${searchParams}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      errorRetryCount: 3,
    }
  );

  return {
    stats: data,
    loading: !error && !data,
    error,
    refresh: mutate,
  };
}
```

**Day 5: Component Integration**

- Create `DashboardStatsProvider` context
- Implement loading and error states
- Add performance monitoring

### Phase 2: Component Migration (Week 2)

**Existing Server Actions to Migrate:**

1. `getBacklogItemsCount` → Part of aggregated stats
2. `getPlatformBreakdown` → Part of aggregated stats
3. `getAggregatedReviewRatings` → Part of aggregated stats
4. `getAcquisitionTypeBreakdown` → Part of aggregated stats

**Migration Pattern:**

```typescript
// Before (Server Actions)
const data = await getBacklogItemsCount({ status: "BACKLOG" });

// After (Route Handler)
const { stats, loading, error } = useDashboardStatsContext();
const backlogCount = stats?.backlogCounts;
```

### Phase 3: Cache Invalidation Strategy

```typescript
// shared/lib/cache-invalidation.ts
export async function invalidateDashboardStats(userId: string) {
  revalidateTag(`dashboard-stats-${userId}`);
}

// Integration with mutation Server Actions
export const addGameToCollection = authorizedActionClient.action(
  async ({ ctx: { userId }, parsedInput }) => {
    const result = await createBacklogItem(parsedInput);
    await invalidateDashboardStats(userId);
    return result;
  }
);
```

## 📈 Expected Performance Improvements

| Metric              | Current           | After Migration | Improvement        |
| ------------------- | ----------------- | --------------- | ------------------ |
| Dashboard Load Time | 800ms             | 50ms (cached)   | **16x faster**     |
| Database Queries    | 4 separate        | 1 (cached)      | **4x reduction**   |
| Client Bundle       | Server Components | +TanStack Query | Minimal impact     |
| Cache Hit Rate      | 0%                | 85%+            | **New capability** |

## ✅ Migration Checklist

### Pre-Implementation

- [ ] Security review of authentication flow
- [ ] Cache key strategy finalized
- [ ] Error handling patterns defined
- [ ] Performance monitoring setup

### Implementation

- [ ] Route handler created with proper auth
- [ ] Dashboard stats aggregation function
- [ ] Client-side hook for data fetching
- [ ] Component migration to new pattern

### Testing

- [ ] Authentication edge cases
- [ ] Cache invalidation works correctly
- [ ] Performance improvements measurable
- [ ] Error handling graceful

### Rollout

- [ ] Feature flag for A/B testing
- [ ] Monitor dashboard performance metrics
- [ ] Gradual migration of components
- [ ] Remove old Server Actions when stable

## 🔄 Cache Invalidation Triggers

Dashboard stats cache should be invalidated when:

- **Game Collection**: `create-game-action.ts` - User adds games to collection
- **Backlog Management**:
  - `create-backlog-item/action.ts` - Creates new backlog items
  - `edit-backlog-item/action.ts` - Updates status, platform, completion dates
  - `delete-backlog-item/action.ts` - Removes backlog items
- **Reviews**: `create-review.ts` - User creates new reviews
- **Steam Integration**:
  - `save-steam-games.ts` - Imports Steam games
  - `import-to-application.ts` - Converts imported games to backlog
  - `remove-steam-data-from-user.ts` - Disconnects Steam integration

## 📊 Monitoring & Analytics

### Key Metrics to Track

- Dashboard load time (before/after)
- Cache hit rate
- API response times
- Error rates
- User engagement with dashboard

### Success Criteria

- Dashboard load time < 100ms (cached)
- Cache hit rate > 80%
- Error rate < 1%
- No security vulnerabilities
- Positive user feedback on performance

## 🛡️ Security Considerations

### Authentication

- Session-based auth only (no userId in URLs)
- Proper session validation
- Rate limiting per user

### Caching

- Private cache only (no CDN caching of user data)
- User-scoped cache keys
- Proper cache invalidation

### Input Validation

- Zod schemas for all query parameters
- Sanitization of user inputs
- Proper error messages without data leakage

## 🔄 Rollback Plan

If issues arise during migration:

1. Feature flag to disable Route Handler
2. Fall back to existing Server Actions
3. Investigate and fix issues
4. Re-enable Route Handler gradually

## Future Considerations

### Other Route Handler Candidates

After successful dashboard migration, consider:

1. External API calls (IGDB, Steam) - **Critical Priority**
2. Game details caching - **High Priority**
3. Public sharing endpoints - **Medium Priority**

### Scalability

- Monitor database performance under increased caching
- Consider Redis for high-traffic scenarios
- Implement proper cache warming strategies

---

**Next Steps**: Begin Phase 1 implementation with core Route Handler creation and security review.
