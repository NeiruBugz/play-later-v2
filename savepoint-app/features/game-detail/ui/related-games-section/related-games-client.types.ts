export interface RelatedGame {
  id: number;
  name: string;
  slug: string;
  cover?: { image_id: string };
}

export interface FranchiseWithGames {
  franchiseId: number;
  franchiseName: string;
  games: RelatedGame[];
  hasMore: boolean;
  totalCount: number;
}

export interface RelatedGamesClientProps {
  igdbId: number;
  franchises: FranchiseWithGames[];
}

export interface GameGridProps {
  franchiseId: number;
  games: RelatedGame[];
  hasMore: boolean;
  onLoadMore: () => void;
  isPending: boolean;
}

export interface GameCardProps {
  game: RelatedGame;
}
