---
dimension: prompt-agent-integrity
date: 2026-05-18
---

# Prompt & Agent Integrity — Audit Results

**Date:** 2026-05-18
**Score:** 100% — Grade **A**

## Results

| #   | Check                                                     | Severity | Status | Evidence |
| --- | --------------------------------------------------------- | -------- | ------ | -------- |
| 1   | PAI-01 No invisible/hidden Unicode in prompt files        | critical | PASS   | Byte-level scan of 110 prompt/instruction files (`CLAUDE.md` ×30, `.claude/agents/*.md` ×11, `.claude/rules/tanstack/*.md` ×10, `.claude/skills/**/*.md`, `.claude/commands/awos/*.md` ×10) for U+200B/C/D, U+2060, mid-file U+FEFF, U+202A–E, U+2062–4, and U+E0001–E007F tag block: zero matches. |
| 2   | PAI-02 No prompt-injection patterns in instructions       | critical | PASS   | ripgrep over `.claude/`, all `CLAUDE.md`, `savepoint-{app,tanstack}/`, `infra/` for role-override / exfiltration / bypass / sensitive-file-read / self-modification patterns. Matches: (a) `.claude/hooks/check-sensitive-files.sh:59` — the defensive deny regex itself; (b) `savepoint-tanstack/CLAUDE.md:140` — "Never read `process.env.*` outside `env.ts`" (defensive); (c) `.claude/skills/terraform-conventions/references/{ci-cd-workflows.md:48, security-compliance.md:42}` — fenced `curl … \| (sh\|bash)` snippets quoting official tflint / trivy install scripts from `raw.githubusercontent.com` (reference docs, not directives). No offensive instructions. |
| 3   | PAI-03 Hook scripts contain no suspicious commands        | critical | PASS   | `.claude/settings.json` registers two hooks: `PreToolUse` (matcher `Read\|Edit\|Write\|Glob\|Grep\|Bash`) → `.claude/hooks/check-sensitive-files.sh`, and `PostToolUse` (matcher `Write\|Edit`) → `.claude/hooks/format-and-lint.sh`. First script: `jq`-parses tool input, case-statement deny for `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`; exits 2 on match — purely defensive, `set -euo pipefail`. Second script: scope-gated to `savepoint-app/`, runs `pnpm exec prettier --write` and `pnpm exec eslint --fix` on ts/tsx/js/jsx/mdx/css/json only. No `curl`/`wget`/`nc`, no `base64`/`eval`, no env harvesting, no background network, no download-and-execute. Both scripts exist on disk and are executable (`-rwxr-xr-x`). |
| 4   | PAI-04 MCP server configs point to trusted endpoints      | critical | PASS   | `.mcp.json` defines 3 servers, all HTTPS or known stdio. (a) `awos-recruitment` type=http, `https://recruitment.awos.provectus.pro/mcp` — HTTPS on owner org domain (Provectus, matches user `@provectus.com`). (b) `terraform-mcp-server` stdio, `docker run -i --rm hashicorp/terraform-mcp-server` — official HashiCorp image. (c) `aws-knowledge-mcp-server` stdio, `uvx fastmcp run https://knowledge-mcp.global.api.aws` — `fastmcp` (legitimate MCP runner) pointed at official `*.api.aws` HTTPS endpoint. No bare IPs, no `http://` remotes, no in-URL credentials, no `curl \| sh` patterns. |
| 5   | PAI-05 Agent and configuration files have git provenance  | high     | PASS   | `git ls-files --error-unmatch` confirms tracked: `.claude/settings.json`, `.mcp.json`, root `CLAUDE.md` + 29 nested `**/CLAUDE.md`, all 11 `.claude/agents/*.md`, all 10 `.claude/commands/awos/*.md`, all 10 `.claude/rules/tanstack/*.md`, both `.claude/hooks/*.sh`, skill `SKILL.md` files. `git status --porcelain .claude/ .mcp.json CLAUDE.md` empty. `git ls-files --others --exclude-standard .claude/` empty. Only untracked item is `.claude/settings.local.json` (matched by `git check-ignore` → explicitly gitignored as per-machine personal config). |
| 6   | PAI-06 Skill/command files lack security-bypass content   | critical | PASS   | ripgrep over `.claude/commands/awos/` (10 workflow commands) and `.claude/skills/` (10 skills) for hook-bypass / settings-modification / secret-access / self-modification / warning-suppression: no offensive matches (the lone hit at `.claude/skills/terraform-conventions/references/code-patterns.md` is a defensive verification step — `terraform show` should NOT display password). No `$ARGUMENTS`-into-shell injection patterns (`rg '\$ARGUMENTS' .claude/commands .claude/skills` returns empty); no `bash -c "$ARGUMENTS"` constructs in any skill. |

## Dimension Summary

- **Max points:** 5 × 3 (critical) + 1 × 2 (high) = 17
- **Deductions:** 0
- **Raw score:** 17 / 17 = **100%** — Grade **A**

### Files in scope (110 prompt/instruction files + 2 configs + 2 hook scripts)

- `.claude/settings.json`, `.mcp.json` (tracked)
- `.claude/hooks/check-sensitive-files.sh`, `.claude/hooks/format-and-lint.sh` (tracked, defensive)
- `.claude/agents/` — 11 sub-agent definitions (tracked)
- `.claude/commands/awos/` — 10 workflow commands (tracked)
- `.claude/rules/tanstack/` — 10 path-scoped rule files (tracked)
- `.claude/skills/` — 10 skill bundles (tracked)
- 30 `CLAUDE.md` files across repo (tracked)

### Notes / observations (informational, not findings)

- `.claude/skills/terraform-conventions/references/{ci-cd-workflows.md, security-compliance.md}` embed `curl … | bash` / `curl … | sh` install snippets in fenced code blocks quoting official upstream URLs (`raw.githubusercontent.com/terraform-linters/tflint`, `raw.githubusercontent.com/aquasecurity/trivy`). These are documentation, not agent directives. Consider replacing with a brew/apt install example if you want future scans to be match-free, or add an inline `<!-- audit:ignore PAI-02 -->` comment.
- `.claude/settings.local.json` is gitignored — standard Claude Code per-user override pattern. Critical config (`.claude/settings.json`) is tracked. No action needed.
- All 3 MCP servers (`awos-recruitment`, `terraform-mcp-server`, `aws-knowledge-mcp-server`) point to verifiable, trusted endpoints with no credential leakage.
