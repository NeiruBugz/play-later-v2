---
dimension: security
date: 2026-05-18
---

# Security Guardrails — Audit Results

**Date:** 2026-05-18
**Score:** 92% — Grade **A**

## Results

| #   | Check                                            | Severity | Status | Evidence |
| --- | ------------------------------------------------ | -------- | ------ | -------- |
| 1   | SEC-01 .env files are gitignored                 | critical | PASS   | `.gitignore` lines 39-44 + 50-52 cover `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`, `.env.prod`. `git ls-files '*.env*'` lists only `.env.example`, `savepoint-app/.env.example`, `savepoint-app/.env.test`, `savepoint-tanstack/.env.example` — no real `.env` tracked. |
| 2   | SEC-02 AI agent hooks restrict sensitive files   | critical | PASS   | `.claude/settings.json` wires `PreToolUse` on `Read\|Edit\|Write\|Glob\|Grep\|Bash` to `.claude/hooks/check-sensitive-files.sh`; script blocks `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx` (verified live: tool calls reading `.env.test` were rejected with exit 2). |
| 3   | SEC-03 .env.example or template exists           | high     | PASS   | Root `/.env.example` (Docker Compose vars) + `savepoint-app/.env.example` (74 lines, placeholders like `your_better_auth_secret_here`, `your_igdb_client_id`) + `savepoint-tanstack/.env.example` (placeholders only). Each JS service that uses `process.env` / typed `env` has a template. |
| 4   | SEC-04 No secrets in committed files             | critical | PASS   | Ripgrep for `AKIA[0-9A-Z]{16}`, `BEGIN (RSA\|EC\|DSA )?PRIVATE KEY`, and `(api[_-]?key\|apikey\|password\|secret)\s*[:=]\s*"…"` across TS/TSX/JS/MJS (excluding tests/mocks/fixtures) returned no matches. `.env.test` values are local placeholders (`postgres:postgres@localhost`, `test-secret-for-e2e-testing-only`) intentional for E2E. |
| 5   | SEC-05 Sensitive files in .gitignore (stack)     | high     | WARN   | Stack = Node/TS + Terraform + AWS. Covered: `.DS_Store`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials*`, `*.tfstate*`, `*.tfvars`, `terraform.tfvars`, `**/.terraform/`, `crash.log`. Missing universally-relevant `Thumbs.db` (dimension flags this as universal). No GCP service-account pattern (not needed — no GCP usage detected). |

## Scoring

- Max points: 3 (SEC-01) + 3 (SEC-02) + 2 (SEC-03) + 3 (SEC-04) + 2 (SEC-05) = **13**
- Deductions: SEC-05 WARN high = **1**
- Raw: 13 − 1 = **12**
- Pct: (12 / 13) × 100 = **92.3% → Grade A**

## Security Summary

- **Secret-file gitignore coverage:** comprehensive for `.env*` family (including `.env.prod`) and certificate/key patterns (`*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials*`); Terraform-specific patterns covered (`*.tfstate*`, `*.tfvars`, `**/.terraform/`).
- **AI agent secret-read restrictions:** active. `.claude/settings.json` invokes `.claude/hooks/check-sensitive-files.sh` on every `Read`/`Edit`/`Write`/`Glob`/`Grep`/`Bash`. The hook explicitly allow-lists `.env.example`, `.env.test`, `.env.development` and blocks `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`. Bash matcher catches `cat/less/head/tail/more/source/nano/vim/vi/code` against sensitive paths and redirect-writes to them. Verified empirically during this audit (Read on `savepoint-app/.env.test` via Bash was blocked).
- **Env example files:** three templates (`/.env.example`, `savepoint-app/.env.example`, `savepoint-tanstack/.env.example`); placeholders only, no real values.
- **Committed `.env*` files:** only the example/template files are tracked. The single tracked non-example file (`savepoint-app/.env.test`) contains intentional E2E placeholders (`test-secret-for-e2e-testing-only`, `postgres:postgres@localhost`) and is explicitly allow-listed by the agent hook.
- **Gaps:** `Thumbs.db` (Windows OS file) not in `.gitignore` — low-effort fix.
