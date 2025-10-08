# Feature Architecture Audit

**Date**: 2025-10-08
**Status**: Analysis Complete
**Next Action**: Implement standardization plan

---

## Executive Summary

This audit reveals significant architectural inconsistencies across the features directory that must be addressed before proceeding with service layer migration. While a service layer has been implemented, **zero features currently use it**, with all server actions calling repositories directly. Additionally, a hybrid pattern has emerged with `view-imported-games` using React Query + API routes, creating two distinct architectural approaches.

### Critical Findings

1. **Service Layer Not Used**: All features bypass the service layer and call repositories directly
2. **Inconsistent Structure**: Features use different directory conventions for validation, types, and utilities
3. **Hybrid Patterns**: Mix of Server Actions and API Routes + React Query without clear guidelines
4. **Nested vs Flat**: `manage-library-item` has 3 nested sub-features while others are flat

---

## Feature Inventory

### Feature Structure Analysis

| Feature               | Components | Server Actions | Validation       | Types       | Hooks | Notes                      |
| --------------------- | ---------- | -------------- | ---------------- | ----------- | ----- | -------------------------- |
| `add-game`            | ✅         | ✅             | `/lib` ✅        | `/types` ⚠️ | ❌    | Standard structure         |
| `add-review`          | ✅         | ✅             | `/lib` ✅        | ❌          | ❌    | Standard structure         |
| `dashboard`           | ✅         | ✅             | `/lib` ✅        | `/types` ⚠️ | ❌    | Standard structure         |
| `gaming-goals`        | ✅         | ✅             | `/lib`           | `/types` ⚠️ | ❌    | Incomplete feature         |
| `landing`             | ✅         | ❌             | ❌               | ❌          | ❌    | Pure UI component          |
| `manage-integrations` | ✅         | ✅             | `/lib` ✅        | ❌          | ❌    | Standard structure         |
| `manage-library-item` | ✅         | ✅             | `/lib` ✅        | ❌          | ❌    | **Nested sub-features** 🔴 |
| `manage-user-info`    | ✅         | ✅             | `/lib` ✅        | ❌          | ❌    | Standard structure         |
| `share-wishlist`      | ✅         | ❌             | ❌               | ❌          | ❌    | Pure UI component          |
| `sign-in`             | ✅         | ❌             | ❌               | ❌          | ❌    | Pure UI component          |
| `steam-integration`   | ✅         | ✅             | `/lib`           | `/types` ⚠️ | ❌    | Standard structure         |
| `theme-toggle`        | ✅         | ❌             | ❌               | ❌          | ❌    | Pure UI component          |
| `view-backlogs`       | ✅         | ✅             | ❌               | ❌          | ❌    | Missing validation         |
| `view-collection`     | ✅         | ✅             | `/lib` ✅        | ❌          | ✅    | Standard structure         |
| `view-game-details`   | ✅         | ✅             | `/lib` ✅        | ❌          | ❌    | Standard structure         |
| `view-imported-games` | ✅         | ✅             | `/validation` 🔴 | ❌          | ✅    | **React Query pattern** 🔴 |
| `view-wishlist`       | ✅         | ✅             | `/lib`           | `/types` ⚠️ | ❌    | Standard structure         |

**Legend:**

- ✅ = Present and correctly located
- ⚠️ = Present but should be flattened (use `types.ts` instead of `/types/` directory)
- 🔴 = Non-standard requiring refactor
- ❌ = Not present (may be intentional)

---

## Architecture Pattern Analysis

### Current State: Two Emerging Patterns

#### Pattern 1: Server Actions (Dominant - 14 features)

```
Next.js Page (RSC)
    ↓
Server Action (features/[feature]/server-actions/)
    ↓
Repository Layer (shared/lib/repository/) ⚠️ BYPASSES SERVICES
    ↓
Prisma → PostgreSQL
```

**Features using this pattern:**

- `add-game`, `add-review`, `dashboard`, `manage-integrations`
- `manage-library-item`, `manage-user-info`, `steam-integration`
- `view-backlogs`, `view-collection`, `view-game-details`, `view-wishlist`

**Issues:**

- ❌ All bypass service layer completely
- ❌ Business logic scattered across server actions
- ❌ Repository functions called directly from server actions

#### Pattern 2: API Routes + React Query (Experimental - 1 feature)

```
Next.js Page (Client Component)
    ↓
React Query Hook (features/[feature]/hooks/)
    ↓
API Route Handler (app/api/[feature]/route.ts)
    ↓
Repository Layer (shared/lib/repository/) ⚠️ BYPASSES SERVICES
    ↓
Prisma → PostgreSQL
```

**Features using this pattern:**

- `view-imported-games` (recently refactored - see `REFACTOR.md`)

**Benefits documented:**

- ✅ Better client-side caching (30s stale time, 5min garbage collection)
- ✅ Optimistic updates for better UX
- ✅ Simplified component code (~100 lines removed)
- ✅ Background data refreshing without blocking UI

**Issues:**

- ❌ Still bypasses service layer
- ⚠️ Only one feature uses this pattern (no consistency)
- ⚠️ No guidelines on when to use this vs Server Actions

---

## Detailed Feature Issues

### 🔴 Critical: `manage-library-item` Structure

**Current Structure:**

```
manage-library-item/
├── create-library-item/
│   ├── components/
│   ├── server-actions/
│   └── lib/
├── edit-library-item/
│   ├── components/
│   ├── server-actions/
│   └── lib/
├── delete-library-item/
│   ├── components/
│   └── server-actions/
├── CLAUDE.md
└── PRD.md
```

**Problems:**

1. Nested sub-features create deep import paths
2. Difficult to share types and validation across sub-features
3. Inconsistent with all other features (flat structure)
4. Harder to maintain and test

**Recommended Refactor:**

```
manage-library-item/
├── components/
│   ├── create-library-item-form.tsx
│   ├── edit-library-item-form.tsx
│   └── delete-library-item-dialog.tsx
├── server-actions/
│   ├── create-library-item.ts
│   ├── edit-library-item.ts
│   └── delete-library-item.ts
├── lib/
│   └── validation.ts (shared schemas)
├── types.ts
├── index.ts
├── CLAUDE.md
└── PRD.md
```

### 🔴 Critical: `view-imported-games` Validation Location

**Current:** `/features/view-imported-games/validation/search-params-schema.ts`
**Standard:** `/features/view-imported-games/lib/validation.ts`

**Impact:**

- Breaks convention used by 11 other features
- Harder to find validation schemas
- Inconsistent import paths

**Fix:** Move validation into `/lib/validation.ts`

### ⚠️ Minor: Types Directory vs File

**Features with `/types/` directory:**

- `add-game`, `dashboard`, `gaming-goals`, `steam-integration`, `view-wishlist`

**Recommendation:** Flatten to `types.ts` unless feature has >5 type definitions

---

## Service Layer Usage Analysis

### Expected Flow (Per Architecture Docs)

```
Server Action / API Route
    ↓
Service Layer (shared/services/)
    ↓
Repository Layer (shared/lib/repository/)
    ↓
Database
```

### Actual Flow (All Features)

```
Server Action / API Route
    ↓
❌ BYPASSES SERVICE LAYER ❌
    ↓
Repository Layer (shared/lib/repository/)
    ↓
Database
```

### Evidence

**Grep Results:**

```bash
# Search for service layer imports in features
grep -r "from ['"@]/shared/services" features/
# Result: No files found

# Search for repository imports in features
grep -r "from ['"@]/shared/lib/repository" features/
# Result: 40+ files importing repositories directly
```

**Example - Dashboard Server Action:**

```typescript
// features/dashboard/server-actions/get-backlog-items-count.ts
import { getLibraryCount } from "@/shared/lib/repository"; // ❌ Direct repository import

export const getLibraryItemsCount = authorizedActionClient.action(
  async ({ parsedInput, ctx: { userId } }) => {
    return getLibraryCount({ userId, status: parsedInput.status }); // ❌ Direct call
  }
);
```

**What It Should Be:**

```typescript
import { LibraryService } from "@/shared/services"; // ✅ Service import

export const getLibraryItemsCount = authorizedActionClient.action(
  async ({ parsedInput, ctx: { userId } }) => {
    const libraryService = new LibraryService();
    return libraryService.getLibraryItemCount(userId, {
      status: parsedInput.status,
    }); // ✅ Service call
  }
);
```

### Impact

1. **Business Logic Scattered**: Each server action reimplements logic instead of sharing via services
2. **Difficult to Test**: Must mock repository layer instead of testing service layer in isolation
3. **Code Duplication**: Similar operations repeated across features
4. **Architecture Deviation**: Implementation doesn't match documented architecture

---

## App Directory Organization Analysis

### Current Route Structure

```
app/
├── (root)/
│   └── page.tsx                          # Dashboard
├── collection/
│   ├── (list-views)/                     # Route group
│   │   ├── imported/page.tsx             # Imported games list
│   │   ├── page.tsx                      # Main collection
│   │   └── wishlist/page.tsx             # Wishlist view
│   └── add-game/page.tsx                 # Add game form
├── backlog/
│   ├── page.tsx                          # User's own backlog
│   └── [username]/page.tsx               # Public shared backlog
├── game/
│   ├── [id]/page.tsx                     # Game details (internal)
│   └── external/[id]/page.tsx            # IGDB game preview
├── user/
│   └── settings/page.tsx                 # User settings
├── wishlist/
│   └── [username]/page.tsx               # Public shared wishlist
└── api/
    ├── auth/[...nextauth]/route.ts       # Auth endpoints
    ├── collection/route.ts               # Collection API
    ├── imported-games/route.ts           # Imported games API
    ├── igdb/                             # IGDB proxy endpoints
    └── steam/                            # Steam integration endpoints
```

### API Routes vs Server Actions

**API Routes (8 total):**

1. `/api/auth/[...nextauth]` - NextAuth.js authentication
2. `/api/collection` - Collection data (unclear usage)
3. `/api/imported-games` - Imported games with filtering (React Query)
4. `/api/igdb-search` - IGDB game search proxy
5. `/api/igdb/platforms` - Platform data
6. `/api/igdb/game/[id]` - Game details from IGDB
7. `/api/steam/connect` - Steam OAuth initiation
8. `/api/steam/callback` - Steam OAuth callback
9. `/api/steam/disconnect` - Disconnect Steam

**Observations:**

- `/api/collection` - Possibly redundant with server actions?
- `/api/imported-games` - Only used by React Query pattern
- Most features use Server Actions, not API routes
- API routes mainly for external integrations (IGDB, Steam, Auth)

### Route Group Analysis

**`collection/(list-views)/`** - Uses Next.js route groups effectively:

- Shared layout for collection views
- Clean URLs without `/list-views` segment
- Good pattern for related pages

**Recommendation:** Consider expanding route groups for other feature clusters

---

## Migration Complexity Assessment

### Easy Migrations (1-2 days each)

These features have simple CRUD operations and minimal business logic:

1. **`manage-user-info`** → UserService
   - Simple profile updates
   - Minimal validation
   - Already has tests

2. **`add-review`** → ReviewService
   - Single create operation
   - Straightforward validation
   - Service already implemented

3. **`view-wishlist`** → LibraryService
   - Read-only operations
   - Simple filtering
   - Minimal transformation

### Medium Migrations (3-5 days each)

These features have moderate complexity with multiple operations:

4. **`manage-library-item`** → LibraryService
   - Three operations (create/update/delete)
   - **Requires structure refactor first** (flatten nested sub-features)
   - Already has comprehensive tests
   - Validation consolidation needed

5. **`dashboard`** → Multiple Services (Library, Review, Game)
   - Multiple read operations
   - Service composition needed
   - Performance critical
   - Good candidate for caching strategy

6. **`view-game-details`** → GameService + ReviewService
   - Multiple data sources
   - Complex data aggregation
   - External API integration (IGDB)

### Complex Migrations (5-7 days each)

These features have complex logic or architectural decisions:

7. **`add-game`** → GameService + LibraryService
   - IGDB integration
   - Game creation + backlog addition
   - Complex validation
   - Multiple repository calls
   - Service composition needed

8. **`view-collection`** → LibraryService + CollectionService(?)
   - Complex filtering and sorting
   - May benefit from React Query pattern
   - Performance optimization needed
   - Possible candidate for Pattern 2 (API Routes + React Query)

9. **`steam-integration`** → GameService + LibraryService + UserService
   - External API integration
   - Bulk operations
   - Complex error handling
   - Transaction management needed

### Special Cases

10. **`view-imported-games`** - Already Refactored
    - **Decision needed:** Keep React Query pattern or migrate back?
    - **Recommendation:** Keep as example of Pattern 2
    - Only needs service layer integration (already has API route structure)

11. **`view-backlogs`** - Public Sharing Feature
    - Minimal business logic
    - Mostly read operations
    - Low priority for migration

12. **`share-wishlist`** - Public Sharing Feature
    - Pure UI component
    - May not need service layer

---

## Standardization Requirements

### Priority 1: Critical Structural Issues

1. **Flatten `manage-library-item` structure**
   - Consolidate 3 sub-features into single feature
   - Share validation and types
   - Simplify imports

2. **Move `view-imported-games/validation/` to `/lib/`**
   - Align with standard convention
   - Update imports in API route and hooks

3. **Flatten `/types/` directories to `types.ts` files**
   - Apply to: `add-game`, `dashboard`, `gaming-goals`, `steam-integration`, `view-wishlist`
   - Only keep directories if >5 type definitions

### Priority 2: Validation Standardization

1. **Ensure all features with server actions have `/lib/validation.ts`**
   - Currently missing: `view-backlogs`
   - Verify all others are correctly located

2. **Consolidate validation schemas**
   - Move feature-specific Zod schemas to `/lib/validation.ts`
   - Share common validation patterns

### Priority 3: Architecture Pattern Documentation

1. **Document when to use Pattern 1 vs Pattern 2**
   - Create decision tree
   - Add examples for each pattern
   - Update architecture guide

2. **Establish API route guidelines**
   - When to create API routes vs use Server Actions
   - RESTful conventions for routes
   - Error handling patterns

---

## Recommended Migration Order

### Phase 1: Standardization (Week 1)

**Goal:** All features follow consistent structure before service migration

1. Create standardization checklist
2. Flatten `manage-library-item` structure
3. Move `view-imported-games` validation to `/lib/`
4. Flatten `/types/` directories to files
5. Add missing validation files
6. Update all documentation

**Deliverable:** Consistent feature structure across all features

### Phase 2: Simple Service Migrations (Week 2)

**Goal:** Establish patterns with easy migrations

1. `add-review` → ReviewService (already exists)
2. `manage-user-info` → UserService (already exists)
3. `view-wishlist` → LibraryService (already exists)

**Deliverable:** 3 features using service layer, patterns established

### Phase 3: Medium Service Migrations (Week 3-4)

**Goal:** Apply patterns to more complex features

1. `manage-library-item` → LibraryService (post-structure-refactor)
2. `view-game-details` → GameService + ReviewService
3. `dashboard` → Multiple services (composition example)

**Deliverable:** 6 features using service layer, service composition patterns

### Phase 4: Complex Service Migrations (Week 5-6)

**Goal:** Handle most complex features

1. `add-game` → GameService + LibraryService
2. `steam-integration` → Multiple services + external API
3. `view-collection` → Evaluate for Pattern 2 (API Routes + React Query)

**Deliverable:** 9 features using service layer

### Phase 5: Final Migrations & Polish (Week 7)

**Goal:** Complete remaining features and quality checks

1. `view-backlogs` → LibraryService
2. `view-imported-games` → Add service layer (keep React Query)
3. Comprehensive testing
4. Performance optimization
5. Final documentation updates

**Deliverable:** All features using service layer, comprehensive tests, updated docs

---

## Architecture Decision: One Pattern or Two?

### Option A: Single Pattern (Server Actions Only)

**Pros:**

- Simpler architecture
- Single mental model
- Easier onboarding
- Consistent codebase

**Cons:**

- Lose benefits of client-side caching
- `view-imported-games` needs re-refactor (waste of work)
- Less flexibility for different use cases
- Might need client-side patterns eventually

### Option B: Two Patterns (Recommended)

**Pattern 1: Server Actions** (Default)

- Use for: Forms, mutations, server-rendered content
- Features: Most features (12+)

**Pattern 2: API Routes + React Query** (Advanced)

- Use for: Complex filtering, real-time updates, client-heavy UIs
- Features: `view-imported-games`, potentially `view-collection`

**Pros:**

- Flexibility to choose right tool for job
- Keep excellent work on `view-imported-games`
- Demonstrates modern React patterns
- Better for certain use cases (filtering, caching)

**Cons:**

- Two mental models to learn
- Need clear decision criteria
- More documentation needed

**Recommendation:** **Option B** with clear guidelines

---

## Decision Criteria for Choosing Pattern

### Use Server Actions (Pattern 1) When:

✅ Simple CRUD operations
✅ Form submissions
✅ Server-rendered pages
✅ SEO-critical pages
✅ Mutations that don't need optimistic updates
✅ Single-purpose operations

**Examples:** Create review, delete library item, update user profile

### Use API Routes + React Query (Pattern 2) When:

✅ Complex filtering/searching with many parameters
✅ Need client-side caching (repeated queries)
✅ Optimistic updates improve UX significantly
✅ Progressive loading/infinite scroll
✅ Real-time data updates
✅ Client-heavy interactions

**Examples:** Imported games list with advanced filtering, collection view with complex search

### When in Doubt: Use Server Actions (Pattern 1)

Default to simpler pattern unless specific benefits of Pattern 2 are needed.

---

## Open Questions

### 1. Service Layer Instantiation

**Question:** Should services be instantiated or use static methods?

**Option A: Instance-based (Current)**

```typescript
const libraryService = new LibraryService();
await libraryService.getLibraryItems({ userId });
```

**Option B: Static methods**

```typescript
await LibraryService.getLibraryItems({ userId });
```

**Recommendation:** Stick with instance-based for dependency injection flexibility

### 2. API Route `/api/collection`

**Question:** What is this route used for? Does it duplicate server action functionality?

**Action:** Audit usage and potentially remove if redundant

### 3. Shared Validation

**Question:** Should common validation patterns be extracted to `shared/lib/validation/`?

**Examples:** Pagination schemas, user ID validation, date range validation

**Recommendation:** Yes, create shared validation utilities

### 4. Transaction Management

**Question:** Where should database transactions be handled?

**Options:**

- A. Repository layer (current)
- B. Service layer
- C. Both (services orchestrate, repositories execute)

**Recommendation:** Option C - services orchestrate complex transactions, repositories handle single-entity transactions

---

## Success Criteria

### Structural Standardization ✅

- [ ] All features use `/lib/validation.ts` for validation (not `/validation/`)
- [ ] No nested sub-features (flatten `manage-library-item`)
- [ ] Types in `types.ts` files (flatten `/types/` directories unless >5 definitions)
- [ ] Consistent directory structure across all features

### Service Layer Integration ✅

- [ ] Zero direct repository imports in server actions
- [ ] All server actions call service layer
- [ ] All API routes call service layer
- [ ] Services have >90% test coverage

### Architecture Clarity ✅

- [ ] Clear documentation of Pattern 1 vs Pattern 2
- [ ] Decision tree for pattern selection
- [ ] Examples of both patterns in docs
- [ ] Updated migration guide for both patterns

### Code Quality ✅

- [ ] All features have passing tests
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes with >80% coverage

---

## Next Steps

1. **Get Approval on Approach**
   - Confirm two-pattern architecture
   - Confirm migration order
   - Confirm standardization priorities

2. **Create Updated Task List**
   - Break down standardization tasks
   - Detailed migration tasks per feature
   - Testing requirements per phase

3. **Begin Phase 1: Standardization**
   - Start with structural fixes
   - Create standardization checklist
   - Document decisions

---

**Document Owner:** Architecture Team
**Last Updated:** 2025-10-08
**Status:** Ready for Review
