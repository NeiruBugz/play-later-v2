"use client";

import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";
import { fetchSteamProfile } from "@/src/features/steam-import/api/fetch-steam-profile.action";
import { useImportedGames } from "@/src/features/steam-import/lib/use-imported-games";
import { GroupedSteamGameList } from "@/src/features/steam-import/ui/grouped-list";
import { ImportedGameItem } from "@/src/features/steam-import/ui/imported-game-item";
import { cn } from "@/src/shared/lib";
import { SteamAppInfo } from "@/src/shared/types";
import { Button, Input } from "@/src/shared/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/ui/tabs";
import { BacklogItemStatus, IgnoredImportedGames, User } from "@prisma/client";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";

function FetchSteamProfileButton({ isDisabled }: { isDisabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={isDisabled}
      className={cn({ "animate-pulse": pending })}
    >
      Fetch profile
    </Button>
  );
}

function GameInfo({ gameCount }: { gameCount: number }) {
  if (gameCount === 0) return null;

  return (
    <>
      <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
        We&apos;ve found {gameCount} games in your Steam profile
      </h3>
      <p className="my-2 mt-6 leading-7">
        Also, we&apos;ve filtered games that you already logged into the app
        with PC as a platform and merged different clients of the game (e.g.
        Call of Duty and Call of Duty Multiplayer)
      </p>
    </>
  );
}

function GameTabs({
  gameGroups,
  gameCount,
}: {
  gameGroups: {
    Backlog: SteamAppInfo[];
    Played: SteamAppInfo[];
  };
  gameCount: number;
}) {
  if (gameCount === 0) return null;

  return (
    <Tabs defaultValue="Backlog">
      <TabsList>
        <TabsTrigger value="Backlog">
          Backlog ({gameGroups["Backlog"]?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="Played">
          Played ({gameGroups["Played"]?.length || 0})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="Backlog">
        <GroupedSteamGameList
          games={gameGroups["Backlog"]}
          groupName="Backlog"
          description="According to 0 hours spent in game"
        />
      </TabsContent>
      <TabsContent value="Played">
        <GroupedSteamGameList
          games={gameGroups["Played"]}
          groupName="Played"
          description="According to playtime provided by Steam"
        />
      </TabsContent>
    </Tabs>
  );
}

function ImportDialog({
  existingGames,
  ignoredGames,
  userData,
}: {
  existingGames: GameWithBacklogItems[];
  ignoredGames: IgnoredImportedGames[];
  userData: User | undefined;
}) {
  const [state, action] = useActionState(fetchSteamProfile, {
    message: "",
    gameList: [],
    gameCount: 0,
  });
  const [page, setPage] = useState(1);
  const { processedGames } = useImportedGames({
    games: state.gameList,
    ignoredGames,
    existingGames,
  });
  const [games, setGames] = useState(processedGames)

  useEffect(() => {
    if (processedGames.length !== games.length && processedGames.length !== 0) {
      setGames(processedGames);
    }
  }, [games.length, processedGames])


  const totalPages = Math.ceil(processedGames.length / 10);

  const paginatedGames = useMemo(() => {
    if (!games.length) return [];
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    return games.slice(startIndex, endIndex);
  }, [page, games])

  const goToFirst = useCallback(() => {
    setPage(1);
  }, [])

  const goToLast = useCallback(() => {
    setPage(totalPages)
  }, [totalPages]);


  const changeSteamAppStatus = useCallback((appId: number, status: string) => {
    const updated = games.map((game) => {
      if (game.appid === appId) {
        return {
          ...game,
          status: status as unknown as BacklogItemStatus,
        };
      }

      return game;
    })
    setGames(updated)
  }, [games])

  return (
    <>
      <div className="my-3">
        <form action={action} className="mb-4 flex items-center gap-2">
          <Input
            placeholder="Enter Steam profile URL"
            name="steamProfileUrl"
            disabled={state.gameCount !== 0}
            defaultValue={userData?.steamProfileURL ?? ""}
            type="text"
          />
          <FetchSteamProfileButton isDisabled={state.gameCount !== 0} />
        </form>
        <GameInfo gameCount={state.gameCount} />
        <div className="">
          <ul className="w-full max-h-[520px] lg:max-w-full overflow-auto">
            {paginatedGames.map((game) => {
              return (
                <li key={game.appid}>
                  <ImportedGameItem game={game} onGameStatusChange={changeSteamAppStatus} />
                </li>
              );
            })}
          </ul>
          <div className={cn("flex items-center gap-1 text-xs mt-2", {
            hidden: !processedGames.length
          })}>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0"
              disabled={page === 1}
              onClick={goToFirst}
            >
              <ChevronsLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              disabled={!page || page === 1}
              className="h-6 w-6 p-0"
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <span className="font-medium">
              {page ?? 1} | {totalPages}
            </span>

            <Button
              variant="ghost"
              disabled={page >= totalPages}
              className="h-6 w-6 p-0"
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0"
              disabled={page >= totalPages}
              onClick={goToLast}
            >
              <ChevronsRight className="h-5 w-5" />
            </Button>
            <span>Total games: {processedGames.length}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export { ImportDialog };
