# Shared Layer

Reusable, domain-agnostic code shared across the application: UI components, utilities, types, hooks, and configuration.

## What Belongs Here vs Elsewhere

| Here (shared/) | Elsewhere |
|----------------|-----------|
| UI primitives (shadcn/ui, loading, platform badges) | Feature-specific components -> `features/[name]/ui/` |
| Utility functions (date, string, validation) | Business logic -> services |
| Shared TypeScript enums and primitive types | Domain types -> `features/[name]/types.ts` |
| Application config & constants | Data access -> repository |
| Generic React hooks (debounce, media query, form) | Domain hooks -> `features/[name]/hooks/` |
| | Compound display components -> `widgets/` |

## Key Utilities

| Utility | Import | Notes |
|---------|--------|-------|
| Prisma client | `@/shared/lib/db` | Singleton instance |
| Logger (Pino) | `createLogger` from `@/shared/lib` | Use `LOGGER_CONTEXT.SERVICE`, `.HANDLER`, `.SERVER_ACTION` |
| Tailwind merge | `cn` from `@/shared/lib/tailwind-merge` | Class merging utility |
| Auth helper | `getServerUserId` from `@/shared/lib/auth` | Returns userId or null; redirect if null |
| Safe actions | `authorizedActionClient`, `actionClient` from `@/shared/lib/safe-action` | next-safe-action setup |
| Rate limiting | `@/shared/lib/rate-limit` | For API routes |

## Components

- `components/ui/` -- shadcn/ui base components (Button, Dialog, Input, Form, etc.)
- `components/` -- Generic reusable components (BrowserBackButton, GameCoverImage, PlatformBadges, SkipToContent, SpeedInsights, ThemeToggle)

## What Moved Out

These were previously in `shared/` and have been relocated to follow FSD conventions:

| Former Location | New Location |
|----------------|-------------|
| `components/GameCard` | `widgets/game-card/` |
| `components/GenreBadges` | `widgets/game-card/ui/` |
| `components/Header`, `MobileNav` | `widgets/header/` |
| `components/CommandPalette` | `features/command-palette/` |
| `lib/profile/` | `features/profile/lib/` |
| `lib/game/` | Removed (dead code) |
| Profile server actions | `features/profile/server-actions/` |
| Profile UI components | `features/profile/ui/` |

## Types

Organized by domain in `types/`: `game.ts`, `library.ts`, `journal.ts`, `platform.ts`, `profile.ts`, `igdb.ts`, `steam.ts`, `collection.ts`, `statistics.ts`, `ui.ts`. Only shared enums and primitive types belong here; domain-specific types live in their feature.

## Hooks

| Hook | Purpose |
|------|---------|
| `useCommandPalette` | Command palette open/close state |
| `useMediaQuery` | Responsive design breakpoints |
| `useDebouncedValue` | Debounced input values |
| `useFormSubmission` | Form submission state |

## Constants

Organized in `constants/`: `api.ts`, `game.ts`, `pagination.ts`, `validation.ts`. Re-exported from `constants/index.ts`.

## Adding New Shared Code

- **Component**: Base UI -> `components/ui/`, custom reusable -> `components/`
- **Utility**: `lib/[category]/`, export from `lib/index.ts`
- **Type**: `types/[domain].ts`, export from `types/index.ts`
- **Hook**: `hooks/use-[name].ts`

## Testing

- Component tests: `*.test.tsx` (jsdom environment)
- Utility tests: `*.test.ts`
- Run with: `pnpm test shared/`
