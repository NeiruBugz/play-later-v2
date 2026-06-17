---
description: Map of agent rule files for savepoint-tanstack — auto-loads when editing the rules themselves
paths:
  - ".claude/rules/tanstack/**/*.md"
---
# Agent rules — savepoint-tanstack

Binding rules for AI agents working in this app. Per-layer rules live in
this directory; cross-cutting rules (test conventions, server fn shape,
error handling) get their own files. Human-facing docs stay in
`savepoint-tanstack/src/<layer>/README.md` (descriptive); rule files here
are prescriptive.

> **Auto-load is on.** Claude Code auto-loads `.claude/rules/**/*.md` from
> the repo root. Each layer file has a `paths:` frontmatter entry, so the
> file enters context **only when Claude reads matching files** — keeping
> the context budget tight. Cross-cutting files (server-fns, testing,
> errors) auto-load when their respective globs match.
>
> See [Claude Code memory docs → path-specific rules](https://code.claude.com/docs/en/memory#path-specific-rules).
>
> **Path glob convention.** `paths:` is resolved relative to where `.claude/`
> sits — in this repo, `.claude/` lives at the repo root, so globs use the
> `savepoint-tanstack/src/<layer>/**/*` prefix. If `.claude/` ever moves
> deeper (e.g. into a workspace), drop the prefix accordingly — a wrong
> prefix matches nothing and the rule silently never activates.

## Layer rules — scoped to `savepoint-tanstack/src/<layer>/**/*`

| File | Auto-loads when |
| --- | --- |
| [`app.md`](./app.md) | Touching `src/app/` (providers, root error boundary, global styles) |
| [`routes.md`](./routes.md) | Touching `src/routes/` (TanStack Router file-based routes) |
| [`widgets.md`](./widgets.md) | Touching `src/widgets/` (composite UI) |
| [`features.md`](./features.md) | Touching `src/features/` (user-intent slices) |
| [`entities.md`](./entities.md) | Touching `src/entities/` (domain queries + display UI) |
| [`shared.md`](./shared.md) | Touching `src/shared/` (db, logger, errors, IGDB, S3, primitives) |

## Cross-cutting rules

| File | Auto-loads when |
| --- | --- |
| [`components.md`](./components.md) | Touching `app/`, `widgets/`, `features/`, or `entities/` (component sidecar convention) |
| [`server-fns.md`](./server-fns.md) | Touching `features/*/api/`, `entities/*/api/`, or any route file |
| [`testing.md`](./testing.md) | Touching `*.test.{ts,tsx}` or `test/**/*` |
| [`errors.md`](./errors.md) | Touching any `.ts`/`.tsx` under `src/` or `test/` |

## How to evolve these rules

- **Adding a rule:** append to the relevant file. If it's cross-cutting (touches 2+ layers), add to the matching cross-cutting file instead.
- **Documenting an exception:** add it under "Documented exceptions" at the bottom of the relevant file, with a link to `DIVERGENCES.md` or `FOOT-GUNS.md` for context.
- **Removing a rule:** don't — supersede it in place with a strikethrough + replacement. Future agents need the history.
- **Adding a new path-scoped file:** include `paths:` frontmatter. Without it, the file auto-loads at every session start (use sparingly).
- **Verifying auto-load:** run `/memory` in a Claude Code session to see which rule files are loaded for the current context.

## See also

- [`../../../savepoint-tanstack/CLAUDE.md`](../../../savepoint-tanstack/CLAUDE.md) — primary tanstack project doc
- [`../../../savepoint-tanstack/FOOT-GUNS.md`](../../../savepoint-tanstack/FOOT-GUNS.md) — runtime traps catalog
- [`../../../savepoint-tanstack/DIVERGENCES.md`](../../../savepoint-tanstack/DIVERGENCES.md) — slice-by-slice divergence log
- [`../../../savepoint-tanstack/CONTEXT.md`](../../../savepoint-tanstack/CONTEXT.md) — DAL vocabulary
