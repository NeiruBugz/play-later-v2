---
dimension: security
date: 2026-05-18
---

# Security Guardrails — Audit Results

**Date:** 2026-05-18
**Score:** 100% — Grade **A**

## Results

| #   | Check                                            | Severity | Status | Evidence |
| --- | ------------------------------------------------ | -------- | ------ | -------- |
| 1   | SEC-01 .env files are gitignored                 | critical | PASS   | `.gitignore` lines 44-54 cover `.env`, `.env.prod`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`. `git ls-files '*.env*'` returns only `.env.example`, `savepoint-app/.env.example`, `savepoint-app/.env.test` (localhost-only placeholders), `savepoint-tanstack/.env.example` — no secret-bearing `.env` tracked. |
| 2   | SEC-02 AI agent hooks restrict sensitive reads   | critical | PASS   | `.claude/settings.json` registers `PreToolUse` matcher `Read\|Edit\|Write\|Glob\|Grep\|Bash` → `.claude/hooks/check-sensitive-files.sh`; script blocks `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, plus Bash `cat/less/head/tail/more/source/nano/vim/vi/code` and redirect-writes against those paths. Allow-lists `.env.example`, `.env.test`, `.env.development`. Hook fired live during this audit (Bash read of `.env.test` was rejected exit 2). |
| 3   | SEC-03 .env.example / template exists            | high     | PASS   | Env usage detected (`savepoint-app/env.mjs`, `savepoint-tanstack/env.ts`, `process.env` references, `env_file` in `docker-compose.yml`). Templates present at `/.env.example` (docker-compose vars), `savepoint-app/.env.example`, `savepoint-tanstack/.env.example`; all contain placeholder values only. |
| 4   | SEC-04 No secrets in committed files             | critical | PASS   | `rg 'AKIA[0-9A-Z]{16}\|BEGIN (RSA\|EC\|DSA )?PRIVATE KEY'` over tracked sources returned only references inside prior audit reports (no live credentials). Broad `(api_key\|secret\|password)\s*[:=]\s*"…"` scan surfaced only test fixtures (`TestPassword123!` in E2E helpers/README, `'password'` strings in generated Prisma namespace stub) and a `dist/` build artifact (gitignored, not tracked). `.env.test` holds intentional placeholders (`postgres:postgres@localhost`, `test-secret-for-e2e-testing-only`). |
| 5   | SEC-05 Sensitive file types in .gitignore        | high     | PASS   | Stack-relevant coverage verified for detected stack (Node/TS + Next.js + Terraform/AWS + Docker): `.env*` family; certs `*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials*`, `secrets*` (lines 34-35, 99-103); Terraform `**/.terraform/`, `*.tfstate*`, `*.tfvars`, `*.auto.tfvars`, `*.tfplan`, `crash.log` (lines 70-85, lock file intentionally retained per comment); OS `.DS_Store` + `Thumbs.db` (lines 32-33); Next.js `.next/`, Playwright auth artifacts, Prisma generated clients, LocalStack data dirs all covered. No GCP service-account pattern needed (no GCP usage). |

## Scoring

- Max points: 3 (SEC-01) + 3 (SEC-02) + 2 (SEC-03) + 3 (SEC-04) + 2 (SEC-05) = **13**
- Deductions: **0**
- Raw: 13 / 13 → **100% → Grade A**

## Security Summary

- **Secret-file gitignore coverage:** comprehensive across `.env*`, cert/key (`*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials*`, `secrets*`), Terraform state/plan/tfvars, OS junk files, and build/output dirs. The previously-flagged `Thumbs.db` gap (2026-05-12 audit) is no longer present — line 33 of `.gitignore` covers it.
- **AI agent secret-read restrictions:** active and verified live. `.claude/settings.json` invokes `.claude/hooks/check-sensitive-files.sh` on `Read`/`Edit`/`Write`/`Glob`/`Grep`/`Bash`. Allow-list (`.env.example`, `.env.test`, `.env.development`) + deny-list pattern matching are correctly resolved via `$CLAUDE_PROJECT_DIR` (fixed in commit 50fa3f91). During this audit a Bash invocation attempting to read `.env.test` was blocked with exit 2.
- **Env templates:** three (`/.env.example`, `savepoint-app/.env.example`, `savepoint-tanstack/.env.example`), placeholders only.
- **Tracked `.env*` files:** only example/template plus `savepoint-app/.env.test` (localhost-only E2E credentials, explicitly self-labeled `for-e2e-testing-only`).
- **No critical findings.** No real secrets in repo; full agent + VCS guardrail coverage.
