import type { ReactNode } from "react";

import type { UpNextQueueItem } from "../../model/use-up-next-queue";

export type UpNextQueueListProps<T extends UpNextQueueItem> = {
  items: readonly T[];
  /** Row body for one queued game; the list adds the number and move controls. */
  renderItem: (item: T) => ReactNode;
};

export type UpNextQueueRowData = {
  id: number;
  title: string;
  body: ReactNode;
};

export type UpNextQueueViewProps = {
  rows: readonly UpNextQueueRowData[];
  isMoving: boolean;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  onMoveTo: (id: number, toPosition: number) => void;
};
