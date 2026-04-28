# Security Guardrails — Audit Results

**Date:** 2026-04-28
**Score:** 100% — Grade **A**

## Results

| #   | Check                                      | Severity | Status | Evidence                                                                                                                                                                                                                  |
| --- | ------------------------------------------ | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | .env files are gitignored                  | critical | PASS   | `.gitignore` covers `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`. `git ls-files '*.env*'` returns only `.env.example` variants and `savepoint-app/.env.test` (localhost-only test creds, no real secrets) |
| 2   | AI agent hooks restrict access to secrets  | critical | PASS   | `.claude/settings.json` registers `PreToolUse` matcher `Read|Edit|Write|Glob|Grep|Bash` running `.claude/hooks/check-sensitive-files.sh`, which blocks `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx` (verified empirically: hook blocked a `cat` of `.env.example` during this audit) |
| 3   | .env.example or template exists            | high     | PASS   | Templates present at `/.env.example` (docker-compose), `/savepoint-app/.env.example` (full Next.js config), `/lambdas-py/.env.example` (Python lambdas) — all use placeholders (`your_*_here`, `test`, `your-s3-bucket-name`)                                |
| 4   | No secrets in committed files              | critical | PASS   | `rg` for AWS keys (`AKIA...`), private-key headers, and `(api_key|secret|password|token)=["']<20+ char>` in tracked files (excluding `.example`/tests/lockfiles) returned no real-secret matches. The only `credentials*` paths are auth-form React components |
| 5   | Sensitive files in .gitignore coverage     | high     | PASS   | Coverage matches detected stack (TS + Python + Terraform + Docker): `.DS_Store`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials*`, `secrets*`, `**/.terraform/`, `*.tfstate*`, `*.tfvars`, `*.auto.tfvars`, `*.tfplan`, override files, `dumps/`, `localstack-data/`, `.docker/`, playwright `e2e/.auth/user.json` |

## Security Summary

- **Sensitive-file gitignore posture:** strong — covers OS, JS, Python, Docker, and Terraform artifacts including state and tfvars.
- **AI-agent guardrail:** active and verified at runtime; hook denies reads, edits, writes, globs, greps, and direct Bash access (`cat`/`less`/`head`/`tail`/`source`/redirects) to env, credentials, secrets, and key/cert extensions. Permits `.env.example`, `.env.test`, `.env.development` for legitimate local development.
- **Tracked env files:** `.env.example` (root + savepoint-app + lambdas-py + lambdas-py/.env.integration.example), and `savepoint-app/.env.test` (localhost Postgres + literal test secret string `test-secret-for-e2e-testing-only`). No real production secrets in version control.
- **Production secrets:** documented as living in AWS Secrets Manager (`savepoint/{env}/steam-api-key`, `savepoint/{env}/igdb-credentials`, `savepoint/{env}/database-url`) per `lambdas-py/CLAUDE.md`.
- **No findings to report.** All five checks PASS; no P0/P1/P2 recommendations from this dimension.
