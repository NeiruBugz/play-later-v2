# Security Guardrails — Audit Results

**Date:** 2026-05-12
**Score:** 88% — Grade **B**

## Results

| #   | Check                                         | Severity | Status | Evidence |
| --- | --------------------------------------------- | -------- | ------ | -------- |
| 1   | SEC-01 .env files are gitignored              | critical | WARN   | `.gitignore` covers `.env`, `.env.local`, `.env.*.local`, `.env.prod`; `.env.example` (root, savepoint-app, savepoint-tanstack) tracked with placeholders only. However `savepoint-app/.env.test` is also tracked — it contains only test-loopback values (`postgres:postgres@localhost`, `test-better-auth-secret-for-e2e-testing-only`), no real secrets, but it sits outside the conventional `.example`/`.template` allowance. |
| 2   | SEC-02 AI agent hooks restrict sensitive read | critical | PASS   | `.claude/settings.json` defines a `PreToolUse` hook matching `Read\|Edit\|Write\|Glob\|Grep\|Bash` → `.claude/hooks/check-sensitive-files.sh` which blocks `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx` with exit 2; Bash branch also blocks `cat/less/head/tail/source/editor`+sensitive and `> sensitive` redirection. Hook actively blocked Bash test attempts during this audit. |
| 3   | SEC-03 .env template exists                   | high     | PASS   | Templates with placeholder values present at root (`.env.example` — Docker Compose), `savepoint-app/.env.example` (DB, Better-Auth, Cognito, IGDB, Steam, S3, Upstash), and `savepoint-tanstack/.env.example` (mirror of savepoint-app for parallel-run window). All values use `your_*_here`/empty/loopback placeholders. |
| 4   | SEC-04 No secrets in committed files          | critical | PASS   | `rg 'AKIA[0-9A-Z]{16}'` → only a reference in `context/audits/2026-04-01/security.md` describing the well-known `AKIAIOSFODNN7EXAMPLE` doc string; `rg 'BEGIN (RSA \|EC \|DSA )?PRIVATE KEY'` → no matches; broad pattern scan over non-test/non-md sources surfaced no real credentials. |
| 5   | SEC-05 Stack-relevant .gitignore coverage     | high     | PASS   | Stack (Next.js + Vite/TanStack Start + Prisma + Terraform on macOS) coverage verified: `.DS_Store`, `node_modules`, `.next/`, `out/`, `build`, `coverage`, `*.tsbuildinfo`, Prisma generated client paths, Playwright artefacts, `**/.terraform/`, `*.tfstate*`, `*.tfvars`, `*.auto.tfvars`, `*.tfplan`, override TFs, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials*`, `secrets*`. |

## Scoring

- Max points: 3 (SEC-01 critical) + 3 (SEC-02 critical) + 2 (SEC-03 high) + 3 (SEC-04 critical) + 2 (SEC-05 high) = **13**
- Deductions: SEC-01 WARN (critical → 1.5) = **1.5**
- Raw score: 13 − 1.5 = **11.5**
- Percentage: 11.5 / 13 = **88.46% → Grade B**

## Security Summary

- **Secret handling:** Strong. AI agent read/write/glob/grep/bash access to sensitive file patterns is hard-blocked by an `exit 2` PreToolUse hook in `.claude/settings.json` → `.claude/hooks/check-sensitive-files.sh`. Hook coverage spans `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, with an explicit allow-list for `.env.example`, `.env.test`, `.env.development`.
- **Tracked env files:** `.env.example` × 3 (root + both apps), `savepoint-app/.env.test` (E2E placeholders). No `.env`, `.env.local`, or `.env.production` are tracked.
- **Findings worth fixing:**
  - **P1 (critical WARN):** `savepoint-app/.env.test` is tracked. Although it contains only loopback placeholder values, it is the lone `.env`-family file outside the conventional `.example`/`.template` naming. Recommend renaming to `.env.test.example` (or similar) and having Playwright/Vitest copy/symlink to `.env.test` locally, OR adding a comment header that pins it as an intentional placeholder fixture.
- **No secrets in source:** broad regex scans for AWS keys, private-key headers, and long base64 token literals returned only an audit-file reference to the well-known `AKIAIOSFODNN7EXAMPLE` doc string.
- **.gitignore coverage:** complete against the detected stack (Next.js, TanStack/Vite, Prisma generated client, Terraform state/plan/vars, Playwright auth, macOS, common key/cert formats).
