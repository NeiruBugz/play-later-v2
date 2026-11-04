# UI Audit: intuitiveness and overload (spec 026 input)

- **Status:** Setup done, audit not run
- **Goal:** find where the current UI is unclear or overloaded, beyond the status-model quirks already in [feature-brief.md §5](../feature-brief.md). Every finding is tagged: covered by 026 / new 026 requirement / separate spec.
- **Baseline:** pre-026 code (five statuses, playthroughs). The same run is repeated after 026 ships to compare numbers.

## Setup

Local only: the credentials provider is disabled in production (`auth.server.ts`, `AUTH_ENABLE_CREDENTIALS=true` + non-prod).

| Account | Password | State |
|---|---|---|
| `audit_full@savepoint.local` | `audit-pass-123` | 28 games across all 5 statuses, 10 runs, 11 notes, 40 staged Steam games, public, follows `audit_friend` |
| `audit_friend@savepoint.local` | `audit-pass-123` | 5 games with recent status changes (activity feed), public, follows back |
| `audit_empty@savepoint.local` | `audit-pass-123` | Fresh: no username, no games (first-run + onboarding) |

Re-create accounts (dev server on :6060) and seed:

```bash
for u in audit_full audit_empty audit_friend; do
  curl -s -X POST http://localhost:6060/api/auth/sign-up/email \
    -H 'Content-Type: application/json' -H 'Origin: http://localhost:6060' \
    -d "{\"email\":\"$u@savepoint.local\",\"password\":\"audit-pass-123\",\"name\":\"$u\"}"
done
docker exec -i savepoint-postgres psql -v ON_ERROR_STOP=1 -U postgres -d savepoint-db < seed-audit-users.sql
```

The seed is idempotent and deliberately contains the brief's quirk cases: Playing with no runs (#2), Played via abandoned run (#3), Up Next already played = Replay (#7), manual override, two ratings (#9), note with minutes but no text (#8). It uses the 34 `Game` rows already in the local DB.

## Method

1. **Screen inventory (automated).** Each surface at 390px and 1440px, via Playwright MCP + `browser_evaluate`: interactive elements (total / above the fold), distinct actions, domain terms shown, blocks, screenshot.
2. **Task walkthroughs.** Count clicks, decision points, dead ends and error traps for the core tasks below.
3. **Heuristic review.** Nielsen's 10 + product definition v3.0 principles (few concepts, one tap, dropping is fine, no competition, main thing visible). Severity critical/high/medium/low.
4. **Consistency (code).** `rg` over UI strings and handlers: one concept under several names, one action behaving differently in different places, dead entry points.
5. **Think-aloud with Nail.** 5-second test on the dashboard, then the tasks below while saying out loud what he expects; the facilitator only records, never helps.

### Surfaces (all)

Landing `/`, `/login`, `/about`, `/dashboard`, `/library` (grid, list, filters, sort), `/games/$slug` (in library / not in library / signed out), `/games/search`, `/journal`, `/journal/new`, `/journal/$id`, `/journal/$id/edit`, `/profile/setup`, `/u/$username` (own / friend / private), followers / following, `/settings/profile`, `/settings/account`, `/steam/games`.
Overlays: ⌘K palette, Log sheet, library add dialog, status picker (popover + sheet), Edit details form, playthrough form, compose dialog, onboarding checklist, mobile bottom nav, sidebar.

### Core tasks

1. Decide what to play tonight.
2. Add a game you just heard about.
3. Put it next in the queue.
4. Start playing it.
5. Log tonight's session (hours only, then with a note).
6. Mark a game finished; mark another as dropped.
7. Find a note you wrote last week.
8. First run (`audit_empty`): get from sign-up to a first game in the library.

## Findings

| # | Surface | Viewport | Finding | Heuristic / principle | Severity | Evidence | Tag |
|---|---|---|---|---|---|---|---|

## Metrics (baseline vs after 026)

| Surface | Viewport | Interactive (total / above fold) | Distinct actions | Domain terms | Blocks |
|---|---|---|---|---|---|
