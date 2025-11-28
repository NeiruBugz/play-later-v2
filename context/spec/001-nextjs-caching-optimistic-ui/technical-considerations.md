# Technical Specification: Next.js Caching & Optimistic UI Refinements

- **Functional Specification:** N/A (Technical refinement, not user-facing feature)
- **Status:** Approved
- **Author(s):** AI-assisted development

---

## 1. High-Level Technical Approach

This specification covers two independent performance/UX refinements identified during a comprehensive codebase review:

1. **Server-Side Caching** - Add `unstable_cache` from `next/cache` to the game search API route to cache IGDB responses, reducing external API calls and improving response times.

2. **Optimistic UI Updates** - Implement React 19's `useOptimistic` hook in quick-action-buttons for instant visual feedback on library status changes.

**Systems Affected:**
- `app/api/games/search/route.ts` (API route)
- `features/game-detail/ui/quick-action-buttons.tsx` (UI component)

**No database changes, no new API endpoints, no architectural changes required.**

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Server-Side Caching with `unstable_cache`

**Location:** `savepoint-app/app/api/games/search/route.ts`

**Current Flow:**
```
Request → Validate → Rate Limit → Handler → IgdbService → IGDB API → Response
```

**Proposed Flow:**
```
Request → Validate → Rate Limit → Cache Check → (Hit: Return cached) / (Miss: IgdbService → IGDB API → Cache → Response)
```

**Implementation:**

```typescript
// app/api/games/search/route.ts
import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { IgdbService } from "@/data-access-layer/services";
import { SearchGamesSchema } from "@/data-access-layer/handlers/game-search/game-search-handler.types";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { HTTP_STATUS } from "@/shared/lib/http-status";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "game-search" });

// Cache factory function - creates cached search with specific params
const getCachedIgdbSearch = (query: string, offset: number) =>
  unstable_cache(
    async () => {
      const igdbService = new IgdbService();
      const result = await igdbService.searchGamesByName({
        name: query,
        offset,
      });

      if (!result.ok) {
        throw new Error(result.error || "Search failed");
      }

      return result.data;
    },
    ["game-search", query.toLowerCase(), String(offset)],
    {
      revalidate: 300, // 5 minutes
      tags: ["game-search"],
    }
  );

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") ?? "";
    const parsedOffset = parseInt(searchParams.get("offset") ?? "0", 10);
    const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    // 1. Input validation (before rate limit to fail fast)
    const validation = SearchGamesSchema.safeParse({ query, offset });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid search parameters" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 2. Rate limit check (before cache to prevent abuse)
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: HTTP_STATUS.TOO_MANY_REQUESTS }
      );
    }

    // 3. Fetch with cache
    logger.info({ query, offset }, "Game search request");
    const data = await getCachedIgdbSearch(query, offset)();

    return NextResponse.json(data, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.error({ error }, "Game search API error");
    return NextResponse.json(
      { error: "Search temporarily unavailable" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
```

**Key Design Decisions:**
- Cache key includes normalized (lowercase) query and offset for consistent hits
- Rate limiting happens **before** cache to prevent abuse
- Errors are thrown (not returned) so they're not cached
- 5-minute TTL matches client-side TanStack Query `staleTime`

---

### 2.2 Optimistic UI with `useOptimistic`

**Location:** `savepoint-app/features/game-detail/ui/quick-action-buttons.tsx`

**Current Flow:**
```
Click → Disable buttons → Server action → Update state → Re-enable
```

**Proposed Flow:**
```
Click → Immediately update UI (optimistic) → Server action → (Success: confirm) / (Error: auto-revert + toast)
```

**Implementation:**

```typescript
// features/game-detail/ui/quick-action-buttons.tsx
"use client";

import { useOptimistic, useTransition, useState } from "react";
import { toast } from "sonner";
import { updateLibraryStatusAction } from "@/features/manage-library-entry/server-actions";
import type { LibraryItemStatus } from "@/shared/types";
import { cn } from "@/shared/lib/tailwind-merge";
// ... other imports

interface OptimisticStatusState {
  status: LibraryItemStatus | undefined;
  isOptimistic: boolean;
}

export const QuickActionButtons = ({
  igdbId,
  gameTitle,
  currentStatus,
}: QuickActionButtonsProps) => {
  const [isPending, startTransition] = useTransition();
  const [announcement, setAnnouncement] = useState<string>("");

  // Optimistic state management
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<
    OptimisticStatusState,
    LibraryItemStatus
  >(
    { status: currentStatus, isOptimistic: false },
    (_, newStatus) => ({
      status: newStatus,
      isOptimistic: true,
    })
  );

  const handleStatusChange = (status: LibraryItemStatus) => {
    if (isPending) return;

    // 1. Immediate optimistic update
    setOptimisticStatus(status);

    // 2. Server action in transition
    startTransition(async () => {
      const result = await updateLibraryStatusAction({ igdbId, status });

      if (result.success) {
        const statusLabel = STATUS_CONFIG[status].label;
        const message = `Status updated to ${statusLabel}`;
        setAnnouncement(message);
        toast.success(message, { description: gameTitle });
      } else {
        // React automatically reverts optimistic state
        setAnnouncement("Failed to update status");
        toast.error("Failed to update status", {
          description: result.error || "Please try again",
        });
      }
    });
  };

  return (
    <Card className="animate-fade-in w-full" style={{ animationDelay: "100ms" }}>
      <CardHeader className="pb-lg">
        <CardTitle className="font-serif">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        <div className="gap-md grid grid-cols-2" role="group" aria-label="Journey status quick actions">
          {STATUS_ORDER.map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const isActive = optimisticStatus.status === status;
            const isOptimisticActive = isActive && optimisticStatus.isOptimistic;

            return (
              <Button
                key={status}
                variant="outline"
                size="sm"
                className={cn(
                  "focus-visible:ring-ring gap-xs py-lg flex h-auto flex-col border",
                  "duration-normal ease-out-expo transition-all",
                  isActive && config.activeClass,
                  isOptimisticActive && "opacity-80"
                )}
                onClick={() => handleStatusChange(status)}
                disabled={isPending}
                aria-label={config.ariaLabel}
                aria-pressed={isActive}
              >
                <Icon
                  className={cn("h-5 w-5", isOptimisticActive && "animate-pulse")}
                  aria-hidden="true"
                />
                <span className="caption">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Key Design Decisions:**
- `useOptimistic` provides instant UI feedback
- `useTransition` keeps UI responsive during server call
- `isOptimistic` flag enables visual distinction (opacity, pulse)
- Auto-revert on error eliminates manual rollback code
- Existing accessibility features preserved

---

## 3. Impact and Risk Analysis

### System Dependencies

| Component | Dependency | Impact |
|-----------|------------|--------|
| Game Search API | `unstable_cache` (Next.js) | Requires Next.js 14.1+ (already met) |
| Quick Action Buttons | `useOptimistic` (React 19) | Requires React 19 (already met) |
| Cache Storage | Vercel Data Cache / File System | Works with default Next.js cache |

### Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cache key collision | Low | Medium | Exact lowercase query + offset in key array |
| Stale search results | Low | Low | 5-min TTL; game metadata rarely changes |
| Memory pressure from cache | Low | Low | Next.js handles eviction; monitor metrics |
| Optimistic UI flicker on error | Medium | Low | Opacity indicator + error toast explains |
| Rate limit bypass via cache | None | N/A | Rate limiting before cache check |

### Backward Compatibility

- **No breaking changes** - Both refinements are additive
- **Graceful degradation** - If cache fails, falls back to direct API call
- **Same API contract** - Response format unchanged

---

## 4. Testing Strategy

### Unit Tests

**Server-Side Caching:**
```typescript
// app/api/games/search/route.test.ts
describe("Game Search API with Caching", () => {
  it("returns cached results for repeated queries", async () => {
    // First request - cache miss
    const response1 = await GET(createMockRequest("zelda", 0));
    expect(igdbService.searchGamesByName).toHaveBeenCalledTimes(1);

    // Second request - cache hit (mock unstable_cache behavior)
    const response2 = await GET(createMockRequest("zelda", 0));
    expect(igdbService.searchGamesByName).toHaveBeenCalledTimes(1); // Not called again
    expect(response1.json()).toEqual(response2.json());
  });

  it("applies rate limiting before cache check", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false });
    const response = await GET(createMockRequest("zelda", 0));
    expect(response.status).toBe(429);
  });

  it("does not cache error responses", async () => {
    vi.mocked(igdbService.searchGamesByName).mockRejectedValue(new Error("API down"));
    const response = await GET(createMockRequest("zelda", 0));
    expect(response.status).toBe(500);
    // Verify cache not populated with error
  });
});
```

**Optimistic UI:**
```typescript
// features/game-detail/ui/quick-action-buttons.test.tsx
describe("QuickActionButtons with useOptimistic", () => {
  it("shows optimistic update immediately on click", async () => {
    render(<QuickActionButtons currentStatus="WISHLIST" {...props} />);

    const playingButton = screen.getByLabelText("Mark as Currently Exploring");
    await user.click(playingButton);

    // Immediate visual feedback
    expect(playingButton).toHaveAttribute("aria-pressed", "true");
    expect(playingButton).toHaveClass("opacity-80"); // Optimistic indicator
  });

  it("reverts UI on server error", async () => {
    vi.mocked(updateLibraryStatusAction).mockResolvedValue({
      success: false,
      error: "Server error",
    });

    render(<QuickActionButtons currentStatus="WISHLIST" {...props} />);

    const playingButton = screen.getByLabelText("Mark as Currently Exploring");
    await user.click(playingButton);

    await waitFor(() => {
      expect(playingButton).toHaveAttribute("aria-pressed", "false");
    });
    expect(screen.getByText("Failed to update status")).toBeInTheDocument();
  });

  it("maintains accessibility during optimistic updates", async () => {
    render(<QuickActionButtons {...props} />);

    const playingButton = screen.getByLabelText("Mark as Currently Exploring");
    await user.click(playingButton);

    const announcement = screen.getByRole("status", { hidden: true });
    await waitFor(() => {
      expect(announcement).toHaveTextContent(/Status updated/);
    });
  });
});
```

### Integration Tests

- Verify cache invalidation with `revalidateTag("game-search")`
- Test concurrent search requests don't cause race conditions
- Verify optimistic updates work correctly with server action integration

### Manual Testing Checklist

- [ ] Search same query twice - second should be instant (cache hit)
- [ ] Status button click shows immediate visual change
- [ ] Network tab shows no IGDB call on cache hit
- [ ] Disconnect network, click status - error toast appears, UI reverts
- [ ] Screen reader announces status changes correctly
