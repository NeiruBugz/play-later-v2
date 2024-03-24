"use client";

import Image from "next/image";
import Link from "next/link";
import { DeleteFromList } from "@/features/game/ui/delete-from-list";
import { deleteGameFromList } from "@/features/lists";
import { Game } from "@prisma/client";
import { Clock } from "lucide-react";

import { Badge, ColorVariant } from "@/components/ui/badge";
import { RenderWhen } from "@/components/render-when";

import { platformEnumToColor, uppercaseToNormal } from "@/lib/utils";

function GameTimeBadge({ time }: { time: Game["gameplayTime"] | undefined }) {
  if (!time) {
    return null;
  }

  return (
    <div className="flex w-fit items-center justify-center gap-1 rounded-full bg-background/70 p-1 text-xs font-medium">
      <Clock className="size-3" />
      {time} h
    </div>
  );
}

function Artwork({ game }: { game: Partial<Game> }) {
  return (
    <div className="group relative w-fit cursor-pointer rounded border bg-background text-white shadow-md transition-all">
      <div className="flex size-32 items-center justify-center sm:size-36 md:size-48 xl:size-52">
        <Image
          src={game.imageUrl ?? ""}
          alt={`${game.title} cover art`}
          className="size-full rounded object-cover"
          width={256}
          height={256}
          priority
        />
        <RenderWhen condition={Boolean(game.platform)}>
          <div className="absolute right-2 top-2 flex w-fit flex-col items-end gap-1 normal-case">
            <Badge
              variant={
                game.platform
                  ? (platformEnumToColor(game.platform) as ColorVariant)
                  : "default"
              }
            >
              {uppercaseToNormal(game.platform as string)}
            </Badge>

            <GameTimeBadge time={game.gameplayTime} />
          </div>
        </RenderWhen>
      </div>
      <div className="absolute bottom-0 left-0 hidden min-h-[30%] w-32 items-center justify-between gap-2 bg-background/70 p-2 group-hover:flex sm:w-36 md:w-48 md:px-4 md:py-2 xl:w-52">
        <p className="text-md font-medium">{game.title}</p>
      </div>
    </div>
  );
}

export function GameCard({
  game,
  path = "library",
  entityId,
}: {
  game: Partial<Game>;
  path?: string;
  entityId?: string;
}) {
  const onDelete = async () => {
    if (!game.id || !entityId) {
      return;
    }

    if (path.includes("lists")) {
      try {
        await deleteGameFromList(entityId, game.id);
      } catch (error) {
        console.error(error);
      }
    }
  };
  return (
    <div className="group w-full rounded">
      {path === "lists" ? <DeleteFromList onDelete={onDelete} /> : null}
      <Link
        href={`/${path === "lists" ? "library" : path}/${game.id}`}
        className="block w-fit rounded"
      >
        <Artwork game={game} />
      </Link>
    </div>
  );
}
