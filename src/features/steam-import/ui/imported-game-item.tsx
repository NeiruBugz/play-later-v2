"use client";

import { cn } from "@/src/shared/lib";
import { SteamAppInfo } from "@/src/shared/types";
import { Button } from "@/src/shared/ui";
import Image from "next/image";
import { minToHours } from "../lib";

type ImportedGameItemProps = {
  game: SteamAppInfo;
  onIgnoreClick: (game: SteamAppInfo) => void;
  markGameForSave: (game: SteamAppInfo) => void;
  isIgnored: boolean;
  isMarkedForSave: boolean;
  isAdded: boolean;
};

function ImportedGameItem({
  game,
  onIgnoreClick,
  markGameForSave,
  isIgnored,
  isMarkedForSave,
  isAdded,
}: ImportedGameItemProps) {
  if (isAdded) {
    return null;
  }

  return (
    <div
      key={game.appid}
      className={cn(
        "my-2 flex h-auto flex-col justify-evenly rounded border p-4 px-2",
        {
          "shadow-lg text-underline border-0 font-bold": isMarkedForSave,
          "text-muted-foreground bg-muted-background": isIgnored,
        }
      )}
    >
      <div className="flex w-fit items-center gap-2">
        <Image
          width={32}
          height={32}
          className="overflow-hidden"
          alt={`${game.name} Steam Logo`}
          src={`https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`}
        />
        <p className="w-full font-medium">{game.name}</p>
      </div>
      <span
        className={cn("hidden text-sm", {
          inline: game.playtime_forever !== 0,
        })}
      >
        Playtime: {minToHours(game.playtime_forever)} h.
      </span>
      <div className="my-3 flex justify-between gap-2">
        <Button onClick={() => markGameForSave(game)} disabled={isIgnored}>Mark for save</Button>
        <Button
          variant="destructive"
          onClick={() => onIgnoreClick(game)}
          disabled={isMarkedForSave}
        >
          Ignore
        </Button>
      </div>
    </div>
  );
}

export { ImportedGameItem };
