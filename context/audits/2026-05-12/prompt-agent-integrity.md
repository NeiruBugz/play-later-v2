# Prompt & Agent Integrity — Audit Results

**Date:** 2026-05-12
**Score:** 91% — Grade **A**

## Results

| #   | Check                                                                 | Severity | Status | Evidence |
| --- | --------------------------------------------------------------------- | -------- | ------ | -------- |
| 1   | PAI-01 No invisible/hidden Unicode in prompt files                    | critical | PASS   | Scanned 98 files (`.claude/**`, `.awos/**`, `.agents/**`, all `CLAUDE.md`, `.mcp.json`, `.claude/settings*.json`); 0 ZWSP/ZWNJ/ZWJ/WJ/RLO/LRO/RLE/LRE/PDF/INV-SEP, 0 mid-file BOM, 0 Unicode tag chars (U+E0001–U+E007F) |
| 2   | PAI-02 No prompt injection patterns in agent instruction files        | critical | PASS   | ripgrep across same file set for role-override (`ignore previous`, `you are now`, `[system]`, `override:`), exfiltration (`exfiltrate`, `curl…\|`, `wget…\|`, `send…contents…to`), security-bypass (`disable hook`, `bypass restrict`, `ignore security`), sensitive-file-targeting (`cat .env`, `print api.key`, `output token`), and self-modification (`modify this file`, `edit CLAUDE.md`) returned 0 matches |
| 3   | PAI-03 Hook scripts do not contain suspicious commands                | critical | PASS   | `.claude/settings.json` references 2 hooks: `.claude/hooks/check-sensitive-files.sh` (PreToolUse — blocks `.env`/`*.pem`/`*.key`/`credentials*`/`secrets*` access via jq+grep; exit 2 on match, no network calls) and `.claude/hooks/format-and-lint.sh` (PostToolUse — runs local `pnpm exec prettier --write` and `pnpm exec eslint --fix` inside `savepoint-app/`; no curl/wget/nc/base64/eval/nohup, no sensitive-file reads) |
| 4   | PAI-04 MCP server configurations point to trusted endpoints           | critical | WARN   | `.mcp.json` defines 3 servers: (a) `awos-recruitment` HTTP type → `https://recruitment.awos.provectus.pro/mcp` — HTTPS, company-owned domain matching `provectus/awos` marketplace, no embedded creds — OK; (b) `terraform-mcp-server` stdio → `docker run -i --rm hashicorp/terraform-mcp-server` — official HashiCorp image, trusted; (c) `aws-knowledge-mcp-server` stdio → `uvx fastmcp run https://knowledge-mcp.global.api.aws` — unusual pattern that uses `uvx` to install generic `fastmcp` package and pass a remote URL as argument; domain is AWS-owned and HTTPS, but the package name `fastmcp` does not follow MCP server naming conventions (`@modelcontextprotocol/server-*`, `mcp-server-*`), and the remote-URL-as-argument shape is closer to a remote-fetch pattern than a stdio server. Legitimate, but non-standard — recommend pinning a version or migrating to an `http`-type server entry |
| 5   | PAI-05 Agent and configuration files have git provenance              | high     | PASS   | `git ls-files --error-unmatch` succeeds for `.claude/settings.json`, `.mcp.json`, root `CLAUDE.md`, both `.claude/hooks/*.sh`; iterated over every file in `.claude/agents/`, `.claude/commands/`, `.claude/skills/`, `.awos/commands/`, `.awos/templates/`, `.awos/scripts/`, `.agents/skills/`, and all 30 `CLAUDE.md` files — 0 untracked. `.claude/settings.local.json` is gitignored (intentional local-only) |
| 6   | PAI-06 Skill/command files contain no security bypass instructions    | critical | PASS   | ripgrep across `.claude/commands/awos/*.md` (10 files), `.claude/skills/**/*.md` (13 files), `.awos/commands/*.md` (10 files) for hook/guardrail bypass (`disable hook`, `--no-verify`, `circumvent security`), settings modification (`modify settings.json`, `alter config`), secret access (`read .env`, `dump secrets`, `output secret`), and `--force` returned 0 matches. `$ARGUMENTS` not used anywhere — no shell-injection surface |

## Scoring

- Max points: 5 critical × 3 + 1 high × 2 = **17**
- Deductions: PAI-04 WARN (critical) = **1.5**
- Raw score: 15.5 / 17 = **91.2%** → Grade **A**

## Findings Summary

| Priority | Check  | Issue |
| -------- | ------ | ----- |
| P1       | PAI-04 | `aws-knowledge-mcp-server` uses non-standard `uvx fastmcp run <https-url>` pattern. Replace with a typed `http` MCP server entry pointing at `https://knowledge-mcp.global.api.aws` (drops the generic `fastmcp` package indirection), or pin `fastmcp` to a specific version with `uvx --from fastmcp==<X.Y.Z>` |

## Notes

- Project uses 3 AI tooling roots: `.claude/` (Claude Code), `.awos/` (AWOS spec-first workflow, vendored from `provectus/awos` marketplace), `.agents/skills/` (additional skill set). All three are checked into git.
- `.claude/settings.local.json` (13 KB) is gitignored as expected — local-only Claude Code state.
- Per-layer `CLAUDE.md` proliferation (30 files including 2 inside `context/spec/014-…/design-handoff*/project/` from generated design handoff artifacts) all read as legitimate project documentation; no suspicious content.
- Hooks enforce a strict block-list for sensitive files at the PreToolUse boundary — strong defense-in-depth for SEC-02.
- No `.cursor/`, `.cursorrules`, `.github/copilot-instructions.md`, or `.aider*` files exist; PAI checks scoped to the present `.claude/`, `.awos/`, `.agents/`, `CLAUDE.md`, and `.mcp.json`.
