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

type Release = Pick<Queued["game"], "releaseDate" | "releaseDatePrecision">;

const TODAY = "2026-11-12";

const utcDay = (isoDay: string) => new Date(`${isoDay}T00:00:00.000Z`);

const exactDay = (isoDay: string): Release => ({
  releaseDate: utcDay(isoDay),
  releaseDatePrecision: "DAY",
});

const release = {
  exactDateAhead: exactDay("2026-12-01"),
  exactDateToday: exactDay(TODAY),
  exactDateYesterday: exactDay("2026-11-11"),
  exactDateLongAgo: exactDay("2025-06-02"),
  tba: { releaseDate: null, releaseDatePrecision: "TBA" } as Release,
  noDate: { releaseDate: null, releaseDatePrecision: null } as Release,
  legacyDateWithoutPrecision: {
    releaseDate: utcDay("2027-12-31"),
    releaseDatePrecision: null,
  } as Release,
};

const periodReleases = [
  {
    precision: "month",
    notOverYet: {
      releaseDate: utcDay("2026-11-01"),
      releaseDatePrecision: "MONTH",
    } as Release,
    over: {
      releaseDate: utcDay("2026-10-01"),
      releaseDatePrecision: "MONTH",
    } as Release,
  },
  {
    precision: "quarter",
    notOverYet: {
      releaseDate: utcDay("2026-10-01"),
      releaseDatePrecision: "QUARTER",
    } as Release,
    over: {
      releaseDate: utcDay("2026-07-01"),
      releaseDatePrecision: "QUARTER",
    } as Release,
  },
  {
    precision: "year",
    notOverYet: {
      releaseDate: utcDay("2026-01-01"),
      releaseDatePrecision: "YEAR",
    } as Release,
    over: {
      releaseDate: utcDay("2025-01-01"),
      releaseDatePrecision: "YEAR",
    } as Release,
  },
];

function queuedWithRelease(id: number, title: string, when: Release): Queued {
  return buildLibraryItemWithGame(
    { id, status: "WANT", upNextPosition: id },
    { id: `game-${id}`, title, ...when }
  );
}

function playingWithRelease(id: number, title: string, when: Release): Playing {
  return {
    ...buildLibraryItemWithGame(
      { id, status: "PLAYING" },
      { id: `game-${id}`, title, ...when }
    ),
    lastSessionAt: null,
    becamePlayingAt: null,
  };
}

type Lists = { playing: Playing[]; upNextQueue: Queued[] };

function setup(initial: Lists) {
  return renderHook(
    (lists: Lists) => useContinueQuestion({ ...lists, today: TODAY }),
    { initialProps: initial }
  );
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

  describe("given nothing is Playing and an upcoming game is first in Up Next", () => {
    const lists: Lists = {
      playing: [],
      upNextQueue: [
        queuedWithRelease(1, "Not Out Yet", release.exactDateAhead),
        queuedWithRelease(2, "Already Out", release.exactDateLongAgo),
      ],
    };

    it("offers to start the released game behind it", () => {
      const { result } = setup(lists);

      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "start",
        "Already Out",
      ]);
    });

    it("leaves the Up Next queue in its original order", () => {
      const queueTitlesBefore = lists.upNextQueue.map(
        (queuedGame) => queuedGame.game.title
      );

      setup(lists);

      expect(
        lists.upNextQueue.map((queuedGame) => queuedGame.game.title)
      ).toEqual(queueTitlesBefore);
    });
  });

  describe("given nothing is Playing and every Up Next game is upcoming", () => {
    it("rests without offering a game", () => {
      const { result } = setup({
        playing: [],
        upNextQueue: [
          queuedWithRelease(1, "Dated Ahead", release.exactDateAhead),
          queuedWithRelease(2, "To Be Announced", release.tba),
          queuedWithRelease(3, "Due Today", release.exactDateToday),
        ],
      });

      expect(result.current.kind).toBe("rest");
      expect(result.current.item).toBeNull();
    });
  });

  describe("given nothing is Playing and a TBA game is first in Up Next", () => {
    it("does not offer the TBA game", () => {
      const { result } = setup({
        playing: [],
        upNextQueue: [
          queuedWithRelease(1, "To Be Announced", release.tba),
          queuedWithRelease(2, "Already Out", release.exactDateLongAgo),
        ],
      });

      expect(titleOf(result.current)).toBe("Already Out");
    });
  });

  describe.each(periodReleases)(
    "given a $precision-dated game first in Up Next",
    ({ notOverYet, over }) => {
      it("skips it while its period is not over", () => {
        const { result } = setup({
          playing: [],
          upNextQueue: [
            queuedWithRelease(1, "Period Running", notOverYet),
            queuedWithRelease(2, "Already Out", release.exactDateLongAgo),
          ],
        });

        expect(titleOf(result.current)).toBe("Already Out");
      });

      it("offers it once its period is over", () => {
        const { result } = setup({
          playing: [],
          upNextQueue: [
            queuedWithRelease(1, "Period Over", over),
            queuedWithRelease(2, "Already Out", release.exactDateLongAgo),
          ],
        });

        expect([result.current.kind, titleOf(result.current)]).toEqual([
          "start",
          "Period Over",
        ]);
      });
    }
  );

  describe("given the first Up Next game came out yesterday", () => {
    it("offers to start it", () => {
      const { result } = setup({
        playing: [],
        upNextQueue: [
          queuedWithRelease(1, "Out Yesterday", release.exactDateYesterday),
        ],
      });

      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "start",
        "Out Yesterday",
      ]);
    });
  });

  describe("given the first Up Next game comes out today", () => {
    it("skips it because it is not out until the day is over", () => {
      const { result } = setup({
        playing: [],
        upNextQueue: [
          queuedWithRelease(1, "Due Today", release.exactDateToday),
          queuedWithRelease(2, "Already Out", release.exactDateLongAgo),
        ],
      });

      expect(titleOf(result.current)).toBe("Already Out");
    });
  });

  describe("given Up Next games without a release date or precision", () => {
    it("offers a game with no date", () => {
      const { result } = setup({
        playing: [],
        upNextQueue: [queuedWithRelease(1, "No Date", release.noDate)],
      });

      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "start",
        "No Date",
      ]);
    });

    it("offers a legacy game whose date has no precision", () => {
      const { result } = setup({
        playing: [],
        upNextQueue: [
          queuedWithRelease(
            1,
            "Legacy Date",
            release.legacyDateWithoutPrecision
          ),
        ],
      });

      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "start",
        "Legacy Date",
      ]);
    });
  });

  describe("given a Playing game that is not out yet", () => {
    const lists: Lists = {
      playing: [
        playingWithRelease(1, "Early Access", release.exactDateAhead),
        playingWithRelease(2, "Announced Later", release.tba),
      ],
      upNextQueue: [],
    };

    it("still asks to continue it", () => {
      const { result } = setup(lists);

      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "continue",
        "Early Access",
      ]);
    });

    it("still walks through every Playing game before resting", () => {
      const { result } = setup(lists);

      act(() => result.current.notTonight());
      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "continue",
        "Announced Later",
      ]);

      act(() => result.current.notTonight());
      expect(result.current.kind).toBe("rest");
    });
  });

  describe("given Not tonight is tapped with upcoming games mixed into Up Next", () => {
    const lists: Lists = {
      playing: [playingWithRelease(1, "Hades", release.exactDateLongAgo)],
      upNextQueue: [
        queuedWithRelease(2, "Upcoming One", release.exactDateAhead),
        queuedWithRelease(3, "Already Out", release.exactDateLongAgo),
        queuedWithRelease(4, "Upcoming Two", release.tba),
      ],
    };

    it("moves from the Playing game to the released game, then rests", () => {
      const { result } = setup(lists);
      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "continue",
        "Hades",
      ]);

      act(() => result.current.notTonight());
      expect([result.current.kind, titleOf(result.current)]).toEqual([
        "start",
        "Already Out",
      ]);

      act(() => result.current.notTonight());
      expect(result.current.kind).toBe("rest");
    });
  });
});
