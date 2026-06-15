import { prisma } from "@/shared/lib/db.server";

import type {
  PlaythroughKind,
  PlaythroughStatus,
} from "../../../../shared/lib/prisma/client.ts";

export type ProfilePlaythrough = {
  id: string;
  kind: PlaythroughKind;
  status: PlaythroughStatus;
  platform: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  rating: number | null;
  notes: string | null;
  game: { title: string; slug: string; coverImage: string | null };
};

/**
 * Recent playthroughs for a user's public profile.
 *
 * Privacy invariant (owner-bypass):
 * - `!isPublicProfile` AND viewer is not the owner → `[]` (section hidden).
 * - Owner viewing their own profile → allowed regardless of `isPublicProfile`.
 *
 * The caller is responsible for resolving `ownerId` and `isPublicProfile` from
 * the profile record — typically from `getPublicProfile`, which already owns the
 * primary privacy gate (throws `NotFoundError` for missing/denied). Accepting
 * `ownerId` + `isPublicProfile` directly avoids a redundant user-by-username
 * lookup and ensures privacy semantics are encoded in exactly one place.
 *
 * Privacy lives here on the entity, not on the feature handler or route.
 * See CONTEXT.md "Privacy invariant". Unlike `getPublicProfile` (which throws
 * `NotFoundError` for denied), this query returns `[]` because the profile
 * route already owns the 404 decision; this section silently hides on a
 * denied read.
 *
 * Results are ordered newest-first by `createdAt` (recent activity).
 */
export async function getProfilePlaythroughs(
  ownerId: string,
  isPublicProfile: boolean,
  viewerId?: string,
  limit = 12
): Promise<ProfilePlaythrough[]> {
  const isOwner = viewerId !== undefined && viewerId === ownerId;

  if (!isPublicProfile && !isOwner) {
    return [];
  }

  const rows = await prisma.playthrough.findMany({
    where: {
      libraryItem: { userId: ownerId },
    },
    select: {
      id: true,
      kind: true,
      status: true,
      platform: true,
      startedAt: true,
      finishedAt: true,
      rating: true,
      notes: true,
      libraryItem: {
        select: {
          game: {
            select: {
              title: true,
              slug: true,
              coverImage: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    status: row.status,
    platform: row.platform,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    rating: row.rating,
    notes: row.notes,
    game: row.libraryItem.game,
  }));
}
