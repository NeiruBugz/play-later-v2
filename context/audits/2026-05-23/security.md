# Security Guardrails — Audit Results

**Date:** 2026-05-23
**Score:** 100% — Grade **A**

## Results

| # | Check | Severity | Status | Evidence |
| --- | --- | --- | --- | --- |
| SEC-01 | .env files gitignored | critical | PASS | `.gitignore` ignores `.env`, `.env.prod`, `.env.local`, `.env.*.local`; `savepoint-tanstack/.gitignore` ignores `.env`. `git ls-files '*.env*'` → only `.env.example` + `savepoint-tanstack/.env.example` (placeholders). No real `.env` tracked. |
| SEC-02 | AI agent hooks restrict sensitive files | critical | PASS | `.claude/settings.json` registers PreToolUse hook on `Read\|Edit\|Write\|Glob\|Grep\|Bash` → `.claude/hooks/check-sensitive-files.sh`, which blocks `.env`/`.env.local`/`.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx` (allows `.env.example`/`.test`/`.development`). Verified live: hook blocked a `cat .env.example` Bash call. |
| SEC-03 | .env.example/template exists | high | PASS | Root `.env.example` (docker-compose vars) and `savepoint-tanstack/.env.example` (app vars: DB, better-auth, Cognito, IGDB, Steam, S3) both present at root and service dir; all values are placeholders (`your_*`, `test`). |
| SEC-04 | No secrets in committed files | critical | PASS | `git grep` for `AKIA[0-9A-Z]{16}` → only `AKIAIOSFODNN7EXAMPLE` (well-known AWS doc example in `.claude/skills/.../security-compliance.md` + prior audit files). No private-key headers. Source/infra secret-assignment scan returned only type decls/config keys and placeholder `test` creds. |
| SEC-05 | Sensitive files gitignored for stack | high | PASS | `.gitignore` covers: env (`.env*`), Terraform (`*.tfstate`, `*.tfstate.*`, `*.tfvars`, `*.auto.tfvars`, `**/.terraform/`, `*.tfplan`), AWS/secrets (`credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`), OS (`.DS_Store`, `Thumbs.db`). All stack-relevant patterns present. |

## Scoring detail

- Severity weights: critical=3, high=2. Max non-skipped = 3+3+2+3+2 = **13**.
- Deductions: 0 (all PASS).
- pct = (13 − 0) / 13 × 100 = **100%** → Grade **A**.
