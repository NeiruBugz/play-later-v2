import { getPlaythroughList } from "@/src/actions/library/get-playthrough-list";
import { PlaythroughItem } from "@/src/components/library/game/ui/game-info/playthrough/playthrough-item";
import { FullGameInfoResponse } from "@/src/packages/types/igdb";
import { Game } from "@prisma/client";

export const Playthroughs = async ({
  id,
  platforms,
}: {
  id: Game["id"];
  platforms: FullGameInfoResponse["release_dates"];
}) => {
  const list = await getPlaythroughList({ id });

  if (!list || list?.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
        Playthroughs
      </h3>
      <div className="flex flex-col gap-2">
        {list.map((playthrough) => (
          <PlaythroughItem
            id={playthrough.id}
            key={playthrough.id}
            label={playthrough.label}
            platform={playthrough.platform}
            platforms={platforms}
          />
        ))}
      </div>
    </section>
  );
};
