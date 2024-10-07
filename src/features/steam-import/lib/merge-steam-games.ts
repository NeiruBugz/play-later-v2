import { SteamAppInfo } from "@/src/shared/types";

const IGNORED_KEYWORDS = [
  "Multiplayer",
  "Zombies",
  "Singleplayer",
  "Campaign",
  "Demo",
  "Beta",
  "Test",
] as const;

function cleanGameName(name: string): string {
  let cleanName = name;

  IGNORED_KEYWORDS.forEach((keyword) => {
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

export { mergeSteamGames };
