# AI Development Tooling — Audit Results

**Date:** 2026-06-10
**Score:** 100% — Grade **A**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| AI-01 | CLAUDE.md ecosystem provides adequate AI context | critical | PASS | 5 CLAUDE.md (root 149L, savepoint-tanstack 182L, infra 56L, command-palette, whats-new) + 10 `.claude/rules/tanstack/*.md` path-scoped rule files. Covers purpose (SavePoint backlog app), commands (per-layer tables), non-obvious conventions (C2 DAL, `.server.ts` bundler boundary, FSD import direction, foot-guns), git/CI workflow, and module gotchas (infra Cognito/S3, Terraform state). |
| AI-02 | Custom slash commands exist | medium | PASS | 10 commands under `.claude/commands/awos/` (architecture, hire, implement, linear, product, roadmap, spec, tasks, tech, verify) — well beyond the 3+ threshold. |
| AI-03 | Skills are configured | low | PASS | 11 skills with valid frontmatter under `.claude/skills/*/SKILL.md` (frontend-design, grill-me, react-best-practices, react-feature-sliced-design, terraform-conventions, accessibility, performance, shadcn, web-quality-audit, etc.). |
| AI-04 | MCP servers configured | low | PASS | `.mcp.json` defines 3 servers: awos-recruitment (http), terraform-mcp-server (stdio/docker), aws-knowledge-mcp-server (stdio/uvx). |
| AI-05 | Hooks are configured | low | PASS | `.claude/settings.json` defines PreToolUse (`check-sensitive-files.sh` on Read/Edit/Write/Glob/Grep/Bash) and PostToolUse (`format-and-lint.sh` on Write/Edit); both scripts present and executable in `.claude/hooks/`. |
| AI-06 | CLAUDE.md files are meaningful and well-structured | high | PASS | All 5 files <200 lines (149/182/56/64/45). Content is non-obvious and load-bearing (bundler boundaries, DAL invariants, divergence reasoning, Cognito downtime gotcha). Markdown headers + tables + concrete references. No directory-tree dumps, no vague "write clean code", no root↔service duplication (service files defer to root for cross-cutting concerns). |
| AI-07 | Agent can run and observe the application | critical | PASS | Web UI (TanStack Start, dev `:6060`): playwright plugin enabled in `.claude/settings.json` `enabledPlugins` (`playwright@claude-plugins-official`) provides browser observe. Terraform IaC (`infra/`): `terraform` on PATH (`/opt/homebrew/bin/terraform`) for `terraform plan` dry-run, plus terraform-mcp-server. Run instructions documented in root + infra CLAUDE.md. |

## Score math

- Non-SKIP checks: AI-01..07 (all evaluated)
- max_points = 3 (AI-01 critical) + 1 (AI-02 medium) + 0.5 (AI-03 low) + 0.5 (AI-04 low) + 0.5 (AI-05 low) + 2 (AI-06 high) + 3 (AI-07 critical) = **10.5**
- deductions = 0 (no FAIL, no WARN)
- raw_score = 10.5 − 0 = 10.5
- pct = (10.5 / 10.5) × 100 = **100%**
- Grade: **A** (90–100)

## Notes

- Known auto-commit/push behavior is environment-side (per project memory), not encoded in `.claude/settings.json` hooks; the two configured hooks are sensitive-file guarding and format/lint, which are legitimate guardrails.
- Browser observe capability for the web UI comes via the `playwright` plugin (enabledPlugins), not a `.mcp.json` server entry — functionally satisfies AI-07 for the primary app type.
