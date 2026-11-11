import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DashboardPageData } from "@/features/dashboard";

import { buildLibraryItemWithGame } from "../../../../test/factories/builders.ts";
import { useContinueQuestion } from "./use-continue-question";

type Playing = DashboardPageData["playing"][number];
type Queued = DashboardPageData["upNextQueue"][number];

function playing(id: number, title: string): Playing {
  return {
    ...buildLibraryItemWithGame(
      { id, status: "PLAYING" },
      { id: `game-${id}`, title }
    ),
    lastSessionAt: null,
    becamePlayingAt: null,
  };
}

function queued(
  id: number,
  title: string,
  status: "WANT" | "DONE" = "WANT"
): Queued {
  return buildLibraryItemWithGame(
    { id, status, upNextPosition: 1 },
    { id: `game-${id}`, title }
  );
}

type Lists = { playing: Playing[]; upNextQueue: Queued[] };

function setup(initial: Lists) {
  return renderHook((lists: Lists) => useContinueQuestion(lists), {
    initialProps: initial,
  });
}

const titleOf = (question: { item: { game: { title: string } } | null }) =>
  question.item?.game.title;

describe("useContinueQuestion", () => {
  describe("given two Playing games and a queued Want game", () => {
    const lists: Lists = {
      playing: [playing(1, "Hades"), playing(2, "Celeste")],
      upNextQueue: [queued(3, "Tunic")],
    };

    it("starts by continuing the first Playing game", () => {
      const { result } = setup(lists);

      expect(result.current.kind).toBe("continue");
      expect(titleOf(result.current)).toBe("Hades");
    });

    it("walks through Playing games, then the queue head, then rests", () => {
      const { result } = setup(lists);

      act(() => result.current.notTonight());
      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "continue",
        "Celeste",
      ]);

      act(() => result.current.notTonight());
      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "start",
        "Tunic",
      ]);

      act(() => result.current.notTonight());
      expect(result.current.kind).toBe("rest");
    });

    it("returns to the first game when asked again", () => {
      const { result } = setup(lists);
      act(() => result.current.notTonight());
      act(() => result.current.notTonight());
      act(() => result.current.notTonight());

      act(() => result.current.askAgain());

      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "continue",
        "Hades",
      ]);
    });

    it("keeps asking about a focused game after the data reloads and reorders", () => {
      const { result, rerender } = setup(lists);
      act(() => result.current.notTonight());
      act(() => result.current.focus(2));

      rerender({
        playing: [playing(2, "Celeste"), playing(1, "Hades")],
        upNextQueue: lists.upNextQueue,
      });

      expect(titleOf(result.current)).toBe("Celeste");
    });

    it("forgets focus once the focused game is no longer Playing", () => {
      const { result, rerender } = setup(lists);
      act(() => result.current.focus(2));

      rerender({
        playing: [playing(1, "Hades")],
        upNextQueue: lists.upNextQueue,
      });

      expect(titleOf(result.current)).toBe("Hades");
    });
  });

  describe("given only a Done game first in the queue", () => {
    it("asks to replay it", () => {
      const { result } = setup({
        playing: [],
        upNextQueue: [queued(4, "Journey", "DONE")],
      });

      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "replay",
        "Journey",
      ]);
    });
  });

  describe("given a game just started from the queue", () => {
    it("asks about the same game once it shows up as Playing", () => {
      const { result, rerender } = setup({
        playing: [playing(1, "Hades")],
        upNextQueue: [queued(3, "Tunic")],
      });
      act(() => result.current.focus(3));

      rerender({
        playing: [playing(1, "Hades"), playing(3, "Tunic")],
        upNextQueue: [],
      });

      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "continue",
        "Tunic",
      ]);
    });
  });
});
