# Prompt & Agent Integrity — Audit Results
**Date:** 2026-05-23
**Score:** 100% — Grade **A**

## Results

| # | Check | Severity | Status | Evidence |
| --- | --- | --- | --- | --- |
| PAI-01 | No invisible/hidden Unicode in prompt files | critical | PASS | Python byte-scan of 67 prompt files (CLAUDE.md, **/CLAUDE.md, .claude/agents,skills,commands,rules) for zero-width, directional-override/isolate, invisible-separator, tag-char, mid-file ZWNBSP: none found. No BOM issues. |
| PAI-02 | No prompt injection patterns | critical | PASS | Case-insensitive grep for role-override ("ignore previous instructions", "you are now", "new system prompt", "disregard"), exfiltration, "disable hook", "ignore security", env reads, "edit CLAUDE.md": 0 matches. All `.env` mentions are defensive/operational config guidance (e.g. CLAUDE.md:42 "Never read process.env.* outside env.ts", infra setup). No `audit:ignore` markers needed. |
| PAI-03 | Hook scripts no suspicious commands | critical | PASS | Two hooks. `check-sensitive-files.sh` is a PreToolUse defensive blocker (exit 2 on .env/credentials/*.pem/*.key access — verified live: it blocked my own grep). `format-and-lint.sh` runs prettier+eslint only. No network exfil, no base64/eval, no download-execute. (Note: format-and-lint.sh hardcodes a `savepoint-app` path that was removed in spec 021, so it no-ops — broken-but-benign, not a security issue.) |
| PAI-04 | MCP server configs trusted endpoints | critical | PASS | .mcp.json: `awos-recruitment` = https://recruitment.awos.provectus.pro/mcp (https, trusted Provectus domain, no creds). `terraform-mcp-server` = `docker run --rm hashicorp/terraform-mcp-server` (official image). `aws-knowledge-mcp-server` = `uvx fastmcp run https://knowledge-mcp.global.api.aws` (https AWS endpoint). All https/known, no bare IPs, no embedded credentials. |
| PAI-05 | Agent/config files have git provenance | high | PASS | settings.json, .mcp.json, both hook scripts, all 3 CLAUDE.md TRACKED. settings.local.json correctly gitignored (intentional personal). All on-disk files under .claude/agents,commands,skills,rules are tracked (`git ls-files --others` returned none). No untracked critical configs. |
| PAI-06 | Skill/command files no security-bypass instructions | critical | PASS | Globbed .claude/commands/**/*.md + .claude/skills/**/*.md. No "disable hook", "--no-verify", "modify settings.json", offensive .env reads. No `$ARGUMENTS` interpolation and no `bash -c`/`eval` shell injection sinks found. |

## Summary
All 6 checks PASS. No malicious or suspicious content detected in any AI agent config file. Notable positive: the project ships a working defensive PreToolUse hook (`check-sensitive-files.sh`) that actively blocks agent access to secrets — it triggered against this auditor's own commands, confirming it functions. One non-security cleanup item: `.claude/hooks/format-and-lint.sh` still targets the removed `savepoint-app/` path and silently no-ops; it should be repointed at `savepoint-tanstack/`.

**Scoring:** All non-skipped checks PASS → 0 deductions. max = 3+3+3+3+2+3 = 17. pct = (17-0)/17 = 100% → Grade A.
