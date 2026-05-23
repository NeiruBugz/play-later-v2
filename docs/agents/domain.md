# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: multi-context monorepo

This repo splits into top-level contexts that each have their own `CLAUDE.md` files:

- `savepoint-tanstack/` — **primary app** (TanStack Start v1). Has its own `CONTEXT.md` glossary (DAL terminology).
- `savepoint-app/` — **legacy** Next.js app, retained as rollback insurance post-cutover (spec 021, Slice 24).
- `infra/` — Terraform IaC

Domain docs follow the same split.

```
/
├── CONTEXT-MAP.md                ← points at each context's CONTEXT.md
├── docs/adr/                     ← system-wide architectural decisions (created lazily)
├── docs/cutover-rollback.md      ← spec 021 cutover rollback runbook
├── savepoint-tanstack/           ← primary app
│   ├── CONTEXT.md                ← DAL terminology dictionary (loader-direct read, UX-hint query, ...)
│   └── docs/adr/                 ← app-scoped decisions (when they exist)
├── savepoint-app/                ← legacy app
│   ├── CONTEXT.md                ← app-layer glossary (gaming/library/journal terms) — when it exists
│   └── docs/adr/                 ← app-scoped decisions (DAL, FSD, caching, etc.)
└── infra/
    ├── CONTEXT.md                ← infra-layer glossary (modules, envs, state) — when it exists
    └── docs/adr/                 ← infra-scoped decisions
```

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — points at each context's `CONTEXT.md`. Read each one relevant to the topic.
- **`docs/adr/`** at the repo root for system-wide decisions, plus `savepoint-app/docs/adr/` and/or `infra/docs/adr/` for context-scoped decisions touching the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. Producer skills (`/grill-with-docs`, `/improve-codebase-architecture`) create them lazily when terms or decisions actually get resolved.

Note: for the primary app, `savepoint-tanstack/CLAUDE.md` (+ its `CONTEXT.md` and per-layer `src/<layer>/README.md`) is the source of truth for layer conventions. For the legacy app, `savepoint-app/CLAUDE.md` and its sub-layer `CLAUDE.md` files apply; `infra/CLAUDE.md` covers infra. Domain docs (`CONTEXT.md`, ADRs) complement, not replace, those files.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (DAL Result type) — but worth reopening because…_
