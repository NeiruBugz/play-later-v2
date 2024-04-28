import { Skeleton } from "@/src/components/ui/skeleton";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/packages/config/site";
import igdbApi from "@/src/packages/igdb-api";
import Image from "next/image";

const placeholderArray = Array.from({ length: 12 }, (_, index) => index + 1);

export const TrendingListSkeleton = () => (
  <div className="columns-3">
    {placeholderArray.map((index) => (
      <Skeleton
        className="mb-4 h-[160px] w-[120px]"
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
            alt={`${game.name} cover`}
            className="mb-4 rounded-md"
            height={NEXT_IMAGE_SIZES["logo"].height}
            key={game.id}
            priority
            src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.cover.image_id}.png`}
            width={NEXT_IMAGE_SIZES["logo"].width}
          />
        );
      })}
    </div>
  );
}
