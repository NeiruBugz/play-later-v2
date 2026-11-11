# Design review capture

Manual dev script (spec 028 by default; see `--spec`). Not part of the Vitest projects or CI. Takes full-page screenshots of every screen in `screens.ts` in Light and Dark.

## Run

Start the app (`pnpm --filter savepoint-tanstack dev`, port 6060) with `AUTH_ENABLE_CREDENTIALS=true` and a seeded dev DB (see `context/spec/026-mindful-core-simplification/ui-audit/`), then:

```bash
REVIEW_EMAIL=... REVIEW_PASSWORD=... \
  pnpm --filter savepoint-tanstack design-review --phase phase1 --set before
```

Runs on Node's built-in TypeScript support (Node >= 22.18). First time only: `pnpm --filter savepoint-tanstack exec playwright install chromium`.

## Options

| Flag         | Meaning                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------- |
| `--phase`    | `phase1` or `phase2` (required)                                                           |
| `--set`      | `before` or `after` (required)                                                            |
| `--checks`   | Run the automated phone checks. On by default when `--set` is `before` or `after`.        |
| `--reseed`   | Re-run the audit seed SQL against the local docker Postgres before capturing (see below). |
| `--desktop`  | Also capture 1440x900. Phone (390x844) is always captured.                                |
| `--spec`     | Spec folder name under `context/spec/`. Default `028-continue-identity-stand-out`.        |
| `--out`      | Output directory. Default `context/spec/<spec>/review/<phase>/<set>/` (repo root)         |
| `--base-url` | Default `http://localhost:6060`                                                           |
| `--screens`  | Comma-separated screen ids to capture, e.g. `home,library,game-in-library`. Default: all. |
| `--query`    | Query string appended to every page URL, e.g. `--query "theme=x"`.                        |

## Reseeding

Verification flows mutate `audit_full` (status changes reorder "Recently Updated"), so captures drift from the before set. Run every comparison capture with `--reseed`: the before set was captured on the seeded state. `--reseed` pipes `context/spec/026-mindful-core-simplification/ui-audit/seed-audit-users.sql`, then the committed `context/spec/028-continue-identity-stand-out/review-fixtures.sql` (four Playing games with red / green / black-and-white / no cover art, dated sessions 3 days, 14 days and 40 days back, a Let go reason on Crisis Core), into `docker exec -i savepoint-postgres psql -U postgres -d savepoint-db` and fails clearly if docker or the container is unavailable (override the container with `REVIEW_DB_CONTAINER`; check `docker compose ps`). The reseed resets the status-model notice; capture dismisses it again with "Got it".

Before every screenshot (and before the phone checks) capture waits up to 5s each for running animations to finish and for in-viewport images to load, then pauses 150ms. A timeout is logged, not fatal.

## Environment

- `REVIEW_EMAIL`, `REVIEW_PASSWORD`: credentials-provider account. Required; never hard-coded.
- `REVIEW_OTHER_USERNAME`: a second public profile used for the public-profile and "game not in library" screens. Default `audit_friend`.

## Output

```
<out>/phone/<screen-id>-<light|dark>.png
<out>/desktop/<screen-id>-<light|dark>.png   (only with --desktop)
<out>/report.json                            (only with checks)
```

The output folder is gitignored. Screens whose data is not reachable are marked `skip` in `screens.ts` with the reason and are listed as skipped in the console output.

## Phone checks

Run on every non-skipped screen at 360x780, 390x844 and 430x932, in Light only (screenshots stay at 390). The page is resized in place after it has loaded. When a dialog or sheet is open, element checks are scoped to the topmost one. The script exits 0 even when checks fail (the "before" set is expected to fail); it exits non-zero only on script errors.

| Check              | Fails when                                                                                                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `horizontalScroll` | `document.scrollingElement.scrollWidth > window.innerWidth`; also lists up to 5 outermost elements wider than the viewport                                                                                                          |
| `tapSize`          | a visible link, button, input, select, textarea, summary or `[role=button/tab/menuitem/option/switch/checkbox/combobox]` is under 44x44                                                                                             |
| `fontSize`         | any visible text node has a computed font size under 12px                                                                                                                                                                           |
| `bodyFontSize`     | body text is under 15px (rule below)                                                                                                                                                                                                |
| `clippedOrCovered` | an enabled interactive element is cut by an `overflow: hidden/clip` ancestor or the viewport edge, or `checkClickable` (verify-ui, loaded and evaluated in the page) reports it covered or unreachable after scrolling it into view |

Body-text rule: an element counts as body text when it has direct text and is a `p` or `li`, or has at least 40 characters of direct text. Anything inside `label`, `button`, `nav`, `th`, `caption`, `figcaption`, `small`, `time`, `code`, `kbd`, `[role=button|tab|menuitem|option]`, `[data-slot=badge]`, `[data-slot=label]` or `[data-slot=section-label]` is a label, not body text. Disabled controls are skipped by `clippedOrCovered`; the dev-only TanStack Devtools toggle is ignored.

### report.json

```json
{
  "generatedAt": "ISO timestamp",
  "baseUrl": "http://localhost:6060",
  "widths": [360, 390, 430],
  "screens": [
    {
      "id": "home",
      "width": 390,
      "failures": [
        {
          "check": "tapSize",
          "selector": "nav > a[href=\"/library\"]",
          "text": "Library",
          "box": { "x": 0, "y": 0, "width": 78, "height": 40 },
          "value": "78x40"
        }
      ]
    }
  ],
  "summary": {
    "byCheck": {
      "horizontalScroll": 0,
      "tapSize": 1,
      "fontSize": 0,
      "bodyFontSize": 0,
      "clippedOrCovered": 0
    },
    "total": 1
  }
}
```

Selectors are short paths (at most 4 levels) built from `data-testid`, stable `id`, `data-slot`, `role` and `aria-label`/`href`; `box.y` is in page coordinates; `value` is the measured size or the reason. One summary line per check is printed to stdout.

## Side effects on the review account

- The first run clicks "Got it" on the status-model notice, which writes that account's acknowledged flag.
- What's New is suppressed through `localStorage` (`whatsNewLastSeenVersion`) in the throwaway browser contexts only.
