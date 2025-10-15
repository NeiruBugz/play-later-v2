# SavePoint Monorepo

This repository contains two top-level modules:

- infra: Terraform infrastructure (Cognito, environments, modules)
- savepoint-app: Next.js application (Auth.js/Prisma, features, tests)

Getting started with the app:

cd savepoint-app
pnpm install
pnpm dev

Infra quickstart is documented at infra/README.md.

Git hooks (Lefthook)

- Install hooks once at the repo root:

pnpm install

This installs `lefthook` locally and runs `lefthook install -f` via the root `prepare` script. If hooks ever break, re-run:

pnpm lefthook:install
