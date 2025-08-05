# Steam Integration Feature - CLAUDE.md

## Feature Overview

The Steam Integration feature provides comprehensive Steam platform integration, enabling users to authenticate with Steam, import their game libraries, and view detailed achievement data with global statistics. This feature serves as a critical user acquisition and engagement driver, leveraging Steam's massive user base to reduce onboarding friction.

### Core Functionality

- **Steam Authentication**: Secure OAuth flow using Steam OpenID 2.0
- **Game Library Import**: Automatic import of user's Steam games with playtime data
- **Achievement Tracking**: Rich achievement data with rarity analysis and global completion statistics
- **Data Enrichment**: Integration with IGDB for comprehensive game metadata

### Business Impact

- Targets Steam's 1.3+ billion user base for user acquisition
- Reduces initial collection setup friction through automatic library import
- Increases engagement through achievement tracking and progression
- Creates competitive advantage through deep Steam API integration

## Architecture Overview

### Data Flow Pattern

```
Steam API → Server Actions → Repository Layer → Prisma → PostgreSQL
     ↓
Achievement Processing → Data Enrichment → React Components → User Interface
```

### Directory Structure

```
features/steam-integration/
├── api/
│   └── callback-handler.ts         # Steam OAuth callback processing
├── lib/
│   ├── enrich-achievements.ts      # Achievement data enrichment logic
│   ├── map-achievements.ts         # Achievement data transformation utilities
│   ├── steam-auth.ts              # Steam OpenID authentication setup
│   └── steam-web-api.ts           # Steam Web API client implementation
├── server-actions/
│   ├── get-achievements.ts         # Fetch and process user achievements
│   ├── get-steam-id-for-user.ts   # Steam username to ID conversion
│   ├── get-user-owned-games.ts    # Import user's Steam game library
│   └── save-steam-games.ts        # Persist imported games to database
├── types/
│   └── type.ts                    # TypeScript definitions for Steam data
└── index.ts                       # Feature public API exports
```

## Component Architecture

### Server Actions Layer (`server-actions/`)

#### `get-user-owned-games.ts` (Lines 1-41)

**Purpose**: Fetches and transforms user's Steam game library
**Key Features**:

- Validates Steam username input using Zod schema (Lines 14-18)
- Converts Steam username to Steam ID via `getSteamIdForUser` (Lines 20-22)
- Fetches owned games from Steam Web API (Lines 28-29)
- Transforms Steam API response to domain format (Lines 31-37)

**Data Flow**:

```typescript
steamUsername → getSteamIdForUser() → SteamWebAPI.getUserOwnedGames() → domain mapping
```

#### `get-achievements.ts` (Lines 1-75)

**Purpose**: Comprehensive achievement data processing with global statistics
**Key Features**:

- Parallel API calls for user achievements, game schema, and global stats (Lines 32-36)
- Achievement validation and error handling (Lines 38-44)
- Data enrichment with rarity calculations (Lines 46-54)
- Achievement statistics computation (Lines 56-71)

**Advanced Processing**:

- Enriches achievements with display names, descriptions, and icons
- Calculates rarity based on global completion percentages
- Provides completion statistics and progress tracking

#### `save-steam-games.ts` (Lines 1-38)

**Purpose**: Persists imported Steam games to database
**Implementation**:

- Maps Steam game data to internal `ImportedGame` format (Lines 17-25)
- Uses repository pattern for database operations (Lines 28-30)
- Comprehensive error handling with logging (Lines 33-36)

#### `get-steam-id-for-user.ts` (Lines 1-23)

**Purpose**: Steam username to Steam ID resolution
**Simple but critical**: Bridges user-friendly usernames to Steam's internal ID system

### Core Libraries (`lib/`)

#### `steam-web-api.ts` (Lines 1-87)

**Class**: `SteamWebAPI` - Comprehensive Steam Web API client
**Key Methods**:

- `getGameAchievementSchema()`: Fetches achievement metadata (Lines 19-33)
- `getUserAchievements()`: Gets user's achievement progress (Lines 35-51)
- `getGlobalAchievementPercentages()`: Global completion statistics (Lines 53-67)
- `getUserOwnedGames()`: User's game library with playtime (Lines 69-83)

**Design Patterns**:

- Singleton pattern with exported instance (Line 86)
- Consistent error handling across all methods
- Environment-based API key management (Lines 16-18)

#### `steam-auth.ts` (Lines 1-9)

**Purpose**: Steam OpenID authentication configuration
**Implementation**: Uses `node-steam-openid` for secure OAuth flow
**Configuration**: Environment-based realm and callback URL setup

#### `enrich-achievements.ts` (Lines 1-34)

**Purpose**: Achievement data enrichment with rarity analysis
**Key Features**:

- Rarity calculation based on global completion percentages (Lines 16-21):
  - Very Rare: < 5% completion
  - Rare: 5-15% completion
  - Uncommon: 15-50% completion
  - Common: > 50% completion
- Schema data integration for display information (Lines 24-32)

#### `map-achievements.ts` (Lines 1-41)

**Purpose**: Data transformation utilities for achievement processing
**Key Functions**:

- `mapAchievementsSchema()`: Creates efficient Map for schema lookups (Lines 18-25)
- `mapGlobalAchievements()`: Transforms global statistics for efficient access (Lines 27-40)

### API Integration (`api/`)

#### `callback-handler.ts` (Lines 1-51)

**Purpose**: Handles Steam OAuth callback and user data persistence
**Security Features**:

- Session validation before processing (Lines 14-18)
- Duplicate Steam account connection prevention (Lines 21-30)
- Comprehensive error handling with user-friendly redirects (Lines 42-47)

**Flow**:

1. Authenticate Steam user via OpenID (Line 11)
2. Validate active application session (Lines 12-18)
3. Check for existing Steam connections (Lines 21-30)
4. Update user with Steam data (Lines 32-37)
5. Redirect with success/error status (Lines 39-47)

## TypeScript Patterns and Type Definitions

### Core Types (`types/type.ts`)

#### Steam API Response Types (Lines 3-58)

```typescript
interface SteamAchievement        # User achievement progress
interface SteamAchievementSchema  # Achievement metadata from Steam
interface SteamPlayerAchievements # Complete user achievement response
interface SteamGameSchema         # Game achievement schema
interface SteamUserOwnedGames     # User's game library response
interface SteamGame               # Individual game data
```

#### Enriched Data Types (Lines 60-68)

```typescript
interface EnrichedAchievement extends SteamAchievement {
  displayName: string;
  description: string;
  icon: string;
  icongray: string;
  hidden: boolean;
  globalPercent?: number;
  rarity: "common" | "uncommon" | "rare" | "very_rare";
}
```

#### Validation Schemas (Lines 70-83)

- Zod schemas for runtime validation
- Type inference for compile-time safety
- Input validation for server actions

### Advanced TypeScript Patterns

- **Interface Extension**: `EnrichedAchievement` extends base Steam types
- **Union Types**: Precise rarity classification system
- **Optional Properties**: Flexible data structures for varying API responses
- **Type Inference**: Zod integration for runtime/compile-time type safety

## Key Dependencies and Integrations

### External Dependencies

- **`node-steam-openid`**: Steam OAuth authentication
- **Steam Web API**: Game library and achievement data
- **Zod**: Runtime validation and type safety

### Internal Integrations

- **Repository Layer**: `shared/lib/repository/user/` and `shared/lib/repository/imported-game/`
- **Authentication**: NextAuth.js session management
- **Database**: Prisma ORM with PostgreSQL
- **Environment**: Centralized environment configuration

### Repository Integration Points

- `getUserSteamData()`: Retrieves user's Steam connection data
- `getUserSteamId()`: Steam username to ID resolution
- `getUserBySteamId()`: Prevents duplicate Steam connections
- `updateUserSteamData()`: Persists Steam authentication data
- `createManyImportedGames()`: Bulk game import functionality

## Testing Strategy

### Current State

- **No dedicated test files present** - represents technical debt
- Integration testing handled at application level
- Manual testing through Steam API sandbox

### Recommended Testing Approach

Based on the architecture, comprehensive testing should include:

#### Unit Testing

- **Steam Web API Client**: Mock HTTP responses for each endpoint
- **Achievement Enrichment**: Test rarity calculations and data transformation
- **Data Mapping**: Verify achievement schema and global statistics mapping
- **Validation Schemas**: Test Zod schema validation with edge cases

#### Integration Testing

- **Steam Authentication Flow**: End-to-end OAuth testing
- **API Integration**: Live Steam API testing with sandbox accounts
- **Database Operations**: Repository layer integration with test database
- **Error Handling**: Steam API failure scenarios and recovery

#### Recommended Test Files

```
features/steam-integration/
├── __tests__/
│   ├── steam-web-api.unit.test.ts
│   ├── enrich-achievements.unit.test.ts
│   ├── steam-auth-flow.integration.test.ts
│   └── achievement-processing.integration.test.ts
```

## Integration Points with Other Features

### Primary Integrations

- **User Management**: Steam profile data storage and authentication
- **Game Collection**: Imported games integration with user's backlog
- **Game Details**: Achievement display in game detail views
- **Profile Settings**: Steam connection management interface

### Data Dependencies

- **User Repository**: Steam authentication and profile data
- **Imported Game Repository**: Bulk game import and storage
- **Game Repository**: IGDB integration for game metadata enrichment

### API Boundaries

- **Public Exports** (`index.ts`): Clean feature interface for external consumption
- **Server Actions**: Type-safe business logic layer
- **Repository Layer**: Abstracted data access

## Performance Considerations

### API Optimization

- **Parallel API Calls**: Achievement data fetching uses `Promise.all()` (Lines 32-36 in `get-achievements.ts`)
- **Efficient Data Structures**: Map-based lookups for achievement processing
- **Bulk Operations**: Batch game imports to minimize database overhead

### Caching Strategy

- Achievement schema and global statistics are prime candidates for caching
- Steam game library data should be cached with TTL
- User Steam profile data persisted to reduce API calls

### Error Handling

- Graceful degradation when Steam API is unavailable
- Comprehensive error logging for debugging
- User-friendly error messages with actionable recovery steps

## Security Considerations

### Authentication Security

- **Secure OAuth Flow**: Uses established Steam OpenID 2.0 protocol
- **Session Validation**: Prevents unauthorized Steam connections
- **API Key Protection**: Environment-based Steam API key management

### Data Privacy

- **User Data Isolation**: Steam data scoped to individual users
- **Minimal Data Collection**: Only necessary Steam profile information
- **Secure Storage**: Steam credentials and profile data encrypted at rest

### API Security

- **Rate Limiting**: Respects Steam API rate limits
- **Input Validation**: Comprehensive Zod schema validation
- **Error Information Disclosure**: Generic error messages to prevent information leakage

## Development Guidelines

### Code Standards

- **Functional Programming**: Emphasis on pure functions and data transformation
- **Type Safety**: Comprehensive TypeScript coverage with strict validation
- **Error Handling**: Consistent error handling patterns across all server actions
- **Separation of Concerns**: Clear boundaries between API, business logic, and data layers

### Adding New Steam Features

1. **Extend Types**: Add new interfaces in `types/type.ts`
2. **Steam Web API**: Add new methods to `SteamWebAPI` class
3. **Server Actions**: Create new server actions following established patterns
4. **Repository Integration**: Add database operations as needed
5. **Export Interface**: Update `index.ts` with public exports

### Testing New Features

1. **Unit Tests**: Test individual functions with mocked dependencies
2. **Integration Tests**: Test complete data flow with real APIs
3. **Error Scenarios**: Test failure modes and recovery
4. **Performance Testing**: Ensure new features don't impact response times

---

_This documentation reflects the current implementation as of the analysis date. The Steam Integration feature demonstrates excellent architectural patterns and comprehensive Steam platform integration._
