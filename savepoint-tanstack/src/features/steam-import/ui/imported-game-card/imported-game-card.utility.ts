/**
 * Steam icon-url builder (Slice 21 Phase D).
 *
 * Steam serves game icons at the Steam CDN with the game-id + icon hash as
 * the path. Ported from `savepoint-app/features/steam-import/lib/
 * formatters.ts`.
 */
export function getSteamIconUrl(
  imgIconUrl: string | null | undefined,
  storefrontGameId: string | null | undefined
): string | null {
  if (!imgIconUrl || !storefrontGameId) {
    return null;
  }
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${storefrontGameId}/${imgIconUrl}.jpg`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Format a Steam last-played timestamp into a short relative phrase
 * ("last played 3 days ago"). Returns `null` when no timestamp is recorded
 * so the caller can omit the row entirely.
 *
 * This is the context that explains the smart-status suggestion: a game only
 * suggests PLAYING when it was played within the last 7 days (see
 * `calculate-smart-status.ts`). Surfacing the date makes the SHELF-vs-PLAYING
 * split self-evident instead of arbitrary.
 */
export function formatLastPlayed(
  lastPlayedAt: Date | null | undefined,
  now: Date = new Date()
): string | null {
  if (!lastPlayedAt) {
    return null;
  }
  const then = new Date(lastPlayedAt);
  const diffMs = now.getTime() - then.getTime();
  const days = Math.floor(diffMs / DAY_MS);

  if (days <= 0) return "last played today";
  if (days === 1) return "last played yesterday";
  if (days < 14) return `last played ${days} days ago`;
  if (days < 60) return `last played ${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `last played ${Math.round(days / 30)} months ago`;
  const years = Math.round(days / 365);
  return `last played ${years} year${years === 1 ? "" : "s"} ago`;
}
