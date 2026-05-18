# Audit Recommendations — 2026-05-18

## P0 — Fix Immediately

### 1. Add CI vulnerability scanning

- **Dimension:** Supply Chain Security
- **Check:** SCS-06
- **Effort:** Low
- **Details:** No vulnerability scanning runs in any of the 5 GitHub Actions workflows. Add a step to `.github/workflows/pr-checks.yml` that runs `pnpm audit --audit-level=high` (fast, native) or `actions/dependency-review-action@v4` (GitHub-native, PR-scoped). This is the single biggest score driver — closing this alone moves the dimension from D toward B.

## P1 — Fix Soon

### 2. Fix stale README claims about retired infrastructure

- **Dimension:** Documentation Quality
- **Check:** DOC-01, DOC-04
- **Effort:** Low
- **Details:** Root `README.md` still claims `infra/` provisions RDS and ECS — only `cognito` and `s3` modules exist today (see `infra/modules/`). Also missing: a mention of `savepoke-tanstack/` as an active sibling app under migration (spec 021). This was first flagged 2026-04-28 and re-flagged 2026-05-12. Edit `README.md` so the "Architecture" section matches the actual `infra/CLAUDE.md` module inventory and lists all three top-level packages.

### 3. Replace open-ended pnpm.overrides with exact pins

- **Dimension:** Supply Chain Security
- **Check:** SCS-07
- **Effort:** Low
- **Details:** Root `package.json` `pnpm.overrides` contains `rollup: '>=4.59.0'` and `fast-xml-parser: '>=5.3.8'` — both are open-ended ranges that defeat the purpose of an override. Replace with exact versions. Create `DEPENDENCY_DECISIONS.md` (or add a section to `CLAUDE.md`) explaining each of the 16 overrides — link the CVE or upstream bug for each.

### 4. Extend Dependabot to savepoint-tanstack and add CODEOWNERS

- **Dimension:** Supply Chain Security
- **Check:** SCS-05
- **Effort:** Low
- **Details:** `.github/dependabot.yml` covers `/savepoint-app` (npm) and `/infra` (terraform) but not `/savepoint-tanstack`. Add a third `package-ecosystem: npm` entry with directory `/savepoint-tanstack`. Also create `.github/CODEOWNERS` listing at minimum: `package.json @NeiruBugz`, `pnpm-lock.yaml @NeiruBugz`, `infra/ @NeiruBugz` — gates lockfile/manifest changes through review.

### 5. Replace boilerplate savepoint-tanstack README

- **Dimension:** Documentation Quality
- **Check:** DOC-02
- **Effort:** Medium
- **Details:** `savepoint-tanstack/README.md` is unmodified TanStack Start scaffold output. Replace with content describing: purpose (migration target per spec 021), current slice status, how to run locally, divergence from `savepoint-app/` patterns. The existing `savepoint-tanstack/CLAUDE.md` has good source material.

### 6. Update architecture.md to reflect TanStack migration

- **Dimension:** Spec-Driven Development
- **Check:** SDD-03
- **Effort:** Low
- **Details:** `context/product/architecture.md` mentions only the Next.js stack — `savepoint-tanstack/` is an active topology layer that doesn't appear. Add a "Migration target" section pointing at spec 021 and the new stack components (TanStack Start v1, TanStack Router, `createServerFn`, Better Auth). At minimum reference spec 021 with a forward note.

### 7. Split savepoint-tanstack/CLAUDE.md

- **Dimension:** AI Development Tooling
- **Check:** AI-06
- **Effort:** Medium
- **Details:** `savepoint-tanstack/CLAUDE.md` is 512 lines — well over the 200-LOC guideline. The "Foot-guns" section (authoritative writeup, referenced from memory) is a natural split candidate. Suggested layout: keep core conventions in CLAUDE.md (≤200), move foot-guns to `savepoint-tanstack/docs/footguns.md`, move DAL specifics to `savepoint-tanstack/src/lib/CLAUDE.md`. `savepoint-app/data-access-layer/CLAUDE.md` (224) is borderline — only trim if natural seams exist.

### 8. Add Terraform formatting check to CI

- **Dimension:** Software Best Practices
- **Check:** SBP-01
- **Effort:** Low
- **Details:** No HCL linting runs in CI. Add to `.github/workflows/pr-checks.yml`: a job that runs `terraform fmt -check -recursive` in `infra/`. Optional next step: add `tflint` via `terraform-linters/setup-tflint@v4`. This is what brought SBP-01 back to WARN from a previous PASS.

## P2 — Improve When Possible

### 9. Add unified task runner spanning all three layers

- **Dimension:** End-to-End Delivery
- **Check:** E2E-05
- **Effort:** Medium
- **Details:** Root `Makefile` covers only `savepoint-app`; CI is split (`pr-checks.yml` vs `pr-checks-tanstack.yml`); developers running cross-layer slices must remember per-layer commands. Add a root `Makefile` (or pnpm script) with targets like `make ci-all`, `make typecheck-all`, `make test-all` that fan out to all three layers. Naturally encourages vertical-slice delivery.

### 10. Add coverage thresholds

- **Dimension:** Quality Assurance
- **Check:** QA-06
- **Effort:** Low
- **Details:** `savepoint-app/vitest.coverage.config.ts` has the v8 provider configured but no `thresholds` block — coverage is measured but not enforced. Add a baseline (e.g. lines: 70, functions: 70) and tighten over time. `savepoint-tanstack/` should get the same setup post-cutover (deferring it now would be premature given file churn).

### 11. Address remaining caret-range deps

- **Dimension:** Supply Chain Security
- **Check:** SCS-03
- **Effort:** Low
- **Details:** Four caret deps in `savepoint-app` (`@radix-ui/react-{dropdown-menu,separator,switch}`, `bottleneck`) and one root devDep remain. Pin to exact versions; Dependabot will handle upgrades.

### 12. Backfill spec hygiene

- **Dimension:** Spec-Driven Development
- **Check:** SDD-05, SDD-06
- **Effort:** Low
- **Details:** Add `tasks.md` to `context/spec/019-ui-hardening-mobile-and-card-interactions/` (or formally close it). Backfill `Status: Completed` in `context/spec/005-library-status-redesign/functional-spec.md`. Move `context/spec/jewel-theme/` (skeleton with only `spec.md`) under `context/research/` or fold into AWOS triad format.

### 13. Add Thumbs.db to .gitignore

- **Dimension:** Security Guardrails
- **Check:** SEC-05
- **Effort:** Low
- **Details:** Universal Windows OS file not currently ignored. One-line `.gitignore` addition.
