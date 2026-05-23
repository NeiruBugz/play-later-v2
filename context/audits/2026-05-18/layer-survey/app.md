# Layer survey: app/

## What's actually here

- `error-boundary/` — single component (folder + barrel + `.type.ts` + `.utility.ts`). The ONLY component in `app/`.
- `index.ts` — layer-level barrel.
- `README.md` — per-layer docs.

No `providers/`, no `styles/` subdirectory. The layer is intentionally thin.

## Dominant patterns (from code)

- One-component-per-folder + barrel + `.type.ts` + `.utility.ts` (matches parent CLAUDE.md "Component file conventions").
- Internal relative imports only (`./error-boundary.type`).
- Downward imports only.

## Drifts

1. **`app/README.md` (low)** — lists `providers/` and `styles/` segments, neither exists.
2. **`app/index.ts` barrel inconsistency (low)** — doesn't re-export types.
3. **No `.test.tsx` for `ErrorBoundary` (medium)** — TDD binding rule says colocated test; this critical surface is the most important place to honor it.

## Proposed rules

- Rule: `app/` holds only providers, root wiring, global styles, root error boundary. Why: keep layer thin.
- Rule: every `app/` component has folder + barrel + `.test.tsx`. Why: `ErrorBoundary` is load-bearing.
- Rule: `app/` imports only from `shared/`. Why: FSD top-of-graph.
- Rule: provider mounting in `__root.tsx`; `app/` holds implementations. Why: TanStack canonical mount.
- Rule: no module-level server-env reads in client-imported files. Why: foot-gun #9.
- Rule: don't grow `app/` without spec review. Why: most additions belong in widgets/shared.

## README accuracy

Misleading — preamble lists "providers, wiring, styles, error boundary" but the segments table only describes `error-boundary/`. Delete the aspirational list or rewrite the table.
