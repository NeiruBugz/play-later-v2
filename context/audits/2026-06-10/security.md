# Security Guardrails — Audit Results

**Date:** 2026-06-10
**Score:** 100% — Grade **A**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| SEC-01 | .env files are gitignored | critical | PASS | Root `.gitignore` ignores `.env`, `.env.prod`, `.env.local`, `.env.{development,test,production}.local`; `savepoint-tanstack/.gitignore` ignores `.env` + `*.local`. `git ls-files '*.env*'` → only `.env.example` and `savepoint-tanstack/.env.example` tracked (no real `.env` files). |
| SEC-02 | AI agent hooks restrict sensitive reads | critical | PASS | `.claude/settings.json` PreToolUse hook on `Read\|Edit\|Write\|Glob\|Grep\|Bash` runs `.claude/hooks/check-sensitive-files.sh`, which exits 2 (blocks) for `.env`, `.env.local`, `.env.production`, `credentials*`, `secrets*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`; allowlists `.env.example/.env.test/.env.development`. Full pattern coverage. |
| SEC-03 | .env.example / template exists | high | PASS | Env usage confirmed (`@env`/`process.env`, docker-compose `.env`). Root `.env.example` (Docker Compose infra vars) and `savepoint-tanstack/.env.example` (app vars) both present; values are placeholders (`your_*`, `localhost`, `admin`, `changeme`-style). Template exists at root AND in the service dir that uses env vars. |
| SEC-04 | No secrets in committed files | critical | PASS | Secret-assignment grep over source (excl. tests/fixtures/examples) returned only Terraform config keys (`access_token = "minutes"`) and a `infra/README.md` doc reference. No `BEGIN PRIVATE KEY` matches. `AKIA[0-9A-Z]{16}` matches exist only inside prior audit files under `context/audits/**` (none in source/infra/config). |
| SEC-05 | Stack-relevant .gitignore coverage | high | PASS | Covers OS files (`.DS_Store`, `Thumbs.db`); TS/Node (`node_modules`, `coverage`, `dist`, `*.tsbuildinfo`, `.env*`); secrets/certs (`*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials*`, `secrets*`); Terraform (`**/.terraform/`, `*.tfstate*`, `*.tfvars`, `*.tfplan`, override files); plus playwright/docker artifacts. All relevant categories present. |

## Score Math

- Non-SKIP checks: SEC-01 (critical=3), SEC-02 (critical=3), SEC-03 (high=2), SEC-04 (critical=3), SEC-05 (high=2)
- max_points = 3 + 3 + 2 + 3 + 2 = **13**
- deductions = 0 (all PASS)
- raw_score = 13 − 0 = 13
- pct = 13 / 13 × 100 = **100%**
- Grade: **A** (90–100)
