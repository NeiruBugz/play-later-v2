# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, layouts, API routes.
- `features/`: Feature modules (UI, server actions, types) per domain.
- `shared/`: Reusable components, hooks, services, lib, and types.
- `prisma/`: `schema.prisma` and `migrations/` for database.
- `test/`: Vitest setup, fixtures, and test utilities.
- `public/`: Static assets.

## Build, Test, and Development Commands
- `pnpm dev`: Start Next.js dev server on `http://localhost:6060` (Turbopack).
- `pnpm build`: Production build (Turbopack).
- `pnpm start`: Start production server.
- `pnpm preview`: Build then start on port 6060.
- `pnpm test`: Run Vitest test suite.
- `pnpm test:watch`: Watch mode.
- `pnpm test:coverage`: Run tests with coverage.
- `pnpm lint` / `pnpm lint:fix`: Lint and auto-fix.
- `pnpm typecheck`: TypeScript checks.
- `pnpm format:write` / `pnpm format:check`: Prettier format/check.
- Optional (DB): `pnpm exec prisma migrate dev` to apply local migrations.

## Coding Style & Naming Conventions
- TypeScript, 2-space indent, semicolons, double quotes, trailing commas (ES5).
- Prettier config: sorted imports and Tailwind class ordering.
- ESLint: Next.js Core Web Vitals + TypeScript rules.
- Paths: use `@/` alias from repo root (e.g., `@/shared/lib/...`).
- Files: kebab-case for files/dirs; React components in `PascalCase`.

## Testing Guidelines
- Frameworks: Vitest, Testing Library (`jsdom` for components, `node` for server).
- Coverage: global 80% thresholds (branches, functions, lines, statements).
- Conventions: `*.test.ts(x)` / `*.spec.ts(x)`; server actions as `*.server-action.test.ts`.
- Setup: see `test/setup/global.ts` and `test/setup/client-setup.ts`.
- Run: `pnpm test` or `pnpm test:coverage`.

## Commit & Pull Request Guidelines
- Conventional Commits enforced by commitlint (e.g., `feat: ...`, `fix(ui): ...`).
- Keep commits focused; include tests when changing logic.
- PRs: clear description, link issues, screenshots for UI, note breaking changes.

## Security & Configuration Tips
- Env vars validated in `env.mjs` (e.g., `AUTH_*`, `POSTGRES_*`, IGDB, Steam). Store in `.env` and never commit secrets.
- Local DB: `docker-compose.yml` exposes Postgres on `6432`.
- Prisma generates on `postinstall`; re-run with `pnpm exec prisma generate` if needed.
