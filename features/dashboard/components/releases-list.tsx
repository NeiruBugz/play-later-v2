import { BacklogItem, BacklogItemStatus, Game } from "@prisma/client";
import { cache } from "react";

import { getUpcomingWishlistItems } from "@/features/dashboard/server-actions";
import { GameCard } from "@/shared/components/game-card";
import { Body } from "@/shared/components/typography";

const getReleases = cache(async () => getUpcomingWishlistItems());

export async function ReleasesList() {
  const { data: releases } = await getReleases();

  if (!releases || releases.length === 0) {
    return (
      <Body variant="muted">
        Add games to your wishlist to see upcoming releases here.
      </Body>
    );
  }

  return (
    <div className="flex w-full gap-3 overflow-x-auto pb-2">
      {releases.map((release) => (
        <div key={release.id} className="w-40 shrink-0">
          <GameCard
            game={
              {
                id: String(release.id),
                title: release.name,
                coverImage: release.cover?.image_id ?? null,
                igdbId: release.id,
              } as unknown as Game
            }
            backlogItem={
              {
                status: BacklogItemStatus.WISHLIST,
              } as unknown as BacklogItem
            }
          />
        </div>
      ))}
    </div>
  );
}
