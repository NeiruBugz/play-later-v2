---
description: Rules for the FSD `app/` layer in savepoint-tanstack (providers, root wiring, root error boundary)
paths:
  - "savepoint-tanstack/src/app/**/*"
---
# Rules — `app/` layer

`app/` is the TOP of the FSD graph: providers, root wiring, global styles,
the root error boundary. Layer is intentionally thin.

## Rules

- **Rule:** `app/` holds only providers, root wiring, global styles, and the root error boundary. **Why:** keeps the layer thin and predictable; everything else belongs in `routes/` or below.
- **Rule:** every `app/` component is its own folder with a barrel + `.test.tsx`. **Why:** even one component (today: `ErrorBoundary`) is load-bearing; testing is mandatory.
- **Rule:** `app/` imports only from `shared/`. No imports from `routes/`, `widgets/`, `features/`, or `entities/`. **Why:** enforces FSD direction; `app/` is the top of the graph.
- **Rule:** provider mounting happens in `__root.tsx` (under `routes/`); the `app/` directory holds the provider *implementations*. **Why:** TanStack Start's root route is the canonical mount point.
- **Rule:** no module-level reads of `env.<server-only-var>` in client-imported files. **Why:** foot-gun #9 — t3-env throws on client at module-load time.
- **Rule:** don't grow `app/` without spec review. **Why:** most additions belong in `widgets/` or `shared/`.

## Documented exceptions

None today.

## See also

- [`../../../savepoint-tanstack/CLAUDE.md`](../../../savepoint-tanstack/CLAUDE.md) — Component file conventions
- [`server-fns.md`](./server-fns.md) — provider wiring sometimes touches server-fn factories
