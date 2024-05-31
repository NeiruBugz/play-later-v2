import { getPlaythroughList } from "@/src/entities/playthrough/api/get-playthrough-list";

import { PlaythroughItem } from "./playthrough-item";
import { PlaythroughsProps } from "./types";

export const Playthroughs = async ({ id, platforms }: PlaythroughsProps) => {
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
