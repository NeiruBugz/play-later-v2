# 07 - Database Query Optimization

## Problem Statement

The codebase has **database performance issues** including N+1 queries, missing indexes, inconsistent transaction usage, and inefficient query patterns that will impact performance as the application scales.

### Current Database Performance Issues

#### ❌ Issue 1: N+1 Query Patterns

```typescript
// features/view-collection/server-actions/get-game-with-backlog-items.ts
// This could result in N+1 queries when loading games with their backlog items
const games = await prisma.game.findMany({
  where: { /* filters */ },
});

// Then for each game, another query to get backlog items
const gamesWithBacklogItems = await Promise.all(
  games.map(async (game) => {
    const backlogItems = await prisma.backlogItem.findMany({
      where: { gameId: game.id },
    });
    return { ...game, backlogItems };
  })
);
```

#### ❌ Issue 2: Missing Query Optimization

```typescript
// Inefficient query without proper includes or selects
const user = await prisma.user.findUnique({
  where: { id: userId },
  // ❌ Fetches all fields when only some are needed
  // ❌ Doesn't include related data in single query
});

const backlogItems = await prisma.backlogItem.findMany({
  where: { userId },
  // ❌ Missing includes for related game data
  // ❌ No pagination for potentially large datasets
});
```

#### ❌ Issue 3: Inconsistent Transaction Usage

```typescript
// domain/backlog-item/service.ts
// Multiple database operations without transaction
export async function create(input: CreateBacklogItemInput, userId: string) {
  // ❌ These operations should be in a transaction
  const game = await GameService.findOrCreate(input.gameData);
  const backlogItem = await prisma.backlogItem.create({
    data: { ...input.backlogItem, gameId: game.id, userId },
  });

  // ❌ If this fails, previous operations are not rolled back
  await updateUserStats(userId);

  return backlogItem;
}
```

## Database Optimization Strategies

### 1. Eliminate N+1 Queries with Proper Includes

#### ✅ Optimized Collection Queries

```typescript
// features/view-collection/server-actions/get-game-with-backlog-items.ts (Optimized)
"use server";

import { authenticatedActionClient } from "@/shared/lib/safe-action-client";
import { prisma } from "@/shared/lib/db";
import { z } from "zod";

const GetCollectionSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  status: z.enum(["TO_PLAY", "PLAYING", "COMPLETED", "WISHLIST"]).optional(),
  platform: z.string().optional(),
  search: z.string().optional(),
});

export const getUserGamesWithBacklogItems = authenticatedActionClient
  .metadata({
    actionName: "getUserGamesWithBacklogItems",
  })
  .inputSchema(GetCollectionSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const { page, limit, status, platform, search } = parsedInput;
    const skip = (page - 1) * limit;

    // ✅ Single optimized query with proper includes
    const [games, totalCount] = await Promise.all([
      prisma.backlogItem.findMany({
        where: {
          userId,
          ...(status && { status }),
          ...(platform && { platform }),
          ...(search && {
            game: {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
          }),
        },
        include: {
          game: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              igdbId: true,
              description: true,
              // Only select needed fields
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      // ✅ Count query with same filters
      prisma.backlogItem.count({
        where: {
          userId,
          ...(status && { status }),
          ...(platform && { platform }),
          ...(search && {
            game: {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
          }),
        },
      }),
    ]);

    return {
      games: games.map(item => ({
        ...item.game,
        backlogItem: {
          id: item.id,
          status: item.status,
          platform: item.platform,
          startedAt: item.startedAt,
          completedAt: item.completedAt,
          createdAt: item.createdAt,
        },
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    };
  });
```

### 2. Transaction-Based Service Layer

#### ✅ Domain Service with Proper Transactions

```typescript
// domain/backlog-item/service.ts (Enhanced with transactions)
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/shared/lib/db";
import { wrapWithResult } from "@/domain/shared/result";
import { DatabaseError, ValidationError } from "@/domain/shared/errors";

export class BacklogItemService {
  static async create(
    input: CreateBacklogItemInput,
    userId: string
  ): Promise<Result<BacklogItem, DomainError>> {
    return wrapWithResult(
      async () => {
        // ✅ Use transaction for multiple operations
        const result = await prisma.$transaction(async (tx) => {
          // Check for existing backlog item
          const existing = await tx.backlogItem.findFirst({
            where: {
              userId,
              gameId: input.gameId,
            },
          });

          if (existing) {
            throw new ValidationError("Game already in collection");
          }

          // Create backlog item
          const backlogItem = await tx.backlogItem.create({
            data: {
              ...input.backlogItem,
              gameId: input.gameId,
              userId,
            },
            include: {
              game: {
                select: {
                  id: true,
                  title: true,
                  coverImage: true,
                },
              },
            },
          });

          // Update user statistics
          await tx.user.update({
            where: { id: userId },
            data: {
              lastActivityAt: new Date(),
            },
          });

          return backlogItem;
        });

        return result;
      },
      {
        operation: "createBacklogItem",
        metadata: { userId, gameId: input.gameId },
      }
    );
  }

  static async updateWithStatusChange(
    id: number,
    updates: UpdateBacklogItemInput,
    userId: string
  ): Promise<Result<BacklogItem, DomainError>> {
    return wrapWithResult(
      async () => {
        return await prisma.$transaction(async (tx) => {
          // Verify ownership and get current item
          const currentItem = await tx.backlogItem.findFirst({
            where: { id, userId },
            include: {
              game: {
                select: { title: true },
              },
            },
          });

          if (!currentItem) {
            throw new ValidationError("Backlog item not found or access denied");
          }

          // Update the backlog item
          const updatedItem = await tx.backlogItem.update({
            where: { id },
            data: {
              ...updates,
              updatedAt: new Date(),
            },
            include: {
              game: {
                select: {
                  id: true,
                  title: true,
                  coverImage: true,
                },
              },
            },
          });

          // Log activity if status changed
          if (updates.status && updates.status !== currentItem.status) {
            await tx.activity.create({
              data: {
                userId,
                type: "STATUS_CHANGE",
                gameId: currentItem.gameId,
                metadata: {
                  from: currentItem.status,
                  to: updates.status,
                  gameName: currentItem.game.title,
                },
              },
            });
          }

          return updatedItem;
        });
      },
      {
        operation: "updateBacklogItem",
        metadata: { id, userId },
      }
    );
  }

  static async batchUpdateStatus(
    itemIds: number[],
    status: BacklogItemStatus,
    userId: string
  ): Promise<Result<{ updated: number }, DomainError>> {
    return wrapWithResult(
      async () => {
        return await prisma.$transaction(async (tx) => {
          // Verify all items belong to user
          const userItems = await tx.backlogItem.findMany({
            where: {
              id: { in: itemIds },
              userId,
            },
            select: { id: true },
          });

          if (userItems.length !== itemIds.length) {
            throw new ValidationError("Some items not found or access denied");
          }

          // Batch update
          const updateResult = await tx.backlogItem.updateMany({
            where: {
              id: { in: itemIds },
              userId,
            },
            data: {
              status,
              updatedAt: new Date(),
            },
          });

          return { updated: updateResult.count };
        });
      },
      {
        operation: "batchUpdateBacklogItems",
        metadata: { itemIds, userId },
      }
    );
  }
}
```

### 3. Query Builder for Complex Queries

#### ✅ Type-Safe Query Builder

```typescript
// shared/lib/database/backlog-query-builder.ts
import { Prisma } from "@prisma/client";

export class BacklogQueryBuilder {
  private where: Prisma.BacklogItemWhereInput = {};
  private include: Prisma.BacklogItemInclude = {};
  private orderBy: Prisma.BacklogItemOrderByWithRelationInput[] = [];

  forUser(userId: string): this {
    this.where.userId = userId;
    return this;
  }

  withStatus(status: Prisma.BacklogItemStatus): this {
    this.where.status = status;
    return this;
  }

  withPlatform(platform: string): this {
    this.where.platform = platform;
    return this;
  }

  withSearch(searchTerm: string): this {
    this.where.game = {
      title: {
        contains: searchTerm,
        mode: "insensitive",
      },
    };
    return this;
  }

  includeGame(fields?: Prisma.GameSelect): this {
    this.include.game = {
      select: fields || {
        id: true,
        title: true,
        coverImage: true,
        igdbId: true,
        description: true,
      },
    };
    return this;
  }

  includeReviews(): this {
    this.include.reviews = {
      select: {
        id: true,
        rating: true,
        content: true,
        createdAt: true,
      },
    };
    return this;
  }

  sortByCreated(order: "asc" | "desc" = "desc"): this {
    this.orderBy.push({ createdAt: order });
    return this;
  }

  sortByTitle(order: "asc" | "desc" = "asc"): this {
    this.orderBy.push({ game: { title: order } });
    return this;
  }

  build(pagination?: { skip?: number; take?: number }) {
    return {
      where: this.where,
      include: this.include,
      orderBy: this.orderBy,
      ...pagination,
    };
  }
}

// Usage examples
export const createUserCollectionQuery = (
  userId: string,
  filters: {
    status?: Prisma.BacklogItemStatus;
    platform?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) => {
  const query = new BacklogQueryBuilder()
    .forUser(userId)
    .includeGame()
    .sortByCreated();

  if (filters.status) query.withStatus(filters.status);
  if (filters.platform) query.withPlatform(filters.platform);
  if (filters.search) query.withSearch(filters.search);

  const pagination = {
    skip: filters.page ? (filters.page - 1) * (filters.limit || 20) : 0,
    take: filters.limit || 20,
  };

  return query.build(pagination);
};
```

### 4. Database Indexes and Performance

#### ✅ Required Database Indexes

```sql
-- Database migration for performance indexes
-- prisma/migrations/add_performance_indexes/migration.sql

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "BacklogItem_userId_status_idx" ON "BacklogItem"("userId", "status");
CREATE INDEX IF NOT EXISTS "BacklogItem_userId_platform_idx" ON "BacklogItem"("userId", "platform");
CREATE INDEX IF NOT EXISTS "BacklogItem_userId_createdAt_idx" ON "BacklogItem"("userId", "createdAt" DESC);

-- Game search performance
CREATE INDEX IF NOT EXISTS "Game_title_idx" ON "Game" USING gin(to_tsvector('english', "title"));
CREATE INDEX IF NOT EXISTS "Game_igdbId_idx" ON "Game"("igdbId");

-- Review queries
CREATE INDEX IF NOT EXISTS "Review_gameId_createdAt_idx" ON "Review"("gameId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt" DESC);

-- User activity tracking
CREATE INDEX IF NOT EXISTS "User_lastActivityAt_idx" ON "User"("lastActivityAt" DESC);
```

#### ✅ Prisma Schema Updates

```prisma
// prisma/schema.prisma (Enhanced with indexes)
model BacklogItem {
  id            Int              @id @default(autoincrement())
  userId        String
  gameId        String
  status        BacklogItemStatus
  platform      String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  // Relationships
  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  game          Game             @relation(fields: [gameId], references: [id], onDelete: Cascade)

  // Performance indexes
  @@index([userId, status])
  @@index([userId, platform])
  @@index([userId, createdAt(sort: Desc)])
  @@index([gameId])
  @@unique([userId, gameId]) // Prevent duplicates
}

model Game {
  id            String           @id @default(cuid())
  title         String
  igdbId        Int?             @unique
  description   String?
  coverImage    String?
  createdAt     DateTime         @default(now())

  // Relationships
  backlogItems  BacklogItem[]
  reviews       Review[]

  // Performance indexes
  @@index([igdbId])
  @@index([title])
}
```

### 5. Query Performance Monitoring

#### ✅ Database Query Logging

```typescript
// shared/lib/database/query-monitor.ts
import { PrismaClient } from "@prisma/client";

export const createMonitoredPrismaClient = () => {
  const prisma = new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "event",
        level: "error",
      },
    ],
  });

  // Monitor slow queries
  prisma.$on("query", (e) => {
    const duration = Number(e.duration);

    if (duration > 100) { // Log queries slower than 100ms
      console.warn("Slow query detected:", {
        query: e.query,
        params: e.params,
        duration: `${duration}ms`,
        timestamp: e.timestamp,
      });
    }

    // Track query patterns for optimization
    if (process.env.NODE_ENV === "development") {
      console.log("Query:", {
        query: e.query.substring(0, 100) + "...",
        duration: `${duration}ms`,
      });
    }
  });

  // Log database errors
  prisma.$on("error", (e) => {
    console.error("Database error:", {
      message: e.message,
      target: e.target,
      timestamp: e.timestamp,
    });
  });

  return prisma;
};
```

## Database Migration Strategy

### Phase 1: Index Creation (Week 1)

1. Add performance indexes for common query patterns
2. Update Prisma schema with proper index definitions
3. Monitor query performance before/after

### Phase 2: Query Optimization (Week 2)

1. Eliminate N+1 queries in collection views
2. Optimize server actions with proper includes
3. Add query builders for complex operations

### Phase 3: Transaction Implementation (Week 3)

1. Wrap multi-step operations in transactions
2. Add proper error handling for transaction failures
3. Implement batch operations for better performance

### Phase 4: Monitoring & Optimization (Week 4)

1. Implement query performance monitoring
2. Add database connection pooling optimization
3. Set up alerts for slow queries

## Critical Database Performance Issues

### High Priority

- `features/view-collection/server-actions/get-game-with-backlog-items.ts` - N+1 query patterns
- `domain/backlog-item/service.ts` - Missing transactions for multi-step operations
- Collection queries without proper pagination and filtering

### Medium Priority

- User statistics calculations without proper aggregation
- Review queries without includes for related data
- Missing database indexes for common query patterns

## Benefits After Database Optimization

- ✅ **Improved Response Times**: Faster page loads and API responses
- ✅ **Better Scalability**: Efficient queries handle larger datasets
- ✅ **Data Consistency**: Transactions ensure data integrity
- ✅ **Resource Efficiency**: Reduced database load and connection usage

---

**Next Document**: [08-caching-performance-strategies.md](./08-caching-performance-strategies.md)
