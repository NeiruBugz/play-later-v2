import { env } from '@/env.mjs';
import { SteamClientInterface, SteamGame } from './steam-client';
import { groupRelatedGames } from './utils';

export class SteamClient implements SteamClientInterface {
  private apiKey: string;

  constructor() {
    this.apiKey = env.STEAM_API_KEY;
  }

  /**
   * Resolve a Steam vanity URL to a Steam64 ID
   * @param steamId The Steam ID or vanity URL
   * @returns The Steam64 ID
   */
  async resolveSteamId(steamId: string): Promise<string> {
    // Check if the input looks like a Steam64 ID (17-digit number)
    if (/^\d{17}$/.test(steamId)) {
      return steamId;
    }

    try {
      const resolveVanityResponse = await fetch(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${this.apiKey}&vanityurl=${steamId}`,
      );

      if (resolveVanityResponse.ok) {
        const vanityData = await resolveVanityResponse.json();
        if (vanityData.response.success === 1) {
          return vanityData.response.steamid;
        }
      }

      // If we couldn't resolve the vanity URL, return the original ID
      // This allows the Steam API to handle the error
      return steamId;
    } catch (error) {
      console.error('Error resolving Steam vanity URL:', error);
      return steamId;
    }
  }

  /**
   * Fetch all games owned by a Steam user
   * @param steamId The Steam ID or vanity URL
   * @returns Array of Steam games
   */
  async getOwnedGames(steamId: string): Promise<SteamGame[]> {
    const steam64Id = await this.resolveSteamId(steamId);

    try {
      const steamResponse = await fetch(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${this.apiKey}&steamid=${steam64Id}&include_appinfo=true&include_played_free_games=true`,
      );

      if (!steamResponse.ok) {
        throw new Error(
          `Failed to fetch games from Steam API: ${steamResponse.status} ${steamResponse.statusText}`,
        );
      }

      const steamData = await steamResponse.json();
      const games = steamData.response.games || [];

      // Group related games and sum their playtime
      return groupRelatedGames(games);
    } catch (error) {
      console.error('Error fetching Steam games:', error);
      throw error;
    }
  }

  /**
   * Fetch paginated and sorted games owned by a Steam user
   * @param steamId The Steam ID or vanity URL
   * @param page The page number (1-based)
   * @param pageSize The number of games per page
   * @param sortField The field to sort by
   * @param sortDirection The direction to sort
   * @returns Paginated games with total count and page info
   */
  async getPaginatedGames(
    steamId: string,
    page: number,
    pageSize: number,
    sortField: 'name' | 'playtime_forever',
    sortDirection: 'asc' | 'desc',
  ): Promise<{
    games: SteamGame[];
    totalGames: number;
    currentPage: number;
    totalPages: number;
  }> {
    // Fetch all games (already grouped)
    const allGames = await this.getOwnedGames(steamId);

    // Sort games based on the requested sort field and direction
    const sortedGames = [...allGames].sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        // Handle undefined or null playtime values
        const playtimeA = a.playtime_forever ?? 0;
        const playtimeB = b.playtime_forever ?? 0;
        return sortDirection === 'asc'
          ? playtimeA - playtimeB
          : playtimeB - playtimeA;
      }
    });

    // Calculate pagination
    const totalGames = sortedGames.length;
    const totalPages = Math.ceil(totalGames / pageSize);

    // Special case: page 0 means "all games"
    if (page === 0) {
      return {
        games: sortedGames,
        totalGames,
        currentPage: 1,
        totalPages,
      };
    }

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalGames);

    // Get the current page of games
    const paginatedGames = sortedGames.slice(startIndex, endIndex);

    return {
      games: paginatedGames,
      totalGames,
      currentPage: page,
      totalPages,
    };
  }
}
