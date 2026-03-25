# AI Development Tooling — Audit Results

**Date:** 2026-03-25
**Score:** 48% — Grade **D**

## Results

| # | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| AI-01 | CLAUDE.md ecosystem provides adequate AI context | critical | FAIL | No root CLAUDE.md exists. No file in the ecosystem states project purpose, cross-service relationships, git workflow, or CI. 10 service-level files exist (savepoint-app modules, lambdas-py, infra) but none provide top-level orientation. |
| AI-02 | Custom slash commands exist | medium | PASS | 9 commands in `.claude/commands/awos/`: architecture, hire, implement, product, roadmap, spec, tasks, tech, verify. |
| AI-03 | Skills are configured | low | PASS | 3 skills with valid SKILL.md: `frontend-design`, `react-best-practices`, `react-feature-sliced-design`. |
| AI-04 | MCP servers configured | low | PASS | `.mcp.json` defines `awos-recruitment` server. `.claude/settings.json` enables `playwright@claude-plugins-official`. |
| AI-05 | Hooks are configured | low | PASS | `PreToolUse` hook configured in `.claude/settings.json` running `check-sensitive-files.sh` on Read/Edit/Write/Glob/Grep/Bash. |
| AI-06 | CLAUDE.md files are meaningful and well-structured | high | WARN | Directory tree listings in `app/CLAUDE.md` (lines 15-33) and `data-access-layer/CLAUDE.md` (lines 39-71) are discoverable. Template/tutorial code in handlers and services files. Import rules duplicated across DAL parent and sub-layer files. All files under 200 lines. Genuinely useful non-obvious content exists (Lambda gotchas, infra gotchas, cross-feature exceptions, Result pattern). |
| AI-07 | Agent can run and observe the application | critical | WARN | Playwright plugin enabled for web UI observation. API/server and Terraform have built-in capability. No explicit dev server run instructions (`pnpm dev` or equivalent) in any CLAUDE.md. Lambda workers lack local invoke tooling (no SAM/LocalStack MCP) but are testable via `uv run pytest`. |

## Scoring Breakdown

| Check | Severity | Weight | Status | Deduction |
| --- | --- | --- | --- | --- |
| AI-01 | critical | 3 | FAIL | 3 |
| AI-02 | medium | 1 | PASS | 0 |
| AI-03 | low | 0.5 | PASS | 0 |
| AI-04 | low | 0.5 | PASS | 0 |
| AI-05 | low | 0.5 | PASS | 0 |
| AI-06 | high | 2 | WARN | 1 |
| AI-07 | critical | 3 | WARN | 1.5 |
| **Total** | | **10.5** | | **5.5** |

Score: (10.5 - 5.5) / 10.5 = 48%

## Key Findings

1. **No root CLAUDE.md** -- the most impactful gap. An agent opening this repo has no top-level context: no project purpose ("SavePoint is a game library management app"), no cross-service architecture overview, no shared commands (build/test/lint for the whole repo), no git workflow or CI documentation. Service-level files are thorough but assume the agent already understands the project.

2. **Service-level files contain discoverable content** -- directory tree listings and code templates/tutorials that an agent can infer from file structure and existing code. These inflate file size without adding non-obvious value.

3. **No dev server run instructions** -- none of the CLAUDE.md files document how to start the Next.js app (`pnpm dev`, required env vars, database setup). The agent must discover this independently.
