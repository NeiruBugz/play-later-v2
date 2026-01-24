# Features Layer

This directory contains modular feature implementations organized by domain. Each feature is a self-contained unit with UI components, server actions, hooks, use-cases, and types.

## Purpose

Features provide **user-facing functionality** organized by business domain:
- Co-locate related code (UI, actions, types) for maintainability
- Enable feature independence and isolation
- Orchestrate services via use-cases for complex operations

## Directory Structure

```
features/
├── auth/                     # Authentication flows
├── browse-related-games/     # Related/franchise games browsing
├── dashboard/                # Dashboard components
├── game-detail/              # Game detail page components
├── game-search/              # Game search functionality
├── journal/                  # Journal entry management
├── library/                  # User library views
├── manage-library-entry/     # Library entry CRUD modal
├── onboarding/               # Onboarding and getting started
├── profile/                  # User profile management
├── setup-profile/            # Initial profile setup wizard
├── steam-import/             # Steam library import and curation
└── whats-new/                # Feature announcements modal
```

## Feature Module Structure

Each feature follows this standard structure:

```
features/feature-name/
├── ui/                       # React components
│   ├── feature-component.tsx
│   ├── feature-component.types.ts
│   └── index.ts              # Re-exports
├── server-actions/           # Next.js server actions
│   ├── feature-action.ts
│   └── index.ts
├── hooks/                    # Feature-specific React hooks
│   ├── use-feature.ts
│   └── index.ts
├── use-cases/                # Business orchestration (optional)
│   ├── feature-use-case.ts
│   └── feature-use-case.unit.test.ts
├── schemas.ts                # Zod validation schemas
├── types.ts                  # Feature-specific types
└── index.ts                  # Public API exports
```

## Architectural Rules

### Feature Independence
- **Features CANNOT import from other features** (with documented exceptions below)
- Use `shared/` for cross-feature types and components
- Use services for cross-domain data access

```typescript
// ✅ Correct
import { GameCard } from "@/shared/components/game-card";
import { LibraryService } from "@/data-access-layer/services";

// ❌ Wrong - arbitrary cross-feature import
import { SearchResults } from "@/features/game-search/ui";
```

### Cross-Feature Import Exception: `manage-library-entry`

**Exception**: The `manage-library-entry` feature is treated as a **shared UI library** for library operations. Other features MAY import from it.

**Rationale**: Library management UI (modal, forms, status controls) is needed across multiple pages (game detail, library list, dashboard). Rather than duplicating or moving to shared/, we document this as an architectural exception.

```typescript
// ✅ Allowed - documented architectural exception
import { LibraryModal } from "@/features/manage-library-entry/ui";
import { updateLibraryStatusAction } from "@/features/manage-library-entry/server-actions";
import { useLibraryModal } from "@/features/manage-library-entry/hooks";
```

**Authorized consumers:**
- `game-detail/ui/add-to-library-button.tsx`
- `game-detail/ui/library-status-display.tsx`
- `game-detail/ui/quick-action-buttons.tsx`

**Rules for this exception:**
1. Only import from `manage-library-entry`'s public API (barrel exports)
2. Do not create new cross-feature dependencies without documenting here
3. If more features need cross-feature imports, consider moving to `shared/`

### Cross-Feature Import Exception: `onboarding`

**Exception**: The `onboarding` feature provides getting-started components for new users. It MAY be imported by app-level pages.

**Rationale**: Onboarding UI (checklist, progress indicators) is displayed on the dashboard and potentially other pages during the new user experience. The components are self-contained and don't create circular dependencies.

```typescript
// ✅ Allowed - documented architectural exception
import { GettingStartedChecklist } from "@/features/onboarding";
```

**Authorized consumers:**
- `app/(protected)/dashboard/page.tsx`

**Rules for this exception:**
1. Only import from `onboarding`'s public API (barrel exports)
2. Onboarding components should remain stateless/presentational where possible
3. Business logic lives in `OnboardingService` in the data access layer

### Cross-Feature Import Exception: `journal`

**Exception**: The `journal` feature provides journal entry components that can be displayed on game detail pages and the dashboard.

**Rationale**: Journal entries are contextual to games and need to be displayed alongside game information. The components are composition-focused and don't create circular dependencies.

```typescript
// ✅ Allowed - documented architectural exception
import { JournalEntriesSection } from "@/features/journal/ui";
```

**Authorized consumers:**
- `game-detail/ui/journal-entries-section.tsx`
- `app/(protected)/dashboard/page.tsx`

**Rules for this exception:**
1. Only import from `journal`'s public API (barrel exports)
2. Journal components should be self-contained with their own data fetching

### Cross-Feature Import Exception: `library`

**Exception**: The `library` feature provides library display components (like LibraryCard) that can be used on the dashboard.

**Rationale**: Library cards and status displays are needed on aggregation pages like the dashboard. These are presentation components that don't create circular dependencies.

```typescript
// ✅ Allowed - documented architectural exception
import { LibraryCard } from "@/features/library/ui";
```

**Authorized consumers:**
- `app/(protected)/dashboard/page.tsx`

**Rules for this exception:**
1. Only import from `library`'s public API (barrel exports)
2. Library components should remain presentational where possible

### Cross-Feature Import Exception: `whats-new`

**Exception**: The `whats-new` feature provides an app-wide announcement modal for new features and updates.

**Rationale**: The modal needs to appear on any protected page to announce new features to users. It's self-contained with localStorage-based state management.

```typescript
// ✅ Allowed - documented architectural exception
import { WhatsNewModal } from "@/features/whats-new";
```

**Authorized consumers:**
- `app/(protected)/layout.tsx`

**Rules for this exception:**
1. Only import from `whats-new`'s public API (barrel exports)
2. Modal is self-contained with its own state management

### Use-Cases for Multi-Service Orchestration
When a feature needs multiple services, create a use-case:

```typescript
// features/game-detail/use-cases/get-game-details.ts
export async function getGameDetails(params: { slug: string; userId?: string }) {
  const igdbService = new IgdbService();
  const libraryService = new LibraryService();

  const [gameResult, libraryResult] = await Promise.all([
    igdbService.getGameDetailsBySlug({ slug: params.slug }),
    libraryService.getLibraryItemsForGame({ userId: params.userId }),
  ]);

  return { game: gameResult.data, libraryItems: libraryResult.data };
}
```

### Server Actions Pattern

```typescript
// features/manage-library-entry/server-actions/add-to-library-action.ts
"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action";
import { AddToLibrarySchema } from "../schemas";

export const addToLibraryAction = authorizedActionClient
  .schema(AddToLibrarySchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const result = await addGameToLibrary({ ...parsedInput, userId });
    return result;
  });
```

## Import Rules

```typescript
// ✅ Allowed imports in features
import { SomeService } from "@/data-access-layer/services";
import { Button } from "@/shared/components/ui/button";
import type { Game } from "@/shared/types";
import { cn } from "@/shared/lib/tailwind-merge";

// ✅ Internal feature imports
import { useFeatureHook } from "../hooks";
import { FeatureSchema } from "../schemas";

// ❌ NOT allowed
import { OtherFeatureComponent } from "@/features/other-feature/ui";
import { gameRepository } from "@/data-access-layer/repository";
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Feature directory | kebab-case | `manage-library-entry/` |
| Component files | kebab-case | `add-entry-form.tsx` |
| Component names | PascalCase | `AddEntryForm` |
| Hook files | kebab-case with `use-` | `use-library-modal.ts` |
| Action files | kebab-case with `-action` | `add-to-library-action.ts` |
| Type files | `.types.ts` suffix | `add-entry-form.types.ts` |
| Schema files | `schemas.ts` | `schemas.ts` |

## Testing Strategy

| Test Type | Location | Purpose |
|-----------|----------|---------|
| Unit tests | `use-cases/*.unit.test.ts` | Use-case logic |
| Component tests | `ui/*.test.tsx` | UI component behavior |
| Server action tests | `server-actions/*.server-action.test.ts` | Action validation/logic |
| Integration tests | `*.integration.test.ts` | Full flow with database |

## Common Patterns

### Form Submissions
Use server actions with Zod validation:

```typescript
// Schema
export const AddEntrySchema = z.object({
  gameId: z.string().uuid(),
  status: z.enum(["playing", "completed", "backlog"]),
});

// Server Action
export const addEntryAction = authorizedActionClient
  .schema(AddEntrySchema)
  .action(async ({ parsedInput }) => {
    // ...
  });

// Component
const { execute, isPending } = useAction(addEntryAction);
```

### Optimistic Updates
Use TanStack Query with optimistic updates:

```typescript
const mutation = useMutation({
  mutationFn: updateLibraryItem,
  onMutate: async (newItem) => {
    await queryClient.cancelQueries({ queryKey: ["library"] });
    const previous = queryClient.getQueryData(["library"]);
    queryClient.setQueryData(["library"], (old) => [...old, newItem]);
    return { previous };
  },
  onError: (err, item, context) => {
    queryClient.setQueryData(["library"], context.previous);
  },
});
```

### Infinite Scroll
Use TanStack Query's `useInfiniteQuery`:

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ["franchise-games", franchiseId],
  queryFn: ({ pageParam = 0 }) => loadMoreFranchiseGames({ offset: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextOffset,
});
```

### Hook Error Handling

Use message-based pattern matching for user-friendly error handling in hooks:

```typescript
// Define error handlers with message matching
type ErrorHandler = {
  match: (message: string) => boolean;
  handle: () => void;
};

const ERROR_HANDLERS: ErrorHandler[] = [
  {
    match: (msg) => msg.includes("No IGDB match found"),
    handle: () => toast.error("Could not match game automatically"),
  },
  {
    match: (msg) => msg.includes("already in library"),
    handle: () => toast.info("Game already in library"),
  },
];

// Use in mutation error handler
function handleError(error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const handler = ERROR_HANDLERS.find((h) => h.match(errorMessage));

  if (handler) {
    handler.handle();
  } else {
    toast.error("Operation failed", { description: errorMessage });
  }
}
```

**Guidelines:**
- Error handling logic is feature-specific (no shared utility needed)
- Server actions use `revalidatePath()` for cache invalidation
- Hooks use `queryClient.invalidateQueries()` for TanStack Query cache
- Use-cases return standardized `{ success: boolean; data?: T; error?: string }` types

## Exports

Each feature should export its public API via `index.ts`:

```typescript
// features/manage-library-entry/index.ts
export { LibraryModal } from "./ui/library-modal";
export { addToLibraryAction, deleteLibraryItemAction } from "./server-actions";
export { useLibraryModal } from "./hooks";
export type { LibraryModalProps } from "./ui/library-modal.types";
```
