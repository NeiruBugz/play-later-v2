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
 * - Missing user → `[]` (profile route already 404s upstream; this section
 *   just stays hidden).
 * - `!isPublicProfile` AND viewer is not the owner → `[]` (section hidden).
 * - Owner viewing their own profile → allowed regardless of `isPublicProfile`.
 *
 * Privacy lives here on the entity, not on the feature handler or route.
 * See CONTEXT.md "Privacy invariant". Unlike `getPublicProfile` (which throws
 * NotFoundError for denied), this query returns `[]` because the profile route
 * already owns the 404 decision; this section silently hides on a denied read.
 *
 * Results are ordered newest-first by `createdAt` (recent activity).
 */
export async function getProfilePlaythroughs(
  username: string,
  viewerId?: string,
  limit = 12
): Promise<ProfilePlaythrough[]> {
  const targetUser = await prisma.user.findFirst({
    where: { usernameNormalized: username.toLowerCase().trim() },
    select: { id: true, isPublicProfile: true },
  });

  if (!targetUser) {
    return [];
  }

  const isOwner = viewerId !== undefined && viewerId === targetUser.id;

  if (!targetUser.isPublicProfile && !isOwner) {
    return [];
  }

  const rows = await prisma.playthrough.findMany({
    where: {
      libraryItem: { userId: targetUser.id },
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
