---
dimension: ai-development-tooling
date: 2026-05-18
---

# AI Development Tooling — Audit Results

**Date:** 2026-05-18
**Score:** 90% — Grade **A**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| 1   | AI-01 CLAUDE.md ecosystem provides adequate AI context | critical | PASS | 29 CLAUDE.md files: root `CLAUDE.md` (project purpose, commands by layer, git workflow, spec workflow, CI), per-layer (`savepoint-app/{app,features,widgets,shared,data-access-layer,test}/CLAUDE.md`, `savepoint-tanstack/CLAUDE.md`, `infra/CLAUDE.md`), per-feature (10 features) and per-widget (8 widgets). Covers purpose, commands, conventions, complex-module gotchas. |
| 2   | AI-02 Custom slash commands exist | medium | PASS | 10 commands under `.claude/commands/awos/` (architecture, hire, implement, linear, product, roadmap, spec, tasks, tech, verify). |
| 3   | AI-03 Skills are configured | low | PASS | 5 skills with SKILL.md: `frontend-design`, `grill-me`, `react-best-practices`, `react-feature-sliced-design`, `terraform-conventions`. |
| 4   | AI-04 MCP servers configured | low | PASS | `.mcp.json` defines 3 servers: `awos-recruitment` (http), `terraform-mcp-server` (stdio/docker), `aws-knowledge-mcp-server` (stdio/uvx). |
| 5   | AI-05 Hooks are configured | low | PASS | `.claude/settings.json` defines `PreToolUse` (`check-sensitive-files.sh`) and `PostToolUse` (`format-and-lint.sh`); scripts present in `.claude/hooks/`. |
| 6   | AI-06 CLAUDE.md files are meaningful and well-structured | high | WARN | Content quality is strong (concrete, non-obvious, well-structured) but 2 files exceed 200-line guideline: `savepoint-tanstack/CLAUDE.md` (512 lines), `savepoint-app/data-access-layer/CLAUDE.md` (224 lines). Remaining 27 files all under 200 lines (largest: root 136, `app/CLAUDE.md` 135, `features/CLAUDE.md` 101). |
| 7   | AI-07 Agent can run and observe the application | critical | PASS | Primary type is web (Next.js 15 + TanStack Start). No browser MCP in `.mcp.json`, but `.claude/settings.json` enables `playwright@claude-plugins-official` plugin providing browser tooling. Terraform IaC supports dry-run (`terraform plan`) per `infra/CLAUDE.md`. Run commands documented in root `CLAUDE.md`. |

## Scoring detail

- Max points: 3 (AI-01) + 1 (AI-02) + 0.5 (AI-03) + 0.5 (AI-04) + 0.5 (AI-05) + 2 (AI-06) + 3 (AI-07) = 10.5
- Deductions: AI-06 WARN at high severity = 1.0
- Raw: 9.5 / 10.5 = 90.48% → Grade A
