import type { GameWithBacklogItems } from "@/slices/backlog/api/get/get-user-games-with-grouped-backlog";
import { mergeSteamGames } from "@/src/features/steam-import/lib/merge-steam-games";
import { SteamAppInfo } from "@/src/shared/types";
import { BacklogItemStatus, IgnoredImportedGames } from "@prisma/client";
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
  const processedGames: Array<SteamAppInfo & { status: BacklogItemStatus }> =
    useMemo(() => {
      if (!games.length) {
        return [];
      }

      const merged = mergeSteamGames([...games]);
      return merged
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
          return !(
            lowerCasedName.includes("test") ||
            lowerCasedName.includes("demo") ||
            lowerCasedName.includes("beta")
          );
        })
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .map((game) => {
          return {
            ...game,
            status:
              game.playtime_forever === 0
                ? (BacklogItemStatus.TO_PLAY as BacklogItemStatus)
                : (BacklogItemStatus.PLAYED as BacklogItemStatus),
          };
        });
    }, [existingGames, games, ignoredGames]);

  return { processedGames };
}

export { useImportedGames };
