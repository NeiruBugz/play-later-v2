# Design review capture

Manual dev script (spec 027). Not part of the Vitest projects or CI. Takes full-page screenshots of every screen in `screens.ts` in Light and Dark.

## Run

Start the app (`pnpm --filter savepoint-tanstack dev`, port 6060) with `AUTH_ENABLE_CREDENTIALS=true` and a seeded dev DB (see `context/spec/026-mindful-core-simplification/ui-audit/`), then:

```bash
REVIEW_EMAIL=... REVIEW_PASSWORD=... \
  pnpm --filter savepoint-tanstack design-review --phase phase1 --set before
```

Runs on Node's built-in TypeScript support (Node >= 22.18). First time only: `pnpm --filter savepoint-tanstack exec playwright install chromium`.

## Options

| Flag         | Meaning                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- |
| `--phase`    | `phase1` or `phase2` (required)                                                             |
| `--set`      | `before` or `after` (required)                                                              |
| `--desktop`  | Also capture 1440x900. Phone (390x844) is always captured.                                  |
| `--out`      | Output directory. Default `context/spec/027-design-reset/review/<phase>/<set>/` (repo root) |
| `--base-url` | Default `http://localhost:6060`                                                             |

## Environment

- `REVIEW_EMAIL`, `REVIEW_PASSWORD`: credentials-provider account. Required; never hard-coded.
- `REVIEW_OTHER_USERNAME`: a second public profile used for the public-profile and "game not in library" screens. Default `audit_friend`.

## Output

```
<out>/phone/<screen-id>-<light|dark>.png
<out>/desktop/<screen-id>-<light|dark>.png   (only with --desktop)
```

The output folder is gitignored. Screens whose data is not reachable are marked `skip` in `screens.ts` with the reason and are listed as skipped in the console output.
