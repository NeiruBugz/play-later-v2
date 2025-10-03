# View Libraries Feature - CLAUDE.md

This document provides comprehensive guidance for working with the View Libraries feature module, which enables social discovery of user game libraries.

## Feature Overview

### Purpose

The View Libraries feature implements social discovery functionality, allowing authenticated users to browse and view other users' game libraries. This promotes community engagement, game discovery, and peer-to-peer recommendations within the gaming platform.

### Core Functionality

- **Library Discovery**: Browse preview cards of all public libraries from users with usernames
- **Detailed Library View**: View complete library collections for specific users
- **Privacy Control**: Username-based visibility system (only users with usernames have discoverable libraries)
- **Social Game Discovery**: Discover new games through other users' collections

## Architecture Overview

### Data Flow

```
Next.js App Router → Feature Server Actions → Repository Layer → Prisma → PostgreSQL

/app/backlog/page.tsx → getBacklogs() → getOtherUsersLibraries() → Prisma queries
/app/backlog/[username]/page.tsx → getUsersBacklog() → getLibraryByUsername() → Prisma queries
```

### Directory Structure

```
features/view-backlogs/
├── components/
│   └── backlog-list.tsx           # Main discovery interface component
├── server-actions/
│   ├── get-backlogs.ts            # Fetch all public libraries
│   └── get-users-backlog.ts       # Fetch specific user's library
├── PRD.md                         # Product requirements document
└── clean-code-review.md           # Code quality assessment
```

## Component Architecture

### BacklogList Component (`components/backlog-list.tsx`)

**Primary Component**: Server-side React component for library discovery interface

**Key Features**:

- Fetches and displays all public libraries using `getBacklogs()` server action (line 7)
- Renders responsive grid layout with library preview cards (line 27)
- Shows first 3 game covers in overlapping card design (lines 40-70)
- Displays "+X more" indicator for additional games (lines 71-77)
- Handles empty states with helpful messaging (lines 13-24)

**Visual Design Pattern**:

- Overlapping game covers using absolute positioning and z-index (lines 47-52)
- Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop (line 27)
- Interactive hover states with shadow transitions (line 54)

**Navigation Integration**:

- Links to detailed library views via `/backlog/[username]` routes (lines 30-34)
- Displays username or fallback name as library identifier (line 36-38)

## Server Actions

### getBacklogs (`server-actions/get-backlogs.ts`)

**Purpose**: Fetches all public libraries excluding current user

**Implementation**:

- Uses `authorizedActionClient` for authentication (lines 6-11)
- Requires user authentication (`requiresAuth: true`)
- Calls `getOtherUsersLibraries({ userId })` repository function (line 12)

**Data Structure**: Returns array of `UserWithLibraryItemsResponse` objects

### getUsersBacklog (`server-actions/get-users-backlog.ts`)

**Purpose**: Fetches specific user's complete library by username

**Implementation**:

- Zod schema validation for username parameter (line 13)
- Authentication check with error handling (lines 15-17)
- Calls `getLibraryByUsername({ username })` repository function (line 18)

**Input Validation**:

```typescript
z.object({ username: z.string() });
```

## Repository Layer Integration

### getOtherUsersLibraries (`shared/lib/repository/library/library-repository.ts` lines 184-205)

**Query Strategy**:

- Excludes current user: `userId: { not: userId }` (line 187)
- Filters for public libraries: `User: { username: { not: null } }` (line 188)
- Includes related data: `include: { game: true, User: true }` (line 190)
- Groups results by user ID using reduce function (lines 194-202)

**Privacy Model**: Only users with usernames have discoverable libraries

### getLibraryByUsername (`shared/lib/repository/library/library-repository.ts` lines 207-221)

**Query Strategy**:

- Filters by username: `User: { username: username }` (line 209)
- Selective game data: includes only `id`, `title`, `coverImage` (lines 211-217)
- Chronological ordering: `orderBy: { createdAt: "asc" }` (line 219)

## TypeScript Patterns

### Type Definitions

```typescript
// From shared/lib/repository/library/types.ts
export type UserWithLibraryItemsResponse = {
  user: User;
  libraryItems: (LibraryItem & { game: Game })[];
};
```

### Server Action Patterns

- **Authentication**: All actions use `authorizedActionClient` with `requiresAuth: true`
- **Input Validation**: Zod schemas for runtime type safety
- **Error Handling**: Proper error propagation and user-friendly messages
- **Type Safety**: Full TypeScript coverage with Prisma-generated types

## App Router Integration

### Discovery Page (`/app/backlog/page.tsx`)

**Route**: `/backlog`
**Purpose**: Main library discovery interface

**Key Features**:

- Server-side authentication check with redirect (lines 10-13)
- Suspense boundary for loading states (line 22)
- Responsive typography and layout (lines 18-21)

### User Library Page (`/app/backlog/[username]/page.tsx`)

**Route**: `/backlog/[username]`
**Purpose**: Detailed individual library view

**Implementation**:

- Dynamic route parameter handling (lines 13-16)
- Parallel data fetching: user library and session (lines 14-19)
- Game grid with hover interactions (lines 32-57)
- Status and platform information display (lines 47-54)

## Key Dependencies

### Internal Dependencies

- `@/shared/components/igdb-image`: Game cover image component with IGDB integration
- `@/shared/lib/enum-mappers`: Status and platform display mapping
- `@/shared/lib/string`: String normalization utilities
- `@/shared/lib/repository`: Data access layer
- `@/shared/lib/safe-action-client`: Type-safe server actions

### External Dependencies

- `next/link`: Navigation between discovery and detailed views
- `zod`: Runtime input validation
- `@prisma/client`: Database types and enums

## Data Models

### Core Entities

```typescript
LibraryItem {
  id: number
  status: LibraryItemStatus
  platform: string?
  userId: string
  gameId: string
  createdAt: Date
  completedAt: Date?
}

User {
  id: string
  username: string?  // Controls library visibility
  name: string?
}

Game {
  id: string
  title: string
  coverImage: string?
  igdbId: number
}
```

### Privacy Logic

- **Public Libraries**: Users with `username !== null`
- **Private Libraries**: Users with `username === null` (default)
- **Discovery Exclusion**: Current user's library never appears in discovery

## Testing Strategy

### Current State

- No dedicated test files found in the feature directory
- Integration testing occurs through app router pages

### Recommended Testing Approach

```typescript
// Suggested test structure
features/view-backlogs/
├── __tests__/
│   ├── components/
│   │   └── backlog-list.unit.test.tsx
│   └── server-actions/
│       ├── get-backlogs.integration.test.ts
│       └── get-users-backlog.integration.test.ts
```

### Test Categories

- **Unit Tests**: Component rendering and interaction logic
- **Integration Tests**: Server actions with mocked repositories
- **E2E Tests**: Full discovery flow with authentication

## Key Files and Responsibilities

### Primary Implementation Files

1. **`components/backlog-list.tsx`** (89 lines)

   - Main discovery interface
   - Card-based library previews
   - Responsive grid layout

2. **`server-actions/get-backlogs.ts`** (14 lines)

   - Public library fetching
   - Authentication enforcement
   - Repository integration

3. **`server-actions/get-users-backlog.ts`** (20 lines)
   - Individual library fetching
   - Username validation
   - Error handling

### App Router Pages

4. **`/app/backlog/page.tsx`** (29 lines)

   - Discovery page implementation
   - Authentication guards
   - Layout and typography

5. **`/app/backlog/[username]/page.tsx`** (63 lines)
   - Detailed library view
   - Dynamic routing
   - Game grid display

### Repository Functions

6. **`shared/lib/repository/library/library-repository.ts`**
   - `getOtherUsersLibraries()` (lines 184-205)
   - `getLibraryByUsername()` (lines 207-221)

## Integration Points

### With Other Features

- **Authentication**: Requires authenticated users for all access
- **User Management**: Username setting controls library visibility
- **Game Management**: Displays game metadata and covers
- **IGDB Integration**: Game cover images and metadata
- **Navigation**: Integrated with main app navigation

### External Services

- **IGDB API**: Game cover images and metadata
- **NextAuth.js**: Authentication and session management
- **Prisma ORM**: Database queries and relationships

## Performance Considerations

### Optimization Strategies

- **Selective Data Loading**: Only necessary game fields in detailed views
- **Efficient Grouping**: Client-side user grouping in discovery
- **Image Optimization**: IGDB image sizing and caching
- **Server Components**: No client-side JavaScript for main interfaces

### Current Performance Profile

- **Discovery Load**: ~2 seconds (as per PRD requirements)
- **Detailed View**: ~1.5 seconds (as per PRD requirements)
- **Scalability**: Handles 100+ users efficiently

## Security & Privacy

### Access Control

- Authentication required for all endpoints
- Username-based opt-in visibility system
- Current user exclusion from discovery results

### Data Privacy

- No sensitive user information exposed
- Public backlogs are intentionally discoverable
- Clear privacy model based on username presence

## Development Best Practices

### Code Patterns

- Server-first architecture with React Server Components
- Type-safe server actions with Zod validation
- Separation of concerns: components, actions, repository
- Error boundaries and fallback states

### Naming Conventions

- Kebab-case for file names (`backlog-list.tsx`)
- PascalCase for components (`BacklogList`)
- camelCase for functions (`getBacklogs`, `getUsersBacklog`)
- Descriptive server action names with clear purposes

## Future Enhancement Opportunities

### High Priority

- Search and filtering in discovery interface
- User following and library subscriptions
- Library comparison tools
- Enhanced social interactions

### Medium Priority

- Personalized recommendations
- Genre-based categorization
- Direct library sharing links
- Performance optimizations for large datasets

---

_This documentation reflects the current implementation as of the latest analysis. For implementation details, refer to the specific files mentioned with their line numbers._
