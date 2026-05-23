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

/**
 * Format playtime in Steam-minutes to "Xh Ym" / "Never played" form.
 * Ported from canonical's `formatters.ts`.
 */
export function formatPlaytime(
  playtimeMinutes: number | null | undefined
): string {
  if (!playtimeMinutes || playtimeMinutes === 0) {
    return "Never played";
  }
  const hours = Math.floor(playtimeMinutes / 60);
  const minutes = playtimeMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
