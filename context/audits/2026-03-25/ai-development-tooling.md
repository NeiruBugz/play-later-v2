# AI Development Tooling — Audit Results
**Date:** 2026-03-25
**Score:** 33% — Grade **F**

## Results

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| AI-01 | CLAUDE.md ecosystem provides adequate AI context | critical | WARN | 9 module-level CLAUDE.md files cover savepoint-app layers well. Root CLAUDE.md deleted on working tree (exists on HEAD, 899 lines in worktree copy). No CLAUDE.md for lambdas-py/ or infra/ — two of three service directories have zero AI context. |
| AI-02 | Custom slash commands exist | medium | PASS | 9 commands in `.claude/commands/awos/`: architecture, hire, implement, product, roadmap, spec, tasks, tech, verify. |
| AI-03 | Skills are configured | low | PASS | 3 skills: `frontend-design`, `react-best-practices`, `react-feature-sliced-design` in `.claude/skills/`. |
| AI-04 | MCP servers configured | low | PASS | `.mcp.json` has 1 server: `awos-recruitment` (HTTP type). |
| AI-05 | Hooks are configured | low | FAIL | `.claude/settings.json` contains only `extraKnownMarketplaces` — no `hooks` key present. |
| AI-06 | CLAUDE.md files are meaningful and well-structured | high | FAIL | 5 of 9 files exceed 200-line limit: features (345), shared (273), test (292), domain (261), repository (333). Root worktree CLAUDE.md is 899 lines — severely bloated. Multiple files contain extensive directory trees, code templates, and tutorial-style prose (e.g., features/CLAUDE.md has 6 cross-feature exception blocks with full code examples; test/CLAUDE.md has 100+ lines of testing pattern examples). Significant duplication of architecture diagrams and import rules between root and sublayer files. |
| AI-07 | Agent can run and observe the application | critical | FAIL | Primary app is a Next.js web UI — no browser MCP (Puppeteer/Playwright) in `.mcp.json`. Lambda layer (lambdas-py/): no SAM/serverless local invoke tooling. Terraform (infra/): no plan/diff MCP. Agent cannot visually verify or interact with any application layer. |

## Scoring Breakdown

| # | Severity | Weight | Status | Deduction |
|---|----------|--------|--------|-----------|
| AI-01 | critical | 3.0 | WARN | 1.5 |
| AI-02 | medium | 1.0 | PASS | 0.0 |
| AI-03 | low | 0.5 | PASS | 0.0 |
| AI-04 | low | 0.5 | PASS | 0.0 |
| AI-05 | low | 0.5 | FAIL | 0.5 |
| AI-06 | high | 2.0 | FAIL | 2.0 |
| AI-07 | critical | 3.0 | FAIL | 3.0 |
| **Total** | | **10.5** | | **7.0** |

Score: (10.5 - 7.0) / 10.5 = 33%
