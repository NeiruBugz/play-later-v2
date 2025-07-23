# Dashboard Feature - CLAUDE.md

## Overview

The Dashboard feature serves as the central gaming analytics and overview hub for Play Later users. It provides comprehensive insights into game collections, backlog progress, gaming habits, and upcoming releases through a widget-based architecture. The dashboard combines motivational elements with actionable data to enhance user engagement and gaming management.

### Primary Purpose

- **Gaming Analytics Hub**: Centralized view of user's gaming statistics and progress
- **Motivational Engagement**: Encourage backlog completion through progress visualization
- **Quick Navigation**: Provide easy access to key features and recent activities
- **External Integration**: Display Steam integration status and upcoming game releases

## Architecture Overview

### Data Flow Pattern

```
Next.js App Router (app/page.tsx)
    ↓
Dashboard Components (features/dashboard/components/)
    ↓
Server Actions (features/dashboard/server-actions/)
    ↓
Repository Layer (shared/lib/repository/)
    ↓
Prisma → PostgreSQL
    ↓
External APIs (IGDB, Steam)
```

### Component Architecture

The dashboard follows a **widget-based architecture** where each component is self-contained, async, and handles its own data fetching and error states.

## Component Structure

### Core Widget Components

#### 1. CollectionStats (`components/collection-stats.tsx`)

**Purpose**: Displays overall collection metrics and achievements

- **Data Sources**: BacklogItem counts, Review ratings aggregation
- **Server Actions**:
  - `getBacklogItemsCount()` (lines 18, 19-22)
  - `getAggregatedReviewRatings()` (line 22)
- **Key Features**:
  - Total games count
  - Completion rate percentage with trophy icon
  - Average rating display (only when ratings exist)
- **UI Pattern**: Card layout with icon headers and key-value pairs

#### 2. BacklogCount (`components/backlog-count.tsx`)

**Purpose**: Core backlog management widget with motivational messaging

- **Data Sources**: Backlog items filtered by status and date ranges
- **Server Actions**: Multiple parallel `getBacklogItemsCount()` calls (lines 17-32)
- **Key Features**:
  - Motivational messaging based on backlog size (lines 44-50)
  - Color-coded status indicators (lines 52-67)
  - Progress visualization with completion rates
  - Time-to-completion estimation (lines 132-136)
- **Business Logic**:
  - Motivational messaging system encourages engagement
  - Visual progress indicators drive completion behavior

#### 3. RecentActivity (`components/recent-activity.tsx`)

**Purpose**: Timeline of recent gaming milestones and achievements

- **Data Sources**: Recently completed games and user reviews
- **Server Actions**:
  - `getRecentCompletedBacklogItems()` (line 17)
  - `getRecentReviews()` (line 18)
- **Key Features**:
  - Chronological activity feed with relative timestamps
  - Visual indicators for different activity types
  - Integration with date-fns for human-readable dates

#### 4. CurrentlyPlaying (`components/currently-playing.tsx`)

**Purpose**: Displays active games with Suspense-based loading

- **Pattern**: Container component with lazy-loaded list
- **Architecture**: Uses React Suspense for progressive loading (line 25)
- **Child Component**: `CurrentlyPlayingList` handles actual data fetching

#### 5. PlatformBreakdown (`components/platform-breakdown.tsx`)

**Purpose**: Analytics widget showing platform and acquisition statistics

- **Data Sources**: Platform distribution and acquisition type analysis
- **Server Actions**:
  - `getPlatformBreakdown()` (line 17)
  - `getAcquisitionTypeBreakdown()` (line 18)
- **Features**:
  - Platform statistics with normalized string display
  - Acquisition type percentages
  - Conditional rendering based on data availability

#### 6. UpcomingReleases (`components/upcoming-releases.tsx`)

**Purpose**: IGDB-powered upcoming release calendar

- **Pattern**: Suspense wrapper with dedicated list component
- **Integration**: Connects user wishlist with IGDB release data
- **Child Component**: `ReleasesList` handles IGDB API integration

#### 7. SteamIntegration (`components/steam-integration.tsx`)

**Purpose**: Steam connection status and management

- **Data Source**: `getSteamIntegrationConnectionState()` (line 16)
- **Features**:
  - Connection status with visual indicators
  - Steam profile link when connected
  - Direct navigation to settings for connection setup
- **Integration Points**: Links to user settings and Steam profile

### Skeleton Loading System

**File**: `components/dashboard-skeletons.tsx`

- **Purpose**: Provides consistent loading states for all widgets
- **Pattern**: Matches the exact layout structure of each component
- **Performance**: Appears within 100ms for perceived performance
- **Components**: Individual skeletons for each widget type

## Server Actions Architecture

### Type-Safe Action Pattern

All server actions follow the `authorizedActionClient` pattern with:

- **Authentication**: Requires valid user session
- **Type Safety**: Zod schema validation for inputs
- **Error Handling**: Consistent error response format
- **Metadata**: Action naming and requirement specification

### Key Server Actions

#### `getBacklogItemsCount()` (`server-actions/get-backlog-items-count.ts`)

- **Input Schema**: Optional status filter and date range (lines 14-25)
- **Repository Integration**: Calls `getBacklogCount()` with user context
- **Flexibility**: Supports multiple filter combinations for different use cases

#### `getAggregatedReviewRatings()` (`server-actions/get-aggregated-review-ratings.ts`)

- **Purpose**: Calculates average user ratings across all reviews
- **Repository Call**: `aggregateReviewsRatingsForUser()`
- **Usage**: Powers average rating display in CollectionStats

#### `getRecentCompletedBacklogItems()` (`server-actions/get-recent-completed-backlog-items.ts`)

- **Purpose**: Retrieves recently completed games for activity feed
- **Repository Integration**: Direct pass-through to repository layer
- **Data Flow**: User ID → Repository → Recent completions with game metadata

#### `getPlatformBreakdown()` (`server-actions/get-platform-breakdown.ts`)

- **Purpose**: Platform statistics with data filtering
- **Business Logic**: Filters out null platforms (lines 17-19)
- **Error Handling**: Throws descriptive error on repository failure

## Library Utilities

### Data Transformation Helpers

#### `groupBacklogItemsByGame()` (`lib/group-backlog-items-by-game.ts`)

- **Purpose**: Aggregates multiple backlog items per game into single objects
- **Pattern**: Uses Map for efficient grouping by game ID
- **Type Safety**: Returns strongly typed `GameWithBacklogItems[]`
- **Use Case**: Supports multiple platform ownership of same game

#### `getUpcomingWishlistGamesWithBacklogId()` (`lib/get-upcoming-wishlist-games-with-backlogId.ts`)

- **Purpose**: Connects IGDB release data with user's wishlist items
- **Integration Point**: Bridges external API data with internal game references
- **Type Safety**: Returns enhanced release data with internal game IDs
- **Business Logic**: Enables upcoming releases widget functionality

## TypeScript Patterns

### Core Type Definitions (`types/index.ts`)

```typescript
export type GameWithBacklogItems = {
  game: Pick<Game, "id" | "title" | "igdbId" | "coverImage">;
  backlogItems: Omit<BacklogItem, "game">[];
  totalMainStoryHours?: number;
};
```

**Design Principles**:

- **Selective Field Access**: Uses `Pick` to limit game fields to essential data
- **Relationship Modeling**: Omits circular references in backlog items
- **Optional Enhancement**: Includes optional metadata like completion time
- **Performance Optimization**: Reduces data transfer by selecting minimal fields

## Integration Points

### External API Integrations

#### IGDB Integration

- **Purpose**: Upcoming releases and game metadata
- **Components**: UpcomingReleases, ReleasesList
- **Data Flow**: User wishlist → IGDB API → Release calendar
- **Error Handling**: Graceful degradation when API unavailable

#### Steam Integration

- **Purpose**: Connection status and profile management
- **Components**: SteamIntegration widget
- **Features**: OAuth status, profile links, settings navigation
- **Privacy**: Respects Steam's privacy policies

### Internal Feature Integration

#### Authentication Integration

- **Pattern**: All server actions require authenticated user context
- **Implementation**: `authorizedActionClient` wrapper ensures user session
- **Security**: User data scoped to authenticated user only

#### Repository Layer Integration

- **Pattern**: Server actions directly call repository functions
- **Benefits**: Clean separation of concerns, testable business logic
- **Data Access**: All database operations through repository pattern

## Dashboard Layout Implementation

### Responsive Grid System (`app/page.tsx` lines 196-237)

```typescript
<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
```

**Layout Strategy**:

- **Mobile First**: Single column on mobile devices
- **Progressive Enhancement**: Adds columns as screen size increases
- **Widget Prioritization**: Primary widgets get larger grid spans
- **Adaptive Layout**: Responds to content and screen size

### Widget Prioritization

1. **Primary Widgets**: CurrentlyPlaying, UpcomingReleases (larger spans)
2. **Stats Widgets**: BacklogCount, CollectionStats (single spans)
3. **Additional Widgets**: RecentActivity, PlatformBreakdown, SteamIntegration

## Performance Optimizations

### Parallel Data Fetching

- **Implementation**: All widgets use `Promise.all()` for concurrent API calls
- **Benefits**: Reduces total page load time by fetching data simultaneously
- **Example**: CollectionStats fetches multiple metrics in parallel (lines 16-23)

### Skeleton Loading Strategy

- **Pattern**: Immediate skeleton display while data loads
- **Implementation**: React Suspense with dedicated skeleton components
- **User Experience**: Provides visual feedback within 100ms

### Caching Considerations

- **Server Actions**: Leverage Next.js built-in caching
- **Data Freshness**: Real-time updates based on user actions
- **Cache Invalidation**: Automatic invalidation on data mutations

## Error Handling Patterns

### Graceful Degradation

- **Philosophy**: Partial failures don't break entire dashboard
- **Implementation**: Each widget handles its own error states
- **User Experience**: Failed widgets show fallback content or hide gracefully

### Data Validation

- **Input Validation**: Zod schemas in server actions ensure type safety
- **Runtime Safety**: Optional chaining and null checks throughout components
- **Error Boundaries**: Component-level error isolation

## Testing Strategy

### Current State

- **Coverage**: No test files currently exist for dashboard feature
- **Architecture Support**: Clean separation enables easy testing

### Recommended Testing Approach

1. **Unit Tests**: Server actions with mocked repositories
2. **Component Tests**: Widget rendering with mocked data
3. **Integration Tests**: IGDB API integration and data transformation
4. **E2E Tests**: Critical user flows and widget interactions

### Testing Utilities Needed

- Mock factories for dashboard data types
- Server action test helpers
- Component rendering utilities for async widgets

## Development Guidelines

### Adding New Widgets

1. Create component in `components/` directory
2. Add corresponding skeleton in `dashboard-skeletons.tsx`
3. Create server actions in `server-actions/` if needed
4. Export component from `components/index.ts`
5. Add to dashboard layout in `app/page.tsx`
6. Follow existing patterns for error handling and loading states

### Data Flow Best Practices

- Server actions should be thin wrappers around repository calls
- Components should handle their own loading and error states
- Use parallel data fetching for multiple data sources
- Implement proper TypeScript types for all data transformations

### Performance Considerations

- Keep widgets focused on single responsibilities
- Use Suspense boundaries for progressive loading
- Implement proper skeleton loading states
- Consider caching strategies for expensive operations

## Future Enhancement Opportunities

### High Priority

1. **Comprehensive Testing**: Add unit, integration, and E2E test coverage
2. **Error Monitoring**: Implement logging and error tracking
3. **Performance Monitoring**: Add metrics for load times and user engagement

### Medium Priority

1. **User Customization**: Configurable widget layout and preferences
2. **Enhanced Analytics**: Gaming time tracking and goal setting
3. **Advanced Filtering**: Customizable time ranges and data views

### Low Priority

1. **Social Features**: Friends activity and comparisons
2. **Export Functionality**: Data export for personal analytics
3. **Gamification**: Achievement system and progress badges

## Key Files Reference

### Components

- `/features/dashboard/components/index.ts` - Component exports
- `/features/dashboard/components/collection-stats.tsx` - Collection overview widget
- `/features/dashboard/components/backlog-count.tsx` - Core backlog management with motivation
- `/features/dashboard/components/recent-activity.tsx` - Activity timeline
- `/features/dashboard/components/dashboard-skeletons.tsx` - Loading state components

### Server Actions

- `/features/dashboard/server-actions/get-backlog-items-count.ts` - Flexible backlog counting
- `/features/dashboard/server-actions/get-aggregated-review-ratings.ts` - Rating statistics
- `/features/dashboard/server-actions/get-platform-breakdown.ts` - Platform analytics

### Utilities

- `/features/dashboard/lib/group-backlog-items-by-game.ts` - Data aggregation helper
- `/features/dashboard/types/index.ts` - TypeScript type definitions

### Integration

- `/app/page.tsx` (lines 184-239) - Dashboard layout and widget composition

---

_This documentation reflects the current implementation as of the repository's refactor to the repository pattern. The dashboard feature demonstrates excellent architectural patterns and is well-positioned for future enhancements._
