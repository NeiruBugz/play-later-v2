/**
 * Formats a playtime value from minutes to a human-readable string
 * @param minutes Playtime in minutes
 * @returns Formatted playtime string
 */
export function formatPlaytime(minutes: number): string {
  if (!minutes || minutes === 0) {
    return '0 hours';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} min`;
}

/**
 * Generates a Steam game image URL based on the app ID and image hash
 * @param appId The Steam app ID
 * @param imageHash The image hash (icon or logo)
 * @returns The full image URL
 */
export function getSteamImageUrl(appId: number, imageHash?: string): string {
  if (!imageHash) {
    // Return the header image as fallback
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
  }

  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${imageHash}.jpg`;
}

/**
 * Checks if a Steam ID is in the correct format (17-digit number)
 * @param steamId The Steam ID to check
 * @returns True if the Steam ID is valid
 */
export function isValidSteam64Id(steamId: string): boolean {
  return /^\d{17}$/.test(steamId);
}

/**
 * Normalizes a game name by removing common suffixes and prefixes
 * @param name The game name to normalize
 * @returns The normalized game name
 */
export function normalizeGameName(name: string): string {
  return name
    .replace(
      /\s*-\s*(Multiplayer|Zombies|Single Player|Campaign|Singleplayer|Co-op|Coop|Cooperative|DLC|Expansion|Season Pass)$/i,
      '',
    )
    .replace(/™|®|©/g, '')
    .trim();
}

/**
 * Extracts the base game name from a full game name
 * @param name The full game name
 * @returns The base game name
 */
export function getBaseGameName(name: string): string {
  // Remove content in parentheses
  let baseName = name.replace(/\s*\(.*?\)\s*/g, ' ');

  // Remove common suffixes
  baseName = baseName.replace(/\s*:\s*.*$/g, '');

  // Remove edition information
  baseName = baseName.replace(
    /\s+(Deluxe|Gold|Complete|Definitive|Enhanced|Remastered|GOTY|Game of the Year|Collection|Edition|HD|VR)\s+Edition/gi,
    '',
  );

  return baseName.trim();
}

/**
 * Checks if two games are related (same base game with different modes)
 * @param name1 First game name
 * @param name2 Second game name
 * @returns True if the games are related
 */
export function areGamesRelated(name1: string, name2: string): boolean {
  // Don't group remasters or remakes with original games
  if (
    (name1.includes('Remastered') && !name2.includes('Remastered')) ||
    (name2.includes('Remastered') && !name1.includes('Remastered')) ||
    (name1.includes('Remake') && !name2.includes('Remake')) ||
    (name2.includes('Remake') && !name1.includes('Remake'))
  ) {
    return false;
  }

  // Extract year in parentheses if present
  const yearRegex = /\((\d{4})\)/;
  const year1Match = name1.match(yearRegex);
  const year2Match = name2.match(yearRegex);

  // If both have years and they're different, don't group them
  if (year1Match && year2Match && year1Match[1] !== year2Match[1]) {
    return false;
  }

  // For games with numbering (like Call of Duty 2, Call of Duty 3)
  // Extract the number and don't group different numbered entries
  const numberRegex = /\b(\d+)\b/;
  const number1Match = name1.match(numberRegex);
  const number2Match = name2.match(numberRegex);

  if (number1Match && number2Match && number1Match[1] !== number2Match[1]) {
    return false;
  }

  // For games with Roman numerals (like Final Fantasy VII, Final Fantasy VIII)
  const romanRegex =
    /\b(I{1,3}|IV|V|VI{1,3}|IX|X|XI{1,3}|XIV|XV|XVI{1,3}|XIX|XX)\b/i;
  const roman1Match = name1.match(romanRegex);
  const roman2Match = name2.match(romanRegex);

  if (
    roman1Match &&
    roman2Match &&
    roman1Match[1].toUpperCase() !== roman2Match[1].toUpperCase()
  ) {
    return false;
  }

  // For games with subtitles (like Call of Duty: Black Ops, Call of Duty: Modern Warfare)
  const subtitleRegex = /:\s*([^:]+)$/;
  const subtitle1Match = name1.match(subtitleRegex);
  const subtitle2Match = name2.match(subtitleRegex);

  // If both have subtitles and they're different, don't group them
  // But we need to check if one is just a mode of the other first
  if (
    subtitle1Match &&
    subtitle2Match &&
    subtitle1Match[1] !== subtitle2Match[1]
  ) {
    // Check if one is a mode variant of the other
    const mode1Match = subtitle1Match[1].match(/^(.*?)\s*-\s*.+$/);
    const mode2Match = subtitle2Match[1].match(/^(.*?)\s*-\s*.+$/);

    // If one has a mode suffix and the other doesn't, compare the base names
    if ((mode1Match && !mode2Match) || (!mode1Match && mode2Match)) {
      const base1 = mode1Match
        ? mode1Match[1].trim()
        : subtitle1Match[1].trim();
      const base2 = mode2Match
        ? mode2Match[1].trim()
        : subtitle2Match[1].trim();

      if (base1 === base2) {
        return true;
      }
    }

    return false;
  }

  // Check for mode variants in the full name
  // This handles cases like "Game - Multiplayer" and "Game"
  const modeRegex = /^(.*?)\s*-\s*.+$/;
  const mode1Match = name1.match(modeRegex);
  const mode2Match = name2.match(modeRegex);

  if (mode1Match || mode2Match) {
    const base1 = mode1Match ? mode1Match[1].trim() : name1.trim();
    const base2 = mode2Match ? mode2Match[1].trim() : name2.trim();

    if (base1 === base2) {
      return true;
    }
  }

  const normalized1 = normalizeGameName(name1);
  const normalized2 = normalizeGameName(name2);

  // Check for exact match after normalization
  if (normalized1 === normalized2) {
    return true;
  }

  // Check if one is a variant of the other (like base game and multiplayer)
  const variant1 = normalized1.replace(/\s*-\s*.*$/, '').trim();
  const variant2 = normalized2.replace(/\s*-\s*.*$/, '').trim();

  if (variant1 === variant2 && variant1.length > 5) {
    return true;
  }

  return false;
}

/**
 * Groups related games and sums their playtime
 * @param games Array of Steam games
 * @returns Array of grouped games with summed playtime
 */
export function groupRelatedGames<
  T extends { appid: number; name: string; playtime_forever: number },
>(games: T[]): T[] {
  if (!games || games.length === 0) {
    return [];
  }

  const processedIds = new Set<number>();
  const result: T[] = [];

  // First pass: group games by base name
  for (let i = 0; i < games.length; i++) {
    if (processedIds.has(games[i].appid)) {
      continue;
    }

    const currentGame = games[i];
    const relatedGames: T[] = [currentGame];
    processedIds.add(currentGame.appid);

    // Find related games
    for (let j = 0; j < games.length; j++) {
      if (i !== j && !processedIds.has(games[j].appid)) {
        if (areGamesRelated(currentGame.name, games[j].name)) {
          relatedGames.push(games[j]);
          processedIds.add(games[j].appid);
        }
      }
    }

    // Choose the primary game (prefer the one without suffixes)
    let primaryGame = relatedGames[0];
    for (const game of relatedGames) {
      // If this game name is shorter or doesn't have a suffix, prefer it as primary
      if (
        game.name.length < primaryGame.name.length ||
        (!game.name.includes('-') && primaryGame.name.includes('-'))
      ) {
        primaryGame = game;
      }
    }

    // Sum playtime for all related games
    const totalPlaytime = relatedGames.reduce(
      (sum, game) => sum + (game.playtime_forever || 0),
      0,
    );

    // Create a new game object with the combined data
    const groupedGame = {
      ...primaryGame,
      playtime_forever: totalPlaytime,
      // Add a property to store the related games
      relatedGames: relatedGames.length > 1 ? relatedGames : undefined,
    } as unknown as T;

    result.push(groupedGame);
  }

  return result;
}
