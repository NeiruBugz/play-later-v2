export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
  img_logo_url?: string;
}

export interface SteamClientInterface {
  /**
   * Resolve a Steam vanity URL to a Steam64 ID
   * @param steamId The Steam ID or vanity URL
   * @returns The Steam64 ID
   */
  resolveSteamId(steamId: string): Promise<string>;

  /**
   * Fetch all games owned by a Steam user
   * @param steamId The Steam ID or vanity URL
   * @returns Array of Steam games
   */
  getOwnedGames(steamId: string): Promise<SteamGame[]>;

  /**
   * Fetch paginated and sorted games owned by a Steam user
   * @param steamId The Steam ID or vanity URL
   * @param page The page number (1-based)
   * @param pageSize The number of games per page
   * @param sortField The field to sort by
   * @param sortDirection The direction to sort
   * @returns Paginated games with total count and page info
   */
  getPaginatedGames(
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
  }>;
}
