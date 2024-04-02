import { Game } from "@prisma/client";

export type LibraryPageProps = {
  searchParams: URLSearchParams;
};

export type LibraryContentProps = {
  list: Game[];
  currentStatus: string;
  totalBacklogTime: number;
  backloggedLength: number;
};

export type LibraryHeaderProps = {
  currentStatus: string;
  backlogged: Game[];
};

export type GamesByYear = Map<number, Game[]>;

export type LibraryData = {
  list: Game[];
  currentStatus: string;
  totalBacklogTime: number;
  backlogged: Game[];
};

export type FilterKeys = "platform" | "sortBy" | "order" | "search";
