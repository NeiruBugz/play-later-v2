import type { SteamSyncStatus } from "../model/types";

const SUMMARY_SEPARATOR = " · ";

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

export function formatSyncSummary(status: SteamSyncStatus): string {
  const parts: Array<string | null> = [
    status.newGames > 0
      ? pluralize(status.newGames, "new game", "new games")
      : null,
    status.refreshedGames > 0
      ? `${status.refreshedGames} already on your list`
      : null,
    status.addAllToLibrary && status.addedToLibrary > 0
      ? `${status.addedToLibrary} added to your library`
      : null,
    status.needsMatch > 0
      ? pluralize(status.needsMatch, "needs a match", "need a match")
      : null,
  ];

  return parts.filter((part) => part !== null).join(SUMMARY_SEPARATOR);
}
