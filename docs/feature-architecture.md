# Feature Architecture

This document provides details about the feature architecture used in the PlayLater application and guidelines for implementing new features.

## Overview

PlayLater follows a feature-based architecture, where each major feature has its own directory containing all related components, actions, and queries. This approach promotes modularity, maintainability, and separation of concerns.

## Feature Structure

Each feature is organized in its own directory under the `features/` folder. A typical feature directory includes:

- **Actions**: Server actions for data mutations
- **Queries**: Database queries for data fetching
- **Components**: UI components specific to the feature
- **Types**: TypeScript types specific to the feature
- **Utils**: Utility functions specific to the feature

## Current Features

The application currently includes the following main features:

### Collection Management

Located in `features/collection/` and `features/manage-collection/`

The collection feature allows users to manage their game collection, including:
- Viewing games in their collection
- Adding games to their collection
- Updating game status (To Play, Playing, Completed)
- Filtering and sorting their collection

Key files:
- `collection-actions.ts`: Server actions for collection management
- `collection-queries.ts`: Database queries for collection data
- `create-backlog-item.ts`: Logic for creating new backlog items
- `update-backlog-item.ts`: Logic for updating backlog items

### Wishlist

Located in `features/wishlist/`

The wishlist feature allows users to manage games they want to play in the future, including:
- Adding games to their wishlist
- Moving games from wishlist to collection
- Removing games from wishlist

### Add Game

Located in `features/add-game/`

The add game feature allows users to search for and add games to their collection or wishlist, including:
- Searching for games using the IGDB API
- Viewing game details
- Adding games to collection or wishlist

## Server Actions

Server actions are used for data mutations and are implemented using Next.js server actions with the `next-safe-action` library for type safety and validation.

Example of a server action:

```typescript
// features/collection/collection-actions.ts
import { action } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '../../prisma/client';

export const updateBacklogItemStatus = action(
  z.object({
    backlogItemId: z.string(),
    status: z.enum(['TO_PLAY', 'PLAYING', 'COMPLETED', 'PLAYED']),
  }),
  async ({ backlogItemId, status }) => {
    const updatedItem = await prisma.backlogItem.update({
      where: { id: backlogItemId },
      data: { status },
    });
    
    return { success: true, data: updatedItem };
  }
);
```

## Database Queries

Database queries are used for data fetching and are implemented using Prisma ORM.

Example of a database query:

```typescript
// features/collection/collection-queries.ts
import { prisma } from '../../prisma/client';

export async function getUserCollection(userId: string) {
  return prisma.backlogItem.findMany({
    where: {
      userId,
      status: {
        not: 'WISHLIST',
      },
    },
    include: {
      game: {
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
          screenshots: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}
```

## UI Components

UI components are implemented using React and Chakra UI. Feature-specific components are stored in the feature directory, while shared components are stored in the `shared/components/` directory.

## Data Flow

The data flow in a typical feature follows this pattern:

1. UI component triggers a server action
2. Server action validates input using Zod
3. Server action performs database operations using Prisma
4. Server action returns result to the UI component
5. UI component updates based on the result

## Adding a New Feature

To add a new feature to the application:

1. Create a new directory in `features/` with a descriptive name
2. Create the necessary files for the feature:
   - `*-actions.ts`: Server actions
   - `*-queries.ts`: Database queries
   - Components as needed
3. Create routes in the `app/` directory if needed
4. Update navigation components to include the new feature

### Example: Adding a "Reviews" Feature

1. Create a new directory: `features/reviews/`
2. Create the necessary files:
   - `reviews-actions.ts`: Server actions for creating/updating reviews
   - `reviews-queries.ts`: Database queries for fetching reviews
   - `ReviewForm.tsx`: Component for submitting reviews
   - `ReviewList.tsx`: Component for displaying reviews
3. Create a route: `app/(app)/reviews/page.tsx`
4. Update navigation to include a link to the reviews page

## Feature Integration

Features can interact with each other through:

1. **Shared database models**: Features can access the same database models
2. **Server actions**: Features can call server actions from other features
3. **Context providers**: Features can share state through context providers
4. **URL parameters**: Features can pass data through URL parameters

## Best Practices

When implementing features:

1. **Separation of concerns**: Keep feature code isolated from other features
2. **Type safety**: Use TypeScript and Zod for type safety
3. **Error handling**: Implement proper error handling in server actions
4. **Loading states**: Handle loading states in UI components
5. **Validation**: Validate user input using Zod
6. **Testing**: Write tests for server actions and UI components
7. **Documentation**: Document feature functionality and API

## Feature Testing

Features should be tested at multiple levels:

1. **Unit tests**: Test individual functions and components
2. **Integration tests**: Test feature interactions
3. **End-to-end tests**: Test complete user flows

## Feature Documentation

Each feature should include documentation:

1. **Purpose**: What problem does the feature solve?
2. **User flows**: How do users interact with the feature?
3. **API**: What actions and queries does the feature expose?
4. **Dependencies**: What other features or services does the feature depend on?
5. **Future improvements**: What enhancements are planned for the feature? 