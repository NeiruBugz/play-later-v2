# CLAUDE.md - Manage Integrations Feature

This file provides guidance to Claude Code (claude.ai/code) when working with the manage-integrations feature module in this repository.

## Feature Overview

The **manage-integrations** feature provides users with a centralized interface to connect and manage external gaming platform accounts (currently Steam, with Xbox and PlayStation planned). It enables users to import their game libraries, synchronize their collections, and manage platform connections through a unified settings interface.

### Key Capabilities

- **Platform Connection Management**: Connect/disconnect gaming platform accounts
- **Steam Integration**: Full Steam account integration with OAuth authentication
- **Library Synchronization**: Import games from connected platforms into PlayLater
- **Profile Management**: View and access connected platform profiles
- **Extensible Architecture**: Ready for additional platforms (Xbox, PlayStation)

### Business Value

- Reduces friction in user onboarding through automated library import
- Increases user engagement by leveraging existing game collections
- Creates competitive advantage through comprehensive platform integration support

## Architecture & Component Structure

### Directory Structure

```
features/manage-integrations/
├── components/
│   ├── integrations-list.tsx       # Server component - main list container
│   └── service-integration.tsx     # Client component - individual platform card
├── server-actions/
│   ├── get-steam-user-data.ts      # Fetch connected Steam account data
│   └── remove-steam-data-from-user.ts # Disconnect Steam account
├── lib/
│   └── services-for-integration.tsx # Platform configuration definitions
├── index.ts                        # Feature exports
└── PRD.md                         # Product requirements document
```

### Component Hierarchy & Responsibilities

#### IntegrationsList (Server Component)

- **File**: `/components/integrations-list.tsx` (Lines 8-52)
- **Purpose**: Main container that fetches user data and renders platform integration cards
- **Data Flow**: Fetches Steam user data → Maps platform configurations → Renders ServiceIntegration cards
- **Key Functions**:
  - `getSteamUserData()` - Fetches connected Steam account information (Line 9)
  - `handleSteamDisconnect()` - Server action for disconnecting Steam (Lines 11-16)
- **Rendering Logic**: Maps through `servicesForIntegration` array and determines connection status for each platform (Lines 26-49)

#### ServiceIntegration (Client Component)

- **File**: `/components/service-integration.tsx` (Lines 24-172)
- **Purpose**: Interactive card component for individual platform integrations
- **State Management**: Local state for sync operations (`isSyncing` - Line 35)
- **Key Functions**:
  - `handleConnect()` - Initiates OAuth flow for platform connection (Lines 37-45)
  - `handleDisconnect()` - Removes platform connection (Lines 47-51)
  - `handleSyncLibraries()` - Imports games from connected platform (Lines 59-105)
  - `handleViewProfile()` - Opens platform profile in new tab (Lines 53-57)

### Platform Configuration System

#### Services Configuration

- **File**: `/lib/services-for-integration.tsx` (Lines 3-25)
- **Data Structure**: Array of platform service definitions
- **Platform Schema**:
  ```typescript
  {
    id: string,           // Platform identifier ("steam", "xbox", "playstation")
    name: string,         // Display name
    description: string,  // User-facing description
    icon: ReactNode,      // Platform icon component
    isDisabled: boolean   // Feature availability flag
  }
  ```

#### Current Platform Support

- **Steam**: Fully implemented (Line 4-10)
- **Xbox**: Planned - disabled (Lines 11-17)
- **PlayStation**: Planned - disabled (Lines 18-24)

## Data Flow Architecture

### Client → Server Actions → Repository → Database

```
User Interface (ServiceIntegration)
    ↓ User Actions (Connect/Sync/Disconnect)
Server Actions (/server-actions/*)
    ↓ Type-safe operations with auth
Repository Layer (/shared/lib/repository/user/)
    ↓ Database operations
PostgreSQL (User table with Steam fields)
```

### Detailed Data Flow Patterns

#### 1. Steam Connection Flow

```
User clicks "Connect" →
  Redirect to /api/steam/connect (OAuth) →
  Steam authentication →
  User data stored in database →
  UI updates with connected state
```

#### 2. Library Sync Flow

```
User clicks "Sync Libraries" →
  getUserOwnedGames() (steam-integration feature) →
  Steam Web API call →
  saveSteamGames() →
  createManyImportedGames() repository →
  Success toast notification
```

#### 3. Disconnect Flow

```
User clicks "Disconnect" →
  removeSteamDataFromUser() server action →
  disconnectSteam() repository →
  Clear Steam fields in User table →
  revalidatePath() → UI refresh
```

## TypeScript Patterns & Type Definitions

### Component Props Interface

```typescript
// ServiceIntegration component props (Lines 12-22)
type ServiceIntegrationProps = {
  id: string; // Platform identifier
  name: string; // Display name
  icon: ReactNode; // Platform icon
  isDisabled: boolean; // Availability status
  description: string; // User description
  isConnected?: boolean; // Connection status
  connectedUsername?: string; // Connected account username
  profileUrl?: string; // Platform profile URL
  onDisconnect?: () => Promise<void>; // Disconnect handler
};
```

### Server Action Patterns

- **Authentication Required**: All server actions use `authorizedActionClient` with `requiresAuth: true`
- **Type Safety**: Input/output validation with Zod schemas from steam-integration feature
- **Error Handling**: Consistent error patterns with toast notifications

### Steam Integration Types

- **Import Schema**: Uses `SteamGameSchema` and `SaveManySteamGamesInput` from `/features/steam-integration/types/type.ts` (Lines 70-82)
- **Database Schema**: Steam user fields in User table (steamId64, steamUsername, steamProfileURL, etc.)

## Key Files & Responsibilities

### Core Components

1. **`/components/integrations-list.tsx`**

   - Server component for data fetching and SSR
   - Handles Steam user data retrieval
   - Manages server action for disconnection
   - Maps platform configurations to ServiceIntegration components

2. **`/components/service-integration.tsx`**
   - Client component for interactive functionality
   - Manages loading states and user feedback
   - Handles OAuth redirects and API calls
   - Implements platform-specific logic (currently Steam-focused)

### Configuration & Data Access

3. **`/lib/services-for-integration.tsx`**

   - Central platform configuration
   - Icon definitions using react-icons
   - Platform availability flags
   - Extensible for future platforms

4. **`/server-actions/get-steam-user-data.ts`**

   - Fetches connected Steam account information
   - Uses `getUserSteamData` repository function
   - Returns user's Steam ID, username, profile URL, connection timestamp

5. **`/server-actions/remove-steam-data-from-user.ts`**
   - Removes Steam connection from user account
   - Uses `disconnectSteam` repository function
   - Clears all Steam-related user fields

### External Dependencies

6. **Steam Integration Feature** (`/features/steam-integration/`)

   - `getUserOwnedGames` - Steam Web API integration
   - `saveSteamGames` - Imported games storage
   - Type definitions for Steam data structures

7. **Repository Layer** (`/shared/lib/repository/user/`)
   - `getUserSteamData` - Database query for Steam user data
   - `disconnectSteam` - Database update to clear Steam fields

## Integration Points with Other Features

### Primary Dependencies

- **Steam Integration Feature**: Core Steam API functionality and game import logic
- **Repository Layer**: User data management and Steam connection persistence
- **Safe Action Client**: Type-safe server actions with authentication
- **UI Components**: shadcn/ui components for consistent design

### App Integration

- **Settings Page**: Rendered in `/app/user/settings/page.tsx` as "Integrations" tab (Lines 50-52, 57-58)
- **Authentication**: Requires user authentication for all operations
- **Navigation**: Integrated into user settings alongside profile management

### Cross-Feature Communication

- **Steam Data Flow**: manage-integrations → steam-integration → imported games → collections
- **User Profile**: Steam connection data stored in User table affects profile display
- **Game Import**: Synced games become available in other features (backlogs, collections)

## Testing Strategy

### Current State

- **No Unit Tests**: No test files found in the feature directory
- **Integration Testing**: Feature relies on repository layer tests
- **Manual Testing**: OAuth flows and external API calls require manual verification

### Recommended Test Coverage

#### Unit Tests

```typescript
// Recommended test files
components/__tests__/service-integration.unit.test.tsx
server-actions/__tests__/get-steam-user-data.unit.test.ts
server-actions/__tests__/remove-steam-data-from-user.unit.test.ts
lib/__tests__/services-for-integration.unit.test.ts
```

#### Test Scenarios

1. **Component Rendering**

   - ServiceIntegration states (connected/disconnected/disabled)
   - Loading states during sync operations
   - Error handling and toast notifications

2. **Server Actions**

   - Authenticated user data retrieval
   - Steam disconnection with database updates
   - Error handling for missing users

3. **Integration Flows**
   - Complete Steam connection workflow
   - Library sync with various game library sizes
   - Platform disconnection and data cleanup

## Development Guidelines

### Adding New Platforms

#### 1. Platform Configuration

Add new platform to `/lib/services-for-integration.tsx`:

```typescript
{
  id: "xbox",
  name: "Xbox",
  description: "Connect your Xbox account to get your game collection",
  icon: <FaXbox className="text-2xl" />,
  isDisabled: false, // Enable when ready
}
```

#### 2. Database Schema Updates

Add platform fields to User table:

```sql
ALTER TABLE "User" ADD COLUMN "xboxId" TEXT;
ALTER TABLE "User" ADD COLUMN "xboxUsername" TEXT;
ALTER TABLE "User" ADD COLUMN "xboxProfileUrl" TEXT;
```

#### 3. Server Actions

Create platform-specific server actions:

- `get-xbox-user-data.ts`
- `remove-xbox-data-from-user.ts`

#### 4. Repository Functions

Add repository functions for new platform:

- `getUserXboxData()`
- `disconnectXbox()`

#### 5. Component Updates

Update `ServiceIntegration` component to handle new platform logic in:

- `handleConnect()` method (Lines 37-45)
- Platform-specific sync logic (Lines 59-105)
- Connection status determination in `IntegrationsList`

### Error Handling Patterns

- **Toast Notifications**: Use `toast.error()` and `toast.success()` for user feedback
- **Loading States**: Manage `isSyncing` state for async operations
- **Server Errors**: Handle `serverError` from server actions consistently
- **Validation Errors**: Display validation feedback for user input

### Performance Considerations

- **Server Components**: Use for data fetching to reduce client bundle
- **Client Components**: Only for interactive functionality
- **Revalidation**: Use `revalidatePath()` after data mutations
- **Error Boundaries**: Consider error boundaries for OAuth flow failures

## Security & Privacy Notes

### Authentication & Authorization

- All server actions require user authentication (`authorizedActionClient`)
- Platform connections are scoped to individual users
- No shared platform data between users

### Data Privacy

- Platform credentials never stored locally
- OAuth tokens handled by platform-specific integrations
- Users maintain full control over platform connections
- Disconnection removes all platform-related data

### API Security

- Steam integration uses secure OpenID 2.0 authentication
- API rate limiting handled gracefully in dependent features
- External API calls are server-side only for security

---

## Quick Reference Commands

### Development Commands

```bash
# Run the application
bun dev

# Type checking
bun typecheck

# Code quality
bun code-check
bun code-fix

# Testing (when tests are added)
bun run test features/manage-integrations
```

### Related Features to Explore

- `/features/steam-integration/` - Steam API integration and game import
- `/features/view-imported-games/` - Display imported games from platforms
- `/features/manage-user-info/` - User profile management
- `/shared/lib/repository/user/` - User data persistence layer
