# AI Development Tooling — Audit Results

**Date:** 2026-05-12
**Score:** 90% — Grade **A**

## Results

| #   | Check                                              | Severity | Status | Evidence |
| --- | -------------------------------------------------- | -------- | ------ | -------- |
| 1   | AI-01 CLAUDE.md ecosystem provides adequate context| critical | PASS   | 28 CLAUDE.md files cover project purpose (root `/CLAUDE.md`), commands (`pnpm --filter savepoint …` table), monorepo conventions, layer rules (`savepoint-app/{app,features,widgets,data-access-layer,shared,test}/CLAUDE.md`), Terraform (`infra/CLAUDE.md`), and active migration target (`savepoint-tanstack/CLAUDE.md`). Complex modules (DAL sublayers handlers/services/repository) each have dedicated files. |
| 2   | AI-02 Custom slash commands exist                  | medium   | PASS   | 10 commands in `.claude/commands/awos/` (architecture, hire, implement, linear, product, roadmap, spec, tasks, tech, verify) — far above the 3+ threshold |
| 3   | AI-03 Skills are configured                        | low      | PASS   | 5 SKILL.md files: `frontend-design`, `grill-me`, `react-best-practices`, `react-feature-sliced-design`, `terraform-conventions` (under `.claude/skills/*/SKILL.md`). 5 additional skill directories exist without SKILL.md but threshold (1+) is satisfied. |
| 4   | AI-04 MCP servers configured                       | low      | PASS   | `.mcp.json` defines 3 servers: `awos-recruitment` (http), `terraform-mcp-server` (stdio docker), `aws-knowledge-mcp-server` (stdio uvx) |
| 5   | AI-05 Hooks are configured                         | low      | PASS   | `.claude/settings.json` defines `PreToolUse` (`.claude/hooks/check-sensitive-files.sh` on Read/Edit/Write/Glob/Grep/Bash) and `PostToolUse` (`.claude/hooks/format-and-lint.sh` on Write/Edit with 30s timeout) |
| 6   | AI-06 CLAUDE.md files meaningful & well-structured | high     | WARN   | Content quality is high (concrete rules, file paths, trip-wires — not vague). However 2 files exceed 200-line guideline: `savepoint-tanstack/CLAUDE.md` (484 lines — over 2x guideline, approaching the 300+ "heavily bloated" zone in spirit though content is dense and substantive), `savepoint-app/data-access-layer/CLAUDE.md` (224 lines). All other 26 files are under 200 lines (median ~25). Some duplication risk: root `CLAUDE.md` Commands section overlaps with package.json scripts but adds non-obvious filter syntax. |
| 7   | AI-07 Agent can run and observe the application   | critical | PASS   | Web UIs (Next.js + TanStack Start): `playwright@claude-plugins-official` plugin enabled in `.claude/settings.json` provides browser MCP for observation; Playwright also installed for e2e (`pnpm --filter savepoint test:e2e`). API endpoints verifiable via Bash/curl after `pnpm dev`. Terraform IaC: `terraform-mcp-server` in `.mcp.json` plus standard `terraform plan` dry-run documented in `infra/CLAUDE.md`. Docker compose for local Postgres/LocalStack documented in root `CLAUDE.md` Quick Start. |

## Scoring

- Max points = 3 (AI-01) + 1 (AI-02) + 0.5 (AI-03) + 0.5 (AI-04) + 0.5 (AI-05) + 2 (AI-06) + 3 (AI-07) = **10.5**
- Deductions = AI-06 WARN (high) = **1.0**
- Raw score = 9.5 → **90.48% → Grade A**

## AI Tooling Summary

- **CLAUDE.md ecosystem:** 28 files, 1867 total lines, median ~25 lines per file. Root + per-layer + per-feature + per-widget coverage.
- **Custom commands:** 10 (all AWOS workflow: spec, tech, tasks, implement, verify, architecture, hire, linear, product, roadmap)
- **Skills:** 5 with SKILL.md (frontend-design, grill-me, react-best-practices, react-feature-sliced-design, terraform-conventions); 5 stub directories without SKILL.md (accessibility, best-practices, core-web-vitals, performance, web-quality-audit)
- **MCP servers:** awos-recruitment (HTTP), terraform-mcp-server (stdio/docker), aws-knowledge-mcp-server (stdio/uvx)
- **Enabled plugins:** `playwright@claude-plugins-official`, `awos@awos-marketplace`
- **Hooks:** pre-tool sensitive-file guard, post-tool format+lint
- **Files exceeding 200-line CLAUDE.md guideline:** `savepoint-tanstack/CLAUDE.md` (484), `savepoint-app/data-access-layer/CLAUDE.md` (224)
- **Run/observe coverage:** web UIs via Playwright plugin + dev server; APIs via curl; Terraform via terraform-mcp-server + `terraform plan`; DB/S3 via docker-compose
