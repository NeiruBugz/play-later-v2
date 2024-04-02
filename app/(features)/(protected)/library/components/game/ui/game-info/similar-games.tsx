import { Suspense } from "react";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import { FullGameInfoResponse } from "@/lib/types/igdb";

import { List } from "@/app/(features)/(protected)/library/components/library/page/list";

const ListSkeleton = () => (
  <List>
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
    <section>
      <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
        Similar games
      </h3>
      <Suspense fallback={<ListSkeleton />}>
        <List>
          {gamesList.map((game) => {
            return (
              <div
                key={game.id}
                className="relative aspect-[3/4] h-full w-[264px] flex-shrink-0 rounded-md border transition"
              >
                <Image
                  width={264}
                  height={352}
                  src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${game.cover?.image_id}.png`}
                  alt={`${game.name} artwork`}
                  className="rounded-md object-cover"
                  priority
                />
              </div>
            );
          })}
        </List>
      </Suspense>
    </section>
  );
};
