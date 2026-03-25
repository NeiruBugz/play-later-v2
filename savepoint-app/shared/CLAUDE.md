# Shared Layer

Reusable, domain-agnostic code shared across the application: UI components, utilities, types, hooks, and configuration.

## What Belongs Here vs Elsewhere

| Here (shared/) | Elsewhere |
|----------------|-----------|
| UI components reused across features | Feature-specific components → `features/[name]/ui/` |
| Utility functions (date, string, validation) | Business logic → services |
| Shared TypeScript types | Feature-specific types → `features/[name]/types.ts` |
| Application config & constants | Data access → repository |
| Common React hooks, third-party wrappers | |

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

- `components/ui/` — shadcn/ui base components (Button, Dialog, Input, Form, etc.)
- `components/` — Custom reusable components (GameCard, Header, MobileNav, LoadingScreen, PlatformBadges)

## Types

Organized by domain in `types/`: `game.ts`, `library.ts`, `journal.ts`, `platform.ts`, `profile.ts`, `igdb.ts`, `steam.ts`. All re-exported from `types/index.ts`.

## Hooks

| Hook | Purpose |
|------|---------|
| `useMediaQuery` | Responsive design breakpoints |
| `useMobile` | Mobile device detection |
| `useDebouncedValue` | Debounced input values |
| `useFormSubmission` | Form submission state |

## Constants

Organized in `constants/`: `api.ts`, `game.ts`, `pagination.ts`, `validation.ts`. Re-exported from `constants/index.ts`.

## Adding New Shared Code

- **Component**: Base UI → `components/ui/`, custom reusable → `components/`
- **Utility**: `lib/[category]/`, export from `lib/index.ts`
- **Type**: `types/[domain].ts`, export from `types/index.ts`
- **Hook**: `hooks/use-[name].ts`

## Testing

- Component tests: `*.test.tsx` (jsdom environment)
- Utility tests: `*.test.ts`
- Run with: `pnpm test shared/`
