# Play Later V2 - Repository Layer Analysis

**Generated on:** January 10, 2025  
**Tool:** Claude Code  
**Analysis Type:** Repository Pattern Implementation Review

## Executive Summary

The repository layer in Play Later V2 shows a solid foundation with TypeScript typing and organized structure, but suffers from inconsistent patterns, responsibility violations, and unclear error handling boundaries. The implementation mixes pure data access patterns with business logic, leading to architectural confusion and potential maintainability issues.

## Critical Issues 🔴

### 1. **Inconsistent Error Handling Strategy**
- **Mixed Approaches**: Some functions throw errors, others return null/undefined
- **Boundary Confusion**: Repository layer handles both data access and business validation errors
- **Server Action Impact**: Inconsistent repository errors result in poor server action error handling

**Examples:**
```typescript
// Throws error (inconsistent with pattern)
export async function deleteBacklogItem({ backlogItemId, userId }) {
  const item = await prisma.backlogItem.findUnique({ where: { id: backlogItemId, userId } });
  if (!item) {
    throw new Error("Backlog item not found"); // Should this be here?
  }
  return prisma.backlogItem.delete({ where: { id: backlogItemId } });
}

// Returns null (different pattern)
export async function findGameById({ id }) {
  return await prisma.game.findUnique({ where: { id } }); // Returns null if not found
}
```

### 2. **Repository Acting as Use Cases/Services**
- **Business Logic Contamination**: Repository functions contain complex business operations
- **Transaction Management**: Repository handles multi-step operations inappropriately
- **External API Integration**: IGDB API calls mixed with data access

**Critical Example:**
```typescript
// This is a USE CASE, not a repository function!
export async function findOrCreateGameByIgdbId({ igdbId }) {
  try {
    return await findGameByIgdbId({ igdbId });
  } catch {
    const gameInfo = await igdbApi.getGameById(igdbId); // External API call!
    // ... complex game creation logic
    return await createGame({ game: gameInput });
  }
}
```

## High Priority Issues 🟠

### 3. **Naming Inconsistencies**
- **Mixed Patterns**: `findGameById` vs `getAllReviewsForGame` vs `getUserBySteamId`
- **Unclear Prefixes**: Some use `get`, others `find`, others have no prefix
- **Inconsistent Suffixes**: `ByUsername`, `ForUser`, `ByIgdbId`

**Inconsistent Naming Examples:**
```typescript
// Inconsistent query prefixes
getUserBySteamId()     // get*
findGameById()         // find*
getAllReviewsForGame() // getAll*

// Inconsistent relationship naming
getBacklogByUsername()     // *ByUsername
findWishlistItemsForUser() // *ForUser
getRecentlyCompletedBacklogItems() // no relationship suffix
```

### 4. **Responsibility Violations**
- **Data Transformation**: Business logic mixed with data access
- **Validation Logic**: Domain validation in repository layer
- **External Dependencies**: API calls and complex processing

**Examples:**
```typescript
// Business logic in repository
export async function addGameToUserBacklog({ userId, igdbId, backlogItem }) {
  return await prisma.$transaction(async () => {
    const game = await findOrCreateGameByIgdbId({ igdbId }); // Use case logic!
    await createBacklogItem({ backlogItem, userId, gameId: game.id });
    return game;
  });
}
```

### 5. **Type System Issues**
- **Complex Input Types**: Overly specific input types that couple to business logic
- **Mixed Concerns**: Types mixing data access and business domain concepts
- **Inconsistent Return Types**: Some wrapped, some direct Prisma types

## Medium Priority Issues 🟡

### 6. **Performance Anti-Patterns**
- **N+1 Queries**: Missing strategic `include` statements
- **Inefficient Pagination**: Manual skip/take calculation in multiple places
- **Missing Indexes**: Complex queries without corresponding database indexes
- **Overfetching**: Select * patterns when specific fields needed

### 7. **Testing Implications**
- **Hard to Mock**: Complex functions with multiple concerns difficult to test
- **Coupled Dependencies**: External API calls make unit testing complex
- **Inconsistent Interfaces**: Different error patterns require different test approaches

## Architectural Recommendations 📋

### 1. **Establish Clear Error Handling Strategy**

**Option A: Repository Returns Result Types (Recommended)**
```typescript
type RepositoryResult<T> = {
  data: T | null;
  error: string | null;
}

// Repository never throws, always returns result
export async function findBacklogItem({ id, userId }): Promise<RepositoryResult<BacklogItem>> {
  try {
    const item = await prisma.backlogItem.findUnique({ where: { id, userId } });
    return { data: item, error: null };
  } catch (error) {
    return { data: null, error: "Database error" };
  }
}
```

**Option B: Repository Returns Data, Service Layer Handles Business Logic**
```typescript
// Repository: Pure data access, throws only on technical errors
export async function findBacklogItem({ id, userId }): Promise<BacklogItem | null> {
  return prisma.backlogItem.findUnique({ where: { id, userId } });
}

// Service Layer: Business logic and validation
export async function deleteBacklogItemUseCase({ id, userId }) {
  const item = await backlogRepository.findBacklogItem({ id, userId });
  if (!item) {
    throw new BusinessError("Backlog item not found");
  }
  return backlogRepository.deleteBacklogItem({ id });
}
```

### 2. **Standardize Function Naming**

**Proposed Naming Convention:**
```typescript
// CRUD Operations
create{Entity}()     // createBacklogItem()
find{Entity}By{Key}() // findBacklogItemById(), findBacklogItemsByUserId()
update{Entity}()     // updateBacklogItem()
delete{Entity}()     // deleteBacklogItem()

// Queries
get{Entity}Count()   // getBacklogItemCount()
list{Entities}()     // listBacklogItems() (with pagination)
exists{Entity}()     // existsBacklogItem()

// Aggregations
aggregate{Entity}{Property}() // aggregateReviewRatings()
```

### 3. **Extract Use Cases/Services**

**Create Service Layer for Complex Operations:**
```typescript
// services/game-service.ts
export class GameService {
  async findOrCreateByIgdbId(igdbId: number): Promise<Game> {
    const existingGame = await gameRepository.findByIgdbId(igdbId);
    if (existingGame) return existingGame;
    
    const gameData = await igdbApi.getGameById(igdbId);
    return gameRepository.create(gameData);
  }
}

// Keep repository pure
export async function findByIgdbId(igdbId: number): Promise<Game | null> {
  return prisma.game.findUnique({ where: { igdbId } });
}
```

### 4. **Simplify Type System**

**Create Consistent Input/Output Types:**
```typescript
// Base patterns
type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateInput<T> = Partial<T> & { id: string | number };
type FindOptions = {
  include?: string[];
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
};
```

## Implementation Priority 📊

### Phase 1: Critical Fixes (Week 1-2)
1. **Standardize Error Handling**: Choose and implement consistent error strategy
2. **Extract Use Cases**: Move complex business logic to service layer
3. **Fix Naming**: Standardize function naming across all repositories

### Phase 2: Structural Improvements (Week 3-4)
1. **Simplify Types**: Refactor input/output types for consistency
2. **Performance Optimization**: Add proper includes and pagination
3. **Testing Support**: Ensure all functions are easily mockable

### Phase 3: Enhancement (Week 5-6)
1. **Result Types**: Implement result pattern if chosen
2. **Service Layer**: Complete extraction of business logic
3. **Documentation**: Add comprehensive JSDoc for all repository functions

## Error Handling Recommendation 🎯

**Recommended Approach**: Repository returns data/null, Service layer handles business errors

**Rationale:**
1. **Clear Separation**: Repository = data access, Service = business logic
2. **Easier Testing**: Each layer has single responsibility
3. **Better Error Messages**: Service layer can provide domain-specific errors
4. **Consistent Server Actions**: All business errors handled at service level

**Example Implementation:**
```typescript
// Repository: Pure data access
export async function findBacklogItem(id: number, userId: string) {
  return prisma.backlogItem.findUnique({ where: { id, userId } });
}

// Service: Business logic
export async function deleteBacklogItemUseCase(id: number, userId: string) {
  const item = await findBacklogItem(id, userId);
  if (!item) {
    throw new Error("Backlog item not found"); // Business error
  }
  return deleteBacklogItem(id);
}

// Server Action: Error handling
export const deleteBacklogItemAction = authorizedActionClient
  .action(async ({ parsedInput: { id }, ctx: { userId } }) => {
    try {
      await deleteBacklogItemUseCase(id, userId);
      RevalidationService.revalidateCollection();
    } catch (error) {
      // Properly handle business errors vs technical errors
      if (error.message === "Backlog item not found") {
        return { serverError: error.message };
      }
      throw error; // Re-throw technical errors
    }
  });
```

## Conclusion

The repository layer needs architectural refactoring to establish clear boundaries between data access, business logic, and error handling. The current mixed approach creates confusion and maintenance challenges. Implementing the recommended separation will improve testability, maintainability, and overall code quality.

**Impact Assessment:**
- **High Impact**: Error handling and naming standardization
- **Medium Impact**: Service layer extraction
- **Low Impact**: Type system improvements

**Estimated Effort:** 3-4 weeks for complete refactoring
**Risk Level:** Medium (requires coordinated changes across server actions)