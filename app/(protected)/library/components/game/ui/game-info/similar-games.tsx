import { List } from "@/app/(protected)/library/components/library/page/list";
import { Skeleton } from "@/components/ui/skeleton";
import { IMAGE_API, IMAGE_SIZES, NEXT_IMAGE_SIZES } from "@/lib/config/site";
import { FullGameInfoResponse } from "@/lib/types/igdb";
import Image from "next/image";
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
                className="relative aspect-[3/4] h-full w-[264px] flex-shrink-0 rounded-md border transition"
                key={game.id}
              >
                <Image
                  alt={`${game.name} artwork`}
                  className="rounded-md object-cover"
                  height={NEXT_IMAGE_SIZES["c-big"].height}
                  priority
                  src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${game.cover?.image_id}.png`}
                  width={NEXT_IMAGE_SIZES["c-big"].width}
                />
              </div>
            );
          })}
        </List>
      </Suspense>
    </section>
  );
};
