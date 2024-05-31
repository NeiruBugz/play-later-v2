import igdbApi from "@/src/shared/api/igdb";
import { CustomImage } from "@/src/shared/ui/custom-image";
import { Skeleton } from "@/src/shared/ui/skeleton";

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
          <CustomImage
            alt={`${game.name} cover`}
            className="mb-4 rounded-md"
            imageUrl={game.cover.image_id}
            key={game.id}
            priority
            size="logo"
          />
        );
      })}
    </div>
  );
}
