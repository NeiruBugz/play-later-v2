---
description: Component sidecar file convention in savepoint-tanstack — .tsx exports components only; values in .utility.ts, types in .type.ts; barrel is the public surface
paths:
  - "savepoint-tanstack/src/app/**/*"
  - "savepoint-tanstack/src/widgets/**/*"
  - "savepoint-tanstack/src/features/**/*"
  - "savepoint-tanstack/src/entities/**/*"
---
# Rules — Component sidecar files (cross-cutting)

Every UI component lives in its own folder with a barrel and up to three
sidecar files. The full descriptive write-up (folder layout, barrel rules,
type/utility split) is in
[`savepoint-tanstack/CLAUDE.md`](../../../savepoint-tanstack/CLAUDE.md) §
"Component file conventions". This file is the prescriptive enforcement layer.

## Rules

- **Rule:** `<name>.tsx` exports **components only**. A component-unique value
  (helper function, constant, lookup object/array, `cva` variants that aren't a
  shadcn primitive) goes in `<name>.utility.ts`. A component-unique type goes in
  `<name>.type.ts`. **Why:** Fast-Refresh boundary clarity + single-responsibility
  files; mechanically enforced by `react-refresh/only-export-components`
  (`allowConstantExport: false`) in `eslint.config.mjs`.
- **Rule:** suffixes are **singular** — `.utility.ts`, `.type.ts` (never
  `.utils`, `.types`, `.constants`). **Why:** one convention, grep-ability.
- **Rule:** the folder `index.ts` barrel is the **only** public surface. It
  re-exports the component value plus any consumer-facing type/utility. External
  callers import from the folder/barrel, never from a sibling `.type` /
  `.utility` module directly. **Why:** internal cohesion, external opacity. A
  consumer-facing helper is re-exported *from `./<name>.utility`*, not bounced
  through the `.tsx` (that re-export trips the lint rule — see theme-provider).
- **Rule:** inside the folder, relative `./<name>.type` / `./<name>.utility`
  imports are allowed and expected. **Why:** that's the cohesion the split buys.
- **Rule:** `.utility.ts` is for **component-local** helpers only. If a sibling
  component needs it, lift it to the feature's `lib/`, `shared/lib/`, or the
  entity — never import another component's `.utility` directly. **Why:** avoids
  sibling coupling; the boundaries plugin keys on slices, not filenames, so it
  won't catch this for you.
- **Rule:** `.type.ts` holds props + view-model types. Domain types stay in
  `entities/<noun>/model/`; the `.type.ts` imports them, never redefines them.
  **Why:** single source of truth for domain shapes.
- **Rule:** non-*exported* inline constants/helpers in a `.tsx` are NOT flagged
  by lint (react-refresh sees only the export surface). Still prefer the sidecar
  when a `.tsx` accumulates more than a trivial local constant. **Why:** the lint
  rule is a floor, not the whole convention; readability is the goal.

## Documented exceptions

The lint rule is **off** for two framework-canonical shapes:

- **`src/shared/ui/**`** — shadcn primitives canonically export a
  `Component + variants` pair (`Button`/`buttonVariants`, …). Splitting them
  would diverge from the shadcn registry / CLI re-add workflow. See
  [`shared.md`](./shared.md).
- **`src/routes/**`** — TanStack file-based routes export
  `const Route = createFileRoute(...)({ component: LocalComponent })` and define
  a thin route component locally. The router's codegen mandates the `Route`
  export from the route file; react-refresh cannot fast-refresh that shape. See
  [`routes.md`](./routes.md).

## See also

- [`../../../savepoint-tanstack/CLAUDE.md`](../../../savepoint-tanstack/CLAUDE.md) — descriptive convention + reference shape (`src/app/error-boundary/`)
- [`shared.md`](./shared.md) — `shared/ui` primitives-only rule
- [`routes.md`](./routes.md) — thin-route convention
