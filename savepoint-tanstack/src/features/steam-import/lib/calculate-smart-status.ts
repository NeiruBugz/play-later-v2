import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

/**
 * Map a Steam playtime + last-played pair to a library status hint.
 *
 * Ported verbatim from
 * `savepoint-app/features/steam-import/lib/calculate-smart-status.ts`.
 * The schema has no `suggestedStatus` column on `ImportedGame`, so this is
 * a derive-on-demand utility — Phase D UI calls it when surfacing the row.
 *
 * Thresholds:
 *   - playtime === 0           → SHELF        ("haven't started")
 *   - lastPlayedAt within 7d   → PLAYING      ("active")
 *   - otherwise                → PLAYED       ("finished or set aside")
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

  return "PLAYED";
}
