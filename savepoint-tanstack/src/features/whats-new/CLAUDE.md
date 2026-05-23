# Feature: whats-new

App-wide announcement modal. Mounted at `RootShell` in
[`__root.tsx`](../../routes/__root.tsx) next to `CommandPalette`,
conditional on an authed user.

## How "newness" is tracked

A single string version (`CURRENT_VERSION`) is compared against the value
stored under `WHATS_NEW_STORAGE_KEY` in `localStorage`. The modal opens
iff the stored value is missing OR different from `CURRENT_VERSION`. The
"Got it" button writes `CURRENT_VERSION` back to the same key and closes
the modal.

This is a deliberate simplification of canonical
(`savepoint-app/features/whats-new/`), which tracks a list of seen
announcement IDs. The single-version model means bumping
`CURRENT_VERSION` re-shows the modal to every user once — sufficient for
the rollout cadence we have today. See `../../DIVERGENCES.md` →
"Slice 20 — what's-new modal" for the reasoning.

## Structure

- `config.ts` — `CURRENT_VERSION`, `WHATS_NEW_STORAGE_KEY`,
  `ANNOUNCEMENTS`, `getActiveAnnouncements()` (filters out
  not-yet-published / expired entries).
- `model/types.ts` — `FeatureAnnouncement` + `AnnouncementCategory`
  TS types and Zod schemas.
- `model/use-whats-new.ts` — `{ isOpen, dismiss }`. Reads localStorage
  on mount via `useEffect`; SSR-safe via `typeof window` guard.
- `ui/whats-new-modal/` — Dialog shell rendering the full
  `getActiveAnnouncements()` list with a single "Got it" dismiss button.

## Divergences from canonical

1. **Single-version dismiss** instead of per-announcement
   seen-ID tracking. Simpler contract; one localStorage key writes one
   value.
2. **No multi-step pagination.** Canonical's "Next / Dismiss all" flow
   is collapsed into a single dialog rendering all announcements at once.
3. **No 1-second open delay.** The canonical hook uses `setTimeout` to
   delay opening; the tanstack version opens synchronously on mount so
   the component test contract stays simple and deterministic.

All three are documented in `../../DIVERGENCES.md` → Slice 20.
