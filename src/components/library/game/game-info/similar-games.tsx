import type { FullGameInfoResponse } from "@/src/packages/types/igdb";

import { CustomImage } from "@/src/components/shared/custom-image";
import { List } from "@/src/components/shared/list";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Suspense } from "react";

const ListSkeleton = () => (
  <List viewMode="grid">
    {Array.from({ length: 5 }, (_, index) => index + 1).map((index) => (
      <Skeleton className="h-[352px] w-[264px]" key={index} />
    ))}
  </List>
);

export const SimilarGames = ({
  gamesList,
}: {
  gamesList: FullGameInfoResponse["similar_games"];
}) => {
  if (!gamesList.length) {
    return null;
  }

  return (
    <section className="container">
      <Suspense fallback={<ListSkeleton />}>
        <List viewMode="grid">
          {gamesList.map((game) => {
            return (
              <div
                className="relative aspect-[3/4] h-full flex-shrink-0 rounded-md border transition"
                key={game.id}
              >
                <CustomImage
                  alt={`${game.name} artwork`}
                  className="rounded-md object-cover"
                  imageUrl={game.cover?.image_id}
                  priority
                  size="logo"
                />
              </div>
            );
          })}
        </List>
      </Suspense>
    </section>
  );
};
