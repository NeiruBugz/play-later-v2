# View Game Details Feature - CLAUDE.md

This file provides guidance to Claude Code when working with the view-game-details feature module.

## Feature Overview

The View Game Details feature serves as the comprehensive game information hub for the PlayLater platform. It displays detailed game metadata, user reviews, media content, achievements, franchise relationships, and provides integration with external platforms like Steam. This feature acts as the central destination for all game-related information and user interactions.

### Primary Purpose

- Display comprehensive game information from IGDB API
- Provide tabbed navigation for organized content (About, Reviews, Screenshots, Achievements)
- Enable user reviews and ratings submission
- Show Steam achievements for authenticated users
- Display franchise relationships and related games
- Support external platform integration (Steam store links, official websites)
- Allow library management directly from game pages

### Key Business Value

- Drives user engagement through rich, content-heavy game pages
- Supports informed gaming decisions through reviews and detailed metadata
- Encourages collection management through integrated actions
- Provides authoritative game information leveraging multiple APIs

## Architecture and Component Breakdown

### Directory Structure

```
view-game-details/
├── components/               # React UI components
│   ├── about.tsx            # Game description, platforms, genres
│   ├── achievements.tsx     # Steam achievement integration
│   ├── artwork.tsx          # Game artwork display
│   ├── expansions.tsx       # DLC and expansion content
│   ├── external-game-actions.tsx  # Add to wishlist/collection
│   ├── franchise/           # Franchise relationship components
│   │   ├── ui/             # Franchise UI components
│   │   ├── lib/            # Franchise utilities
│   │   └── types.ts        # Franchise type definitions
│   ├── franchises.tsx       # Main franchise display
│   ├── game-quick-actions.tsx  # Game management actions
│   ├── game-screenshots.tsx    # Screenshot gallery
│   ├── game-stats.tsx       # Rating and statistics
│   ├── game-tabs.tsx        # Main tabbed interface
│   ├── metadata.tsx         # Game metadata display
│   ├── review.tsx           # Individual review component
│   ├── reviews.tsx          # Reviews list and form
│   ├── screenshot-carousel.tsx  # Image carousel
│   ├── similar-games.tsx    # Related games
│   └── times-to-beat.tsx    # HowLongToBeat integration
├── lib/                     # Feature-specific utilities
│   ├── determine-game-source.ts  # Game source detection
│   └── find-steam-app-id.ts     # Steam ID extraction
├── server-actions/          # Business logic layer
│   ├── get-game.ts          # Main game data fetching
│   ├── get-reviews.ts       # User reviews retrieval
│   └── get-library-items-by-igdb-id.ts  # User library status
└── index.ts                 # Feature exports
```

### Core Components

#### GameTabs (`components/game-tabs.tsx`)

**Purpose**: Main tabbed interface organizing game content

- **Props**: Game metadata (name, description, igdbId, genres, release dates, Steam app ID)
- **Tabs**: About, Reviews, Screenshots, Achievements (conditional)
- **Architecture**: Uses `AdaptiveTabs` from shared components
- **Key Features**:
  - Conditional achievement tab based on Steam integration
  - Suspense boundaries for async content
  - Responsive design for mobile/desktop

```typescript
// Key type definition (lines 16-33)
type GameTabsProps = {
  gameName: string;
  gameDescription: string;
  igdbGameId: number;
  genres: FullGameInfoResponse["genres"];
  releaseDates: FullGameInfoResponse["release_dates"];
  steamAppId: number | null;
};
```

#### About (`components/about.tsx`)

**Purpose**: Display game description, platforms, and genres

- **Data Sources**: IGDB release dates and genre information
- **Features**: Platform badges, genre tags, expansion content
- **Integration**: Includes `Expansions` component with Suspense

#### Achievements (`components/achievements.tsx`)

**Purpose**: Steam achievement display with progress tracking

- **Data Source**: Steam API via `getUserAchievements` server action
- **Features**:
  - Achievement cards with unlock status
  - Progress tracking with completion percentage
  - Rarity indicators and global statistics
  - Error handling for Steam connection issues
- **Key Props**: `steamAppId: number`

#### Reviews (`components/reviews.tsx`)

**Purpose**: User review display and submission interface

- **Server Action**: `getReviews` for data fetching
- **Features**: Review form integration, individual review cards
- **Error Handling**: Graceful fallback for fetch failures

### Game Source Determination

The feature supports both internal and external games through a utility system:

#### `determine-game-source.ts` (lines 1-4)

```typescript
export function determineGameSource(gameId: string) {
  const isNumeric = !isNaN(Number(gameId)) && Number.isInteger(Number(gameId));
  return isNumeric ? "EXTERNAL" : "INTERNAL";
}
```

- **Purpose**: Distinguish between internal database games and external IGDB games
- **Logic**: Numeric IDs = external (IGDB), UUID = internal database
- **Usage**: Affects available actions and review functionality

#### `find-steam-app-id.ts`

**Purpose**: Extract Steam app ID from IGDB external games data

- **Input**: `FullGameInfoResponse["external_games"]`
- **Process**: Find Steam URL, extract app ID using shared utility
- **Error Handling**: Returns `null` for missing/invalid Steam data
- **Dependencies**: Uses `getSteamAppIdFromUrl` from shared library

## Data Flow Architecture

### Client → Server Actions → Repositories

```
Next.js Page/Component
       ↓
Server Actions (view-game-details/server-actions/)
├── getGame (get-game.ts)
├── getReviews (get-reviews.ts)
└── getLibraryItemsByIgdbId (get-library-items-by-igdb-id.ts)
       ↓
Repository Layer (shared/lib/repository/)
├── findGameById
├── getAllReviewsForGame
└── getLibraryItemsForUserByIgdbId
       ↓
Prisma ORM → PostgreSQL
```

### Server Actions Implementation

#### `getGame` (lines 6-20)

```typescript
export const getGame = authorizedActionClient
  .metadata({
    actionName: "getGame",
    requiresAuth: true,
  })
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const game = await findGameById({ id: parsedInput.id });
    return game;
  });
```

- **Authentication**: Required for all game operations
- **Validation**: Zod schema validation for input parameters
- **Repository**: Delegates to `findGameById` from repository layer

#### `getReviews` (lines 8-20)

```typescript
export const getReviews = authorizedActionClient
  .metadata({
    actionName: "getReviews",
    requiresAuth: true,
  })
  .inputSchema(z.object({ gameId: z.string() }))
  .action(async ({ parsedInput }) => {
    return await getAllReviewsForGame({ gameId: parsedInput.gameId });
  });
```

#### `getLibraryItemsByIgdbId` (lines 8-24)

```typescript
export const getLibraryItemsByIgdbId = authorizedActionClient
  .metadata({
    actionName: "getLibraryItemsByIgdbId",
    requiresAuth: true,
  })
  .inputSchema(z.object({ igdbId: z.number() }))
  .action(async ({ ctx: { userId }, parsedInput }) => {
    const libraryItems = await getLibraryItemsForUserByIgdbId({
      userId,
      igdbId: parsedInput.igdbId,
    });
    return libraryItems;
  });
```

- **Context Usage**: Leverages authenticated user context (`ctx.userId`)
- **Type Safety**: Numeric validation for IGDB IDs

## TypeScript Patterns and Type Definitions

### Type Safety Approach

The feature demonstrates excellent TypeScript patterns:

1. **Shared Type Dependencies**: Leverages `FullGameInfoResponse` from shared types
2. **Conditional Types**: Uses discriminated unions for component props
3. **Generic Type Parameters**: Follows `T` prefix convention
4. **Strict Validation**: Zod schemas for runtime type safety

### Key Type Integrations

#### Shared Types Usage

```typescript
// From components/about.tsx (lines 8-13)
type AboutProps = {
  igdbId: number;
  description: string;
  releaseDates: FullGameInfoResponse["release_dates"];
  genres: FullGameInfoResponse["genres"];
};
```

#### Conditional Types Pattern

```typescript
// From components/game-tabs.tsx (lines 25-33)
type WithReviews =
  | {
      isReviewsDisabled: boolean;
      gameId: string;
    }
  | {
      isReviewsDisabled: boolean;
      gameId: never;
    };
```

### Franchise Type System

```typescript
// From components/franchise/types.ts
export type FranchiseProps = {
  name: string;
  games: FranchiseGamesResponse["games"];
};
```

## Key Files and Responsibilities

### Primary Entry Points

- **`index.ts`**: Feature exports and public API
- **`components/game-tabs.tsx`**: Main UI orchestrator
- **`server-actions/get-game.ts`**: Primary data fetching

### Component Hierarchy

```
GameTabs (Main Container)
├── About
│   ├── Platform Badges
│   ├── Genre Tags
│   └── Expansions (Suspense)
├── Reviews
│   ├── ReviewForm
│   └── Review Cards
├── Screenshots
│   └── GameScreenshots (Suspense)
└── Achievements (Conditional)
    ├── Progress Card
    └── Achievement List
```

### Utility Functions

- **`determine-game-source.ts`**: Game type classification
- **`find-steam-app-id.ts`**: Steam integration utilities

### Integration Components

- **`external-game-actions.tsx`**: Integration with add-game feature
- **`game-quick-actions.tsx`**: Integration with manage-library-item feature

## Testing Strategy

### Current Test Coverage

The feature includes unit tests for utility functions:

#### `find-steam-app-id.test.ts`

**Test Cases**:

- Null handling for undefined/empty external games (lines 6-14)
- Successful Steam app ID extraction (lines 16-26)
- Error handling for non-Steam URLs (lines 28-38)
- Graceful handling of undefined URLs (lines 40-46)

### Testing Patterns

```typescript
// Example test structure (lines 5-26)
describe("findSteamAppId", () => {
  it("should return the steam app id", () => {
    const steamAppId = findSteamAppId([
      {
        id: 1,
        category: 1,
        name: "Test",
        url: "https://store.steampowered.com/app/1234567890",
      },
    ]);
    expect(steamAppId).toBe(1234567890);
  });
});
```

### Testing Strategy Recommendations

1. **Component Testing**: Test tab navigation and content loading
2. **Integration Testing**: Verify server action responses
3. **Error Boundary Testing**: Validate error state handling
4. **Steam Integration Testing**: Mock Steam API responses

## Integration Points with Other Features

### Feature Dependencies

- **`@/features/add-game`**: AddToCollectionModal, AddToWishlistFromExternalPage
- **`@/features/add-review`**: ReviewForm, AddReviewDialog
- **`@/features/manage-library-item`**: EditGameEntryModal, GameStatusSelector
- **`@/features/steam-integration`**: getUserAchievements, EnrichedAchievement types

### Shared Library Dependencies

- **Repository Layer**: `findGameById`, `getAllReviewsForGame`, `getLibraryItemsForUserByIgdbId`
- **Safe Action Client**: `authorizedActionClient` for type-safe server actions
- **UI Components**: AdaptiveTabs, Badge, Card, Progress from shadcn/ui
- **IGDB Integration**: Game metadata and images

### External API Integration

1. **IGDB API**: Primary game metadata source
2. **Steam API**: Achievement data and external links
3. **HowLongToBeat**: Completion time estimates

## Key Dependencies

### External Packages

- **`@prisma/client`**: Database models (BacklogItem, Review)
- **`lucide-react`**: Icons (Trophy, Clock, Star)
- **`next/image`**: Optimized image loading
- **`zod`**: Runtime validation

### Internal Dependencies

- **Shared Components**: AdaptiveTabs system, UI components
- **Shared Types**: FullGameInfoResponse, FranchiseGamesResponse
- **Shared Utilities**: Steam URL parsing, IGDB image handling

## Development Guidelines

### Code Style Patterns

- **Functional Components**: Use function declarations for server components
- **Props Typing**: Define explicit prop types for all components
- **Error Handling**: Graceful degradation for external API failures
- **Suspense Boundaries**: Wrap async content in Suspense with fallbacks

### Performance Considerations

- **Image Optimization**: Use Next.js Image component for game assets
- **Lazy Loading**: Suspense boundaries for heavy content (screenshots, achievements)
- **Conditional Rendering**: Steam-specific features only when applicable

### Authentication Integration

- All server actions require authentication
- User context automatically available in server actions
- Conditional features based on Steam account connection

## Future Enhancement Opportunities

### High Priority

1. **Enhanced Interactivity**: Game comparison tools, social sharing
2. **Advanced Content**: Video trailers, news feeds, community guides
3. **Personalization**: Custom notes, viewing history recommendations

### Medium Priority

1. **Community Features**: Discussion forums, user-generated content
2. **Advanced Analytics**: Popularity trending, engagement metrics
3. **Extended Platform Support**: Additional platform integrations beyond Steam

This feature represents an excellent example of comprehensive game information architecture with strong external API integration, type safety, and user experience design.
