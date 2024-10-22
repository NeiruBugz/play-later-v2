"use client";

import { BacklogStatusMapper, cn } from "@/src/shared/lib";
import { SteamAppInfo } from "@/src/shared/types";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui";
import { BacklogItemStatus } from "@prisma/client";
import Image from "next/image";
import { minToHours } from "../lib";

type ImportedGameItemProps = {
  game: SteamAppInfo & { status?: BacklogItemStatus };
  onGameStatusChange?: (appId: number, status: string) => void;
  onIgnoreClick?: (game: SteamAppInfo) => void;
  markGameForSave?: (game: SteamAppInfo) => void;
  isIgnored?: boolean;
  isMarkedForSave?: boolean;
  isAdded?: boolean;
};

function ImportedGameItem({
  game,
  onIgnoreClick,
  onGameStatusChange,
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
        "my-2 flex h-auto justify-between rounded border p-4 px-2",
        {
          "text-underline border-0 font-bold shadow-lg": isMarkedForSave,
          "bg-muted-background text-muted-foreground": isIgnored,
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
        <div>
          <p className="w-full font-medium">{game.name}</p>
          <span
            className={cn("hidden text-sm", {
              inline: game.playtime_forever !== 0,
            })}
          >
            Playtime: {minToHours(game.playtime_forever)} h.
          </span>
        </div>
      </div>

      <div className="my-3 flex justify-between gap-2">
        <Select
          value={game.status}
          onValueChange={(value) => onGameStatusChange?.(game.appid, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status"></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.values(BacklogItemStatus).map((key) => {
              return (
                <SelectItem value={key} key={key}>
                  {BacklogStatusMapper[key]}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {/*<Button onClick={() => markGameForSave?.(game)} disabled={isIgnored}>Mark for save</Button>*/}
        <Button
          variant="destructive"
          onClick={() => onIgnoreClick?.(game)}
          disabled={isMarkedForSave}
        >
          Ignore
        </Button>
      </div>
    </div>
  );
}

export { ImportedGameItem };
