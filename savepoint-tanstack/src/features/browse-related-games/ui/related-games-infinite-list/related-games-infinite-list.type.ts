import type { RelatedGame } from "../../api";

export interface RelatedGamesPage {
  games: RelatedGame[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface RelatedGamesInfiniteListProps {
  collectionId: number;
  pageSize: number;
  firstPage: RelatedGamesPage;
}
