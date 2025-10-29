# Repository Guidelines

## Project Structure & Module Organization

- `infra/`: Terraform modules and envs (Cognito and future infra).
- `savepoint-app/`: Next.js application root.
  - `app/`: App Router routes, layouts, and API routes.
  - `features/`: Feature-scoped modules (UI, server actions, types).
  - `shared/`: Reusable components, hooks, services, lib, and types.
  - `prisma/`: `schema.prisma` and `migrations/` for database.
  - `test/`: Vitest setup, fixtures, and test utilities.
  - `e2e/`: Playwright tests, helpers, page objects, and setup/teardown.
  - `public/`: Static assets.
- `scripts/`: Local tooling (e.g., LocalStack S3 init and CORS config).

Example import alias inside the app: `import { cn } from "@/shared/lib/tailwind-merge"`.

## Build, Test, and Development Commands

Run from `savepoint-app/` or prefix with `pnpm -C savepoint-app` from the repo root.

- `pnpm dev`: Start Next.js dev server at `http://localhost:6060` (Turbopack).
- `pnpm build`: Production build.
- `pnpm start`: Start production server.
- `pnpm preview`: Build then start on port 6060.
- `pnpm test` | `pnpm test:watch` | `pnpm test:coverage`: Run Vitest.
- `pnpm test:e2e` | `pnpm test:e2e:ui` | `pnpm test:e2e:debug`: Run Playwright E2E tests.
- `pnpm lint` | `pnpm lint:fix`: ESLint check/fix.
- `pnpm typecheck`: TypeScript checks.
- `pnpm format:write` | `pnpm format:check`: Prettier write/check.
- Optional DB: `pnpm exec prisma migrate dev` to apply local migrations.
  - Local DB via `docker-compose up -d postgres-db` (Postgres on host port `6432`).

## Coding Style & Naming Conventions

- TypeScript; 2-space indent; semicolons; double quotes; ES5 trailing commas.
- Prettier: sorted imports and Tailwind class ordering.
- ESLint: Next.js Core Web Vitals + TypeScript rules.
- App paths use `@/` from the app root (`savepoint-app`) (e.g., `@/features/games/ui/Card`).
- Files/dirs: kebab-case; React components: `PascalCase`.

## Testing Guidelines

- Unit/Integration: Vitest + Testing Library (`jsdom` for components, `node` for server).
- Coverage: global ≥80% (branches, functions, lines, statements).
- Conventions: `*.test.ts(x)` / `*.spec.ts(x)`; server actions: `*.server-action.test.ts`.
- Setup: `test/setup/global.ts`, `test/setup/client-setup.ts`.
- E2E: Playwright tests live in `e2e/` with helpers and page objects.
  - Web server runs at `http://localhost:6060` (configured in `playwright.config.ts`).
  - Auth for E2E: set `AUTH_ENABLE_CREDENTIALS=true` and use storage state in `e2e/.auth/`.
  - S3 features (e.g., avatar upload) use LocalStack; ensure LocalStack is running when testing locally.
  - Run: `pnpm test:e2e`, `pnpm test:e2e:ui`, or `pnpm test:e2e:debug`.

## Commit & Pull Request Guidelines

- Conventional Commits (e.g., `feat: add filters`, `fix(ui): align button`). Validate locally with `pnpm exec commitlint`.
- Keep commits focused; include tests when changing logic.
- PRs: clear description, linked issues, screenshots for UI, and note breaking changes.

## Security & Configuration Tips

- Env vars validated in `env.mjs` (e.g., `AUTH_*`, `POSTGRES_*`, IGDB, Steam, S3/LocalStack). Store in `.env`; never commit secrets.
- Local DB via `docker-compose.yml` (Postgres exposed on host `6432`).
- Local S3 via LocalStack: gateway mapped to host port `4568` (internal `4566`). See `scripts/init-localstack.sh` and `scripts/localstack-cors.json` to bootstrap bucket and CORS.
- Prisma client generates on `postinstall`; re-run with `pnpm exec prisma generate` if needed.

## Continuous Integration

- PR checks: see `.github/workflows/pr-checks.yml` for lint, typecheck, and tests.
- E2E on CI: `.github/workflows/e2e.yml` spins up Postgres and LocalStack, prepares schema via Prisma, initializes S3 bucket/CORS, and runs Playwright. Artifacts (HTML report and results) are uploaded on failure.

## Local Hooks

- Pre-commit hooks have been removed in favor of CI checks.
- Run local checks manually with `pnpm code-check` from `savepoint-app/`.
- CI runs formatting, lint, typecheck, and tests on PRs; commit message validation is local-only.
