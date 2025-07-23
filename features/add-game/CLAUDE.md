# Add Game Feature - CLAUDE.md

This documentation provides comprehensive guidance for working with the Add Game feature module in the Play Later v2 application.

## Feature Overview

The Add Game feature enables users to search for video games using the IGDB database and add them to their personal game collection with customizable metadata including platform, backlog status, and acquisition type.

### Core Functionality

- **Game Search**: Real-time search integration with IGDB API (minimum 3 characters)
- **Game Selection**: Visual game picker with cover art and release dates
- **Collection Configuration**: Platform, backlog status, and acquisition type selection
- **Multiple Entry Points**: Full form, modal quick-add, and external page integration
- **Data Validation**: Comprehensive input validation with Zod schemas

### Business Value

- Enables users to build and manage personal game libraries
- Provides accurate game metadata through IGDB integration
- Supports multiple gaming platforms and acquisition methods
- Streamlines game addition with intuitive UX patterns

## Architecture Overview

### Data Flow

```
User Input → Form Validation → Server Action → Repository Layer → Database
     ↓
Search API → IGDB Service → Cache → Search Results → UI
```

### Component Structure

```
features/add-game/
├── components/              # React UI components
│   ├── add-game-form.tsx           # Main form component (lines 1-352)
│   ├── game-picker.tsx             # Search interface (lines 1-287)
│   ├── add-to-collection-modal.tsx # Quick-add modal (lines 1-251)
│   ├── add-game-form.submit.tsx    # Submit button component (lines 1-44)
│   └── add-game-from-external-page.tsx # External integration (lines 1-48)
├── server-actions/          # Business logic
│   ├── create-game-action.ts       # Main server action (lines 1-39)
│   ├── add-game.ts                 # Core business logic (lines 1-41)
│   └── create-game-action.server-action.test.ts # Unit tests (lines 1-182)
├── lib/                    # Validation and constants
│   ├── validation.ts               # Zod schemas (lines 1-21)
│   └── constants.ts                # Default values (lines 1-19)
├── types/                  # TypeScript definitions
│   └── index.ts                    # Type exports (lines 1-21)
└── index.ts               # Feature exports (lines 1-6)
```

## Component Breakdown

### 1. AddGameForm (`/components/add-game-form.tsx`)

**Purpose**: Main form component for adding games with full configuration options.

**Key Features**:

- Game search integration with `GamePicker` (lines 127-132)
- Platform selection dropdown (lines 182-221)
- Backlog status radio group (lines 226-275)
- Acquisition type radio group (lines 280-332)
- Form validation and error handling (lines 58-67)
- Loading states and disabled controls (lines 54, 111)

**React Patterns**:

- `useForm` with Zod resolver for validation (lines 69-72)
- `useAction` for server action integration (lines 58-67)
- `useTransition` for loading states (lines 54, 96-108)
- Controlled form state with React Hook Form (lines 74-88)

**Dependencies**:

- `react-hook-form` - Form state management
- `@hookform/resolvers/zod` - Zod integration
- `next-safe-action/hooks` - Server action hooks
- `sonner` - Toast notifications

### 2. GamePicker (`/components/game-picker.tsx`)

**Purpose**: Search interface with IGDB integration and game selection.

**Key Features**:

- Debounced search with query cancellation (lines 128-137)
- Visual game selection with cover art (lines 19-77)
- Loading and empty states (lines 79-102)
- Search popover with results dropdown (lines 248-278)
- Selected game preview (lines 171-208)

**Performance Optimizations**:

- Query cancellation to prevent race conditions (lines 133, 144, 152)
- Memoized popover open state (lines 155-165)
- TanStack Query integration for caching (lines 119, 120)

**Integration Points**:

- `useIGDBSearch` hook from `features/search` (line 5)
- `IgdbImage` component for game covers (line 6)

### 3. AddToCollectionModal (`/components/add-to-collection-modal.tsx`)

**Purpose**: Quick-add modal for streamlined game addition from external pages.

**Key Features**:

- Compact form layout with essential fields (lines 116-230)
- Modal state management (lines 57, 101)
- Navigation to game details after success (line 83)
- Simplified validation flow (lines 69-96)

**Usage Context**: Ideal for quick additions from game detail pages or search results.

### 4. Server Actions

#### createGameAction (`/server-actions/create-game-action.ts`)

**Purpose**: Main server action wrapper with authentication and caching.

**Implementation Details**:

- Requires authentication (lines 12-16)
- Input validation with `CreateGameActionSchema` (line 17)
- Calls `saveGameAndAddToBacklog` for business logic (line 30)
- Cache revalidation for `/collection` path (line 32)
- Returns game title and ID for UI feedback (lines 34-37)

#### saveGameAndAddToBacklog (`/server-actions/add-game.ts`)

**Purpose**: Core business logic for adding games to user collections.

**Implementation Details**:

- Direct repository layer integration (lines 29-37)
- User scoped operations with `userId` from context (line 26)
- Comprehensive input validation (lines 14-25)
- Calls `addGameToUserBacklog` repository function (line 29)

## TypeScript Patterns

### Type Definitions (`/types/index.ts`)

```typescript
// Partial game data for form handling (lines 3-5)
export type GameFormValues =
  | Partial<Omit<Game, "releaseDate"> & { releaseDate: number }>
  | undefined;

// Backlog item configuration (lines 7-11)
export type BacklogItemFormValues = {
  backlogStatus: BacklogItemStatus;
  acquisitionType: AcquisitionType;
  platform?: string;
};

// Server action input type (lines 13-20)
export type AddGameToBacklogInput = {
  game: Pick<Game, "igdbId">;
  backlogItem: {
    backlogStatus: BacklogItemStatus;
    acquisitionType: AcquisitionType;
    platform?: string;
  };
};
```

### Validation Schemas (`/lib/validation.ts`)

```typescript
// Zod schema for server action validation (lines 4-9)
export const CreateGameActionSchema = z.object({
  backlogStatus: z.nativeEnum(BacklogItemStatus).optional(),
  igdbId: z.number(),
  platform: z.string().optional(),
  acquisitionType: z.nativeEnum(AcquisitionType).optional(),
});

// Type inference and form data parsing (lines 11-20)
export type CreateGameActionInput = z.infer<typeof CreateGameActionSchema>;
```

### Constants (`/lib/constants.ts`)

```typescript
// Default platform options (lines 6-12)
export const DEFAULT_PLATFORM_LIST: SearchResponse["platforms"] = [
  { id: 9999, name: "PC" },
  { id: 9998, name: "PlayStation" },
  // ... other platforms
];

// Form default values (lines 14-18)
export const initialFormValues: BacklogItemFormValues = {
  backlogStatus: BacklogItemStatus.TO_PLAY,
  acquisitionType: AcquisitionType.DIGITAL,
  platform: "",
};
```

## Data Flow Analysis

### 1. User Interaction Flow

```
User enters search → GamePicker queries IGDB → Results displayed
User selects game → AddGameForm populated → User configures metadata
User submits form → createGameAction validation → saveGameAndAddToBacklog
Repository layer → addGameToUserBacklog → Database persistence
Success response → UI feedback → Cache revalidation
```

### 2. Search Integration

The feature integrates with the search module (`features/search`) through:

- `useIGDBSearch` hook for real-time game search
- Search results caching and query management
- Debounced search to optimize API calls

### 3. Repository Integration

Uses the repository pattern through `shared/lib/repository`:

- `addGameToUserBacklog` for game and backlog item creation
- User-scoped operations with authentication context
- Database transaction handling for consistency

## Testing Strategy

### Unit Tests (`/server-actions/create-game-action.server-action.test.ts`)

**Coverage Areas**:

- Authentication validation (lines 23-37)
- Input validation for all fields (lines 45-91)
- Successful game creation scenarios (lines 93-179)
- Error handling and edge cases

**Testing Patterns**:

- Mocked dependencies with `vi.mock` (lines 8-10)
- Comprehensive validation testing (lines 46-90)
- Multiple success scenarios (lines 94-178)
- TypeScript error testing with `@ts-expect-error` (lines 48, 65, 82)

### Test Structure

```typescript
describe("createGameAction", () => {
  describe("when user is not authenticated", () => {
    // Authentication error tests
  });

  describe("when user is authenticated", () => {
    describe("when input is invalid", () => {
      // Validation error tests
    });

    describe("when input is valid", () => {
      // Success scenario tests
    });
  });
});
```

## Integration Points

### External Dependencies

1. **IGDB API Integration**

   - Game search through `features/search`
   - Game metadata retrieval
   - Image handling with `IgdbImage` component

2. **Repository Layer**

   - `addGameToUserBacklog` from `shared/lib/repository/backlog`
   - User authentication context
   - Database transaction management

3. **UI Components**
   - shadcn/ui form components
   - Custom typography components
   - Icon library (Lucide React)

### Internal Feature Dependencies

- Search feature for IGDB integration
- Authentication system for user context
- Shared components for UI consistency
- Type definitions from Prisma schema

## Performance Considerations

### Optimizations Implemented

1. **Search Performance**

   - Debounced search input (300ms delay)
   - Query cancellation for abandoned searches
   - TanStack Query caching for repeated searches

2. **Form Performance**

   - Controlled component state with React Hook Form
   - Validation on submit rather than real-time
   - Loading states to prevent double submissions

3. **UI Performance**
   - Conditional rendering for form sections
   - Memoized component props where applicable
   - Optimized re-renders with proper dependency arrays

### Scalability Notes

- IGDB API rate limiting handled by search feature
- Database indexing for game lookups (handled by repository)
- Client-side caching reduces redundant API calls

## Error Handling

### Validation Errors

- Zod schema validation with detailed error messages
- Form-level error display with `FormMessage` components
- Server-side validation mirroring client validation

### Runtime Errors

- Toast notifications for user feedback (lines 58-67 in add-game-form.tsx)
- Console error logging for debugging (lines 92, 105)
- Graceful degradation for API failures

### Authentication Errors

- Server action authentication requirements
- Proper error messages for unauthenticated users
- Redirect handling for authentication flows

## Usage Examples

### 1. Main Form Usage

```tsx
import { AddGameForm } from "@/features/add-game";

export default function AddGamePage() {
  return (
    <div className="container mx-auto py-8">
      <AddGameForm />
    </div>
  );
}
```

### 2. Modal Quick-Add Usage

```tsx
import { AddToCollectionModal } from "@/features/add-game";

export function GameDetailActions({ game }) {
  return <AddToCollectionModal gameTitle={game.name} igdbId={game.igdbId} />;
}
```

### 3. External Page Integration

```tsx
import { AddToWishlistFromExternalPage } from "@/features/add-game";

export function ExternalGameActions({ igdbId, isInCollection }) {
  return (
    <AddToWishlistFromExternalPage
      igdbId={igdbId}
      isWishlistDisabled={isInCollection}
    />
  );
}
```

## Development Guidelines

### Adding New Features

1. **New Components**: Follow the established pattern with validation, loading states, and error handling
2. **Server Actions**: Use `authorizedActionClient` and proper input validation
3. **Types**: Define in `/types/index.ts` with proper Prisma integration
4. **Constants**: Add to `/lib/constants.ts` for reusability

### Testing Requirements

- Unit tests for all server actions (>90% coverage target)
- Component tests for form interactions
- Integration tests for IGDB API integration
- Error scenario coverage

### Code Style Guidelines

- Use TypeScript strict mode patterns
- Implement proper loading and error states
- Follow React Hook Form patterns for validation
- Use server actions for all mutations

## Future Enhancement Opportunities

Based on the PRD analysis (lines 283-309), potential improvements include:

### High Priority

1. **Enhanced Search UX**

   - Search history/recent searches
   - Fuzzy search for better matching
   - Game genre/platform filters

2. **Performance Optimizations**
   - Search result caching
   - Virtual scrolling for large result sets
   - Optimized image loading

### Medium Priority

1. **Bulk Operations**

   - Bulk game addition capability
   - CSV import functionality
   - External service integrations

2. **Advanced Features**
   - AI-powered game recommendations
   - Cross-platform game matching
   - Enhanced metadata editing

The current implementation demonstrates excellent architectural practices and requires minimal structural changes. Focus should be on UX enhancements and performance optimizations rather than architectural refactoring.
