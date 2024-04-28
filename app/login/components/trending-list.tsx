import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";

import { IMAGE_API, IMAGE_SIZES, NEXT_IMAGE_SIZES } from "@/lib/config/site";
import igdbApi from "@/lib/igdb-api";

const placeholderArray = Array.from({ length: 12 }, (_, index) => index + 1);

export const TrendingListSkeleton = () => (
  <div className="columns-3">
    {placeholderArray.map((index) => (
      <Skeleton
        className="mb-4 h-[190px] w-[140px]"
        key={Math.random() * index}
      />
    ))}
  </div>
);

export async function TrendingList() {
  const trendingGames = await igdbApi.getGamesByRating();

  return (
    <div className="columns-3">
      {trendingGames?.map((game) => {
        return (
          <Image
            key={game.id}
            src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.cover.image_id}.png`}
            alt={`${game.name} cover`}
            className="mb-4 rounded-md"
            width={NEXT_IMAGE_SIZES["c-big"].width}
            height={NEXT_IMAGE_SIZES["c-big"].height}
            priority
          />
        );
      })}
    </div>
  );
}
