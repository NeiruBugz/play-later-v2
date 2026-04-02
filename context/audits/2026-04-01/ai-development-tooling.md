# AI Development Tooling — Audit Results

**Date:** 2026-04-01
**Score:** 86% — Grade **B**

## Results

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| AI-01 | CLAUDE.md ecosystem provides adequate AI context | critical | PASS | 28 CLAUDE.md files: root, 3 layers (savepoint-app/app, lambdas-py, infra), DAL sublayers (handlers, services, repository), features layer + 14 individual features, widgets layer + 2 widgets, shared, test. Combined ecosystem covers: project purpose, architecture, all key commands per layer, cross-layer communication (SQS/S3/PostgreSQL), non-obvious conventions (import hierarchy, Result pattern, FSD layers, cross-feature exceptions), critical gotchas (Lambda event loop, dependency upper bounds, Docker builds, secret management). |
| AI-02 | Custom slash commands exist | medium | PASS | 10 custom commands in `.claude/commands/awos/`: architecture, implement, product, roadmap, spec, tasks, tech, verify, hire, linear. |
| AI-03 | Skills are configured | low | PASS | 4 skills: `frontend-design`, `react-best-practices`, `react-feature-sliced-design`, `terraform-conventions` in `.claude/skills/*/SKILL.md`. |
| AI-04 | MCP servers configured | low | PASS | `.mcp.json` defines 3 servers: awos-recruitment (HTTP), terraform-mcp-server (Docker/stdio), aws-knowledge-mcp-server (uvx/stdio). Additionally, `enabledPlugins` includes `playwright@claude-plugins-official`. |
| AI-05 | Hooks are configured | low | PASS | `.claude/settings.json` configures PreToolUse hook (check-sensitive-files.sh on Read/Edit/Write/Glob/Grep/Bash) and PostToolUse hook (format-and-lint.sh on Write/Edit with 30s timeout). |
| AI-06 | CLAUDE.md files are meaningful and well-structured | high | PASS | All 28 files under 200 lines (max: 154 lines in data-access-layer/CLAUDE.md). Content is non-obvious and well-structured: architectural rules, import restrictions, cross-feature exception table, Result pattern conventions, Lambda gotchas, security defaults, testing strategies. Feature-level files are concise (11-17 lines) but contain meaningful notes (import dependencies, key behaviors). No bloat, no directory listings, no duplicated content between levels. |
| AI-07 | Agent can run and observe the application | critical | WARN | Web UI: Playwright plugin enabled in settings.json -- agent can browse the app. API/server: built-in curl capability sufficient. Infrastructure: terraform-mcp-server configured for plan/apply. Gap: Lambda/serverless layer has no local invoke tooling configured (no SAM CLI, no serverless-offline, no LocalStack invoke integration). Agent cannot locally invoke or test Lambda functions through MCP tools. |

## Scoring

| Severity | Weight | Checks |
|----------|--------|--------|
| critical | 3 | AI-01, AI-07 |
| high | 2 | AI-06 |
| medium | 1 | AI-02 |
| low | 0.5 | AI-03, AI-04, AI-05 |

- **Max points:** 10.5
- **Deductions:** 1.5 (AI-07 WARN at critical severity = 1.5)
- **Score:** (10.5 - 1.5) / 10.5 = 85.7% -> **86%**
- **Grade:** B

## Summary

The project has an exemplary AI development tooling setup. The CLAUDE.md ecosystem is comprehensive with 28 files providing layered, non-obvious context. The slash command library (10 commands), skills (4), MCP servers (3), and hooks (2) demonstrate mature Claude Code adoption. The single gap is the Lambda/serverless layer lacking local invoke tooling, meaning the agent cannot directly run or test Python Lambda functions locally through configured tools.
