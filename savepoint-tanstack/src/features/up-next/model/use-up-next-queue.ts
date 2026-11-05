import { useRouter } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";

import { moveInUpNextFn } from "../api/move-in-up-next-fn";

export type UpNextQueueItem = {
  id: number;
  game: { title: string };
};

type MoveTarget = { direction: "up" | "down" } | { toPosition: number };

type OrderOverride = {
  base: readonly unknown[];
  ids: readonly number[];
};

export type UseUpNextQueueResult<T extends UpNextQueueItem> = {
  items: T[];
  isMoving: boolean;
  announcement: string;
  moveUp: (id: number) => Promise<void>;
  moveDown: (id: number) => Promise<void>;
  moveTo: (id: number, toPosition: number) => Promise<void>;
};

function applyOrder<T extends UpNextQueueItem>(
  items: readonly T[],
  ids: readonly number[]
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = ids.flatMap((id) => byId.get(id) ?? []);
  const placed = new Set(ids);
  return [...ordered, ...items.filter((item) => !placed.has(item.id))];
}

function moveId(ids: readonly number[], from: number, to: number): number[] {
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as number);
  return next;
}

/**
 * Optimistic reorder of the Up Next queue. Moves are serialized: while one is
 * in flight further moves are ignored and `isMoving` lets the UI disable its
 * controls. The list is replaced with the server's ordered response;
 * `router.invalidate()` runs only after a successful move.
 */
export function useUpNextQueue<T extends UpNextQueueItem>(
  initialItems: readonly T[]
): UseUpNextQueueResult<T> {
  const router = useRouter();
  const [override, setOverride] = useState<OrderOverride | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const inFlight = useRef(false);

  const activeOverride = override?.base === initialItems ? override : null;
  const items = useMemo(
    () =>
      activeOverride
        ? applyOrder(initialItems, activeOverride.ids)
        : [...initialItems],
    [initialItems, activeOverride]
  );

  const move = async (
    id: number,
    target: MoveTarget,
    optimisticIds: readonly number[]
  ) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsMoving(true);
    const rollbackTo = activeOverride;
    setOverride({ base: initialItems, ids: optimisticIds });

    let moved = false;
    try {
      const queue = await moveInUpNextFn({ data: { id, ...target } });
      const ids = [...queue]
        .sort((a, b) => a.position - b.position)
        .map((entry) => entry.id);
      setOverride({ base: initialItems, ids });
      const position = queue.find((entry) => entry.id === id)?.position;
      const title = initialItems.find((item) => item.id === id)?.game.title;
      if (position !== undefined && title !== undefined) {
        setAnnouncement(`${title} is now #${position}`);
      }
      moved = true;
    } catch (error) {
      setOverride(rollbackTo);
      toast.error(getUserFacingErrorMessage(error));
    } finally {
      inFlight.current = false;
      setIsMoving(false);
    }

    if (!moved) return;
    try {
      await router.invalidate();
    } catch {
      // The move is already saved and shown; a failed refresh keeps this view.
    }
  };

  const moveBy = (id: number, offset: -1 | 1) => {
    const ids = items.map((item) => item.id);
    const from = ids.indexOf(id);
    const to = from + offset;
    if (from === -1 || to < 0 || to >= ids.length) return Promise.resolve();
    return move(
      id,
      { direction: offset === -1 ? "up" : "down" },
      moveId(ids, from, to)
    );
  };

  const moveTo = (id: number, toPosition: number) => {
    const ids = items.map((item) => item.id);
    const from = ids.indexOf(id);
    const to = toPosition - 1;
    if (from === -1 || to === from || to < 0 || to >= ids.length) {
      return Promise.resolve();
    }
    return move(id, { toPosition }, moveId(ids, from, to));
  };

  return {
    items,
    isMoving,
    announcement,
    moveUp: (id) => moveBy(id, -1),
    moveDown: (id) => moveBy(id, 1),
    moveTo,
  };
}
