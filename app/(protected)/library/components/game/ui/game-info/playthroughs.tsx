import { Game } from "@prisma/client";

import { getPlaythroughList } from "@/app/(protected)/library/lib/actions/get-playthrough-list";

export const Playthroughs = async ({ id }: { id: Game["id"] }) => {
  const list = await getPlaythroughList({ id });

  if (!list.length) {
    return null;
  }

  return (
    <section>
      <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
        Playthroughs
      </h3>
      {list.map((playthrough) => {
        return (
          <p
            key={playthrough.id}
            className="text-xs leading-none text-foreground"
          >
            {playthrough.label} - {playthrough.platform}
          </p>
        );
      })}
    </section>
  );
};
