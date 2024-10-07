"use client";

import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";
import { fetchSteamProfile } from "@/src/features/steam-import/api/fetch-steam-profile.action";
import { useImportedGames } from "@/src/features/steam-import/lib/use-imported-games";
import { GroupedSteamGameList } from "@/src/features/steam-import/ui/grouped-list";
import { cn } from "@/src/shared/lib";
import { SteamAppInfo } from "@/src/shared/types";
import { Button, Input } from "@/src/shared/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/ui/tabs";
import { IgnoredImportedGames } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";

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
}: {
  existingGames: GameWithBacklogItems[];
  ignoredGames: IgnoredImportedGames[];
}) {
  const [state, action] = useFormState(fetchSteamProfile, {
    message: "",
    gameList: [],
    gameCount: 0,
  });
  const { gameGroups } = useImportedGames({
    games: state.gameList,
    ignoredGames,
    existingGames,
  });

  return (
    <div className="my-3">
      <form action={action} className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Enter Steam profile URL"
          name="steamProfileUrl"
          disabled={state.gameCount !== 0}
          type="text"
        />
        <FetchSteamProfileButton isDisabled={state.gameCount !== 0} />
      </form>
      <GameInfo gameCount={state.gameCount} />
      <GameTabs gameGroups={gameGroups} gameCount={state.gameCount} />
    </div>
  );
}

export { ImportDialog };
