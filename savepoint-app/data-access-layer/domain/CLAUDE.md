# Domain Layer

This directory contains domain models, mappers, and enums that represent the core business entities of the application.

## Purpose

The Domain Layer:
- Defines domain models independent of persistence (Prisma)
- Provides mappers to transform between Prisma models and domain types
- Contains business-relevant enums and value objects
- Enables clean separation between database schema and application logic

## Directory Structure

```
domain/
├── index.ts              # Main exports
│
├── library/
│   ├── library-item.mapper.ts    # Prisma → Domain mapping
│   ├── library-item.domain.ts    # Domain model definitions
│   └── types.ts                  # Type exports
│
├── journal/
│   ├── journal-entry.mapper.ts
│   ├── journal-entry.domain.ts
│   └── types.ts
│
└── platform/
    ├── platform.mapper.ts
    ├── platform.domain.ts
    └── types.ts
```

## Core Concepts

### Domain Models vs Prisma Models

Prisma models are database-centric; domain models are business-centric:

```typescript
// Prisma Model (generated)
interface PrismaLibraryItem {
  id: string;
  userId: string;
  gameId: string;
  status: string;           // Database stores as string
  acquisitionType: string;
  createdAt: Date;
  updatedAt: Date;
}

// Domain Model (defined here)
interface LibraryItemDomain {
  id: string;
  userId: string;
  gameId: string;
  status: LibraryItemStatus;      // Typed enum
  acquisitionType: AcquisitionType;
  createdAt: Date;
  updatedAt: Date;
}
```

### Mappers

Mappers transform between Prisma and domain representations:

```typescript
// library-item.mapper.ts
import type { LibraryItem as PrismaLibraryItem } from "@prisma/client";
import type { LibraryItemDomain } from "./types";
import { LibraryItemStatus, AcquisitionType } from "./library-item.domain";

export class LibraryItemMapper {
  static toDomain(prisma: PrismaLibraryItem): LibraryItemDomain {
    return {
      id: prisma.id,
      userId: prisma.userId,
      gameId: prisma.gameId,
      status: prisma.status as LibraryItemStatus,
      acquisitionType: prisma.acquisitionType as AcquisitionType,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    };
  }

  static toPrisma(domain: LibraryItemDomain): PrismaLibraryItem {
    return {
      id: domain.id,
      userId: domain.userId,
      gameId: domain.gameId,
      status: domain.status,
      acquisitionType: domain.acquisitionType,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toDomainList(items: PrismaLibraryItem[]): LibraryItemDomain[] {
    return items.map(this.toDomain);
  }
}
```

### Enums

Define business-relevant enums:

```typescript
// library-item.domain.ts
export enum LibraryItemStatus {
  BACKLOG = "backlog",
  PLAYING = "playing",
  COMPLETED = "completed",
  DROPPED = "dropped",
  ON_HOLD = "on_hold",
}

export enum AcquisitionType {
  PURCHASED = "purchased",
  GIFTED = "gifted",
  SUBSCRIPTION = "subscription",
  FREE = "free",
}
```

## Usage in Services

Services use mappers to work with domain types:

```typescript
// In LibraryService
import { LibraryItemMapper } from "@/data-access-layer/domain";
import { findLibraryItemsByUserId } from "@/data-access-layer/repository";

export class LibraryService extends BaseService {
  async getLibraryItems(userId: string) {
    const prismaItems = await findLibraryItemsByUserId(userId);
    const domainItems = LibraryItemMapper.toDomainList(prismaItems);
    return this.success({ items: domainItems });
  }
}
```

## Current Domain Models

| Domain | Models | Enums |
|--------|--------|-------|
| Library | `LibraryItemDomain` | `LibraryItemStatus`, `AcquisitionType` |
| Journal | `JournalEntryDomain` | `JournalMood`, `JournalVisibility` |
| Platform | `PlatformDomain` | - |

## Adding a New Domain Model

1. Create directory: `domain/[entity]/`
2. Define domain model: `[entity].domain.ts`
3. Create mapper: `[entity].mapper.ts`
4. Export types: `types.ts`
5. Add to `domain/index.ts`

### Template

```typescript
// domain/review/review.domain.ts
export enum ReviewRating {
  EXCEPTIONAL = 5,
  GOOD = 4,
  AVERAGE = 3,
  POOR = 2,
  TERRIBLE = 1,
}

export interface ReviewDomain {
  id: string;
  userId: string;
  gameId: string;
  rating: ReviewRating;
  content: string;
  createdAt: Date;
}

// domain/review/review.mapper.ts
import type { Review as PrismaReview } from "@prisma/client";
import type { ReviewDomain } from "./review.domain";

export class ReviewMapper {
  static toDomain(prisma: PrismaReview): ReviewDomain {
    return {
      id: prisma.id,
      userId: prisma.userId,
      gameId: prisma.gameId,
      rating: prisma.rating as ReviewRating,
      content: prisma.content,
      createdAt: prisma.createdAt,
    };
  }
}

// domain/review/types.ts
export type { ReviewDomain } from "./review.domain";
export { ReviewRating } from "./review.domain";
export { ReviewMapper } from "./review.mapper";

// domain/index.ts
export * from "./review/types";
```

## Architectural Rules

### What Belongs Here
- Domain model interfaces
- Business enums and value objects
- Mappers between Prisma and domain types
- Domain-specific validation logic (if any)

### What Does NOT Belong Here
- Prisma client usage (belongs in repository)
- Business logic (belongs in services)
- HTTP concerns (belongs in handlers)
- UI types (belongs in shared/types)

## Import Rules

```typescript
// ✅ Domain can import
import type { LibraryItem } from "@prisma/client";  // Types only

// ❌ Domain CANNOT import
import { prisma } from "@/shared/lib/db";           // No database access
import { SomeService } from "../services";           // No services
```

## Testing

Domain mappers are typically tested via service unit tests. For complex mapping logic, add unit tests:

```typescript
// library-item.mapper.test.ts
import { LibraryItemMapper } from "./library-item.mapper";
import { LibraryItemStatus } from "./library-item.domain";

describe("LibraryItemMapper", () => {
  it("correctly maps status enum", () => {
    const prismaItem = { status: "playing", /* ... */ };
    const domain = LibraryItemMapper.toDomain(prismaItem);
    expect(domain.status).toBe(LibraryItemStatus.PLAYING);
  });
});
```

## Exports

All domain types and mappers are exported from `index.ts`:

```typescript
// domain/index.ts
export * from "./library/types";
export * from "./journal/types";
export * from "./platform/types";
```
