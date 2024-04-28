import { Game } from "@prisma/client";

export type LibraryPageProps = {
  searchParams: URLSearchParams;
};

export type LibraryContentProps = {
  backloggedLength: number;
  currentStatus: string;
  list: Game[];
  totalBacklogTime: number;
};

export type LibraryHeaderProps = {
  backlogged: Game[];
  currentStatus: string;
};

export type LibraryData = {
  backlogged: Game[];
  currentStatus: string;
  list: Game[];
  totalBacklogTime: number;
};

export type FilterKeys =
  | "order"
  | "platform"
  | "purchaseType"
  | "search"
  | "sortBy";
