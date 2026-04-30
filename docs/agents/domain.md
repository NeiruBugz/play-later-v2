# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: multi-context monorepo

This repo splits into two top-level contexts that already have their own `CLAUDE.md` files:

- `savepoint-app/` — Next.js app (frontend + backend API)
- `infra/` — Terraform IaC

Domain docs follow the same split.

```
/
├── CONTEXT-MAP.md                ← points at each context's CONTEXT.md
├── docs/adr/                     ← system-wide architectural decisions
├── savepoint-app/
│   ├── CONTEXT.md                ← app-layer glossary (gaming/library/journal terms)
│   └── docs/adr/                 ← app-scoped decisions (DAL, FSD, caching, etc.)
└── infra/
    ├── CONTEXT.md                ← infra-layer glossary (modules, envs, state)
    └── docs/adr/                 ← infra-scoped decisions
```

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — points at each context's `CONTEXT.md`. Read each one relevant to the topic.
- **`docs/adr/`** at the repo root for system-wide decisions, plus `savepoint-app/docs/adr/` and/or `infra/docs/adr/` for context-scoped decisions touching the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. Producer skills (`/grill-with-docs`, `/improve-codebase-architecture`) create them lazily when terms or decisions actually get resolved.

Note: `savepoint-app/CLAUDE.md`, `savepoint-app/app/CLAUDE.md`, `savepoint-app/data-access-layer/CLAUDE.md`, `savepoint-app/features/CLAUDE.md`, `savepoint-app/widgets/CLAUDE.md`, and `infra/CLAUDE.md` are the canonical source of truth for layer conventions. Domain docs (`CONTEXT.md`, ADRs) complement, not replace, those files.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (DAL Result type) — but worth reopening because…_
