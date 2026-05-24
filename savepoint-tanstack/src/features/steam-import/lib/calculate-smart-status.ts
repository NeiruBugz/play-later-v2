import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

/**
 * Map a Steam playtime + last-played pair to a library status hint.
 *
 * Ported verbatim from
 * `savepoint-app/features/steam-import/lib/calculate-smart-status.ts`.
 * The schema has no `suggestedStatus` column on `ImportedGame`, so this is
 * a derive-on-demand utility — Phase D UI calls it when surfacing the row.
 *
 * `PLAYED` is never auto-assigned. For a backlog tracker, inferring
 * "finished" from import signals is the single most destructive default:
 * recency correlates weakly with completion, and a wrongly-PLAYED game drops
 * out of "Up Next" and the dashboard hero — the surfaces designed to bring the
 * user back. Promotion to PLAYED is an explicit user action on the row.
 *
 * Thresholds:
 *   - playtime === 0           → SHELF    ("haven't started")
 *   - lastPlayedAt within 7d   → PLAYING  ("active")
 *   - otherwise                → SHELF    ("owned / set aside — user decides if it's done")
 */
export function calculateSmartStatus(input: {
  playtime: number | null | undefined;
  lastPlayedAt: Date | null | undefined;
}): LibraryItemStatus {
  if (!input.playtime || input.playtime === 0) {
    return "SHELF";
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (input.lastPlayedAt && new Date(input.lastPlayedAt) > sevenDaysAgo) {
    return "PLAYING";
  }

  return "SHELF";
}
