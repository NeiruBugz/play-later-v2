# Security Guardrails — Audit Results

**Date:** 2026-04-28
**Score:** 100% — Grade **A**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| SEC-01 | `.env` files are gitignored | critical | PASS | `.gitignore` lines 41-51 cover `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`. `git ls-files '*.env*'` returns only `*.env.example` templates and `savepoint-app/.env.test` (placeholder test creds: `AUTH_SECRET=test-secret-for-e2e-testing-only`, `postgres:postgres@localhost`); no real secrets tracked. |
| SEC-02 | AI agent hooks restrict access to sensitive files | critical | PASS | `.claude/settings.json` registers `PreToolUse` hook on matcher `Read\|Edit\|Write\|Glob\|Grep\|Bash` → `.claude/hooks/check-sensitive-files.sh`. Script blocks `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`; allows `.env.example`, `.env.test`, `.env.development`. Bash matcher also blocks `cat/less/head/tail/source/vim/nano/code` against those patterns and redirection writes. |
| SEC-03 | `.env.example` or template exists | high | PASS | Root `.env.example` (Docker Compose vars), `savepoint-app/.env.example` (full app env: DB, NextAuth, Cognito, IGDB, Steam, S3/LocalStack, Upstash) with placeholder values (`your_*_here`). Terraform: `infra/envs/dev/terraform.tfvars.example` and `infra/envs/prod/terraform.tfvars.example` with placeholder/example values. All env-var-using surfaces have a template. |
| SEC-04 | No secrets in committed files | critical | PASS | Ripgrep across tracked sources for `AKIA[0-9A-Z]{16}`, PRIVATE KEY headers, and `(api_key\|secret\|password\|token)=["']{20+ chars}["']` returned no matches outside placeholders, test fixtures, and `.env.example` templates. LocalStack uses `test/test` AWS creds (intentional local stub, not a real key). |
| SEC-05 | Sensitive files in `.gitignore` coverage | high | PASS | Stack-relevant patterns covered: OS (`.DS_Store`), keys/certs (`*.pem`, `*.key`, `*.p12`, `*.pfx`), generic creds (`credentials*`, `secrets*`), Terraform (`**/.terraform/`, `*.tfstate*`, `*.tfvars`, `*.auto.tfvars`, `override.tf*`, `*.tfplan`, `crash.log`), Node (`node_modules`, `.pnpm-debug.log*`), Next.js (`.next/`, `out/`), Playwright auth artifacts (`e2e/.auth/user.json`), local data (`localstack-data/`, `dumps/`, `.local-data/`, `.docker/`), IDE dirs. `.terraform.lock.hcl` correctly retained per Terraform best practice. |

## Security Summary

- **Posture:** Strong. No regressions vs. 2026-04-01 audit (also 100%/A). Lambdas-py pipeline retired since previous audit, slightly narrowing the secrets surface area.
- **Gitignore strategy:** Comprehensive coverage of secrets, IaC state/tfvars, build artifacts, and OS files for the Next.js + Terraform stack.
- **AI agent guardrails:** PreToolUse hook actively denies sensitive reads/writes via `Read/Edit/Write/Glob/Grep`; Bash matcher prevents shell-out bypass (`cat`, redirection, editors).
- **Templates:** Three template surfaces cover all services — root Docker Compose env, web app env, dev/prod Terraform tfvars.
- **Tracked env file:** `savepoint-app/.env.test` is intentionally tracked (E2E fixtures, localhost-only, placeholder secret string) and explicitly allowlisted by the hook.
- **Production secrets:** Real values held outside the repo (Cognito → Terraform outputs piped into local `.env.local`; IGDB/Steam keys configured per developer/environment, never committed).
- **No findings.** No P0/P1/P2 recommendations from this dimension.

### Score Calculation

```
max_points = 3 (SEC-01) + 3 (SEC-02) + 2 (SEC-03) + 3 (SEC-04) + 2 (SEC-05) = 13
deductions = 0
raw_score  = 13
pct        = 100%  → Grade A
```
