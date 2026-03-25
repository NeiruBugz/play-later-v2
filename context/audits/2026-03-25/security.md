# Security Guardrails Audit

- **Date:** 2026-03-25
- **Score:** 69.2%
- **Grade:** C

## Results

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| SEC-01 | .env files are gitignored | critical | PASS | `.env`, `.env.local`, `.env.*.local` all in `.gitignore`; tracked `*.env*` files are only `.env.example` (placeholders) and `savepoint-app/.env.test` (localhost test-only creds: `postgres:postgres`, `AUTH_SECRET=test-secret-for-e2e-testing-only`) |
| SEC-02 | AI agent hooks restrict access to sensitive files | critical | FAIL | `.claude/settings.json` exists but contains no hooks -- no `PreToolUse` rules blocking Read/Glob/Bash access to `.env`, `*.pem`, `*.key`, `credentials*`, or `secrets*` patterns |
| SEC-03 | .env.example or template exists | high | PASS | Templates at root (`.env.example`), `savepoint-app/.env.example`, `lambdas-py/.env.example`, `lambdas-py/.env.integration.example` -- all contain placeholders (`your_*_here`, `your-*`) |
| SEC-04 | No secrets in committed files | critical | PASS | No real API keys, private keys, or cloud credentials found; all matches are test fixtures (`TestPassword123!`, `password123`, `test-api-key`) in e2e/unit test files |
| SEC-05 | Sensitive files in .gitignore coverage | high | WARN | Covers: `.DS_Store`, `*.pem`, `*.tfstate`, `*.tfvars`, `node_modules`, `.next`, `__pycache__`, `.venv` (in `lambdas-py/.gitignore`), `Thumbs.db` (in `lambdas-py/.gitignore`). Missing from all gitignore files: `*.key` pattern |

## Scoring

| Severity | Weight | SEC-01 | SEC-02 | SEC-03 | SEC-04 | SEC-05 |
|----------|--------|--------|--------|--------|--------|--------|
| critical | 3 | PASS (0) | FAIL (-3) | -- | PASS (0) | -- |
| high | 2 | -- | -- | PASS (0) | -- | WARN (-1) |

- **Max points:** 13 (3+3+2+3+2)
- **Deductions:** 4 (SEC-02: -3, SEC-05: -1)
- **Score:** (13 - 4) / 13 = 69.2%
- **Grade:** C

## Summary

The project has solid fundamentals: `.env` files are properly gitignored, `.env.example` templates exist across all services with placeholder values, and no real secrets were found in committed files. Two issues bring the score down:

1. **SEC-02 (critical):** `.claude/settings.json` has no `PreToolUse` hooks to prevent AI agents from reading sensitive files like `.env`, `*.pem`, or `*.key`. Any Claude Code session can freely access secrets on disk.
2. **SEC-05 (high):** The `*.key` glob pattern is missing from all `.gitignore` files. While `*.pem` is covered, `*.key` files (e.g., TLS private keys) could be accidentally committed.
