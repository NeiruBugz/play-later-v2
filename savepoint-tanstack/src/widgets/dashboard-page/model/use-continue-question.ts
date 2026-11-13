import { useState } from "react";

import { isUpcomingRelease, type CalendarDay } from "@/entities/game";
import type { DashboardPageData } from "@/features/dashboard";

type PlayingGame = DashboardPageData["playing"][number];
type QueuedGame = DashboardPageData["upNextQueue"][number];

export type ContinueQuestionItem = PlayingGame | QueuedGame;
export type ContinueQuestionKind = "continue" | "start" | "replay" | "rest";

export type UseContinueQuestionArgs = {
  playing: PlayingGame[];
  upNextQueue: QueuedGame[];
  today: CalendarDay;
};

export type ContinueQuestion = {
  kind: ContinueQuestionKind;
  item: ContinueQuestionItem | null;
  notTonight: () => void;
  askAgain: () => void;
  focus: (itemId: number) => void;
};

export function useContinueQuestion({
  playing,
  upNextQueue,
  today,
}: UseContinueQuestionArgs): ContinueQuestion {
  const [skippedIds, setSkippedIds] = useState<number[]>([]);
  const [focusId, setFocusId] = useState<number | null>(null);

  const queueHead =
    upNextQueue.find((queued) => !isUpcomingRelease(queued.game, today)) ??
    null;
  const candidates: ContinueQuestionItem[] = queueHead
    ? [...playing, queueHead]
    : playing;

  const focused =
    focusId === null
      ? null
      : (candidates.find((candidate) => candidate.id === focusId) ?? null);
  const item =
    focused ??
    candidates.find((candidate) => !skippedIds.includes(candidate.id)) ??
    null;

  const kind = resolveKind(item, playing);

  return {
    kind,
    item,
    notTonight: () => {
      if (item) setSkippedIds((ids) => [...ids, item.id]);
      setFocusId(null);
    },
    askAgain: () => {
      setSkippedIds([]);
      setFocusId(null);
    },
    focus: setFocusId,
  };
}

function resolveKind(
  item: ContinueQuestionItem | null,
  playing: PlayingGame[]
): ContinueQuestionKind {
  if (!item) return "rest";
  if (playing.some((game) => game.id === item.id)) return "continue";
  return item.status === "DONE" ? "replay" : "start";
}
