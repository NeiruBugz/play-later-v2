# CLAUDE.md - View Wishlist Feature

This document provides comprehensive guidance for working with the view-wishlist feature module in the Play Later V2 application.

## Feature Overview

The view-wishlist feature enables users to manage and display their game wishlists both privately (authenticated users) and publicly (shared via shareable URLs). It serves as a core component of the collection management system, allowing users to:

- **Personal Wishlist Management**: View and manage their private wishlist at `/collection/wishlist`
- **Public Wishlist Sharing**: Share wishlists publicly via `/wishlist/[username]` URLs
- **Game Discovery**: Browse and discover games through shared wishlists
- **Collection Integration**: Seamlessly integrate with the broader backlog management system

## Architecture and Component Breakdown

### Directory Structure

```
features/view-wishlist/
├── components/
│   └── wishlisted-list.tsx          # Main wishlist display component
├── lib/
│   └── group-wishlisted-items-by-game-id.ts  # Data transformation utility
├── server-actions/
│   └── get-wishlisted-items.ts      # Server actions for data fetching
├── types/
│   └── index.ts                     # TypeScript type definitions
├── PRD.md                          # Product requirements document
└── CLAUDE.md                       # This documentation file
```

### Component Architecture

#### WishlistedList Component (`components/wishlisted-list.tsx`)

**Primary Component**: Server-side rendered React component for displaying personal wishlists

**Key Responsibilities**:

- Fetches authenticated user's wishlist data via server actions (lines 7)
- Handles error states and empty wishlist states (lines 9-29)
- Renders responsive grid layout of game cards (lines 31-50)
- Provides navigation to add-game feature for empty state (lines 19-26)

**Integration Points**:

- Uses `getWishlistedItems` server action for data fetching
- Integrates with shared `BacklogItemCard` component for consistent game display
- Links to `/collection/add-game` for wishlist population

### Data Flow Architecture

**Data Flow Pattern**: Next.js App Router → Server Actions → Repository Layer → Prisma → PostgreSQL

#### 1. Client Layer (App Router Routes)

**Personal Wishlist Route** (`/app/collection/(list-views)/wishlist/page.tsx`):

- Requires authentication (lines 8-11)
- Uses Suspense for loading states (lines 13-14)
- Renders `WishlistedList` component

**Shared Wishlist Route** (`/app/wishlist/[username]/page.tsx`):

- Public access, no authentication required
- Fetches data by username parameter (lines 10-13)
- Custom layout with header and user context (lines 32-34)
- Handles URL decoding for username parameters (line 11)

#### 2. Server Actions Layer (`server-actions/get-wishlisted-items.ts`)

**Personal Wishlist Action** (`getWishlistedItems`):

```typescript
// Lines 14-30
export const getWishlistedItems = authorizedActionClient
  .metadata({ actionName: "getWishlistedItems", requiresAuth: true })
  .action(async ({ ctx: { userId } }) => {
    const wishlisted = await findWishlistItemsForUser({ userId });
    const groupedGames = groupWishlistedItemsByGameId({ wishlisted });
    return Object.values(groupedGames);
  });
```

**Public Wishlist Action** (`getWishlistedItemsByUsername`):

```typescript
// Lines 32-51
export const getWishlistedItemsByUsername = publicActionClient
  .metadata({ actionName: "getWishlistedItemsByUsername", requiresAuth: false })
  .inputSchema(z.object({ username: z.string() }))
  .action(async ({ parsedInput: { username } }) => {
    const wishlisted = await getWishlistedItemsByUsernameCommand({ username });
    const groupedGames = groupWishlistedItemsByGameId({ wishlisted });
    return Object.values(groupedGames);
  });
```

#### 3. Repository Layer Integration

**Personal Wishlist Query**:

```typescript
// From backlog-repository.ts
export async function findWishlistItemsForUser({ userId }: { userId: string }) {
  return await prisma.backlogItem.findMany({
    where: { userId, status: BacklogItemStatus.WISHLIST },
    include: { game: true },
    orderBy: { createdAt: "asc" },
  });
}
```

**Public Wishlist Query**:

```typescript
// From backlog-repository.ts
export async function getWishlistedItemsByUsername({
  username,
}: {
  username: string;
}) {
  return await prisma.backlogItem.findMany({
    where: {
      User: { username: username },
      status: BacklogItemStatus.WISHLIST,
    },
    include: { game: true },
    orderBy: { createdAt: "asc" },
  });
}
```

### Data Transformation Layer

#### Game Grouping Utility (`lib/group-wishlisted-items-by-game-id.ts`)

**Purpose**: Transforms flat BacklogItem array into grouped game structure for efficient rendering

**Implementation**:

```typescript
// Lines 3-19
export function groupWishlistedItemsByGameId({
  wishlisted,
}: {
  wishlisted: BacklogItemWithGame[];
}) {
  return wishlisted.reduce(
    (acc: Record<string, GameWithBacklogItems>, item) => {
      const { game, ...backlogItem } = item;
      if (!acc[game.id]) {
        acc[game.id] = { game, backlogItems: [] };
      }
      acc[game.id].backlogItems.push(backlogItem);
      return acc;
    },
    {}
  );
}
```

**Key Benefits**:

- Prevents duplicate game display when user has same game on multiple platforms
- Aggregates multiple backlog items per game for comprehensive display
- Optimizes rendering performance by reducing component iterations

## TypeScript Patterns and Type Definitions

### Core Type System (`types/index.ts`)

**GameWithBacklogItems Interface**:

```typescript
// Lines 3-6
export type GameWithBacklogItems = {
  game: Game;
  backlogItems: Omit<BacklogItem, "game">[];
};
```

**BacklogItemWithGame Interface**:

```typescript
// Lines 8-10
export type BacklogItemWithGame = BacklogItem & {
  game: Game;
};
```

### Type Safety Patterns

1. **Server Action Type Safety**:
   - Uses `authorizedActionClient` and `publicActionClient` from shared safe-action library
   - Input validation with Zod schemas for public actions
   - Automatic type inference for action contexts

2. **Database Type Safety**:
   - Leverages Prisma generated types (`BacklogItem`, `Game`)
   - Type-safe repository functions with explicit return types
   - Proper handling of optional/nullable fields

3. **Component Prop Types**:
   - Explicit prop interfaces for all components
   - Proper game data shape definition for BacklogItemCard integration
   - Optional boolean flags for different display contexts

## Key Files and Responsibilities

### Primary Files

1. **`components/wishlisted-list.tsx`** - Main Display Component
   - **Lines 6-7**: Server action integration and data fetching
   - **Lines 9-11**: Error handling for server failures
   - **Lines 13-29**: Empty state handling with navigation links
   - **Lines 33-47**: Game grid rendering with responsive layout
   - **Responsibility**: Render personal wishlist with proper state handling

2. **`server-actions/get-wishlisted-items.ts`** - Data Access Layer
   - **Lines 14-30**: Authenticated wishlist fetching with error handling
   - **Lines 32-51**: Public wishlist fetching with username validation
   - **Lines 23, 44**: Data transformation via grouping utility
   - **Responsibility**: Bridge between UI and data layer with proper authorization

3. **`lib/group-wishlisted-items-by-game-id.ts`** - Data Processing
   - **Lines 8-18**: Efficient grouping algorithm using reduce
   - **Lines 10-14**: Game aggregation logic with backlog item collection
   - **Responsibility**: Transform flat data structure for optimal UI rendering

4. **`types/index.ts`** - Type Definitions
   - **Lines 3-6**: Game-centric data structure for UI components
   - **Lines 8-10**: Database-centric data structure for processing
   - **Responsibility**: Type safety across feature boundaries

### Integration Files

5. **Route Handlers**:
   - `/app/collection/(list-views)/wishlist/page.tsx` - Personal wishlist page
   - `/app/wishlist/[username]/page.tsx` - Public shared wishlist page

6. **Shared Dependencies**:
   - `/shared/components/backlog-item-card.tsx` - Game card display component
   - `/shared/lib/repository/backlog/backlog-repository.ts` - Database access functions

## Testing Strategy

### Current Testing Status

**Status**: No dedicated tests currently exist for this feature module.

### Recommended Testing Approach

#### Unit Tests (`.unit.test.ts`)

**Components**:

```typescript
// Recommended: wishlisted-list.unit.test.ts
describe("WishlistedList Component", () => {
  it("should display empty state with add-game link");
  it("should render game cards in responsive grid");
  it("should handle server errors gracefully");
});
```

**Utilities**:

```typescript
// Recommended: group-wishlisted-items-by-game-id.unit.test.ts
describe("groupWishlistedItemsByGameId", () => {
  it("should group items by game ID correctly");
  it("should handle multiple platforms per game");
  it("should preserve backlog item properties");
});
```

#### Integration Tests (`.integration.test.ts`)

**Server Actions**:

```typescript
// Recommended: get-wishlisted-items.integration.test.ts
describe("Wishlist Server Actions", () => {
  it("should fetch personal wishlist for authenticated user");
  it("should fetch public wishlist by username");
  it("should handle non-existent usernames");
  it("should enforce authentication for personal wishlists");
});
```

### Test Data Factories

**Recommended Factories**:

- `createWishlistItem()` - Generate BacklogItem with WISHLIST status
- `createGameWithWishlistItems()` - Generate Game with associated wishlist items
- `createUserWithWishlist()` - Generate User with populated wishlist

## Integration Points with Other Features

### Internal Feature Dependencies

1. **Authentication System** (`/auth`):
   - Personal wishlist access requires valid session
   - Public wishlist access is unrestricted
   - User context provided via server action clients

2. **Backlog Management** (`/features/manage-backlog-item`):
   - Status transitions from WISHLIST to other states
   - Action buttons in BacklogItemCard for status changes
   - Integration with backlog item CRUD operations

3. **Add Game Feature** (`/features/add-game`):
   - Empty state navigation to game addition flow
   - New games can be added directly to wishlist status
   - Seamless workflow for wishlist population

4. **Game Details** (`/features/view-game-details`):
   - Game cards link to detailed game view pages
   - Game metadata display integration
   - Platform and cover image handling

### External Service Dependencies

1. **Database Layer** (Prisma/PostgreSQL):
   - BacklogItem table with WISHLIST status filtering
   - User table for username-based public access
   - Game table for metadata and cover images

2. **IGDB Integration**:
   - Game cover images via IgdbImage component
   - Game metadata synchronization
   - Platform information display

3. **Shared Component Library**:
   - BacklogItemCard for consistent game display
   - UI components from shadcn/ui design system
   - Responsive layout utilities from Tailwind CSS

## Performance Considerations

### Database Query Optimization

1. **Status Filtering**: Database-level filtering by `BacklogItemStatus.WISHLIST`
2. **Eager Loading**: Game data included in single query to prevent N+1 problems
3. **Chronological Ordering**: Consistent `createdAt` ASC ordering for predictable display

### Client-Side Performance

1. **Grouping Efficiency**: Single-pass reduce operation for game grouping
2. **Component Rendering**: Minimal re-renders through proper key usage
3. **Image Loading**: Optimized IGDB image component with proper sizing

### Caching Strategy

**Current**: No explicit caching implemented
**Recommendation**: Consider React Query or SWR for client-side caching of wishlist data

## Common Development Patterns

### Error Handling Pattern

```typescript
// Consistent pattern across server actions (lines 26-29, 47-50)
try {
  const result = await repositoryFunction();
  return processedResult;
} catch (e) {
  console.error(e);
  return [];
}
```

### Authentication Pattern

```typescript
// Personal data access (lines 14-18)
export const getWishlistedItems = authorizedActionClient
  .metadata({ requiresAuth: true })
  .action(async ({ ctx: { userId } }) => {
    // userId automatically available from context
  });
```

### Validation Pattern

```typescript
// Public data access with input validation (lines 37-38)
.inputSchema(z.object({ username: z.string() }))
.action(async ({ parsedInput: { username } }) => {
  // Input automatically validated and typed
});
```

## Development Commands

### Feature-Specific Development

```bash
# Run development server to test wishlist functionality
pnpmdev

# View personal wishlist (requires authentication)
# Navigate to: http://localhost:6060/collection/wishlist

# View shared wishlist (replace with actual username)
# Navigate to: http://localhost:6060/wishlist/[username]
```

### Code Quality for Feature

```bash
# Type check wishlist feature files
pnpmtypecheck

# Lint wishlist feature
pnpmlint features/view-wishlist

# Format wishlist feature
pnpmformat:write features/view-wishlist
```

### Testing (When Implemented)

```bash
# Run wishlist-specific unit tests
pnpmrun test features/view-wishlist

# Run integration tests affecting wishlist functionality
pnpmrun test:integration --grep="wishlist"
```

## Future Enhancement Opportunities

### High Priority Features

1. **Wishlist Organization**: Categories, tags, and custom ordering
2. **Social Features**: Wishlist sharing to social media platforms
3. **Price Tracking**: Integration with game store APIs for price alerts
4. **Bulk Operations**: Multi-select for batch wishlist management

### Medium Priority Features

1. **Smart Recommendations**: AI-powered game suggestions based on wishlist
2. **Collaborative Wishlists**: Shared wishlists for families or friend groups
3. **Analytics**: Wishlist insights and gaming preference analysis
4. **Export/Import**: Data portability for external tools

### Technical Improvements

1. **Performance**: Client-side caching and virtualized lists for large wishlists
2. **Accessibility**: Enhanced screen reader support and keyboard navigation
3. **Testing**: Comprehensive test suite covering all user flows
4. **Mobile**: Optimized mobile experience with touch-friendly interactions

---

_This documentation is maintained as part of the Play Later V2 codebase. Update this file when making significant changes to the view-wishlist feature architecture or functionality._
