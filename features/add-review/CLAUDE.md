# Add Review Feature - CLAUDE.md

This file provides guidance for working with the add-review feature module in the Play Later v2 application.

## Feature Overview

The Add Review feature enables authenticated users to create and submit game reviews with star ratings (1-10 scale), written content, and platform selection. The feature provides both modal dialog and standalone form interfaces to accommodate different user contexts.

### Core Functionality

- **10-star rating system**: Required field with visual feedback
- **Review content**: Optional text area for detailed thoughts
- **Platform selection**: Optional dropdown for gaming platform
- **Dual interfaces**: Modal dialog for game pages and standalone form
- **Real-time validation**: Client and server-side input validation
- **Authentication required**: All review operations require user login

## Architecture & Component Breakdown

### Component Hierarchy

```
AddReviewDialog (Modal wrapper)
├── DialogTrigger (Button with Star icon)
└── DialogContent
    ├── DialogHeader (Game title & description)
    └── AddReviewForm (Form implementation)

ReviewForm (Standalone form)
├── Star rating buttons (1-10 scale)
├── Textarea (Review content)
└── Submit button
```

### Key Files & Responsibilities

#### Components (`/components/`)

- **`add-review-dialog.tsx`** (Lines 1-44): Modal wrapper component

  - Renders shadcn/ui Dialog with trigger button
  - Displays game title and contextual description
  - Contains AddReviewForm for actual review submission

- **`add-review-form.tsx`** (Lines 1-102): Primary form with next-safe-action integration

  - Uses `useAction` hook for type-safe server actions
  - Implements 10-star rating with visual feedback
  - Includes platform selection dropdown
  - Form validation and submission handling

- **`review-form.tsx`** (Lines 1-75): Simplified standalone form

  - Direct server action calls without next-safe-action
  - Minimal form interface for embedded contexts
  - Client-side state management with useState

- **`index.ts`** (Lines 1-2): Feature exports for clean imports

#### Server Actions (`/server-actions/`)

- **`create-review.ts`** (Lines 1-46): Type-safe server actions
  - `createReviewForm`: Enhanced action with full validation (Lines 10-27)
  - `createReview`: Basic action for simple submissions (Lines 29-46)
  - Both use `authorizedActionClient` for authentication
  - Automatic cache revalidation for game pages

#### Validation (`/lib/`)

- **`validation.ts`** (Lines 1-20): Zod schemas for input validation
  - `CreateReviewSchema`: Core validation rules (Lines 3-8)
  - `CreateReviewInput`: TypeScript type inference (Line 10)
  - `ReviewIncludeUser`: Schema for review with user data (Lines 12-18)

## Data Flow

### Complete Review Submission Flow

```
User Interaction → Client Validation → Server Action → Repository → Database
                                            ↓
Game Page Cache ← Cache Revalidation ← Success Response
```

### Detailed Flow Steps

1. **User opens modal**: Click "Write a Review" button triggers dialog
2. **Rating selection**: Required star rating (1-10) with visual feedback
3. **Content entry**: Optional review text and platform selection
4. **Client validation**: Form validates rating requirement before enabling submit
5. **Server action**: `createReviewForm` or `createReview` processes submission
6. **Repository call**: `createReview` function in review-repository.ts
7. **Database operation**: Prisma creates review record with user/game relationships
8. **Cache revalidation**: `revalidatePath` updates game page data
9. **User feedback**: Toast notification confirms success/failure

### Authentication Flow

- All server actions require authentication via `authorizedActionClient`
- Unauthenticated requests receive "Authentication required" error
- User ID automatically injected into review data from session context

## TypeScript Patterns & Type Definitions

### Core Types

```typescript
// Input validation schema
CreateReviewInput = {
  gameId: string,      // Required, min 1 character
  rating: number,      // Required, 1-10 range
  content?: string,    // Optional review text
  completedOn?: string // Optional platform selection
}

// Repository input type
CreateReviewInput = {
  userId: string,
  gameId: string,
  review: {
    rating: number,
    content?: string,
    completedOn: string | undefined
  }
}
```

### Type Safety Patterns

- **Zod schemas**: Runtime validation with TypeScript inference (validation.ts:3-8)
- **next-safe-action**: Type-safe server actions with automatic validation
- **Repository typing**: Strict input/output types for data layer
- **Component props**: Minimal, focused prop interfaces

## Testing Strategy

### Test Coverage

The feature includes comprehensive testing across all layers:

#### Component Tests

- **`add-review-dialog.test.tsx`**: Dialog behavior and form integration

  - Dialog rendering with correct title/description (Lines 48-54)
  - Rating button interactions and state management (Lines 60-67)
  - Form submission flow validation (Lines 69-83)

- **`review-form.test.tsx`**: Standalone form functionality
  - Form element rendering (Lines 39-46)
  - Rating selection and button state (Lines 48-51)
  - Text input handling (Lines 53-58)
  - Complete submission workflow (Lines 60-67)

#### Server Action Tests

- **`create-review.server-action.test.ts`**: Server-side logic validation
  - Authentication requirement enforcement (Lines 16-28, 89-101)
  - Input validation error handling (Lines 35-50)
  - Successful review creation (Lines 52-71, 109-130)
  - Mocked Prisma interactions for isolated testing

### Testing Patterns

- **Test utilities**: Uses `renderWithTestProviders` for consistent setup
- **Element selectors**: Semantic queries for accessibility-focused testing
- **User interactions**: `@testing-library/user-event` for realistic interactions
- **Mocking strategy**: Vi.js mocks for external dependencies (Prisma, auth)
- **Async testing**: Proper waitFor patterns for async operations

## Integration Points

### Repository Layer

- **Review Repository** (`shared/lib/repository/review/review-repository.ts`):
  - `createReview`: Core database operation (Lines 23-45)
  - `getAllReviewsForGame`: Retrieves reviews for display
  - User/Game relationship handling via Prisma connect

### External Dependencies

- **shadcn/ui**: Dialog, Button, Select, Textarea components
- **Lucide React**: Star icons for rating system (`StarIcon`)
- **Sonner**: Toast notifications for user feedback
- **next-safe-action**: Type-safe server actions with validation
- **Platform options**: `playingOnPlatforms` from shared utilities

### Authentication Integration

- Uses `authorizedActionClient` from `shared/lib/safe-action-client`
- Automatic user ID injection from session context
- Consistent error handling for unauthenticated requests

## Development Commands

### Feature-Specific Testing

```bash
# Run all review-related tests
bun run test add-review

# Watch mode for component tests
bun run test:unit:watch add-review

# Coverage for review feature
bun run test:coverage --testNamePattern="add-review|review"
```

### Development Workflow

```bash
# Start development server
bun dev

# Run type checking
bun typecheck

# Format and lint
bun code-fix
```

## Usage Examples

### Modal Dialog Implementation

```typescript
import { AddReviewDialog } from "@/features/add-review";

// In game detail page
<AddReviewDialog
  gameId={game.id}
  gameTitle={game.title}
/>
```

### Standalone Form Implementation

```typescript
import { ReviewForm } from "@/features/add-review";

// Embedded in page layout
<ReviewForm gameId={gameId} />
```

## Performance Considerations

### Optimization Patterns

- **Lazy loading**: Modal content loads only when opened
- **Debounced validation**: Client-side validation prevents excessive API calls
- **Efficient cache revalidation**: Targeted path revalidation vs. full cache clear
- **Minimal re-renders**: Focused state updates in form components

### Response Time Targets (from PRD)

- Modal dialog open: < 300ms
- Star rating feedback: < 100ms
- Form submission: < 2s
- Page revalidation: < 1s

## Accessibility Features

### WCAG Compliance

- **Keyboard navigation**: Star rating fully keyboard accessible
- **Screen reader support**: Proper ARIA labels for rating buttons (Lines 64, 49)
- **Focus management**: Dialog focus trapping and restoration
- **Semantic HTML**: Proper form labels and button roles

### Implementation Details

- Star rating buttons include `aria-label` with specific values
- Form fields properly associated with labels
- Loading states communicated to assistive technologies
- High contrast support through consistent color usage

## Future Enhancement Opportunities

Based on PRD recommendations:

### High Priority

- Review editing and deletion functionality
- Character count indicators for review content
- Enhanced completion date picker interface
- Rich text editor for better content formatting

### Medium Priority

- Review helpfulness voting system
- User review history and management
- Review sharing capabilities
- Content quality scoring and analytics

### Low Priority

- Multiple platform reviews per game
- Integration with external review platforms
- Automated review summarization features
- Advanced review comparison tools

## Error Handling

### Client-Side Errors

- Form validation prevents invalid submissions
- Network failure recovery with user-friendly messages
- Loading state management during submissions

### Server-Side Errors

- Authentication requirement enforcement
- Input validation with detailed error messages
- Database operation error handling and rollback
- Graceful degradation for service failures

## Security Considerations

### Input Sanitization

- Zod schema validation for all inputs
- Content sanitization before database storage
- Protection against XSS through proper encoding

### Authentication & Authorization

- Required authentication for all review operations
- User association validation for review ownership
- Protection against duplicate review submissions
- Parameterized database queries prevent injection attacks
