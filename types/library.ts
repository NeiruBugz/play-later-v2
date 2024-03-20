import { Game } from "@prisma/client";

export type LibraryPageProps = {
  params: {};
  searchParams: URLSearchParams;
};

export type LibraryContentProps = {
  list: Game[] | GamesByYear;
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
  list: Game[] | GamesByYear;
  currentStatus: string;
  totalBacklogTime: number;
  backlogged: Game[];
};
