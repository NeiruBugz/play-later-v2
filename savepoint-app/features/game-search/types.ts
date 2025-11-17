export interface SearchGameResult {
  id: number;
  name: string;
  slug: string;
  game_type: number;
  cover?: {
    image_id: string;
  };
  platforms?: Array<{
    name: string;
  }>;
  first_release_date?: number;
}
export interface GameSearchResponse {
  games: SearchGameResult[];
  count: number;
}
