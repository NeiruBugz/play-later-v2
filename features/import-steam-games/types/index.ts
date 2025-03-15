import type { SteamGame as SteamApiGame } from '@/shared/external-apis/steam';

export type SortField = 'name' | 'playtime_forever';
export type SortDirection = 'asc' | 'desc';

export interface SteamGame extends SteamApiGame {
  alreadyInBacklog: boolean;
  relatedGames?: SteamApiGame[];
}
