import type { SearchResponse } from "@/shared/types";

export type AddGameFormProps = {
  game: SearchResponse;
  onCancel: () => void;
};

export type GameSearchResultCardProps = {
  game: SearchResponse;
  onSelect: () => void;
};

export type GameSearchResultsProps = {
  games: SearchResponse[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  query: string;
  onGameSelect: (game: SearchResponse) => void;
};
