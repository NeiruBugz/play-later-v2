import { prisma } from "@/shared/lib/db.server";

import type { ReleaseCheckUpdate, StoredRelease } from "../model/release-check";

export type ReleaseCheckWrite = {
  gameId: string;
  stored: StoredRelease;
  data: ReleaseCheckUpdate;
};

export async function applyReleaseChecks(
  writes: ReleaseCheckWrite[]
): Promise<number> {
  const results = await Promise.all(
    writes.map(({ gameId, stored, data }) =>
      prisma.game.updateMany({
        where: {
          id: gameId,
          releaseDate: stored.releaseDate,
          releaseDatePrecision: stored.releaseDatePrecision,
        },
        data,
      })
    )
  );
  return results.reduce((total, { count }) => total + count, 0);
}
