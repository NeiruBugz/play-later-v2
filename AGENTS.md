# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router routes, layouts, and API routes.
- `features/`: Feature-scoped modules (UI, server actions, types) per domain.
- `shared/`: Reusable components, hooks, services, lib, and types.
- `prisma/`: `schema.prisma` and `migrations/` for database.
- `test/`: Vitest setup, fixtures, and test utilities.
- `public/`: Static assets.

Example import alias: `import { cn } from "@/shared/lib/cn"`.

## Build, Test, and Development Commands

- `pnpm dev`: Start Next.js dev server at `http://localhost:6060` (Turbopack).
- `pnpm build`: Production build.
- `pnpm start`: Start production server.
- `pnpm preview`: Build then start on port 6060.
- `pnpm test` | `pnpm test:watch` | `pnpm test:coverage`: Run Vitest.
- `pnpm lint` | `pnpm lint:fix`: ESLint check/fix.
- `pnpm typecheck`: TypeScript checks.
- `pnpm format:write` | `pnpm format:check`: Prettier write/check.
- Optional DB: `pnpm exec prisma migrate dev` to apply local migrations.

## Coding Style & Naming Conventions

- TypeScript; 2-space indent; semicolons; double quotes; ES5 trailing commas.
- Prettier: sorted imports and Tailwind class ordering.
- ESLint: Next.js Core Web Vitals + TypeScript rules.
- Paths use `@/` from repo root (e.g., `@/features/games/ui/Card`).
- Files/dirs: kebab-case; React components: `PascalCase`.

## Testing Guidelines

- Frameworks: Vitest + Testing Library (`jsdom` for components, `node` for server).
- Coverage: global ≥80% (branches, functions, lines, statements).
- Conventions: `*.test.ts(x)` / `*.spec.ts(x)`; server actions: `*.server-action.test.ts`.
- Setup: `test/setup/global.ts`, `test/setup/client-setup.ts`.
- Run: `pnpm test` or `pnpm test:coverage`.

## Commit & Pull Request Guidelines

- Conventional Commits enforced by commitlint (e.g., `feat: add filters`, `fix(ui): align button`).
- Keep commits focused; include tests when changing logic.
- PRs: clear description, linked issues, screenshots for UI, and note breaking changes.

## Security & Configuration Tips

- Env vars validated in `env.mjs` (e.g., `AUTH_*`, `POSTGRES_*`, IGDB, Steam). Store in `.env`; never commit secrets.
- Local DB via `docker-compose.yml` (Postgres on `6432`).
- Prisma generates on `postinstall`; re-run with `pnpm exec prisma generate` if needed.
