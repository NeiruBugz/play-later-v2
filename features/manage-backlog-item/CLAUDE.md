# CLAUDE.md - Manage Backlog Item Feature

This file provides comprehensive documentation for the manage-backlog-item feature module, following the established patterns from the main CLAUDE.md file.

## Feature Overview

The Manage Backlog Item feature provides comprehensive CRUD operations for users to manage their personal gaming backlog. It enables users to add games to their collection, track progress through different gaming statuses, manage multi-platform ownership, and maintain detailed gaming timelines with start and completion dates.

### Key Capabilities

- **Create**: Add games to backlog with platform and status information
- **Read**: Fetch user's backlog items for specific games
- **Update**: Modify status, platform, dates, and other metadata
- **Delete**: Remove items from backlog with confirmation
- **Quick Actions**: One-click status updates (Complete, Start Playing, Move to Backlog)
- **Multi-Platform Support**: Track the same game across different platforms

## Architecture Overview

### Directory Structure

```
features/manage-backlog-item/
├── create-backlog-item/          # Creation functionality
│   ├── components/
│   │   └── create-backlog-item-form.tsx
│   ├── lib/
│   │   └── validation.ts
│   └── server-actions/
│       ├── action.ts
│       └── action.server-action.test.ts
├── edit-backlog-item/            # Update operations
│   ├── components/
│   │   ├── complete-action-button.tsx
│   │   ├── edit-game-entry-modal.tsx
│   │   ├── game-entry-form.tsx
│   │   ├── game-status-selector.tsx
│   │   ├── move-to-backlog-action-button.tsx
│   │   └── start-playing-action-button.tsx
│   ├── hooks/
│   │   ├── update-backlog-action.ts
│   │   └── use-matching-backlog-item.ts
│   ├── lib/
│   │   └── validation.ts
│   ├── server-actions/
│   │   ├── action.ts
│   │   ├── action.server-action.test.ts
│   │   ├── create-backlog-item.ts
│   │   ├── get-backlog-items.ts
│   │   └── schema.ts
│   └── index.ts
├── delete-backlog-item/          # Deletion functionality
│   ├── components/
│   │   ├── delete-backlog-item.tsx
│   │   └── index.ts
│   ├── server-actions/
│   │   ├── action.ts
│   │   └── action.server-action.test.ts
│   └── index.ts
├── PRD.md                        # Product requirements document
└── clean-code-review.md          # Code quality assessment
```

### Data Flow Architecture

The feature follows the standard repository pattern implementation:

```
User Interaction → React Components → Server Actions → Repository Layer → Prisma → PostgreSQL
                                   ↓
Cache Invalidation ← UI Updates ← Response Processing ← Business Logic ← Data Validation
```

#### Detailed Flow Examples:

1. **Create Flow**:

   ```
   CreateBacklogItemForm → createBacklogItem action → createBacklogItemCommand repository → Database
   ```

2. **Update Flow**:

   ```
   Quick Action Button → updateBacklogItemAction → updateBacklogItem repository → Database
   Edit Modal Form → editBacklogItem action → updateBacklogItem repository → Database
   ```

3. **Delete Flow**:
   ```
   DeleteBacklogItem Component → deleteBacklogItemAction → deleteBacklogItem repository → Database
   ```

## Component Architecture

### Create Sub-Feature

**Key Component**: `CreateBacklogItemForm` (`create-backlog-item/components/create-backlog-item-form.tsx`)

- Lines 43-110: Main form component with platform and status selection
- Lines 25-28: Date parsing utility function
- Lines 30-41: Form submission loading state component
- Lines 44-52: Form action handling with toast notifications

**Server Action**: `createBacklogItem` (`create-backlog-item/server-actions/action.ts`)

- Lines 10-48: Authorized action with form data validation
- Lines 16-23: Zod form data schema definition
- Lines 24-47: Business logic and repository integration

### Edit Sub-Feature

**Primary Components**:

1. **EditGameEntryModal** (`edit-game-entry-modal.tsx`)

   - Lines 29-88: Modal wrapper with tabbed interface for multiple platform entries
   - Lines 48-54: Dynamic tab generation based on existing backlog items
   - Lines 57-77: Tab content rendering with form components

2. **GameEntryForm** (`game-entry-form.tsx`)

   - Lines 37-177: Comprehensive form for editing all backlog item properties
   - Lines 44-52: State management for form fields
   - Lines 54-79: Form submission logic with dual action support (create/update)
   - Lines 127-174: Date picker implementation using Radix UI Calendar

3. **Quick Action Buttons**:
   - **CompleteActionButton** (lines 21-72): Single-click completion with status validation
   - **StartPlayingActionButton** (lines 25-75): One-click status change to "PLAYING"
   - **MoveToBacklogActionButton**: Similar pattern for "TO_PLAY" status

**Hooks**:

- **useMatchingBacklogItem** (`hooks/use-matching-backlog-item.ts`): Finds backlog items by status with URL param support
- **updateBacklogActionAction** (`hooks/update-backlog-action.ts`): Server action for quick status updates

**Server Actions**:

- **editBacklogItem** (`server-actions/action.ts`): Full edit with comprehensive validation
- **updateBacklogItemAction** (`hooks/update-backlog-action.ts`): Quick status-only updates
- **getBacklogItems** (`server-actions/get-backlog-items.ts`): Fetch user's items for a game

### Delete Sub-Feature

**Key Component**: `DeleteBacklogItem` (`delete-backlog-item/components/delete-backlog-item.tsx`)

- Lines 22-68: Alert dialog with confirmation flow
- Lines 27-37: Action hook with success/error handling
- Lines 40-66: Destructive action UI with proper confirmation

## TypeScript Patterns and Validation

### Validation Schemas

**Zod Form Data Patterns** (`edit-backlog-item/server-actions/schema.ts`):

- Lines 5-11: BacklogItemStatus enum validation
- Lines 13-19: Optional date transformation schema
- Lines 21-48: Edit form validation with date coercion
- Lines 50-77: Create form validation schema

**Key Type Patterns**:

```typescript
// Component prop typing (game-entry-form.tsx, lines 26-31)
type GameEntryFormProps = Pick<
  BacklogItem,
  "startedAt" | "completedAt" | "platform" | "status" | "id"
> & {
  gameId?: string;
};

// Status validation (game-entry-form.tsx, lines 33-35)
const isValidStatus = (value: string): value is BacklogItemStatus => {
  return Object.values(BacklogItemStatus).includes(value as BacklogItemStatus);
};
```

### Data Models

**BacklogItem Structure** (from PRD.md, lines 191-203):

```typescript
BacklogItem = {
  id: string,
  userId: string,
  gameId: string,
  platform: string,
  status: BacklogItemStatus,
  acquisitionType: AcquisitionType,
  startedAt?: Date,
  completedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Status Enumeration** (lines 207-214):

```typescript
BacklogItemStatus =
  | "TO_PLAY"      // In backlog, not started
  | "PLAYING"      // Currently being played
  | "COMPLETED"    // Finished
  | "PLAYED"       // Played but not completed
  | "WISHLIST"     // Desired for future acquisition
```

## Key Dependencies and Integrations

### UI Dependencies

- **@radix-ui/react-popover**: Calendar date picker implementation
- **shadcn/ui**: Form components, modals, buttons, calendars
- **lucide-react**: Icons for actions and status indicators
- **sonner**: Toast notifications for user feedback

### Validation and Forms

- **zod & zod-form-data**: Runtime validation and form data parsing
- **date-fns**: Date formatting and manipulation utilities
- **next-safe-action**: Type-safe server action implementation

### State Management

- **useAction hook**: Server action integration with loading states
- **useFormStatus**: Form submission state management
- **useState**: Local component state for form fields

### Integration Points

**Repository Layer** (`shared/lib/repository`):

- `createBacklogItem`: Create new backlog entries
- `updateBacklogItem`: Update existing entries
- `deleteBacklogItem`: Remove entries with ownership validation
- `getManyBacklogItems`: Fetch user's items for a game

**Revalidation Service** (`shared/ui/revalidation`):

- Cache invalidation after mutations
- Consistent across all CRUD operations
- Lines referenced: create-action.ts:47, edit-action.ts:42, delete-action.ts:39

## Testing Strategy

### Test Structure

**Server Action Testing Pattern** (`create-backlog-item/server-actions/action.server-action.test.ts`):

1. **Authentication Testing** (lines 22-32):

   ```typescript
   describe("when user is not authenticated", () => {
     it("should throw authentication error", async () => {
       mockGetServerUserId.mockResolvedValue(undefined);
       // Test implementation
     });
   });
   ```

2. **Validation Testing** (lines 39-75):

   - Missing required fields validation
   - Field-specific error message verification
   - Form data parsing edge cases

3. **Success Path Testing** (lines 77-118):
   - Successful creation with minimal data
   - Creation with optional date fields
   - Repository integration verification
   - Cache revalidation confirmation

### Test Coverage Areas

**Unit Tests**:

- Server action validation and business logic
- Component state management and user interactions
- Form validation and error handling
- Date parsing and transformation utilities

**Integration Points**:

- Repository layer integration
- Authentication middleware
- Cache revalidation triggers
- Form submission workflows

## Performance Considerations

### Optimizations Implemented

1. **Form State Management**:

   - Local state for immediate UI feedback
   - Optimistic updates for quick actions
   - Debounced validation for complex forms

2. **Data Fetching**:

   - Server actions for type-safe data operations
   - Selective fetching with `getManyBacklogItems`
   - Cache invalidation only when necessary

3. **Component Rendering**:
   - Conditional rendering for action buttons
   - Memoized components for expensive operations
   - Proper key props for list rendering

### Scalability Features

**Multi-Platform Support**:

- Independent tracking per platform
- Tabbed interface for multiple entries
- Platform-specific validation and display

**Bulk Operations** (referenced in PRD.md):

- Foundation for future batch operations
- Consistent action patterns across components
- Extensible component architecture

## Error Handling

### Client-Side Error Management

**Toast Notifications**:

```typescript
// Pattern used across components
const { execute } = useAction(serverAction, {
  onSuccess: () => toast.success("Success message"),
  onError: () => toast.error("Error message"),
});
```

**Form Validation**:

- Real-time validation feedback
- Field-specific error messages
- Type-safe error handling with Zod

### Server-Side Error Handling

**Authorized Action Pattern**:

- Authentication requirement enforcement
- Input validation with detailed error messages
- Graceful failure handling with user feedback

## Future Enhancement Opportunities

Based on the PRD.md assessment (lines 341-384), potential improvements include:

### High Priority

- Drag-and-drop reordering for backlog items
- Batch operations (bulk status updates, platform migration)
- Keyboard shortcuts for power users
- Gaming time tracking and estimates

### Medium Priority

- Custom tags and categories for games
- Priority ranking system
- Backlog sharing and collaboration features
- Import/export functionality

### Advanced Features

- Machine learning recommendations
- Social features (compare backlogs, friend recommendations)
- Advanced filtering and search capabilities
- Gamification elements

## Usage Examples

### Basic Integration

```typescript
// Creating a backlog item
import { CreateBacklogItemForm } from "@/features/manage-backlog-item/create-backlog-item";

<CreateBacklogItemForm gameId="game-123" />

// Editing entries
import { EditGameEntryModal } from "@/features/manage-backlog-item/edit-backlog-item";

<EditGameEntryModal backlogItems={userBacklogItems} />

// Quick actions
import { CompleteActionButton, StartPlayingActionButton } from "@/features/manage-backlog-item/edit-backlog-item";

<CompleteActionButton backlogItems={items} />
<StartPlayingActionButton game={gameData} backlogItems={items} />
```

### Server Action Usage

```typescript
// Quick status update
import { updateBacklogItemAction } from "@/features/manage-backlog-item/edit-backlog-item/hooks/update-backlog-action";
// Full edit
import { editBacklogItem } from "@/features/manage-backlog-item/edit-backlog-item/server-actions/action";

await updateBacklogItemAction({
  id: backlogItemId,
  status: "COMPLETED",
});

const formData = new FormData();
formData.append("id", "123");
formData.append("status", "PLAYING");
formData.append("platform", "PC");
await editBacklogItem(formData);
```

## Code Quality Assessment

**Current Implementation Quality: Excellent (9.5/10)**

### Strengths

- Clean three-tier architecture with logical separation
- Comprehensive validation using Zod with proper error handling
- Type-safe server actions with authentication integration
- Robust repository pattern implementation
- Excellent component composition with reusable elements
- Proper state management with optimistic updates
- Well-structured testing approach with good coverage
- Performance-optimized with minimal re-renders
- Comprehensive accessibility considerations

### Technical Architecture Excellence

- Domain-driven design with clear feature boundaries
- Consistent patterns across all CRUD operations
- Proper separation of concerns between components, actions, and repositories
- Type safety throughout the entire stack
- Comprehensive error handling and user feedback

This feature serves as an exemplary implementation of clean architecture principles and can be used as a reference for other feature development in the codebase.
