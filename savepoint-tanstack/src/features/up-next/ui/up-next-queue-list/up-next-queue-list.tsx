import { lazy, Suspense } from "react";

import { useIsDesktop } from "@/shared/lib/use-media-query";

import {
  useUpNextQueue,
  type UpNextQueueItem,
} from "../../model/use-up-next-queue";
import type {
  UpNextQueueListProps,
  UpNextQueueViewProps,
} from "./up-next-queue-list.type";
import { UpNextQueueRow } from "./up-next-queue-row";

const SortableUpNextQueue = lazy(() => import("./sortable-up-next-queue"));

function PlainUpNextQueue({
  rows,
  isMoving,
  onMoveUp,
  onMoveDown,
}: UpNextQueueViewProps) {
  return (
    <ol aria-label="Up Next queue" className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <li key={row.id} className="flex items-center gap-3">
          <UpNextQueueRow
            title={row.title}
            number={index + 1}
            isFirst={index === 0}
            isLast={index === rows.length - 1}
            disabled={isMoving}
            onMoveUp={() => onMoveUp(row.id)}
            onMoveDown={() => onMoveDown(row.id)}
          >
            {row.body}
          </UpNextQueueRow>
        </li>
      ))}
    </ol>
  );
}

export function UpNextQueueList<T extends UpNextQueueItem>({
  items: initialItems,
  renderItem,
}: UpNextQueueListProps<T>) {
  const { items, isMoving, announcement, moveUp, moveDown, moveTo } =
    useUpNextQueue(initialItems);
  const isDesktop = useIsDesktop();

  const view: UpNextQueueViewProps = {
    rows: items.map((item) => ({
      id: item.id,
      title: item.game.title,
      body: renderItem(item),
    })),
    isMoving,
    onMoveUp: (id) => void moveUp(id),
    onMoveDown: (id) => void moveDown(id),
    onMoveTo: (id, toPosition) => void moveTo(id, toPosition),
  };

  return (
    <div>
      {isDesktop ? (
        <Suspense fallback={<PlainUpNextQueue {...view} />}>
          <SortableUpNextQueue {...view} />
        </Suspense>
      ) : (
        <PlainUpNextQueue {...view} />
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
