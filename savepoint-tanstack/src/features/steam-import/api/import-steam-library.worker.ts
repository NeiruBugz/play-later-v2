import { upsertImportedGamesBatch } from "@/entities/imported-game/api";
import type { SteamImportedGameInput } from "@/entities/imported-game/model/types";
import { fetchOwnedGames, type OwnedGame } from "@/shared/api/steam";
import { prisma } from "@/shared/lib/db.server";
import { UnauthorizedError, ValidationError } from "@/shared/lib/errors";

/**
 * Worker for `importSteamLibraryFn` (Slice 21 Phase C — Steam library import).
 *
 * Plain async function — owns the auth gate, reads `User.steamId64`, fetches
 * the user's Steam library, and delegates the upsert to the entity layer.
 * Worker-split (foot-gun #8) so integration tests can drive it without the
 * TanStack Start runtime.
 *
 * Flow:
 *   1. Auth gate (throws `UnauthorizedError` on missing userId).
 *   2. Read `User.steamId64`; throw `ValidationError` if not connected.
 *   3. Call `fetchOwnedGames` — re-throws typed Steam errors as-is
 *      (`SteamProfilePrivateError`, `SteamApiUnavailableError`, etc.).
 *   4. Adapt OwnedGame payloads → SteamImportedGameInput shape.
 *   5. Delegate to `upsertImportedGamesBatch` (single transaction).
 *
 * Slice-spec divergence: the spec mentions "matches via IGDB by name+platform
 * (best-effort)" during import. Canonical does NOT do IGDB matching at
 * import time — rows are written with `igdbMatchStatus: PENDING` and
 * matched downstream (see
 * `savepoint-app/data-access-layer/handlers/steam-import/
 * fetch-steam-games.handler.ts`). We mirror canonical. Documented in
 * DIVERGENCES.md.
 *
 * Returns `{ imported, total }` where:
 *   - `imported` = created + updated (canonical's "row count touched").
 *   - `total`    = number of games returned by Steam.
 */
export async function importSteamLibraryWorker(
  userId: string | undefined
): Promise<{ imported: number; total: number }> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { steamId64: true },
  });

  if (!user?.steamId64) {
    throw new ValidationError("Connect Steam first to import your library", {
      userId,
    });
  }

  // Re-throws typed Steam errors (SteamProfilePrivateError,
  // SteamApiUnavailableError, SteamRateLimitError, SteamProfileNotFoundError)
  // — caller decides UX.
  const ownedGames = await fetchOwnedGames(user.steamId64);

  const payload = ownedGames.map(adaptOwnedGame);
  const { created, updated } = await upsertImportedGamesBatch(userId, payload);

  return { imported: created + updated, total: ownedGames.length };
}

function adaptOwnedGame(g: OwnedGame): SteamImportedGameInput {
  return {
    storefrontGameId: String(g.appId),
    name: g.name,
    playtime: g.playtimeForever,
    playtimeWindows: g.playtimeWindows,
    playtimeMac: g.playtimeMac,
    playtimeLinux: g.playtimeLinux,
    lastPlayedAt:
      g.rtimeLastPlayed && g.rtimeLastPlayed > 0
        ? new Date(g.rtimeLastPlayed * 1000)
        : null,
    imgIconUrl: g.imgIconUrl,
    imgLogoUrl: g.imgLogoUrl,
  };
}
