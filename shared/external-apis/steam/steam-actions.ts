'use server';

import { SteamClient } from '@/shared/external-apis/steam/client';

// Create a singleton instance of the Steam client
const steamClient = new SteamClient();

/**
 * Get a reference to the Steam client
 * @returns The Steam client instance
 */
export async function getSteamClient() {
  return steamClient;
}

/**
 * Resolve a Steam vanity URL to a Steam64 ID
 * @param steamId The Steam ID or vanity URL
 * @returns The Steam64 ID
 */
export async function resolveSteamId(steamId: string) {
  return steamClient.resolveSteamId(steamId);
}

/**
 * Fetch all games owned by a Steam user
 * @param steamId The Steam ID or vanity URL
 * @returns Array of Steam games
 */
export async function getOwnedGames(steamId: string) {
  return steamClient.getOwnedGames(steamId);
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
export async function getPaginatedGames(
  steamId: string,
  page: number,
  pageSize: number,
  sortField: 'name' | 'playtime_forever',
  sortDirection: 'asc' | 'desc',
) {
  return steamClient.getPaginatedGames(
    steamId,
    page,
    pageSize,
    sortField,
    sortDirection,
  );
}
