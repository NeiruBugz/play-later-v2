# App Router Layer

This directory contains the Next.js 15 App Router - the HTTP adapter layer that handles routing, page rendering, and API endpoints.

## Purpose

The App Router is a **thin adapter layer** that:
- Defines URL routes and page structure
- Renders React Server Components
- Delegates business logic to features and services
- Handles HTTP concerns (caching, headers, responses)

## Directory Structure

```
app/
├── (protected)/          # Route group requiring authentication
│   ├── dashboard/        # User dashboard
│   ├── library/          # Game library management
│   └── profile/          # User profile and settings
├── api/                  # API route handlers
│   ├── auth/             # NextAuth endpoints
│   ├── games/            # Game search and details
│   └── library/          # Library operations
├── games/                # Public game pages
│   ├── search/           # Game search page
│   └── [slug]/           # Dynamic game detail page
├── login/                # Authentication page
├── layout.tsx            # Root layout
├── page.tsx              # Home page
├── error.tsx             # Error boundary
├── not-found.tsx         # 404 page
└── loading.tsx           # Loading state
```

## Architectural Rules

### What Belongs Here
- Page components (`page.tsx`)
- Layout components (`layout.tsx`)
- Loading states (`loading.tsx`)
- Error boundaries (`error.tsx`, `global-error.tsx`)
- Not found pages (`not-found.tsx`)
- API route handlers (`route.ts`)

### What Does NOT Belong Here
- Business logic (use services/use-cases)
- Data fetching logic (use features/services)
- Reusable UI components (use `shared/components/`)
- Form handling (use server actions in features)

## Import Rules

```typescript
// ✅ Allowed imports
import { SomeFeatureComponent } from "@/features/some-feature/ui";
import { getGameDetails } from "@/features/game-detail/use-cases";
import { GameService } from "@/data-access-layer/services";
import { Button } from "@/shared/components/ui/button";

// ❌ NOT allowed
import { gameRepository } from "@/data-access-layer/repository";  // Use services
import { prisma } from "@/shared/lib/db";                         // Never direct Prisma
```

## API Routes

API routes live in `app/api/` and should:
1. Import handlers from `@/data-access-layer/handlers/`
2. Return `NextResponse` with appropriate status codes
3. Use `unstable_cache` for cacheable GET requests

```typescript
// app/api/games/search/route.ts
import { gameSearchHandler } from "@/data-access-layer/handlers";

export async function GET(request: Request) {
  const result = await gameSearchHandler.search(params);

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.error.status });
  }

  return NextResponse.json(result.data);
}
```

## Server Components vs Client Components

- **Default to Server Components** - No `'use client'` directive
- **Use Client Components only when needed**:
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (localStorage, window)
  - React hooks (useState, useEffect)
  - Third-party client libraries

## Caching Strategy

```typescript
// Server-side caching for API routes
import { unstable_cache } from "next/cache";

const getCachedData = unstable_cache(
  async (params) => service.getData(params),
  ["cache-key"],
  { revalidate: 300, tags: ["data-tag"] }
);
```

## Testing

- **No tests in `app/` directory** - Logic should be in features/services
- Page components are tested via E2E tests in `/e2e`
- API routes are tested via handler tests in `data-access-layer/handlers/`

## Common Patterns

### Protected Routes
Use the `(protected)` route group with a layout that checks authentication:

```typescript
// app/(protected)/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/login");
  return <>{children}</>;
}
```

### Dynamic Routes
Use `[param]` for dynamic segments:

```typescript
// app/games/[slug]/page.tsx
export default async function GamePage({ params }: { params: { slug: string } }) {
  const result = await getGameDetails({ slug: params.slug });
  // ...
}
```

### Loading States
Each route can have its own loading state:

```typescript
// app/games/[slug]/loading.tsx
export default function Loading() {
  return <GameDetailSkeleton />;
}
```
