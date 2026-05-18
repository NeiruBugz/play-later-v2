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
| 1   | PAI-01 No invisible/hidden Unicode in prompt files        | critical | PASS   | Byte-level scan of 106 files (`.claude/agents/*.md`, `.claude/skills/**/*.md`, `.claude/commands/awos/*.md`, `CLAUDE.md` + 29 nested `**/CLAUDE.md`, `.github/prompts/*.md`) for U+200B/C/D, U+2060, mid-file U+FEFF, U+202A–E, U+2062–4, and U+E0001–E007F tag block: zero matches. |
| 2   | PAI-02 No prompt-injection patterns in instructions       | critical | PASS   | ripgrep over `.claude/`, `.github/prompts/`, `CLAUDE.md`, `savepoint-{app,tanstack}/`, `infra/` for role-override / exfiltration / bypass / sensitive-file-read / self-modification patterns. Only matches: two `curl…\| bash` fences in `.claude/skills/terraform-conventions/references/{ci-cd-workflows.md:48,security-compliance.md:42}` — both are fenced documentation snippets quoting upstream install scripts from `raw.githubusercontent.com/terraform-linters/tflint` and `aquasecurity/trivy` (reference material, not agent instructions). One benign hit in `CLAUDE.md:38` (`"Modify infra / Terraform"` table label) and one in `.claude/hooks/check-sensitive-files.sh:59` (the defensive regex itself). No offensive instructions. |
| 3   | PAI-03 Hook scripts contain no suspicious commands        | critical | PASS   | `.claude/settings.json` registers two hooks: `PreToolUse` → `.claude/hooks/check-sensitive-files.sh` and `PostToolUse` → `.claude/hooks/format-and-lint.sh`. First script: `jq` parse of tool input + filename allow/deny case statements, exits 2 on sensitive paths — purely defensive. Second script: scopes to `savepoint-app/`, runs `pnpm exec prettier --write` and `pnpm exec eslint --fix`. No `curl`/`wget`/`nc`, no `base64`/`eval`, no env harvesting, no background network. Both scripts exist on disk and are executable. |
| 4   | PAI-04 MCP server configs point to trusted endpoints      | critical | PASS   | `.mcp.json` defines 3 servers — all HTTPS or known stdio. (a) `awos-recruitment` HTTP type, URL `https://recruitment.awos.provectus.pro/mcp` — HTTPS on project owner's domain (Provectus, matches user org `@provectus.com`). (b) `terraform-mcp-server` stdio, `docker run -i --rm hashicorp/terraform-mcp-server` — official HashiCorp image. (c) `aws-knowledge-mcp-server` stdio, `uvx fastmcp run https://knowledge-mcp.global.api.aws` — fastmcp runner pointed at official `*.api.aws` HTTPS endpoint. No bare IPs, no `http://` remotes, no in-URL credentials, no `curl \| sh` patterns. |
| 5   | PAI-05 Agent and configuration files have git provenance  | high     | PASS   | `git ls-files --error-unmatch` confirms tracked: `.claude/settings.json`, `.mcp.json`, all 11 `.claude/agents/*.md`, all 10 `.claude/commands/awos/*.md`, both `.claude/hooks/*.sh`, `CLAUDE.md` + 29 nested `**/CLAUDE.md`, all 7 `.github/prompts/*.md`. Five entries under `.claude/skills/{accessibility,best-practices,core-web-vitals,performance,web-quality-audit}/SKILL.md` initially appeared untracked, but they are symlinks to `.agents/skills/<name>/SKILL.md` — both the symlinks (`git ls-files .claude/skills/`) and the resolved targets (`git ls-files .agents/skills/`) are tracked. `.claude/settings.local.json` is the standard local-user override (Claude convention), not in PAI-05 scope. |
| 6   | PAI-06 Skill/command files lack security-bypass content   | critical | PASS   | ripgrep over `.claude/commands/` (10 awos workflow commands) and `.claude/skills/` (10 skills) for hook-bypass / settings-modification / secret-access / self-modification / warning-suppression: single match at `.claude/skills/terraform-conventions/references/code-patterns.md:785` — a defensive verification step ("Verify secret not in state: `terraform show` should not display password"), opposite of exfiltration. No `$ARGUMENTS`-into-shell injection patterns; no `bash -c "$ARGUMENTS"` constructs in any skill. |

## Dimension Summary

- **Max points:** 6 × 3 (critical) + 1 × 2 (high) = 20
- **Deductions:** 0
- **Raw score:** 20 / 20 = **100%** — Grade **A**

### Files in scope (106 prompt/instruction files + 2 configs + 2 hook scripts)

- `.claude/settings.json`, `.mcp.json` (tracked)
- `.claude/hooks/check-sensitive-files.sh`, `.claude/hooks/format-and-lint.sh` (tracked, defensive)
- `.claude/agents/` — 11 agent definitions (tracked)
- `.claude/commands/awos/` — 10 workflow commands (tracked)
- `.claude/skills/` — 10 skill bundles (5 native, 5 symlinked from tracked `.agents/skills/`)
- `.github/prompts/` — 7 prompt mirrors (tracked)
- 30 `CLAUDE.md` files across repo (tracked)

### Notes / observations (informational, not findings)

- The terraform-conventions skill reference docs (`ci-cd-workflows.md`, `security-compliance.md`) embed `curl … | bash` and `curl … | sh` install snippets in fenced code blocks. These are documentation, not directives to the agent, and target official upstream domains (`raw.githubusercontent.com/terraform-linters/tflint`, `raw.githubusercontent.com/aquasecurity/trivy`). Consider rewording to a `# install via package manager (brew/apt)` example if you want to keep the dimension match-free in future scans.
- `.claude/settings.local.json` exists on disk and is untracked, but is not gitignored. This is the standard Claude per-machine override file (out of PAI-05's enumerated scope). If shared local config is undesired, add `.claude/settings.local.json` to `.gitignore` to make the intent explicit.
