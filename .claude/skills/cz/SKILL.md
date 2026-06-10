---
name: cz
description: Commitizen-style guided commit. Analyzes the staged diff, infers a Conventional Commit type and scope, runs an AskUserQuestion wizard to confirm/refine, then commits a commitlint-valid message. Use when the user says "/cz", "commitizen", "guided commit", "cz commit", or wants to build a conventional commit interactively. Does not push.
disable-model-invocation: true
---

# Guided Conventional Commit (`/cz`)

A diff-aware commitizen. You do the analysis; the user confirms through the wizard. The result MUST pass this project's commitlint config (`commitlint.config.mjs`).

## Step 1 — Inspect what will be committed

```bash
git status --short
git diff --cached --stat
```

- If **nothing is staged**, show the unstaged/untracked changes and ask (via `AskUserQuestion`) whether to stage all, stage a subset, or abort. Never `git add` silently.
- If the staged set spans **clearly unrelated concerns** (e.g. a feature change + an infra change), say so and offer to split into multiple `/cz` commits. The user's standing preference is to split multi-concern changes by concern. Respect it unless they decline.
- Read the staged diff (`git diff --cached`) before inferring anything.

## Step 2 — Infer type, scope, subject from the diff

**Type** — pick from the project's enum (commitlint `type-enum`), inferring from the change:

| Signal in diff | type |
|---|---|
| New capability / user-facing behavior | `feat` |
| Bug fix, corrected behavior | `fix` |
| Only `*.md` / docs | `docs` |
| Only tests (`*.test.*`, `*.spec.*`, `test/`) | `test` |
| `package.json`/lockfile dep bumps | `build` (or `chore` w/ scope `deps`/`deps-dev`) |
| `.github/`, CI configs, hooks | `ci` |
| Internal restructure, no behavior change | `refactor` |
| Perf-only change | `perf` |
| Formatting/whitespace only | `style` |
| Tooling/meta/config, none of the above | `chore` |

Valid types ONLY: `build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test`.

**Scope** — derive from the dominant changed path. Prefer one of these known scopes when it matches; otherwise use a lowercase kebab-case scope, or omit if the change is genuinely cross-cutting:

- Domains: `library`, `game-detail`, `profile`, `auth`, `journal`, `dashboard`, `steam-import`, `social`, `onboarding`, `command-palette`, `account`
- Cross-cutting: `igdb`, `dal`, `db`, `api`, `shared`, `ui`, `design-system`, `a11y`, `seo`, `logging`
- Tooling/meta: `deps`, `deps-dev`, `ci`, `config`, `docker`, `infra`, `tanstack`, `eslint`, `vitest`, `claude`, `awos`, `docs`, `spec`

Path → scope hints: `src/features/<x>/` or `src/widgets/<x>/` or `src/entities/<x>/` → the domain it belongs to; `infra/` → `infra`; `.claude/` → `claude`; `.github/` → `ci`; root configs → `config`.

**Subject** — imperative mood, lowercase first letter, no trailing period, header (`type(scope): subject`) ≤ 100 chars.

## Step 3 — Run the wizard (`AskUserQuestion`)

Ask in one batch, pre-filling your inferred answers as the first/recommended option:

1. **Type** — your inferred type marked `(inferred)`, plus the 2–3 next most likely.
2. **Scope** — your inferred scope plus a few plausible alternatives and a "no scope" option.
3. **Subject** — present your drafted subject; the user can accept or edit via the "Other" free-text option.

Then, only if the diff warrants it, ask:
4. **Body?** — offer "no body" vs. "add a short body" (you draft 1–3 bullet lines explaining the *why*).
5. **Breaking change?** — default no. If yes, capture the description for a `BREAKING CHANGE:` footer.
6. **Issue refs?** — optional `Closes #N` / `Refs #N` footer.

## Step 4 — Assemble and self-validate

Build the message:

```
<type>(<scope>): <subject>

<body, wrapped at ~100 cols, blank line above>

BREAKING CHANGE: <desc>        # only if applicable
Closes #<n>                     # only if applicable
```

Validate against commitlint rules before committing — there is no local `@commitlint/cli`, so check by hand:
- type ∈ enum, lowercase; scope lowercase if present
- subject non-empty, no trailing period
- header ≤ 100 chars
- blank line between header and body, and before footers

If a check fails, fix it and re-show, do not commit a message you know is invalid.

## Step 5 — Commit (do not push)

Append the standard trailer, then commit with a heredoc:

```bash
git commit -m "$(cat <<'EOF'
<assembled message>

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

Report the resulting `git log --oneline -1`. **Never push** unless the user explicitly asks — pushing is a separate, explicit step.
