# View Imported Games Feature - CLAUDE.md

This feature manages the workflow for importing games from external platforms (primarily Steam) into the user's main collection, providing comprehensive game review, enrichment, and selective import capabilities.

## Feature Overview

### Purpose

The View Imported Games feature serves as an intermediary layer between external platform integrations (Steam) and the user's main game collection. It allows users to review, enrich, filter, and selectively import games from their external libraries.

### Core Functionality

- **Game Queue Management**: Display and manage imported games from external platforms
- **Advanced Filtering**: Search, filter, and sort through imported game libraries
- **IGDB Enrichment**: Enhance Steam game data with comprehensive metadata from IGDB
- **Selective Import**: Choose specific games to add to the main PlayLater collection
- **Batch Operations**: Efficiently handle multiple games with optimistic updates
- **Progress Tracking**: Real-time status updates for import and enrichment processes

### User Journey

```
Steam Integration → Imported Games Queue → Search/Filter → Select Games →
Enrich with IGDB → Review Enhanced Data → Import to Collection → Management Complete
```

## Architecture & Component Structure

### Component Hierarchy

```
ImportedGames (Main Container)
├── ImportedGamesFilters (Search & Filtering Interface)
│   ├── Search input with debouncing
│   ├── Platform filter dropdown
│   ├── Sort by/order controls
│   └── Active filters display
└── ImportedGameCard[] (Individual Game Display)
    ├── Game image with fallback
    ├── Platform and playtime badges
    ├── Import action button
    └── Status indicators
```

### Key Components

#### `ImportedGames` (`/components/imported-games.tsx`, lines 101-357)

**Purpose**: Main container component managing the complete imported games experience

**Key Features**:

- Advanced state management with optimistic updates (lines 124-127)
- Debounced search with 300ms delay (line 129)
- Real-time URL synchronization (lines 133-149)
- Comprehensive pagination with smart page button calculation (lines 318-342)
- Dual loading states for search vs. full page operations (lines 121-122)

**State Management**:

- `games`: Current game list with optimistic updates for removal
- `filters`: Search term, storefront filter, sorting options
- `currentPage`: Pagination state synchronized with URL
- `isPending`/`isSearchPending`: Separate loading states for better UX

**Performance Optimizations**:

- Debounced search to prevent excessive server requests
- Optimistic updates for immediate UI feedback during imports
- Separate transitions for search vs. navigation operations
- Smart pagination that shows contextual page numbers

#### `ImportedGamesFilters` (`/components/imported-games-filters.tsx`, lines 51-231)

**Purpose**: Comprehensive filtering interface with collapsible advanced options

**Features**:

- Real-time search with clear button (lines 101-119)
- Platform filtering with "All Platforms" option (lines 158-176)
- Sortable by name, playtime, platform, or date added (lines 178-212)
- Active filter indicators with count badge (lines 141-151)
- Results count display showing filtered vs. total games (lines 123-131)

#### `ImportedGameCard` (`/components/imported-game-card.tsx`, lines 65-193)

**Purpose**: Individual game display with import functionality

**Features**:

- Dynamic image handling with Steam URL generation (lines 52-63)
- Platform-specific styling and icons (lines 34-50)
- Import button with loading states and success feedback (lines 166-189)
- Playtime display converted to hours (lines 134-141)
- Visual import confirmation overlay (lines 142-149)

**Integration Points**:

- Uses `importToApplication` server action for adding games to collection
- Optimistic removal from list on successful import
- Toast notifications for success/error feedback

## Data Flow Architecture

### Server Actions Flow

#### `getImportedGames` (`/server-actions/get-imported-games.ts`)

```typescript
Client Request → Input Validation → Repository Query → Filtered Results
```

**Functionality**:

- Validates search parameters using Zod schema (lines 17-28)
- Builds dynamic where clause for filtering (lines 35-45)
- Supports sorting by multiple fields with configurable order (lines 48-61)
- Returns paginated results with total count

**Repository Integration**:

- `getFilteredImportedGames()`: Paginated game retrieval
- `getFilteredImportedGamesCount()`: Total count for pagination

#### `importToApplication` (`/server-actions/import-to-application.ts`)

```typescript
Steam App ID → IGDB Enrichment → Game Creation → Backlog Addition → Cleanup
```

**Process Flow** (lines 19-60):

1. **IGDB Lookup**: Fetch game metadata using Steam App ID
2. **Game Creation**: Use `saveGameAndAddToBacklog` from add-game feature
3. **Backlog Entry**: Create backlog item with appropriate status (PLAYED if playtime > 0)
4. **Cleanup**: Soft delete from imported games table
5. **Cache Invalidation**: Revalidate both imported games and collection

**Error Handling**: Comprehensive error catching with user-friendly messages

#### `enrichWithIGDBData` (`/server-actions/enrich-with-igdb-data.ts`)

```typescript
Steam App ID → IGDB API Query → Game Metadata → Response
```

**Purpose**: Standalone enrichment for preview without import commitment

### Repository Layer Integration

#### Data Access Patterns (`/shared/lib/repository/imported-game/`)

- **Soft Deletion**: Uses `deletedAt` field instead of hard deletes (line 11-14)
- **Efficient Filtering**: Optimized queries with proper indexing support
- **Batch Operations**: Support for bulk game creation from Steam imports

#### Database Schema Integration

```typescript
ImportedGame {
  id: string
  name: string
  storefront: Storefront (STEAM, PLAYSTATION, XBOX)
  storefrontGameId: string
  playtime: number (in minutes)
  img_icon_url: string
  img_logo_url: string
  userId: string
  createdAt: DateTime
  deletedAt: DateTime? (for soft deletion)
}
```

## TypeScript Patterns & Validation

### Type Safety Architecture

- **Strict Interface Definitions**: All components use explicit prop interfaces
- **Prisma Type Integration**: Leverages generated Prisma types for data consistency
- **Zod Validation**: Runtime validation for all server action inputs

### Key Types & Schemas

#### Search Parameters (`/validation/search-params-schema.ts`)

```typescript
SearchParamsSchema = {
  page: number (min: 1, default: 1)
  limit: number (min: 1, max: 100, default: 20)
  search: string (optional)
  storefront: Storefront enum (optional)
  sortBy: "name" | "playtime" | "storefront" | "createdAt"
  sortOrder: "asc" | "desc"
}
```

#### Action Schemas

- **Import Schema**: Steam App ID with optional playtime
- **Enrichment Schema**: Steam App ID for IGDB lookup

### State Management Types

```typescript
OptimisticAction =
  | { type: "REMOVE_GAME"; gameId: string }
  | { type: "RESET" }

ImportedGamesFilters = {
  search: string
  storefront: Storefront | "ALL"
  sortBy: "name" | "playtime" | "storefront" | "createdAt"
  sortOrder: "asc" | "desc"
}
```

## Key Files & Responsibilities

### Components

- **`components/imported-games.tsx`** (357 lines): Main container with complex state management
- **`components/imported-games-filters.tsx`** (231 lines): Advanced filtering interface
- **`components/imported-game-card.tsx`** (195 lines): Individual game display and import

### Server Actions

- **`server-actions/get-imported-games.ts`** (76 lines): Paginated game retrieval with filtering
- **`server-actions/import-to-application.ts`** (61 lines): Core import workflow with IGDB enrichment
- **`server-actions/enrich-with-igdb-data.ts`** (22 lines): Standalone IGDB metadata enrichment

### Validation

- **`validation/search-params-schema.ts`** (28 lines): URL search parameter validation
- **`validation/import-to-application.schema.ts`** (7 lines): Import action validation
- **`validation/enrich-with-igdb.schema.ts`** (6 lines): Enrichment action validation

### Integration

- **`index.ts`** (4 lines): Feature exports for external consumption
- **`/app/collection/(list-views)/imported/page.tsx`** (84 lines): Next.js page integration

## Testing Strategy

### Current State

⚠️ **No tests currently implemented** - This represents a significant gap in the feature's maturity.

### Recommended Testing Approach

#### Unit Tests

```typescript
// Component Testing
describe("ImportedGameCard", () => {
  it("should display game information correctly");
  it("should handle import action with loading states");
  it("should show platform-specific styling");
});

describe("ImportedGamesFilters", () => {
  it("should debounce search input");
  it("should maintain filter state in URL");
  it("should clear all filters correctly");
});

// Server Action Testing
describe("importToApplication", () => {
  it("should enrich game data via IGDB");
  it("should create backlog entry with correct status");
  it("should soft delete imported game on success");
});
```

#### Integration Tests

```typescript
describe("Import Workflow Integration", () => {
  it("should complete full import flow from Steam to collection");
  it("should handle IGDB enrichment failures gracefully");
  it("should maintain data consistency during imports");
});
```

## Integration Points

### External Dependencies

- **Steam Web API**: Source of imported game data
- **IGDB API**: Game metadata enrichment via `@/shared/lib/igdb`
- **Prisma ORM**: Database operations via repository layer
- **NextAuth.js**: User authentication for authorized actions

### Internal Feature Dependencies

- **Add Game Feature**: `saveGameAndAddToBacklog` for creating collection entries
- **Repository Layer**: All data access operations
- **UI Components**: shadcn/ui component library for consistent interface
- **Revalidation Service**: Cache invalidation for data consistency

### Route Integration

- **Page Route**: `/collection/imported` - Main imported games interface
- **API Routes**: Server actions handle all data operations
- **URL State**: Search parameters synchronized with browser history

## Performance Considerations

### Optimization Strategies

- **Debounced Search**: 300ms delay prevents excessive server requests
- **Optimistic Updates**: Immediate UI feedback during import operations
- **Pagination**: Configurable page sizes (default 20, max 100)
- **Selective Loading**: Separate loading states for search vs. navigation
- **Image Optimization**: Next.js Image component with Steam CDN URLs

### Scalability Features

- **Efficient Queries**: Repository layer optimized for large datasets
- **Soft Deletion**: Maintains referential integrity while supporting "undo" workflows
- **Batch Operations**: Framework supports bulk import operations
- **Progressive Enhancement**: Graceful degradation for failed operations

## Development Guidelines

### Adding New Features

1. **New Filters**: Add to `ImportedGamesFilters` interface and validation schema
2. **Import Sources**: Extend storefront enum and add platform-specific handling
3. **Enrichment Sources**: Create new server actions following existing patterns

### Code Quality Notes

Based on clean code review, key improvement areas:

- **Component Size**: Main `ImportedGames` component is 357 lines (recommended: break into smaller components)
- **Single Responsibility**: Extract filtering, pagination, and search logic into custom hooks
- **Magic Numbers**: Move hard-coded values to configuration constants

### Error Handling Patterns

- **Server Actions**: All actions include comprehensive error handling
- **UI Feedback**: Toast notifications for user-facing operations
- **Graceful Degradation**: Fallback states for failed image loads and API errors
- **Validation**: Runtime validation prevents invalid state transitions

---

_This documentation reflects the current implementation as of the repository state. For the most up-to-date information, refer to the actual source files and recent commit history._
