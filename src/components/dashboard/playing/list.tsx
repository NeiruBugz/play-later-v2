import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/packages/config/site";
import { cn } from "@/src/packages/utils";
import { getPlayingGames } from "@/src/queries/dashboard/get-playing-games";
import { Game } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

const GameWidget = ({
  game,
}: {
  game: { id: Game["id"]; imageUrl: Game["imageUrl"]; title: Game["title"] };
}) => {
  return (
    <Link href={`/library/${game.id}`}>
      <div className="flex flex-col items-center gap-1.5">
        <Image
          alt={`${game.title} artwork`}
          className="rounded-md object-cover"
          height={NEXT_IMAGE_SIZES["logo"].height}
          priority
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.imageUrl}.png`}
          width={NEXT_IMAGE_SIZES["logo"].width}
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
