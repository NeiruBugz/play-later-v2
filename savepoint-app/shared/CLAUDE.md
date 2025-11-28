# Shared Layer

This directory contains reusable, domain-agnostic code shared across the application: UI components, utilities, types, hooks, and configuration.

## Purpose

The Shared Layer:
- Provides reusable UI components (shadcn/ui based)
- Contains utility functions and helpers
- Defines shared TypeScript types
- Holds application-wide configuration
- Exports common React hooks

## Directory Structure

```
shared/
├── components/
│   ├── ui/                   # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── design-system/        # Design system components
│   ├── game-card/            # Reusable game card
│   ├── header.tsx            # App header
│   ├── mobile-nav.tsx        # Mobile navigation
│   └── ...
│
├── types/
│   ├── game.ts               # Game-related types
│   ├── library.ts            # Library types
│   ├── journal.ts            # Journal types
│   ├── platform.ts           # Platform types
│   ├── profile.ts            # Profile types
│   ├── igdb.ts               # IGDB API types
│   ├── steam.ts              # Steam API types
│   └── index.ts              # Re-exports
│
├── lib/
│   ├── index.ts              # Main export
│   ├── auth/                 # Auth utilities
│   │   ├── get-server-user-id.ts
│   │   └── credentials-callbacks.ts
│   ├── app/
│   │   ├── db.ts             # Prisma client singleton
│   │   └── logger.ts         # Pino logger setup
│   ├── ui/
│   │   ├── cn.ts             # Tailwind class merge
│   │   └── tailwind-merge.ts
│   ├── game/                 # Game utilities
│   ├── platform/             # Platform mappers
│   ├── storage/              # S3 client
│   ├── validation/           # Zod helpers
│   ├── steam/                # Steam API client
│   ├── rate-limit.ts         # Rate limiting
│   ├── date.ts               # Date utilities
│   └── server-action/
│       └── safe-action.ts    # Next-safe-action setup
│
├── hooks/
│   ├── use-media-query.ts    # Responsive design
│   ├── use-mobile.tsx        # Mobile detection
│   ├── use-debounced-value.ts
│   └── use-form-submission.ts
│
├── config/
│   ├── fonts.ts              # Font configuration
│   ├── image.config.ts       # Image optimization
│   ├── http-codes.ts         # HTTP status codes
│   └── igdb.ts               # IGDB API config
│
├── constants/
│   ├── api.ts                # API constants
│   ├── game.ts               # Game constants
│   ├── pagination.ts         # Pagination defaults
│   ├── validation.ts         # Validation rules
│   └── index.ts
│
├── providers/
│   └── providers.tsx         # Root providers (TanStack Query, etc.)
│
└── globals.css               # Global Tailwind + styles
```

## Architectural Rules

### What Belongs Here
- UI components reused across features
- Utility functions (date, string, validation)
- Shared TypeScript types
- Application configuration
- Common React hooks
- Third-party library wrappers

### What Does NOT Belong Here
- Feature-specific components (use `features/[name]/ui/`)
- Business logic (use services)
- Data access (use repository)
- Feature-specific types (use `features/[name]/types.ts`)

## Import Patterns

```typescript
// From features or app
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/tailwind-merge";
import type { Game } from "@/shared/types";
import { useMediaQuery } from "@/shared/hooks";
import { PAGINATION } from "@/shared/constants";
```

## Key Utilities

### Logger

```typescript
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

// In services
const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "GameService" });

// In server actions
const logger = createLogger({ [LOGGER_CONTEXT.SERVER_ACTION]: "addGame" });

// Usage
logger.info({ gameId }, "Game added successfully");
logger.error({ error: err }, "Failed to add game");
```

### Tailwind Class Merge

```typescript
import { cn } from "@/shared/lib/tailwind-merge";

<div className={cn("base-class", isActive && "active-class", className)} />
```

### Auth Helpers

```typescript
import { getServerUserId } from "@/shared/lib/auth";

const userId = await getServerUserId();
if (!userId) redirect("/login");
```

### Safe Actions

```typescript
import { authorizedActionClient, actionClient } from "@/shared/lib/safe-action";

// Requires authentication
export const protectedAction = authorizedActionClient
  .schema(MySchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // userId is guaranteed to exist
  });

// Public action
export const publicAction = actionClient
  .schema(MySchema)
  .action(async ({ parsedInput }) => {
    // No auth required
  });
```

## Components

### shadcn/ui Components

Located in `components/ui/`. These are the base components from shadcn/ui:

```typescript
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Form, FormField, FormItem, FormLabel } from "@/shared/components/ui/form";
```

### Custom Components

Located directly in `components/`:

```typescript
import { GameCard } from "@/shared/components/game-card";
import { Header } from "@/shared/components/header";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { PlatformBadges } from "@/shared/components/platform-badges";
```

## Types

Shared types are organized by domain:

```typescript
// Game types
import type { Game, GameSearchResult, GameDetails } from "@/shared/types/game";

// Library types
import type { LibraryItem, LibraryStatus } from "@/shared/types/library";

// IGDB types
import type { IgdbGame, IgdbPlatform } from "@/shared/types/igdb";
```

## Hooks

```typescript
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { useMobile } from "@/shared/hooks/use-mobile";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

// Usage
const isMobile = useMobile();
const debouncedSearch = useDebouncedValue(searchTerm, 300);
const isLargeScreen = useMediaQuery("(min-width: 1024px)");
```

## Constants

```typescript
import { PAGINATION } from "@/shared/constants/pagination";
import { API_ENDPOINTS } from "@/shared/constants/api";
import { VALIDATION_RULES } from "@/shared/constants/validation";

// Usage
const items = await fetchItems({ limit: PAGINATION.DEFAULT_LIMIT });
```

## Adding New Shared Code

### Adding a Component

1. Create in appropriate location:
   - Base UI: `components/ui/`
   - Custom reusable: `components/`
2. Export from `index.ts` if applicable

### Adding a Utility

1. Create in `lib/[category]/`
2. Export from `lib/index.ts`

### Adding a Type

1. Add to appropriate file in `types/`
2. Export from `types/index.ts`

### Adding a Hook

1. Create in `hooks/`
2. Follow `use-` naming convention

## Testing

- Component tests: `*.test.tsx`
- Utility tests: `*.test.ts`
- Run with: `pnpm test shared/`

```typescript
// components/game-card/game-card.test.tsx
import { render, screen } from "@testing-library/react";
import { GameCard } from "./game-card";

describe("GameCard", () => {
  it("renders game title", () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(mockGame.name)).toBeInTheDocument();
  });
});
```
