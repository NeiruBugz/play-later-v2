"use client";

import { minToHours } from "@/src/features/steam-import/lib";
import { cn } from "@/src/shared/lib";
import { SteamAppInfo } from "@/src/shared/types";
import { Button, Input } from "@/src/shared/ui";
import { Checkbox } from "@/src/shared/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui/select";
import Image from "next/image";
import { useDeferredValue, useState } from "react";

type GroupedSteamGameListProps = {
  groupName: string;
  games: SteamAppInfo[];
  description?: string;
};

function GroupedSteamGameList({
  games,
  description,
}: GroupedSteamGameListProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [sortState, setSortState] = useState("alphabetical");
  const defferedValue = useDeferredValue(filterQuery);

  if (games.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="my-2 text-xs text-slate-400">{description}</p>
      <div className="flex flex-wrap gap-4 md:flex-nowrap">
        <Input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.currentTarget.value)}
          placeholder="Start typing game name to filter"
        />
        <Select value={sortState} onValueChange={setSortState}>
          <SelectTrigger className="max-w-[260px] gap-1" aria-label="list sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="playtime">Playtime</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="justify-between my-4 grid h-fit max-h-[600px] min-h-[600px] grid-cols-[repeat(auto-fit,_minmax(280px,_1fr))] gap-4 overflow-auto">
        {games
          .sort((gameA, gameB) => {
            if (sortState === "playtime") {
              return gameB.playtime_forever - gameA.playtime_forever;
            }

            return gameA.name.localeCompare(gameB.name);
          })
          .filter((game) =>
            game.name.toLowerCase().includes(defferedValue.toLowerCase())
          )
          .map((game) => (
            <div
              key={game.appid}
              className="my-2 flex h-auto w-[280px] md:w-full flex-col justify-evenly rounded border p-4 px-2"
            >
              <div className="flex w-fit items-center gap-2">
                {/* <Checkbox /> */}
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
                <Button>Add to Collection</Button>
                <Button variant="destructive">Ignore</Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export { GroupedSteamGameList };
