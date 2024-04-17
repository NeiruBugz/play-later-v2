import { Game } from "@prisma/client";

import { FullGameInfoResponse } from "@/lib/types/igdb";

import { PlaythroughItem } from "@/app/(protected)/library/components/game/ui/game-info/playthrough-item";
import { getPlaythroughList } from "@/app/(protected)/library/lib/actions/get-playthrough-list";

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
            label={playthrough.label}
            platform={playthrough.platform}
            id={playthrough.id}
            platforms={platforms}
            key={playthrough.id}
          />
        ))}
      </div>
    </section>
  );
};
