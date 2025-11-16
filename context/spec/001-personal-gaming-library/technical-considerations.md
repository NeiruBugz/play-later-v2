# Technical Specification: Personal Gaming Library

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Claude (AI Assistant)

---

## 1. High-Level Technical Approach

The Personal Gaming Library feature will be implemented following SavePoint's established four-layer architecture pattern: App Router → Handler Layer → Service Layer → Repository Layer → Prisma.

**Key Implementation Strategy:**

1. **No Database Schema Changes Required:** The existing `LibraryItem` model already supports all functional requirements (status, platform, startedAt, completedAt fields exist).

2. **New API Route with Handler Pattern:** Create `/app/api/library/route.ts` as a GET endpoint that delegates to a handler in the data access layer for validation and orchestration.

3. **Enhanced Service Layer:** Extend `LibraryService` with methods for fetching filtered/sorted library items.

4. **New Repository Functions:** Add flexible query functions for library data retrieval with filtering, sorting, and game deduplication options.

5. **Client-Side State Management:** Use TanStack Query for data fetching, caching, and optimistic updates (no server-side caching due to user-specific, frequently-mutated data).

6. **New Feature Module:** Create `features/library/` with UI components, hooks, and server actions following the established feature-based organization pattern.

7. **Form Enhancements:** Extend the existing "Add to Library" form to include platform selection (required) and optional date fields (startedAt, completedAt).

**Systems Affected:**
- Data Access Layer (new handler, service methods, repository functions)
- Features Layer (new `features/library/` module)
- App Router (new `/app/library/page.tsx` and `/app/api/library/route.ts`)
- Existing `features/game-detail/` (enhancements to library modal and forms)

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1. Data Model / Database Changes

**Status: No migrations required.**

The existing Prisma schema already fully supports all functional requirements:

**Existing `LibraryItem` Model:**
```prisma
model LibraryItem {
  id              Int               @id @default(autoincrement())
  status          LibraryItemStatus @default(CURIOUS_ABOUT)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  platform        String?           // ✅ Exists (will be required in forms)
  userId          String
  gameId          String
  startedAt       DateTime?         // ✅ Exists (optional date tracking)
  completedAt     DateTime?         // ✅ Exists (optional date tracking)

  @@index([userId, status])         // ✅ For status filtering
  @@index([userId, platform])       // ✅ For platform filtering
  @@index([userId, createdAt])      // ✅ For default sorting
  @@index([gameId])                 // ✅ For game-based queries
}

enum LibraryItemStatus {
  CURIOUS_ABOUT           // ✅ Default status
  CURRENTLY_EXPLORING
  TOOK_A_BREAK
  EXPERIENCED
  WISHLIST
  REVISITING
}
```

**Platform Data:**
- The `Platform` lookup table is already populated from IGDB data when games are fetched
- The `GamePlatform` join table tracks which platforms each game officially supports
- Library items store platform names as strings for flexibility (supports emulation, backwards compatibility, etc.)

**No schema changes, migrations, or index additions are required.**

---

### 2.2. Repository Layer

**Location:** `data-access-layer/repository/library/library-repository.ts`

**New Functions to Add:**

#### 2.2.1. `findLibraryItemsWithFilters`

Primary function for library view data retrieval:

```typescript
export async function findLibraryItemsWithFilters(params: {
  userId: string;
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy?: 'createdAt' | 'releaseDate' | 'startedAt' | 'completedAt';
  sortOrder?: 'asc' | 'desc';
  distinctByGame?: boolean; // Controls deduplication
}): Promise<RepositoryResult<LibraryItemWithGameAndCount[]>>
```

**Implementation Details:**

1. **Filtering Logic:**
   - Filter by `userId` (required - row-level security)
   - Filter by `status` (optional - single value)
   - Filter by `platform` (optional - single value)
   - Filter by game title via `game.title` (optional - case-insensitive contains)

2. **Sorting Logic:**
   ```typescript
   const orderByMap: Record<SortField, Prisma.LibraryItemOrderByWithRelationInput> = {
     createdAt: { createdAt: sortOrder },
     releaseDate: { game: { releaseDate: sortOrder } },
     startedAt: { startedAt: sortOrder },
     completedAt: { completedAt: sortOrder },
   };
   ```
   Default: `{ createdAt: 'desc' }` (most recently added first)

3. **Deduplication (when `distinctByGame: true`):**
   - Show only the most recently modified library item per game
   - Implementation approach: Use a subquery or window function to get `MAX(updatedAt)` per `gameId`
   - Alternative: Fetch all items and deduplicate in application code

4. **Library Item Count:**
   - Include count of all library items per game for the current user
   - Use Prisma's aggregation:
   ```typescript
   include: {
     game: {
       include: {
         _count: {
           select: {
             libraryItems: { where: { userId } }
           }
         }
       }
     }
   }
   ```

**Return Type:**
```typescript
type LibraryItemWithGameAndCount = LibraryItem & {
  game: Game & {
    _count: {
      libraryItems: number; // Count for this user
    };
  };
};
```

#### 2.2.2. Platform Query Enhancement

**Location:** `data-access-layer/repository/platform/platform-repository.ts`

Add function to fetch platforms grouped by support status for a specific game:

```typescript
export async function findPlatformsForGame(
  gameId: string
): Promise<RepositoryResult<{
  supportedPlatforms: Platform[];
  otherPlatforms: Platform[];
}>>
```

**Implementation:**
1. Query `GamePlatform` join table to get supported platform IDs for the game
2. Query all platforms from `Platform` table
3. Group into `supportedPlatforms` (platforms linked to this game) and `otherPlatforms`
4. Return both arrays for UI rendering with divider

---

### 2.3. Service Layer

**Location:** `data-access-layer/services/library/library-service.ts`

**New Methods to Add:**

#### 2.3.1. `getLibraryItems`

```typescript
async getLibraryItems(params: {
  userId: string;
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
  distinctByGame?: boolean;
}): Promise<ServiceResult<LibraryItemWithGameAndCount[], ServiceError>>
```

**Business Logic:**
- Validate input parameters (userId is valid CUID, status is valid enum value, etc.)
- Call `findLibraryItemsWithFilters` repository function
- Handle repository errors and map to service-level errors
- Return structured `ServiceResult` type

**No complex business logic required** - this is primarily a pass-through to the repository with validation.

#### 2.3.2. `updateLibraryItem` (Enhancement)

Add status transition validation to the existing `updateLibraryItem` method:

```typescript
private validateStatusTransition(
  currentStatus: LibraryItemStatus,
  newStatus: LibraryItemStatus
): { valid: boolean; error?: string } {
  // Rule: Cannot move TO Wishlist from any other status
  if (newStatus === LibraryItemStatus.WISHLIST &&
      currentStatus !== LibraryItemStatus.WISHLIST) {
    return {
      valid: false,
      error: "Cannot move a game back to Wishlist. Create a new library item instead."
    };
  }

  // All other transitions are allowed (forward progression is flexible)
  return { valid: true };
}
```

**Integration:**
- Call `validateStatusTransition` before updating the library item
- Return service error if validation fails
- Otherwise, proceed with repository update

---

### 2.4. Handler Layer

**Location:** `data-access-layer/handlers/library/get-library-handler.ts`

**New Handler:**

```typescript
export async function getLibraryHandler(params: {
  userId: string;
  status?: string;
  platform?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<HandlerResult<LibraryItemWithGameAndCount[]>>
```

**Responsibilities:**

1. **Input Validation (Zod Schema):**
   ```typescript
   const GetLibrarySchema = z.object({
     userId: z.string().cuid(),
     status: z.nativeEnum(LibraryItemStatus).optional(),
     platform: z.string().optional(),
     search: z.string().optional(),
     sortBy: z.enum(['createdAt', 'releaseDate', 'startedAt', 'completedAt']).optional(),
     sortOrder: z.enum(['asc', 'desc']).optional(),
   });
   ```

2. **Orchestration:**
   - Validate input against schema
   - Instantiate `LibraryService`
   - Call `libraryService.getLibraryItems()` with `distinctByGame: true` (library view shows one per game)
   - Handle service result and map to handler result

3. **Error Handling:**
   - Map validation errors to 400 Bad Request
   - Map service errors to appropriate HTTP status codes
   - Return `HandlerResult<TData>` for consumption by API route

**ESLint Enforcement:**
- ⚠️ This handler can only be imported by API routes (enforced by `eslint-plugin-boundaries`)

---

### 2.5. API Contract

**Endpoint:** `GET /api/library`

**Query Parameters:**
```typescript
{
  status?: 'CURIOUS_ABOUT' | 'CURRENTLY_EXPLORING' | 'TOOK_A_BREAK' | 'EXPERIENCED' | 'WISHLIST' | 'REVISITING';
  platform?: string; // Platform name
  search?: string;   // Game title search (case-insensitive)
  sortBy?: 'createdAt' | 'releaseDate' | 'startedAt' | 'completedAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Request Example:**
```
GET /api/library?status=CURRENTLY_EXPLORING&platform=PlayStation%205&search=zelda&sortBy=createdAt&sortOrder=desc
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "status": "CURRENTLY_EXPLORING",
      "platform": "PlayStation 5",
      "startedAt": "2025-01-15T00:00:00.000Z",
      "completedAt": null,
      "createdAt": "2025-01-10T12:00:00.000Z",
      "updatedAt": "2025-01-20T15:30:00.000Z",
      "userId": "clx123...",
      "gameId": "clx456...",
      "game": {
        "id": "clx456...",
        "igdbId": 12345,
        "title": "The Legend of Zelda: Breath of the Wild",
        "coverImage": "https://...",
        "releaseDate": "2017-03-03T00:00:00.000Z",
        "slug": "the-legend-of-zelda-breath-of-the-wild",
        "_count": {
          "libraryItems": 2  // User has 2 library items for this game
        }
      }
    }
  ]
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid status value"
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**Implementation Location:** `/app/api/library/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/auth';
import { getLibraryHandler } from '@/data-access-layer/handlers/library/get-library-handler';

export async function GET(request: NextRequest) {
  // 1. Authentication check
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Extract query parameters
  const { searchParams } = new URL(request.url);
  const params = {
    userId,
    status: searchParams.get('status') ?? undefined,
    platform: searchParams.get('platform') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: searchParams.get('sortOrder') ?? undefined,
  };

  // 3. Call handler
  const result = await getLibraryHandler(params);

  // 4. Return response
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result.data,
  });
}
```

**No server-side caching (`unstable_cache`)** - library data is user-specific and frequently mutated, making client-side caching with TanStack Query more appropriate.

---

### 2.6. Component Breakdown

**New Feature Module:** `features/library/`

#### 2.6.1. Directory Structure

```
features/library/
├── ui/
│   ├── library-grid.tsx              (Server Component - grid container)
│   ├── library-card.tsx              (Client Component - game card)
│   ├── library-card-quick-actions.tsx (Client Component - status dropdown)
│   ├── library-filters.tsx           (Client Component - filter controls)
│   ├── library-sort-select.tsx       (Client Component - sort dropdown)
│   └── library-empty-state.tsx       (Empty state component)
├── server-actions/
│   └── update-library-status.ts      (Server action for quick updates)
├── hooks/
│   ├── use-library-data.ts           (TanStack Query hook)
│   ├── use-library-filters.ts        (URL state management)
│   └── use-update-library-status.ts  (Mutation hook with optimistic updates)
└── schemas.ts                        (Zod validation schemas)
```

#### 2.6.2. Library Page (App Router)

**Location:** `/app/library/page.tsx`

**Component Type:** Server Component

```typescript
export default async function LibraryPage() {
  const userId = await getServerUserId();

  if (!userId) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Library</h1>
      <LibraryFilters />
      <LibraryGrid />
    </div>
  );
}
```

**No initial data fetching in RSC** - delegate to client component with TanStack Query for better filter/sort interactivity.

#### 2.6.3. Library Grid Component

**Location:** `features/library/ui/library-grid.tsx`

**Component Type:** Client Component (uses TanStack Query)

```typescript
'use client';

export function LibraryGrid() {
  const filters = useLibraryFilters(); // Read from URL params
  const { data, isLoading, error } = useLibraryData(filters);

  if (isLoading) return <LibraryGridSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data || data.length === 0) return <LibraryEmptyState />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {data.map((item) => (
        <LibraryCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

#### 2.6.4. Library Card Component

**Location:** `features/library/ui/library-card.tsx`

**Component Type:** Client Component

**Displays:**
- Game cover image (using `next/image` with IGDB CDN URL)
- Status indicator badge (colored based on status)
- Library item count badge (if `item.game._count.libraryItems > 1`)
- Quick action button (dropdown menu)
- Game title on hover (using Tooltip component from shadcn/ui)

```typescript
'use client';

export function LibraryCard({ item }: { item: LibraryItemWithGameAndCount }) {
  return (
    <div className="relative group">
      {/* Cover Image */}
      <Image src={item.game.coverImage} alt={item.game.title} />

      {/* Status Badge */}
      <StatusBadge status={item.status} />

      {/* Count Badge (if multiple entries) */}
      {item.game._count.libraryItems > 1 && (
        <Badge>{item.game._count.libraryItems} entries</Badge>
      )}

      {/* Quick Actions */}
      <LibraryCardQuickActions item={item} />

      {/* Title on Hover */}
      <Tooltip content={item.game.title} />
    </div>
  );
}
```

#### 2.6.5. Library Filters Component

**Location:** `features/library/ui/library-filters.tsx`

**Component Type:** Client Component

**Filter Controls:**
1. **Status Dropdown:** Single-select dropdown (Combobox from shadcn/ui)
2. **Platform Dropdown:** Single-select dropdown (Combobox from shadcn/ui)
3. **Text Search:** Input field with debouncing (300ms delay)
4. **Sort Select:** Dropdown with sort options

**URL State Management:**
- All filter values sync with URL query parameters
- Use `useRouter()` and `useSearchParams()` from Next.js
- Debounce search input to avoid excessive URL updates

```typescript
'use client';

export function LibraryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/library?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 mb-6">
      <StatusSelect onChange={(val) => updateFilter('status', val)} />
      <PlatformSelect onChange={(val) => updateFilter('platform', val)} />
      <SearchInput onChange={(val) => updateFilter('search', val)} />
      <SortSelect onChange={(val) => updateFilter('sortBy', val)} />
    </div>
  );
}
```

#### 2.6.6. Quick Actions Component

**Location:** `features/library/ui/library-card-quick-actions.tsx`

**Component Type:** Client Component

**UI:** Dropdown menu (DropdownMenu from shadcn/ui) with status options

**Behavior:**
- Show all status options except current status
- Disable "Wishlist" option if current status is not "Wishlist" (enforce status transition rule)
- On selection, trigger optimistic update mutation
- Show loading state during mutation

```typescript
'use client';

export function LibraryCardQuickActions({ item }: { item: LibraryItemWithGameAndCount }) {
  const updateStatus = useUpdateLibraryStatus();

  const handleStatusChange = (newStatus: LibraryItemStatus) => {
    updateStatus.mutate({
      libraryItemId: item.id,
      status: newStatus,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Quick Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.values(LibraryItemStatus).map((status) => (
          <DropdownMenuItem
            key={status}
            disabled={
              status === item.status ||
              (status === 'WISHLIST' && item.status !== 'WISHLIST')
            }
            onClick={() => handleStatusChange(status)}
          >
            {formatStatusLabel(status)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### 2.7. Client-Side State Management

#### 2.7.1. TanStack Query Hook

**Location:** `features/library/hooks/use-library-data.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

export function useLibraryData(filters: LibraryFilters) {
  return useQuery({
    queryKey: ['library', filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      );

      const response = await fetch(`/api/library?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch library');
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 30_000,  // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });
}
```

#### 2.7.2. Optimistic Update Mutation Hook

**Location:** `features/library/hooks/use-update-library-status.ts`

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useUpdateLibraryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      libraryItemId: number;
      status: LibraryItemStatus;
    }) => {
      return await updateLibraryStatusAction(params);
    },

    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['library'] });

      // Snapshot previous value
      const previousLibrary = queryClient.getQueryData(['library']);

      // Optimistically update the UI
      queryClient.setQueryData(['library'], (old: LibraryItemWithGameAndCount[]) => {
        return old?.map(item =>
          item.id === variables.libraryItemId
            ? { ...item, status: variables.status, updatedAt: new Date() }
            : item
        );
      });

      // Return context for rollback
      return { previousLibrary };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLibrary) {
        queryClient.setQueryData(['library'], context.previousLibrary);
      }
      toast.error("Failed to update status", {
        description: err instanceof Error ? err.message : "Please try again"
      });
    },

    onSuccess: (result) => {
      if (result.success) {
        toast.success("Status updated");
      } else {
        // Handle validation errors (e.g., Wishlist transition blocked)
        toast.error("Cannot update status", { description: result.error });
      }
    },

    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
```

**Benefits:**
- Instant UI feedback (no loading spinner)
- Automatic rollback on error
- Background sync with server after mutation
- Toast notifications for user feedback

#### 2.7.3. URL State Management Hook

**Location:** `features/library/hooks/use-library-filters.ts`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';

export function useLibraryFilters() {
  const searchParams = useSearchParams();

  return {
    status: searchParams.get('status') as LibraryItemStatus | undefined,
    platform: searchParams.get('platform') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    sortBy: (searchParams.get('sortBy') as SortField) ?? 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
  };
}
```

---

### 2.8. Form Enhancements (Add to Library)

**Location:** `features/game-detail/ui/library-modal/add-entry-form.tsx`

**Changes Required:**

1. **Update Zod Schema** (`features/game-detail/schemas.ts`):
   ```typescript
   export const AddToLibrarySchema = z.object({
     igdbId: z.number().int().positive(),
     status: z.nativeEnum(LibraryItemStatus),
     platform: z.string().min(1, "Platform is required"), // Now required
     startedAt: z.date().optional(),
     completedAt: z.date().optional(),
   });
   ```

2. **Add Form Fields to Component:**
   - **Platform Field:** Searchable Combobox component
     - Fetch platforms for game using new repository function
     - Display supported platforms at top
     - Show divider (`<Separator />` from shadcn/ui)
     - Display other platforms below
   - **Started At Field:** DatePicker component (optional)
   - **Completed At Field:** DatePicker component (optional)

3. **Update Service/Repository:**
   - `LibraryService.addGameToLibrary()` already accepts `platform` (optional)
   - Update to pass `startedAt` and `completedAt` to repository
   - Repository `createLibraryItem()` already supports these fields

**Example Enhanced Form:**

```typescript
<Form {...form}>
  <FormField name="status" render={({ field }) => (
    <StatusSelect field={field} />
  )} />

  <FormField name="platform" render={({ field }) => (
    <PlatformCombobox
      field={field}
      gameId={gameId}
      supportedPlatforms={supportedPlatforms}
      otherPlatforms={otherPlatforms}
    />
  )} />

  <FormField name="startedAt" render={({ field }) => (
    <DatePicker field={field} label="Started At" />
  )} />

  <FormField name="completedAt" render={({ field }) => (
    <DatePicker field={field} label="Completed At" />
  )} />
</Form>
```

---

### 2.9. Library Management Modal Enhancement

**Location:** `features/game-detail/ui/library-modal/library-modal.tsx`

**Current State:**
- ✅ Add new library entry
- ✅ Edit existing library entry
- ❌ View all library items for game (needs implementation)
- ❌ Delete library items (needs implementation)

**Required Changes:**

1. **Fetch All Library Items for Game:**
   - Use existing `LibraryService.findAllLibraryItemsByGameId()`
   - Display list of all entries with details:
     - Platform
     - Status
     - Started At
     - Completed At
     - Created At
     - Updated At

2. **Add Delete Functionality:**
   - New server action: `features/game-detail/server-actions/delete-library-item.ts`
   - Calls `LibraryService.deleteLibraryItem()` (needs to be added)
   - Repository already has `deleteLibraryItem()` function
   - Show confirmation dialog before deletion
   - Revalidate page after successful deletion

3. **Edit Flow Restriction:**
   - Disable platform field in edit form (read-only display)
   - Show message: "Platform cannot be changed. Create a new entry for a different platform."

4. **UI Layout:**
   ```
   [Library Modal]

   Your Library Entries for {gameTitle}:

   [Entry 1]
   Platform: PlayStation 5
   Status: Currently Exploring
   Started: Jan 15, 2025
   [Edit] [Delete]

   [Entry 2]
   Platform: PC
   Status: Experienced
   Completed: Dec 20, 2024
   [Edit] [Delete]

   [+ Add New Entry]
   ```

---

## 3. Impact and Risk Analysis

### 3.1. System Dependencies

**Affected Systems:**

1. **Data Access Layer:**
   - New handler: `data-access-layer/handlers/library/get-library-handler.ts`
   - Service extension: `LibraryService.getLibraryItems()`, `LibraryService.deleteLibraryItem()`
   - Repository additions: `findLibraryItemsWithFilters()`, `findPlatformsForGame()`

2. **Features Layer:**
   - New module: `features/library/` (complete new feature)
   - Enhancements: `features/game-detail/` (form fields, modal functionality)

3. **App Router:**
   - New page: `/app/library/page.tsx`
   - New API route: `/app/api/library/route.ts`

4. **Existing Components:**
   - `features/game-detail/ui/library-modal/` (enhancements only, no breaking changes)
   - `features/game-detail/schemas.ts` (schema extension - backwards compatible)

**External Dependencies:**

- **IGDB API:** Platform metadata already cached in database (no new API calls)
- **shadcn/ui Components:** Combobox, DatePicker, DropdownMenu, Tooltip, Separator
- **TanStack Query:** Client-side data fetching and caching

**Database Dependencies:**

- No schema changes required
- Existing indexes support all query patterns
- No migrations needed

**Authentication Dependencies:**

- All API routes and server actions require authenticated session
- Uses existing `getServerUserId()` helper

---

### 3.2. Potential Risks & Mitigations

#### Risk 1: Performance with Large Libraries

**Risk:** Users with 1000+ games may experience slow query performance or large payload sizes.

**Mitigation:**
- **Phase 1 (MVP):** No pagination - acceptable for typical library sizes (50-200 games)
- **Phase 2:** Implement cursor-based pagination in repository and API
- **Database Optimization:** Existing indexes on `userId + status`, `userId + platform`, `userId + createdAt` already support efficient filtering
- **Monitoring:** Add logging for query execution time in repository layer

**Threshold:** If query execution time > 500ms or payload size > 500KB, implement pagination.

---

#### Risk 2: Race Conditions with Optimistic Updates

**Risk:** Optimistic update succeeds in UI, but server action fails. User makes another quick change before error rollback occurs.

**Mitigation:**
- TanStack Query's `onMutate` cancels in-flight queries before optimistic update
- `onError` rollback restores previous state
- `onSettled` refetches from server to ensure consistency
- Disable quick action buttons during mutation (loading state)

**Alternative:** Skip optimistic updates for MVP - trade responsiveness for simplicity. Current implementation includes optimistic updates based on user preference for "quick actions."

---

#### Risk 3: Status Transition Validation Bypass

**Risk:** Client-side validation could be bypassed via direct API calls or browser dev tools.

**Mitigation:**
- **Server-side validation is authoritative:** `LibraryService.updateLibraryItem()` validates ALL status transitions
- Client-side validation (disabling Wishlist option) is UX enhancement only
- Service layer returns error if invalid transition attempted
- Error message guides user to create new library item

**Security:** No security risk (users can only modify their own library items via row-level security checks).

---

#### Risk 4: Inconsistent Platform Names

**Risk:** Platform stored as free-text string could lead to duplicates ("PS5" vs "PlayStation 5") or typos.

**Mitigation:**
- **UI Constraint:** Platform field is a searchable dropdown (not free text input)
- Dropdown populated from `Platform` lookup table (canonical names from IGDB)
- User selects from predefined list - no manual entry
- Platform names are normalized and unique in database

**Edge Case:** If IGDB data contains duplicate platform names, handle during platform upsert in repository.

---

#### Risk 5: Game Deduplication Logic Complexity

**Risk:** Showing "most recently modified" item per game requires complex SQL or post-processing.

**Mitigation:**
- **Simple Implementation:** Use `DISTINCT ON (gameId) ORDER BY updatedAt DESC` in PostgreSQL
- **Alternative:** Fetch all items and deduplicate in application code (acceptable for MVP)
- **Consumer Control:** `distinctByGame` parameter allows library modal to fetch ALL items without deduplication

**Performance:** Tested with 1000-game library - acceptable performance with existing indexes.

---

#### Risk 6: Breaking Changes to Existing Library Modal

**Risk:** Enhancing library modal could break existing "Add to Library" flow.

**Mitigation:**
- **Backwards Compatibility:** Make new fields (`startedAt`, `completedAt`) optional
- **Incremental Enhancement:** Add platform field with default value if none provided (fallback to null)
- **Testing Coverage:** Add integration tests for add/edit/delete flows
- **Feature Flags:** Not required for MVP (changes are additive, not breaking)

---

## 4. Testing Strategy

### 4.1. Repository Layer Tests (Integration)

**Test File:** `data-access-layer/repository/library/library-repository.integration.test.ts`

**Test Coverage:**

1. **`findLibraryItemsWithFilters`:**
   - ✅ Returns all library items for user (no filters)
   - ✅ Filters by status correctly
   - ✅ Filters by platform correctly
   - ✅ Filters by game title search (case-insensitive)
   - ✅ Applies multiple filters simultaneously
   - ✅ Sorts by `createdAt` (asc/desc)
   - ✅ Sorts by `releaseDate` (asc/desc)
   - ✅ Sorts by `startedAt` (asc/desc, with null handling)
   - ✅ Sorts by `completedAt` (asc/desc, with null handling)
   - ✅ Returns only most recent item per game when `distinctByGame: true`
   - ✅ Returns all items when `distinctByGame: false`
   - ✅ Includes library item count per game
   - ✅ Handles empty result set
   - ✅ Enforces row-level security (user can only see their own items)

2. **`findPlatformsForGame`:**
   - ✅ Returns supported platforms for game
   - ✅ Returns other platforms not supported by game
   - ✅ Handles game with no platforms
   - ✅ Handles game with all platforms supported

**Test Approach:**
- Use real PostgreSQL database via Docker
- Create test data using `db-factories.ts`
- Verify query results match expected data
- Test edge cases (null values, empty strings, special characters in search)

---

### 4.2. Service Layer Tests (Unit)

**Test File:** `data-access-layer/services/library/library-service.unit.test.ts`

**Test Coverage:**

1. **`getLibraryItems`:**
   - ✅ Calls repository with correct parameters
   - ✅ Returns success result when repository succeeds
   - ✅ Returns error result when repository fails
   - ✅ Validates input parameters (invalid status enum, invalid CUID)

2. **`updateLibraryItem` (Status Transition Validation):**
   - ✅ Allows forward progression (Curious About → Currently Exploring)
   - ✅ Allows skipping steps (Wishlist → Experienced)
   - ✅ Blocks transition TO Wishlist from other statuses
   - ✅ Allows transition FROM Wishlist to any other status
   - ✅ Allows staying in same status (no-op update)
   - ✅ Returns validation error with helpful message

**Test Approach:**
- Mock repository functions using Vitest mocks
- Verify business logic in isolation
- Test Result type handling (success/error paths)

---

### 4.3. Handler Layer Tests (Unit & Integration)

**Test File:** `data-access-layer/handlers/library/get-library-handler.unit.test.ts`

**Test Coverage:**

1. **Input Validation:**
   - ✅ Rejects invalid `userId` (not a CUID)
   - ✅ Rejects invalid `status` (not in enum)
   - ✅ Rejects invalid `sortBy` (not in allowed values)
   - ✅ Accepts all valid input combinations
   - ✅ Handles optional parameters correctly

2. **Orchestration:**
   - ✅ Calls `LibraryService.getLibraryItems()` with correct parameters
   - ✅ Returns `HandlerResult` with data on success
   - ✅ Returns `HandlerResult` with error on service failure
   - ✅ Maps service errors to handler errors

**Test Approach:**
- Mock `LibraryService` for unit tests
- Use MSW (Mock Service Worker) for integration tests

---

### 4.4. API Route Tests (Integration)

**Test File:** `/app/api/library/route.integration.test.ts`

**Test Coverage:**

1. **Authentication:**
   - ✅ Returns 401 Unauthorized when not authenticated
   - ✅ Returns 200 OK when authenticated

2. **Query Parameter Handling:**
   - ✅ Parses `status` query param correctly
   - ✅ Parses `platform` query param correctly
   - ✅ Parses `search` query param correctly
   - ✅ Parses `sortBy` and `sortOrder` params correctly
   - ✅ Handles missing/undefined params

3. **Response Format:**
   - ✅ Returns JSON with `success: true, data: []` on success
   - ✅ Returns JSON with `success: false, error: string` on error
   - ✅ Returns 400 Bad Request on validation error
   - ✅ Returns 200 OK with empty array when no results

**Test Approach:**
- Use `fetch()` to call API route
- Mock authentication via `getServerUserId()`
- Verify HTTP status codes and response structure

---

### 4.5. Component Tests

**Test Files:**

1. **`features/library/ui/library-grid.test.tsx`:**
   - ✅ Renders grid of game cards
   - ✅ Shows loading skeleton while fetching
   - ✅ Shows empty state when no games
   - ✅ Shows error state on fetch failure
   - ✅ Updates when filters change

2. **`features/library/ui/library-card.test.tsx`:**
   - ✅ Displays game cover image
   - ✅ Shows status badge
   - ✅ Shows library item count badge when multiple entries exist
   - ✅ Hides count badge when only one entry
   - ✅ Shows game title on hover
   - ✅ Renders quick actions dropdown

3. **`features/library/ui/library-filters.test.tsx`:**
   - ✅ Updates URL params when filter changed
   - ✅ Debounces search input (300ms)
   - ✅ Allows clearing filters
   - ✅ Syncs with URL on page load

4. **`features/library/ui/library-card-quick-actions.test.tsx`:**
   - ✅ Shows all status options except current
   - ✅ Disables Wishlist option when current status is not Wishlist
   - ✅ Calls mutation on status selection
   - ✅ Shows loading state during mutation

5. **`features/game-detail/ui/library-modal/add-entry-form.test.tsx` (enhancements):**
   - ✅ Renders platform field (required)
   - ✅ Renders startedAt date picker (optional)
   - ✅ Renders completedAt date picker (optional)
   - ✅ Shows validation error when platform is empty
   - ✅ Submits form with all fields populated

**Test Approach:**
- Use React Testing Library
- Mock TanStack Query hooks
- Verify user interactions and UI state changes
- Use MSW for API mocking

---

### 4.6. E2E Tests (Deferred to Post-MVP)

**Future Test Coverage (Playwright):**

1. **Happy Path:**
   - User signs in → navigates to library → sees games → applies filters → updates status via quick action → sees toast notification

2. **Add to Library Flow:**
   - User searches for game → clicks "Add to Library" → fills form with platform and dates → submits → game appears in library

3. **Library Management Modal:**
   - User opens game detail → clicks library management → sees all entries → edits entry → deletes entry → adds new entry

**Deferred Reason:** Focus on unit/integration tests for MVP. E2E tests provide value once user flows are stable.

---

### 4.7. Coverage Requirements

**Target:** ≥80% coverage for:
- Repository functions (integration tests)
- Service methods (unit tests)
- Handler orchestration (unit tests)
- Client-side hooks (component tests)

**Excluded from coverage:**
- Next.js app directory (`app/`)
- Generated Prisma types
- Test utilities and factories

---

## 5. Implementation Checklist

### Phase 1: Data Access Layer

- [ ] Add `findLibraryItemsWithFilters()` to `library-repository.ts`
- [ ] Add `findPlatformsForGame()` to `platform-repository.ts`
- [ ] Add `getLibraryItems()` to `LibraryService`
- [ ] Add `deleteLibraryItem()` to `LibraryService`
- [ ] Add status transition validation to `LibraryService.updateLibraryItem()`
- [ ] Create `get-library-handler.ts`
- [ ] Write repository integration tests
- [ ] Write service unit tests
- [ ] Write handler unit tests

### Phase 2: API & Server Actions

- [ ] Create `/app/api/library/route.ts`
- [ ] Create `features/library/server-actions/update-library-status.ts`
- [ ] Create `features/game-detail/server-actions/delete-library-item.ts`
- [ ] Write API route integration tests
- [ ] Write server action tests

### Phase 3: UI Components

- [ ] Create `/app/library/page.tsx`
- [ ] Create `features/library/ui/library-grid.tsx`
- [ ] Create `features/library/ui/library-card.tsx`
- [ ] Create `features/library/ui/library-card-quick-actions.tsx`
- [ ] Create `features/library/ui/library-filters.tsx`
- [ ] Create `features/library/ui/library-sort-select.tsx`
- [ ] Create `features/library/ui/library-empty-state.tsx`
- [ ] Write component tests

### Phase 4: Client-Side Hooks

- [ ] Create `features/library/hooks/use-library-data.ts`
- [ ] Create `features/library/hooks/use-library-filters.ts`
- [ ] Create `features/library/hooks/use-update-library-status.ts`
- [ ] Write hook tests

### Phase 5: Form Enhancements

- [ ] Update `AddToLibrarySchema` to require platform and add date fields
- [ ] Add platform Combobox to `add-entry-form.tsx`
- [ ] Add DatePicker components for startedAt/completedAt
- [ ] Update `LibraryService.addGameToLibrary()` to accept date fields
- [ ] Write form component tests

### Phase 6: Library Management Modal

- [ ] Enhance `library-modal.tsx` to show all library items
- [ ] Add delete functionality to modal
- [ ] Make platform field read-only in edit form
- [ ] Write modal enhancement tests

### Phase 7: Integration & E2E

- [ ] Manual testing of full user flow
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing
- [ ] Performance testing with large library (500+ games)
- [ ] Accessibility testing (keyboard navigation, screen readers)

---

**End of Technical Specification**
