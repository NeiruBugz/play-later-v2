# Feature Structure Standard

**Version**: 1.0
**Date**: 2025-10-08
**Status**: Official Standard

---

## Standard Feature Structure

All features in the `features/` directory must follow this standardized structure:

```
features/[feature-name]/
├── components/              # React components (required for UI features)
│   ├── [feature]-main.tsx
│   ├── [feature]-form.tsx
│   └── ...
├── server-actions/          # Server actions (Pattern 1) OR
├── hooks/                   # React Query hooks (Pattern 2)
│   └── use-[feature].ts
├── lib/                     # Feature-specific utilities and validation
│   ├── validation.ts        # ⚠️ REQUIRED for features with server actions/API routes
│   ├── utils.ts             # Optional: feature-specific utilities
│   └── constants.ts         # Optional: feature-specific constants
├── types.ts                 # ⚠️ Flat file (NOT /types/ directory unless >5 definitions)
├── index.ts                 # Public exports
├── CLAUDE.md                # Feature documentation
└── PRD.md                   # Optional: Product requirements
```

---

## Directory Rules

### Required Directories

1. **`components/`** (Required for UI features)
   - Must contain React components
   - File naming: kebab-case (e.g., `user-profile-form.tsx`)
   - Component naming: PascalCase (e.g., `UserProfileForm`)

2. **`server-actions/`** (Required for Pattern 1 features)
   - Must contain server action files
   - File naming: kebab-case (e.g., `create-user.ts`)
   - Each file exports one primary action
   - Must include `index.ts` for organized exports

3. **`lib/`** (Required for features with validation)
   - **`validation.ts`** (Required): All Zod schemas
   - `utils.ts` (Optional): Feature-specific utilities
   - `constants.ts` (Optional): Feature-specific constants

### Optional Directories

4. **`hooks/`** (Optional: Pattern 2 features only)
   - Contains React Query hooks
   - File naming: `use-[feature-name].ts`
   - Example: `use-imported-games.ts`

### Forbidden Patterns

❌ **NO `/validation/` directory** - Use `/lib/validation.ts` instead
❌ **NO `/types/` directory** - Use flat `types.ts` file unless >5 type definitions
❌ **NO nested sub-features** - Flatten into single feature with organized structure

---

## File Conventions

### `types.ts` (Flat File)

**Rule**: Use a flat `types.ts` file for feature-specific types.

**When to use `/types/` directory**:

- Only if feature has >5 type files
- Only if types are logically grouped into categories
- Must still export all types from `types.ts` index

**Example `types.ts`**:

```typescript
// features/add-review/types.ts

import { Game, Review } from "@prisma/client";

export type ReviewFormData = {
  gameId: string;
  rating: number;
  content?: string;
  isPublic?: boolean;
};

export type ReviewWithGame = Review & {
  game: Pick<Game, "id" | "title" | "coverImage">;
};

export type CreateReviewInput = Omit<Review, "id" | "createdAt" | "updatedAt">;
```

### `lib/validation.ts` (Required)

**Rule**: All Zod schemas must be in `lib/validation.ts`.

**Example**:

```typescript
// features/add-review/lib/validation.ts

import { z } from "zod";

export const createReviewSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  rating: z.number().min(1).max(10),
  content: z.string().max(5000).optional(),
  isPublic: z.boolean().default(false),
});

export const updateReviewSchema = createReviewSchema.partial().extend({
  id: z.string().min(1),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
```

### `server-actions/index.ts` (Required)

**Rule**: All server actions must be exported from `server-actions/index.ts`.

**Example**:

```typescript
// features/add-review/server-actions/index.ts

export { createReviewAction } from "./create-review";
export { updateReviewAction } from "./update-review";
export { deleteReviewAction } from "./delete-review";
```

### `index.ts` (Feature Exports)

**Rule**: Feature must export public API from `index.ts`.

**Example**:

```typescript
// features/add-review/index.ts

// Components
export { CreateReviewForm } from "./components/create-review-form";
export { ReviewList } from "./components/review-list";

// Server Actions (Pattern 1)
export * from "./server-actions";

// Hooks (Pattern 2, if applicable)
export { useReviews } from "./hooks/use-reviews";

// Types (public types only)
export type { ReviewWithGame, ReviewFormData } from "./types";
```

---

## Pattern-Specific Structures

### Pattern 1: Server Actions (Default)

```
features/[feature-name]/
├── components/
│   └── [feature]-form.tsx
├── server-actions/
│   ├── create-[entity].ts
│   ├── update-[entity].ts
│   ├── delete-[entity].ts
│   └── index.ts
├── lib/
│   └── validation.ts          # Required
├── types.ts
├── index.ts
└── CLAUDE.md
```

**Required Files**:

- ✅ `lib/validation.ts` - Zod schemas for server actions
- ✅ `server-actions/index.ts` - Export all actions
- ✅ `index.ts` - Public API

### Pattern 2: API Routes + React Query

```
features/[feature-name]/
├── components/
│   └── [feature]-list.tsx
├── hooks/
│   └── use-[feature].ts        # React Query hook
├── lib/
│   └── validation.ts           # Shared with API route
├── types.ts
├── index.ts
└── CLAUDE.md

app/api/[feature-name]/
└── route.ts                    # API route handler
```

**Required Files**:

- ✅ `lib/validation.ts` - Shared schemas (used by API route and hook)
- ✅ `hooks/use-[feature].ts` - React Query hook
- ✅ `app/api/[feature-name]/route.ts` - API route handler
- ✅ `index.ts` - Public API

---

## Server Action Standards

### Server Action File Template

```typescript
// features/[feature]/server-actions/[action-name].ts
"use server";

import { [Service] } from "@/shared/services";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { [schema] } from "../lib/validation";
import { revalidatePath } from "next/cache";

/**
 * [Action description]
 *
 * This is a thin wrapper around [Service].
 * Feature-specific validation stays here.
 *
 * @param input - [Input description]
 * @returns [Return description]
 */
export const [actionName] = authorizedActionClient
  .metadata({
    actionName: "[actionName]",
    requiresAuth: true,
  })
  .inputSchema([schema])
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // 1. Instantiate service
    const service = new [Service]();

    // 2. Call service method (business logic in service)
    const result = await service.[method]({
      ...parsedInput,
      userId,
    });

    // 3. Revalidate cache if needed
    revalidatePath("/[path]", "page");

    // 4. Return result
    return result;
  });
```

**Key Principles**:

1. Server actions are thin wrappers around services
2. Validation is feature-specific and stays in the action
3. Business logic lives in the service layer
4. Always revalidate cache after mutations

---

## API Route Standards

### API Route File Template

```typescript
// app/api/[feature]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getServerUserId } from "@/auth";
import { [Service] } from "@/shared/services";
import { [schema] } from "@/features/[feature]/lib/validation";

/**
 * GET /api/[feature]
 *
 * [Route description]
 * This is a thin wrapper around [Service].
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // 1. Authenticate
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Validate request parameters
    const parsedInput = [schema].safeParse({
      // Extract from searchParams
    });

    if (!parsedInput.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsedInput.error.format() },
        { status: 400 }
      );
    }

    // 3. Call service (business logic in service)
    const service = new [Service]();
    const result = await service.[method]({
      userId,
      ...parsedInput.data,
    });

    // 4. Return response
    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Key Principles**:

1. API routes are thin wrappers around services
2. Always authenticate first
3. Validate all inputs with Zod
4. Business logic lives in the service layer
5. Consistent error handling

---

## Service Layer Integration (Required)

### ❌ FORBIDDEN: Direct Repository Calls

```typescript
// ❌ BAD - Server action calling repository directly
import { getLibraryRepository } from "@/shared/lib/repository";

export const getLibraryItems = authorizedActionClient.action(
  async ({ ctx: { userId } }) => {
    const repo = getLibraryRepository();
    return repo.findMany({ where: { userId } }); // ❌ Bypasses service layer
  }
);
```

### ✅ REQUIRED: Service Layer Calls

```typescript
// ✅ GOOD - Server action calling service
import { LibraryService } from "@/shared/services";

export const getLibraryItems = authorizedActionClient.action(
  async ({ ctx: { userId } }) => {
    const libraryService = new LibraryService();
    return libraryService.getLibraryItems({ userId }); // ✅ Uses service layer
  }
);
```

---

## Documentation Standards

### `CLAUDE.md` (Required)

Every feature must have a `CLAUDE.md` file documenting:

1. **Feature Overview**
   - Purpose and description
   - Core functionality
   - User journey

2. **Architecture**
   - Pattern used (1 or 2)
   - Component hierarchy
   - Data flow

3. **Key Files**
   - Components with descriptions
   - Server actions/API routes
   - Services used
   - Types and validation

4. **Integration Points**
   - External dependencies
   - Internal feature dependencies
   - Service layer usage

5. **Testing Strategy**
   - Unit tests
   - Integration tests
   - E2E tests (if applicable)

6. **Development Guidelines**
   - Adding new functionality
   - Common patterns
   - Performance considerations

**Template**: See `features/add-review/CLAUDE.md` for example

---

## Compliance Checklist

Use this checklist to verify feature compliance:

### Structure Compliance

- [ ] Components in `/components/` directory
- [ ] Server actions in `/server-actions/` OR hooks in `/hooks/`
- [ ] Validation in `/lib/validation.ts` (NOT `/validation/`)
- [ ] Types in `types.ts` file (NOT `/types/` directory, unless >5 files)
- [ ] Public exports in `index.ts`
- [ ] Documentation in `CLAUDE.md`

### Service Layer Compliance

- [ ] No direct repository imports in server actions
- [ ] No direct repository imports in API routes
- [ ] All server actions call service layer
- [ ] All API routes call service layer
- [ ] Services properly instantiated

### Code Quality Compliance

- [ ] All files use TypeScript
- [ ] All functions have JSDoc comments
- [ ] All server actions have metadata
- [ ] All validation uses Zod schemas
- [ ] All tests passing
- [ ] TypeScript compiles with zero errors
- [ ] Linter passes with zero errors

### Documentation Compliance

- [ ] `CLAUDE.md` exists and is complete
- [ ] Service layer usage documented
- [ ] Data flow documented
- [ ] Integration points documented
- [ ] Pattern choice (1 or 2) documented

---

## Automated Compliance Checker

### Bash Script

```bash
#!/bin/bash
# check-feature-compliance.sh

FEATURE_DIR=$1

echo "Checking compliance for: $FEATURE_DIR"
echo "---"

# Check required files
echo "📁 Structure Compliance:"
[ -d "$FEATURE_DIR/components" ] && echo "  ✅ /components/" || echo "  ❌ /components/ missing"
[ -f "$FEATURE_DIR/lib/validation.ts" ] && echo "  ✅ /lib/validation.ts" || echo "  ⚠️  /lib/validation.ts missing (required for server actions)"
[ -f "$FEATURE_DIR/types.ts" ] && echo "  ✅ types.ts" || echo "  ℹ️  types.ts not found"
[ -f "$FEATURE_DIR/index.ts" ] && echo "  ✅ index.ts" || echo "  ❌ index.ts missing"
[ -f "$FEATURE_DIR/CLAUDE.md" ] && echo "  ✅ CLAUDE.md" || echo "  ❌ CLAUDE.md missing"

# Check forbidden patterns
echo ""
echo "🚫 Forbidden Patterns:"
[ -d "$FEATURE_DIR/validation" ] && echo "  ❌ /validation/ directory found (use /lib/validation.ts)" || echo "  ✅ No /validation/ directory"
[ -d "$FEATURE_DIR/types" ] && echo "  ⚠️  /types/ directory found (flatten to types.ts unless >5 files)" || echo "  ✅ No /types/ directory"

# Check service layer usage
echo ""
echo "🔧 Service Layer Integration:"
if grep -r "from ['\"]@/shared/lib/repository" "$FEATURE_DIR" > /dev/null 2>&1; then
  echo "  ❌ Direct repository imports found!"
  grep -rn "from ['\"]@/shared/lib/repository" "$FEATURE_DIR"
else
  echo "  ✅ No direct repository imports"
fi

if grep -r "from ['\"]@/shared/services" "$FEATURE_DIR" > /dev/null 2>&1; then
  echo "  ✅ Service layer imports found"
else
  echo "  ⚠️  No service layer imports (verify if intentional)"
fi

echo ""
echo "---"
echo "Compliance check complete for $FEATURE_DIR"
```

### Usage

```bash
# Check single feature
./check-feature-compliance.sh features/add-review

# Check all features
for feature in features/*/; do
  ./check-feature-compliance.sh "$feature"
  echo ""
done
```

---

## Migration Guide

### From Non-Standard to Standard Structure

#### Step 1: Audit Current Structure

```bash
# Run compliance checker
./check-feature-compliance.sh features/[feature-name]
```

#### Step 2: Fix Validation Location

```bash
# If /validation/ directory exists
mkdir -p features/[feature-name]/lib
mv features/[feature-name]/validation/* features/[feature-name]/lib/validation.ts
rmdir features/[feature-name]/validation

# Update imports
find features/[feature-name] -type f -exec sed -i '' 's|../validation/|../lib/validation|g' {} +
```

#### Step 3: Flatten Types Directory

```bash
# If /types/ directory exists and has <5 files
cat features/[feature-name]/types/*.ts > features/[feature-name]/types.ts
rm -rf features/[feature-name]/types/

# Update imports
find features/[feature-name] -type f -exec sed -i '' 's|from "../types/|from "../types|g' {} +
find features/[feature-name] -type f -exec sed -i '' 's|from "./types/|from "./types|g' {} +
```

#### Step 4: Add Service Layer Integration

```typescript
// Before
import { getUserRepository } from "@/shared/lib/repository";
// After
import { UserService } from "@/shared/services";

export const getUser = authorizedActionClient.action(
  async ({ ctx: { userId } }) => {
    const repo = getUserRepository();
    return repo.findById(userId);
  }
);

export const getUser = authorizedActionClient.action(
  async ({ ctx: { userId } }) => {
    const userService = new UserService();
    return userService.getUser(userId);
  }
);
```

#### Step 5: Verify Compliance

```bash
# Run compliance checker again
./check-feature-compliance.sh features/[feature-name]

# Run tests
pnpm run test features/[feature-name]

# Type check
pnpm typecheck
```

---

## Examples

### ✅ Good Example: `add-review`

```
features/add-review/
├── components/
│   ├── create-review-form.tsx
│   └── review-card.tsx
├── server-actions/
│   ├── create-review.ts
│   ├── update-review.ts
│   ├── delete-review.ts
│   └── index.ts
├── lib/
│   └── validation.ts
├── types.ts
├── index.ts
├── CLAUDE.md
└── PRD.md
```

**Why it's good**:

- ✅ Validation in `/lib/validation.ts`
- ✅ Types in flat `types.ts` file
- ✅ Server actions organized with index
- ✅ Complete documentation
- ✅ Public exports in `index.ts`

### ❌ Bad Example (Before Refactor): `manage-library-item`

```
features/manage-library-item/
├── create-library-item/          ❌ Nested sub-feature
│   ├── components/
│   ├── server-actions/
│   └── lib/
├── edit-library-item/             ❌ Nested sub-feature
│   ├── components/
│   ├── server-actions/
│   └── lib/
├── delete-library-item/           ❌ Nested sub-feature
│   ├── components/
│   └── server-actions/
├── CLAUDE.md
└── PRD.md
```

**Why it's bad**:

- ❌ Nested sub-features (non-standard)
- ❌ Difficult to share validation/types
- ❌ Inconsistent with other features
- ❌ Deep import paths

### ❌ Bad Example (Before Refactor): `view-imported-games`

```
features/view-imported-games/
├── components/
├── hooks/
├── validation/                    ❌ Should be /lib/validation.ts
│   └── search-params-schema.ts
├── index.ts
└── CLAUDE.md
```

**Why it's bad**:

- ❌ Validation in `/validation/` instead of `/lib/validation.ts`
- Breaks convention used by other features

---

## Reference

### Complete Feature Examples

1. **Pattern 1 (Server Actions)**: `features/add-review/`
2. **Pattern 2 (React Query)**: `features/view-imported-games/` (after standardization)
3. **Complex Feature**: `features/dashboard/`

### Related Documentation

- [Two-Pattern Architecture Guide](./two-pattern-architecture.md)
- [Service Layer Guide](../../product/service-layer-guide.md)
- [Migration Guide](../../product/migration-guide.md)
- [Architecture Overview](../../product/architecture.md)

---

**Document Owner**: Architecture Team
**Last Updated**: 2025-10-08
**Review Schedule**: After each feature standardization
