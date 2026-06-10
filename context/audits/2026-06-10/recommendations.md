# Audit Recommendations — 2026-06-10

Overall: **96% — Grade A** (up from 94% on 2026-05-23). No P0 (critical FAIL) items. Two P1 items and four P2 items below.

## P0 — Fix Immediately

_None. No critical-severity FAILs._

## P1 — Fix Soon

### 1. Add an E2E test tier

- **Dimension:** Quality Assurance
- **Check:** QA-04 (high, FAIL)
- **Effort:** Medium
- **Details:** The project has strong unit (jsdom, mocked Prisma) and integration (real PG, forked) tiers but **no E2E layer at all** — no `playwright.config.*`, no `e2e/` directory, no `*.e2e.test.*` files. This is the single reason Quality Assurance sits at 83% B (the only non-A dimension) and has been the standing gap across audits. Add Playwright (`pnpm --filter savepoint-tanstack add -D playwright @playwright/test` with exact pins per project policy), a `playwright.config.ts`, and at least one full-flow spec exercising the core journey: **auth → add a game → see it in the library**. Wire an `e2e` script and add it to `pr-checks-tanstack.yml`. This also lifts the pyramid (QA-05) from "two tiers" to a complete three-tier pyramid.

### 2. Pin or vendor the remote-fetch MCP server

- **Dimension:** Prompt & Agent Integrity
- **Check:** PAI-04 (critical, WARN)
- **Effort:** Low
- **Details:** `.mcp.json` defines `aws-knowledge-mcp-server` as `uvx fastmcp run https://knowledge-mcp.global.api.aws` — a download-and-run of a remote MCP definition on every session. The endpoint is HTTPS and AWS-owned (legitimate), so this is a WARN not a FAIL, but the executed definition is unpinned: whatever AWS serves at that URL runs with the agent's tool access. Mitigate by pinning to a specific published `aws-knowledge-mcp-server` package version (stdio with a fixed `@version`), or vendoring the server spec locally, so the agent runs a reviewed, version-locked artifact rather than live remote content. This drove the −9 regression from last audit's 100%.

## P2 — Improve When Possible

### 3. Resolve the Upstash Redis phantom in architecture.md

- **Dimension:** Spec-Driven Development
- **Check:** SDD-03 (high, WARN)
- **Effort:** Low
- **Details:** `context/product/architecture.md` lists **Upstash Redis** (marked "optional") but there is no Redis client dependency, no Redis service in `docker-compose.yml`, and no code reference. Either wire it up (if caching/rate-limiting is genuinely planned and imminent) or remove the entry. Every audit will keep flagging declared-but-unused core infrastructure as architecture drift. This was the sole deduction dropping SDD from 100% to 93%.

### 4. Prune or wire orphaned Prisma tables

- **Dimension:** End-to-End Delivery
- **Check:** E2E-04 (medium, WARN)
- **Effort:** Low
- **Details:** Four tables in `prisma/schema.prisma` have no query layer in the app: `Review`, `Genre`, `GameGenre`, `IgnoredImportedGames`. `Review` has **zero references anywhere** and appears superseded by `JournalEntry` — a candidate for a removal migration. The `Genre` displayed in the UI comes from the IGDB REST API, not the table, so `Genre`/`GameGenre` may be dead schema. Audit each: drop via migration if truly unused, or add the entity query + UI consumer if planned. Removing dead schema also shrinks the surface future agents must reason about.

### 5. Trim the dependency override set

- **Dimension:** Supply Chain Security
- **Check:** SCS-07 (high, WARN)
- **Effort:** Low
- **Details:** `pnpm.overrides` pins **14 packages** (hono, valibot, js-yaml, fast-xml-parser, fast-xml-builder, fast-uri, handlebars, lodash, defu, picomatch, path-to-regexp, brace-expansion, smol-toml, yaml), exceeding the 10+ maintenance-debt threshold. No FAIL conditions — all are exact-pinned, aged >7 days, and documented in `DEPENDENCY_DECISIONS.md`. As upstream releases fold these fixes in, remove the corresponding overrides; or add a note in `DEPENDENCY_DECISIONS.md` explaining why a sustained count of ~14 is expected, so future audits read it as intentional.

### 6. Broaden CI vulnerability scanning to devDependencies

- **Dimension:** Supply Chain Security
- **Check:** SCS-06 (critical, PASS — hardening note)
- **Effort:** Low
- **Details:** CI `pnpm audit` runs `--prod`, so devDependencies (test/build tooling — a real supply-chain surface) are not scanned. The check still PASSes (blocking on PRs for prod deps), but dropping `--prod` or adding a second non-blocking full-tree audit step closes the gap.
