# Audit Recommendations — 2026-05-18

## P0 — Fix Immediately

### 1. Add a quarantine gate for fresh package releases

- **Dimension:** Supply Chain Security
- **Check:** SCS-04 (critical FAIL)
- **Effort:** Low
- **Details:** Four `@tanstack/*` deps in `savepoint-tanstack/package.json` were installed within 1–3 days of publish (`@tanstack/react-router@1.170.4` 2026-05-17, `@tanstack/react-start@1.168.6` 2026-05-17, `@tanstack/react-router-devtools@1.167.0` 2026-05-15, `@tanstack/react-router-ssr-query@1.167.0` 2026-05-15). The spec 021 migration cadence keeps pulling latest TanStack releases. Add **one** of:
  - Renovate config (`.github/renovate.json5`): `{ "minimumReleaseAge": "7 days" }`.
  - CI gate in `.github/workflows/pr-checks-tanstack.yml`: a script that parses changed `package.json` entries and queries the npm registry's `time` field, failing the job if any added/upgraded version was published <7 days ago.

## P1 — Fix Soon

### 2. Enforce a coverage threshold (and add coverage to tanstack)

- **Dimension:** Quality Assurance
- **Check:** QA-01 (critical WARN) + QA-06 (low WARN)
- **Effort:** Medium
- **Details:** Source/test ratio is unmeasured because `savepoint-app/vitest.coverage.config.ts` declares reporters but no `thresholds`. Start with a soft floor and ratchet:
  ```ts
  coverage: { thresholds: { lines: 60, functions: 55, branches: 50, statements: 60 } }
  ```
  Add an equivalent `vitest.coverage.config.ts` to `savepoint-tanstack/` (acceptable to defer until post-cutover, but at minimum scaffold the file so the gap is visible). Wire `test:coverage` into a non-blocking CI job first, then promote to blocking.

### 3. Unify cross-layer tooling

- **Dimension:** End-to-End Delivery
- **Check:** E2E-01 (high FAIL) + E2E-05 (medium WARN)
- **Effort:** Medium
- **Details:** Root `Makefile` only proxies `pnpm --filter savepoint`; `pr-checks.yml` + `pr-checks-tanstack.yml` are siblings; `infra/` has no root-level task entry. Concrete moves:
  - Add root `package.json` scripts (or Makefile targets) `dev`, `test`, `ci`, `infra:plan`, `infra:apply` that fan out to both apps + infra.
  - Merge the two `pr-checks*.yml` into one matrix-driven workflow with `app: [savepoint-app, savepoint-tanstack]`.
  - The 21% cross-layer-branch rate is partly structural (spec 021 dominates savepoint-app right now); revisit the threshold post-cutover, but unified tooling lowers the friction that's discouraging cross-layer branches today.

## P2 — Improve When Possible

### 4. Remove stale "Domain docs" reference in root CLAUDE.md

- **Dimension:** Documentation
- **Check:** DOC-04 (medium WARN)
- **Effort:** Low
- **Details:** Root `CLAUDE.md:146` claims `CONTEXT-MAP.md` at root and per-layer `CONTEXT.md` files exist in `savepoint-app/` and `infra/`. None exist. Either create the files (duplicates effort with existing per-module `CLAUDE.md`) or delete the paragraph and replace with: "Per-module CLAUDE.md files are the single source of domain context." Only `docs/agents/domain.md` referenced there is real — keep the link to that one.

### 5. Update architecture.md to reflect Vercel + TanStack Start

- **Dimension:** Spec-Driven Development
- **Check:** SDD-03 (high WARN)
- **Effort:** Low
- **Details:** `context/product/architecture.md` §5 still declares ECS Fargate as the compute platform; actual hosting is Vercel (per spec 021 cutover plan + observed deploy.yml). TanStack Start v1 only appears in the document header. Updates:
  - §5: replace ECS Fargate paragraph with Vercel (regions, build outputs, runtime).
  - Add an explicit "Frontend frameworks (transitional)" subsection noting both Next.js 16 (canonical) and TanStack Start v1 (spec 021 rewrite, cutover at Slice 20).
  - Bump version to v2.3 with a 2026-05-18 note.

### 6. Replace remaining caret ranges with exact pins

- **Dimension:** Supply Chain Security
- **Check:** SCS-03 (high WARN)
- **Effort:** Low
- **Details:** 7 carets total. Most-important to fix first: the 3 inside root `pnpm.overrides` (`valibot ^1.2.0`, `glob ^10.5.0`, `js-yaml ^4.1.1`) — `^` inside an override defeats the "pin one version everywhere" intent. Then `@radix-ui/react-{dropdown-menu,separator,switch}` and `bottleneck` in `savepoint-app/package.json`, and `@commitlint/config-conventional` in root. `pnpm-lock.yaml` bounds the live risk, but exact pinning is the documented project rule (`feedback_pin_exact_versions`).

### 7. Lift DAL→features cross-layer imports into shared/

- **Dimension:** Code Architecture
- **Check:** ARCH-02 (high WARN)
- **Effort:** Medium
- **Details:** Three reverse-direction imports:
  - `savepoint-app/data-access-layer/services/profile/profile-service.ts` → `@/features/profile/lib`
  - `savepoint-app/data-access-layer/handlers/igdb/igdb-handler.ts` → `@/features/game-search`
  - (social activity-feed types — see code-architecture.md evidence)

  Move the imported symbols into `shared/lib/` (if framework-agnostic) or into DAL-owned schemas under `data-access-layer/domain/` (if they're really data contracts). Either way, the DAL stops depending on the features layer it serves.

### 8. Document internal API surface (especially Steam OAuth)

- **Dimension:** Documentation
- **Check:** DOC-03 (medium WARN)
- **Effort:** Low
- **Details:** 12 internal route handlers exist under `savepoint-app/app/api/**`. Most are colocated-consumer-only, but `app/api/steam/auth/callback/route.ts`, `app/api/steam/connect/route.ts`, and `app/api/auth/[...all]/route.ts` form an externally-triggered surface. At minimum: add a Markdown table to `savepoint-app/app/CLAUDE.md` with one row per route handler (path, method, auth, request shape, response shape). No full OpenAPI artifact required given internal-only nature.

### 9. Add infra root-level task entry

- **Dimension:** End-to-End Delivery
- **Check:** E2E-05 (medium WARN)
- **Effort:** Medium
- **Details:** Today an agent has to `cd infra/envs/dev && terraform plan` — three context switches. Add a root script (`scripts/infra.sh dev plan`) or root `package.json` script (`"infra:plan:dev": "terraform -chdir=infra/envs/dev plan"`) so `pnpm infra:plan:dev` works from anywhere. Mirror for `apply`. Add to root README + `infra/CLAUDE.md`.

### 10. Trim data-access-layer/CLAUDE.md below the 200-line guideline

- **Dimension:** AI Development Tooling
- **Check:** AIT-06 (sub-WARN, currently PASS)
- **Effort:** Low
- **Details:** At 224 lines it's the only CLAUDE.md over the guideline. Below threshold today, but trimming preserves future agent context window. Candidates for extraction: split the Trip-wires section into a path-scoped `.claude/rules/data-access-layer/` rule file matching the same pattern used for `tanstack/`.
