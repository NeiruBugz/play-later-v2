# Prompt & Agent Integrity — Audit Results

**Date:** 2026-06-10
**Score:** 91% — Grade **A**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| PAI-01 | No invisible/hidden Unicode in prompt files | critical | PASS | Byte-level PCRE2 scan (ZW chars, RTL/LTR overrides, invisible separators, tag block, mid-file BOM) across 9 agents, 5 SKILL.md + references, 10 commands, 10 rules, 7 CLAUDE.md → 0 hits |
| PAI-02 | No prompt-injection patterns | critical | PASS | Offensive-pattern grep (role override, exfiltration, secret-read, bypass) over full prompt set → 0 matches; no defensive/offensive ambiguity to flag |
| PAI-03 | Hook scripts contain no suspicious commands | critical | PASS | `.claude/settings.json` hooks → `check-sensitive-files.sh` (defensive: blocks .env/*.pem/*.key, exit 2) + `format-and-lint.sh` (prettier/eslint only). No curl/wget/nc/base64/eval/printenv/push in repo hooks |
| PAI-04 | MCP endpoints trusted | critical | WARN | `.mcp.json`:3 awos-recruitment `https://recruitment.awos.provectus.pro/mcp` (own org, HTTPS — ok); :7 terraform `docker run hashicorp/terraform-mcp-server` (official — ok); :17 aws-knowledge `uvx fastmcp run https://knowledge-mcp.global.api.aws` — remote-fetch-and-run of a spec from AWS domain; legitimate/identifiable but non-standard pattern |
| PAI-05 | Agent/config files have git provenance | high | PASS | `git ls-files --error-unmatch`: settings.json, .mcp.json, both hook scripts, all 41 agent/skill/command/rule/CLAUDE.md files TRACKED. Only `.claude/settings.local.json` untracked but gitignored (intentional local-only) |
| PAI-06 | Command/skill files free of security-bypass + arg injection | critical | PASS | Bypass-pattern grep over 10 commands + 5 skills → 0 matches; no `$ARGUMENTS`/`bash -c "$..."`/backtick-into-shell injection sinks found |

## Score Math

- Non-SKIP checks: PAI-01..06. max_points = 3 + 3 + 3 + 3 + 2 + 3 = **17**
- Deductions: PAI-04 WARN (critical) = 1.5; all others PASS = 0. Total = **1.5**
- raw_score = 17 − 1.5 = 15.5
- pct = 15.5 / 17 × 100 = **91.18% → 91%**
- Grade: **A** (90–100)

## Notes

- The known env-level auto-commit+push hook (per memory) lives in user-global `~/.claude/`, NOT in this repo's `.claude/settings.json` or `.claude/hooks/`. Repo-tracked hooks are purely defensive; the auto-push behavior is outside repo-config audit scope but flagged here for awareness.
- PAI-04 is the only deduction. To clear: prefer a pinned local terraform/aws MCP package or a vendored spec over `uvx fastmcp run <remote-url>` so the executed MCP definition is pinned and reviewable.
