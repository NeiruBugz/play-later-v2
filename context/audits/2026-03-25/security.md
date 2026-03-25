# Security Guardrails -- Audit Results

**Date:** 2026-03-25
**Score:** 69% -- Grade **C**

## Results

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| SEC-01 | .env files are gitignored | critical | WARN | `.env`, `.env.local`, `.env.*.local`, `.env.production.local` all in `.gitignore`. Tracked env files are `.env.example` (3 locations) and `savepoint-app/.env.test` which contains localhost-only test credentials (`postgres:postgres`, `AUTH_SECRET=test-secret-for-e2e-testing-only`). No real secrets tracked, but `.env.test` with hardcoded test values is committed. |
| SEC-02 | AI agent hooks restrict access to sensitive files | critical | PASS | `.claude/settings.json` configures `PreToolUse` hooks on `Read\|Edit\|Write\|Glob\|Grep\|Bash` tools via `.claude/hooks/check-sensitive-files.sh`. Script blocks `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`. Bash tool access also filtered for `cat/less/head/tail/more` of sensitive files. Allows `.env.example`, `.env.test`, `.env.development`. |
| SEC-03 | .env.example or template exists | high | PASS | Templates found at root (`.env.example`), `savepoint-app/.env.example`, `lambdas-py/.env.example`, `lambdas-py/.env.integration.example`. All contain placeholder values (`your_*_here`, `your-*`). `infra/` uses `terraform.tfvars` (gitignored) and does not need a `.env.example`. |
| SEC-04 | No secrets in committed files | critical | WARN | No real API keys, private keys, or cloud credentials found. All grep matches are test fixtures: `TestPassword123!` in e2e specs, `postgres:postgres` in test setup files, `$2a$10$hashedpassword` in unit test mocks. Patterns are suspicious but confirmed as test-only values. |
| SEC-05 | Sensitive files in .gitignore coverage | high | WARN | Covers: `.env*`, `*.pem`, `*.key`, `*.tfstate`, `*.tfvars`, `.terraform/`, `node_modules`, `.next/`. Missing from `.gitignore`: `*.p12`, `*.pfx`, `credentials*`, `secrets*` patterns. These are covered by AI agent hooks but not by git itself. |

## Scoring

| Check | Severity | Weight | Status | Deduction |
|-------|----------|--------|--------|-----------|
| SEC-01 | critical | 3 | WARN | -1.5 |
| SEC-02 | critical | 3 | PASS | 0 |
| SEC-03 | high | 2 | PASS | 0 |
| SEC-04 | critical | 3 | WARN | -1.5 |
| SEC-05 | high | 2 | WARN | -1.0 |

- **Max points:** 13 (3+3+2+3+2)
- **Deductions:** 4.0 (SEC-01: -1.5, SEC-04: -1.5, SEC-05: -1.0)
- **Raw score:** 9.0
- **Score:** (9.0 / 13) * 100 = 69.2% -> 69%
- **Grade:** C

## Summary

The project has solid security fundamentals: `.env` patterns are properly gitignored, comprehensive AI agent hooks block access to sensitive files across all tool types, and `.env.example` templates exist for all service directories with placeholder values. No real secrets were found in committed source code.

Three areas produce warnings:

1. **SEC-01:** `savepoint-app/.env.test` is committed with hardcoded test credentials (localhost postgres, test auth secret). While these are clearly test-only values, committing any `.env.*` file with actual connection strings sets a risky precedent.
2. **SEC-04:** Test files contain password-like strings (`TestPassword123!`, `postgres:postgres`). All confirmed as test fixtures, not production secrets, but the pattern is flagged as suspicious.
3. **SEC-05:** `.gitignore` is missing patterns for `*.p12`, `*.pfx`, `credentials*`, and `secrets*` files. While the AI agent hook script covers these, git itself would not prevent accidental commits of these file types.
