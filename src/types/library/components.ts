import type { Game } from "@prisma/client";

import { PickerItem } from "@/src/types/library/actions";

export interface PickerControlsProps {
  hasChoice: boolean;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
}

export interface PickerChoiceProps {
  afterClick: () => void;
  choice: PickerItem;
  isRunning: boolean;
}

export interface PickerProps {
  closeDialog: () => void;
  items: PickerItem[];
}

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

export type FilterKeys =
  | "order"
  | "platform"
  | "purchaseType"
  | "search"
  | "sortBy"
  | "status";
