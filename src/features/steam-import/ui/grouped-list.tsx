"use client";

import { SteamAppInfo } from "@/src/shared/types";
import { Button, Input } from "@/src/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui/select";
import { IgnoredImportedGames } from "@prisma/client";
import React, { useCallback, useDeferredValue, useMemo, useState } from "react";
import { ImportedGameItem } from "./imported-game-item";

type GroupedSteamGameListProps = {
  groupName: string;
  games: SteamAppInfo[];
  description?: string;
};

type SortOption = "alphabetical" | "playtime";

const GroupedSteamGameList: React.FC<GroupedSteamGameListProps> = ({
  groupName,
  games,
  description,
}) => {
  const [filterQuery, setFilterQuery] = useState("");
  const [sortState, setSortState] = useState<SortOption>("alphabetical");
  const deferredValue = useDeferredValue(filterQuery);
  const [isSaving, setIsSaving] = useState(false);
  const [ignoredGames, setIgnoredGames] = useState<
    Omit<IgnoredImportedGames, "id" | "userId">[]
  >([]);
  const [gamesToSave, setGamesToSave] = useState<SteamAppInfo[]>([]);
  const [progress, setProgress] = useState(0);

  const onAddAllClick = useCallback(async () => {
    // Implement the logic to add all games
  }, []);

  const onIgnoreClick = useCallback((steamGame: SteamAppInfo) => {
    setIgnoredGames((prev) => [...prev, { name: steamGame.name }]);
  }, []);

  const addToCollectionClick = useCallback((steamGame: SteamAppInfo) => {
    setGamesToSave((prev) => [...prev, steamGame]);
  }, []);

  const filteredAndSortedGames = useMemo(() => {
    const filteredGames = games.filter((game) =>
      game.name.toLowerCase().includes(deferredValue.toLowerCase())
    );

    return [...filteredGames].sort((gameA, gameB) => {
      if (sortState === "playtime") {
        return gameB.playtime_forever - gameA.playtime_forever;
      }
      return gameA.name.localeCompare(gameB.name);
    });
  }, [games, deferredValue, sortState]);

  if (!games.length) {
    return null;
  }

  return (
    <>
      <div>
        {description && (
          <p className="my-2 text-xs text-slate-400">{description}</p>
        )}
        <div className="flex flex-wrap gap-4 md:flex-nowrap">
          <Input
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.currentTarget.value)}
            placeholder="Start typing game name to filter"
            disabled={isSaving}
          />
          <Select
            value={sortState}
            onValueChange={(value: SortOption) => setSortState(value)}
            disabled={isSaving}
          >
            <SelectTrigger
              className="max-w-[260px] gap-1"
              aria-label="list sort"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="playtime" disabled={groupName === "Backlog"}>
                Playtime
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onAddAllClick} disabled={isSaving}>
            Add all games
          </Button>
        </div>
        <div className="my-4 grid h-fit max-h-[600px] min-h-[600px] grid-cols-[repeat(auto-fit,_minmax(280px,_1fr))] justify-between gap-4 overflow-auto">
          {filteredAndSortedGames.map((game) => (
            <ImportedGameItem
              key={game.appid}
              game={game}
              onIgnoreClick={onIgnoreClick}
              markGameForSave={addToCollectionClick}
              isIgnored={ignoredGames.some(
                (ignoredGame) => game.name === ignoredGame.name
              )}
              isMarkedForSave={gamesToSave.some(
                (gameForSave) => gameForSave.name === game.name
              )}
            />
          ))}
        </div>
      </div>
      <BatchSaveProgress progress={progress} />
    </>
  );
};

const BatchSaveProgress: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="fixed bottom-20 right-4 z-[100] w-[300px] overflow-y-auto rounded border p-4 shadow-md">
    <h3 className="mb-2 text-lg font-semibold">Batch Save Progress</h3>
    <p className="mt-2 text-sm">{Math.round(progress)}% completed</p>
  </div>
);

export { GroupedSteamGameList };
