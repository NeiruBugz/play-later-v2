# SavePoint Monorepo

[![Integration Tests (Vitest)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/integration.yml/badge.svg)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/integration.yml)

[![E2E Tests (Playwright)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/e2e.yml/badge.svg)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/e2e.yml)

This repository contains two top-level modules:

- infra: Terraform infrastructure (Cognito, environments, modules)
- savepoint-app: Next.js application (Auth.js/Prisma, features, tests)

Getting started with the app:

cd savepoint-app
pnpm install
pnpm dev

Adding dependencies (always use `-E` for exact versions):

pnpm add -E package-name        # Production dependency
pnpm add -DE package-name       # Dev dependency

Infra quickstart is documented at infra/README.md.

Pre-commit Hooks

- Local git hooks have been removed. All code quality checks run in CI on pull requests.
- To run checks locally before pushing, use from `savepoint-app/`:

pnpm ci:check
