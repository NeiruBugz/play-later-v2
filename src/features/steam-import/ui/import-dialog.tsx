"use client";

import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";
import { fetchSteamProfile } from "@/src/features/steam-import/api/fetch-steam-profile.action";
import { GroupedSteamGameList } from "@/src/features/steam-import/ui/grouped-list";
import { cn } from "@/src/shared/lib";
import { SteamAppInfo } from "@/src/shared/types";
import { Button, Input } from "@/src/shared/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/ui/tabs";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

const ignoredKeywords = [
  "Multiplayer",
  "Zombies",
  "Singleplayer",
  "Campaign",
  "Demo",
  "Beta",
  "Test",
];

function cleanGameName(name: string): string {
  let cleanName = name;

  ignoredKeywords.forEach((keyword) => {
    cleanName = cleanName.replace(new RegExp(` - ${keyword}`, "gi"), "");
  });

  cleanName = cleanName.replace(/\(\d{4}\)/, "");

  return cleanName.trim();
}

function mergeSteamGames(games: SteamAppInfo[]): SteamAppInfo[] {
  const mergedGamesMap: { [key: string]: SteamAppInfo } = {};

  games.forEach((game) => {
    const cleanName = cleanGameName(game.name);

    if (mergedGamesMap[cleanName]) {
      mergedGamesMap[cleanName].playtime_forever += game.playtime_forever;
      mergedGamesMap[cleanName].playtime_windows_forever +=
        game.playtime_windows_forever;
      mergedGamesMap[cleanName].playtime_mac_forever +=
        game.playtime_mac_forever;
      mergedGamesMap[cleanName].playtime_linux_forever +=
        game.playtime_linux_forever;
      mergedGamesMap[cleanName].playtime_deck_forever +=
        game.playtime_deck_forever;
    } else {
      mergedGamesMap[cleanName] = { ...game };
    }
  });

  return Object.values(mergedGamesMap);
}

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

function ImportDialog({
  existingGames,
}: {
  existingGames: GameWithBacklogItems[];
}) {
  const [state, action] = useFormState(fetchSteamProfile, {
    message: "",
    gameList: [],
    gameCount: 0,
  });


  const [gameGroups, setGameGroups] = useState<Record<string, SteamAppInfo[]>>({
    Backlog: [],
    Played: [],
  });

  useEffect(() => {
    if (state.gameList.length) {
      const merged = mergeSteamGames([...state.gameList]);
      const sortedGames = merged
        .sort((gameA, gameB) => gameA.name.localeCompare(gameB.name))
        .filter((steamGame) => {
          const matchedGame = existingGames.find(
            (existingGame) =>
              existingGame.game.title.toLowerCase() ===
              steamGame.name.toLowerCase()
          );

          if (matchedGame) {
            const hasPcPlatform = matchedGame.backlogItems.some(
              (item) => item.platform?.toLowerCase() === "pc"
            );

            return !hasPcPlatform;
          }

          return true;
        });
      const played: SteamAppInfo[] = [];
      const unPlayed: SteamAppInfo[] = [];

      sortedGames.forEach((steamGame) => {
        if (steamGame.playtime_forever === 0) {
          unPlayed.push(steamGame);
        } else {
          played.push(steamGame);
        }
      });

      const groups = {
        Backlog: unPlayed,
        Played: played,
      };


      setGameGroups(groups);
    }
  }, [existingGames, state.gameList]);

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
      <h3
        className={cn(
          "my-2 hidden scroll-m-20 text-2xl font-semibold tracking-tight",
          {
            block: state.gameCount !== 0,
          }
        )}
      >
        We&apos;ve found {state.gameCount} games in your Steam profile
      </h3>
      <p
        className={cn("my-2 hidden leading-7 [&:not(:first-child)]:mt-6", {
          block: state.gameCount !== 0,
        })}
      >
        Also, we&apos;ve filtered games that you already logged into the app
        with PC as a platform and merged different clients of the game (e.g.
        Call of Duty and Call of Duty Multiplayer)
      </p>
      <Tabs defaultValue="Backlog" hidden={state.gameCount === 0}>
        <TabsList>
          <TabsTrigger value="Backlog">
            Backlog ({gameGroups["Backlog"].length})
          </TabsTrigger>
          <TabsTrigger value="Played">
            Played ({gameGroups["Played"].length})
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
    </div>
  );
}

export { ImportDialog };
