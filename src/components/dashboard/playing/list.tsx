import type { Game } from "@prisma/client";

import { CustomImage } from "@/src/components/shared/custom-image";
import { cn } from "@/src/packages/utils";
import { getPlayingGames } from "@/src/queries/dashboard/get-playing-games";
import Link from "next/link";

const GameWidget = ({
  game,
}: {
  game: { id: Game["id"]; imageUrl: Game["imageUrl"]; title: Game["title"] };
}) => {
  return (
    <Link href={`/library/${game.id}`}>
      <div className="flex flex-col items-center gap-1.5">
        <CustomImage
          alt={`${game.title} artwork`}
          className="rounded-md object-cover"
          imageUrl={game.imageUrl}
          priority
          size="logo"
        />
      </div>
    </Link>
  );
};

export async function PlayingGamesList() {
  const games = await getPlayingGames();

  return (
    <div
      className={cn("flex w-full gap-3", {
        "justify-center": games.length <= 2,
      })}
    >
      {games.map((game) => (
        <GameWidget game={game} key={game.id} />
      ))}
    </div>
  );
}
