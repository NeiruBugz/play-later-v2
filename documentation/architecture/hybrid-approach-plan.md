# Hybrid Approach: Server Actions and Route Handlers

**Date**: 2025-08-20
**Purpose**: Define a modern, hybrid approach for utilizing both Server Actions and Route Handlers to improve the architecture, decoupling, and reusability of the codebase.

## 1. Introduction

The current architecture heavily relies on Server Actions for all client-server communication. While Server Actions are excellent for mutations and form submissions that are tightly coupled to the UI, they are not always the best choice for all use cases. This document proposes a hybrid approach that combines the strengths of both Server Actions and Route Handlers, and introduces a service layer to decouple business logic.

## 2. Core Principles

- **Hybrid Model**: We will use both Server Actions and Route Handlers, choosing the right tool for the job.
- **Service Layer**: We will introduce a service layer to encapsulate business logic and data access, making it reusable and independent of the presentation layer.
- **Dependency Injection**: We will use a simple dependency injection pattern to provide services to the presentation layer, making the code more modular and testable.

## 3. The Hybrid Model in Practice

### When to Use Server Actions

- **UI-Coupled Mutations**: For operations that directly result from user interactions with the UI and lead to a state change, such as form submissions.
- **Examples**:
  - Adding a game to the collection.
  - Updating user settings.
  - Submitting a review.

### When to Use Route Handlers

- **API Endpoints**: For exposing data to third-party services, other clients (e.g., a mobile app), or for any functionality that needs a standard API endpoint.
- **Data Fetching (Queries)**: For all data fetching operations. This allows for client-side data fetching libraries, caching, and a better user experience.
- **Webhooks**: For receiving incoming requests from external services.

## 4. The Service Layer

To support this hybrid model, we will create a service layer that will be consumed by both Server Actions and Route Handlers.

- **Structure**: The service layer will be located in `shared/services` and will be organized by domain (e.g., `game-management`, `integration`, `user`).
- **Implementation**: Each service will be a class that encapsulates a specific set of business logic. Services can be composed of other services or repositories.
- **Example**:

  ```typescript
  // shared/services/game-management.ts
  export class GameManagementService {
    constructor(private db: PrismaClient) {}

    async getGame(id: number) {
      return this.db.game.findUnique({ where: { id } });
    }

    // ... other methods
  }
  ```

## 5. Refactoring Plan

We will refactor the existing codebase to adopt this new architecture. The main goal is to resolve the existing boundary violations and create a more maintainable and scalable system.

### Phase 1: Implement the Service Layer

1.  **Create the Service Layer**: Create the `shared/services` directory and implement the initial services based on the existing business logic in the Server Actions.
2.  **Refactor Server Actions**: Refactor the existing Server Actions to use the new service layer. This will centralize the business logic and make the Server Actions thinner.

### Phase 2: Introduce Route Handlers for Queries

1.  **Identify Queries**: Identify all Server Actions that are used for data fetching (queries).
2.  **Create Route Handlers**: Create new Route Handlers for these queries in the `app/api` directory.
3.  **Update the Frontend**: Update the frontend components to use a client-side data fetching library (e.g., SWR or React Query) to call the new Route Handlers.

### Detailed Breakdown of Changes

#### Queries to be Refactored into Route Handlers

- **Dashboard**: All data fetching for the dashboard will be moved to Route Handlers under `/api/dashboard/`.
- **Game Details**: `get-game`, `get-reviews`, `get-backlog-items-by-igdb-id` will be moved to Route Handlers under `/api/games/`.
- **Collection**: `get-game-with-backlog-items`, `get-uniques-platforms` will be moved to Route Handlers under `/api/collection/`.
- **And more...**: A complete list is provided in the appendix.

#### Mutations to Remain as Server Actions

- **`add-review/create-review`**
- **`manage-backlog-item/action`** (edit backlog item)
- **`manage-backlog-item/create-backlog-item`**
- **`manage-integrations/remove-steam-data-from-user`**
- **`manage-user-info/edit-user-action`**
- **`view-imported-games/enrich-with-igdb-data`**
- **`view-imported-games/import-to-application`**

## 6. Benefits of this Approach

- **Resolves Boundary Violations**: By introducing a service layer and a clear separation between queries and mutations, we will naturally resolve the existing architectural boundary violations.
- **Improved Testability**: The service layer will be easy to test in isolation.
- **Better Scalability and Maintainability**: The new architecture will be more modular and easier to extend with new features.
- **Improved User Experience**: Using Route Handlers for queries will enable better caching, parallel data fetching, and a more responsive UI.

## 7. Appendix: Complete List of Refactoring Candidates

(This section will contain the detailed list of all server actions and their proposed refactoring, as previously discussed.)
