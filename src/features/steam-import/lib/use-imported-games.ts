import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";
import { mergeSteamGames } from "@/src/features/steam-import/lib/merge-steam-games";
import { SteamAppInfo } from "@/src/shared/types";
import { IgnoredImportedGames } from "@prisma/client";
import { useMemo } from "react";

function removeSpecialChars(input: string): string {
  const specialCharsRegex =
    /[\u2122\u00A9\u00AE\u0024\u20AC\u00A3\u00A5\u2022\u2026]/g;

  return input.replace(specialCharsRegex, "");
}

function useImportedGames({
  games,
  existingGames,
  ignoredGames,
}: {
  games: SteamAppInfo[];
  existingGames: GameWithBacklogItems[];
  ignoredGames: IgnoredImportedGames[];
}) {
  const gameGroups = useMemo(() => {
    if (!games.length) {
      return {
        Backlog: [],
        Played: [],
      };
    }

    const merged = mergeSteamGames([...games]);
    const sortedGames = merged
      .sort((gameA, gameB) => gameA.name.localeCompare(gameB.name))
      .filter((steamGame) => {
        const matchedGame = existingGames.find(
          (existingGame) =>
            existingGame.game.title.toLowerCase() ===
            removeSpecialChars(steamGame.name).toLowerCase()
        );

        if (matchedGame) {
          const hasPcPlatform = matchedGame.backlogItems.some(
            (item) => item.platform?.toLowerCase() === "pc"
          );

          return !hasPcPlatform;
        }

        return true;
      })
      .filter((steamGame) => {
        const matchedGame = ignoredGames.find(
          (ignoredGame) =>
            ignoredGame.name.toLowerCase() === steamGame.name.toLowerCase()
        );

        return !matchedGame;
      })
      .filter((steamGame) => {
        const lowerCasedName = steamGame.name.toLowerCase();
        if (
          lowerCasedName.includes("test") ||
          lowerCasedName.includes("demo") ||
          lowerCasedName.includes("beta")
        ) {
          return false;
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

    return {
      Backlog: unPlayed,
      Played: played,
    };
  }, [existingGames, games, ignoredGames]);

  return { gameGroups };
}

export { useImportedGames };
