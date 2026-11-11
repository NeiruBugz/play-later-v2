import { describe, expect, it } from "vitest";

import { orderContinueGames } from "./order-continue-games";

type Candidate = {
  game: { title: string };
  lastSessionAt: Date | null;
  becamePlayingAt: Date | null;
};

function candidate(
  title: string,
  lastSessionAt: string | null,
  becamePlayingAt: string | null
): Candidate {
  return {
    game: { title },
    lastSessionAt: lastSessionAt ? new Date(lastSessionAt) : null,
    becamePlayingAt: becamePlayingAt ? new Date(becamePlayingAt) : null,
  };
}

const titlesOf = (items: Candidate[]) => items.map((i) => i.game.title);

describe("orderContinueGames", () => {
  describe("given games with sessions", () => {
    it("puts the most recently played first", () => {
      const ordered = orderContinueGames([
        candidate("Old", "2026-01-01T10:00:00Z", "2025-01-01T00:00:00Z"),
        candidate("Newest", "2026-05-01T10:00:00Z", "2025-01-01T00:00:00Z"),
        candidate("Middle", "2026-03-01T10:00:00Z", "2025-01-01T00:00:00Z"),
      ]);

      expect(titlesOf(ordered)).toEqual(["Newest", "Middle", "Old"]);
    });

    it("ranks by session date, not by when the game became Playing", () => {
      const ordered = orderContinueGames([
        candidate(
          "Started late",
          "2026-01-01T10:00:00Z",
          "2026-04-01T00:00:00Z"
        ),
        candidate(
          "Started early",
          "2026-02-01T10:00:00Z",
          "2025-01-01T00:00:00Z"
        ),
      ]);

      expect(titlesOf(ordered)).toEqual(["Started early", "Started late"]);
    });
  });

  describe("given a game without sessions", () => {
    it("counts from the date it became Playing", () => {
      const ordered = orderContinueGames([
        candidate("Session", "2026-02-01T10:00:00Z", "2025-01-01T00:00:00Z"),
        candidate("No session, newer", null, "2026-03-01T00:00:00Z"),
        candidate("No session, older", null, "2026-01-01T00:00:00Z"),
      ]);

      expect(titlesOf(ordered)).toEqual([
        "No session, newer",
        "Session",
        "No session, older",
      ]);
    });
  });

  describe("given equal recency", () => {
    it("prefers the game that became Playing more recently", () => {
      const ordered = orderContinueGames([
        candidate(
          "Became earlier",
          "2026-02-01T10:00:00Z",
          "2026-01-01T00:00:00Z"
        ),
        candidate(
          "Became later",
          "2026-02-01T10:00:00Z",
          "2026-01-15T00:00:00Z"
        ),
      ]);

      expect(titlesOf(ordered)).toEqual(["Became later", "Became earlier"]);
    });

    it("falls back to the title when both dates match", () => {
      const ordered = orderContinueGames([
        candidate("Zelda", "2026-02-01T10:00:00Z", "2026-01-01T00:00:00Z"),
        candidate("Alan Wake", "2026-02-01T10:00:00Z", "2026-01-01T00:00:00Z"),
        candidate("Hades", "2026-02-01T10:00:00Z", "2026-01-01T00:00:00Z"),
      ]);

      expect(titlesOf(ordered)).toEqual(["Alan Wake", "Hades", "Zelda"]);
    });
  });

  it("returns an empty list for no games", () => {
    expect(orderContinueGames([])).toEqual([]);
  });

  it("does not reorder the list it was given", () => {
    const input = [
      candidate("Old", "2026-01-01T10:00:00Z", "2025-01-01T00:00:00Z"),
      candidate("New", "2026-05-01T10:00:00Z", "2025-01-01T00:00:00Z"),
    ];

    orderContinueGames(input);

    expect(titlesOf(input)).toEqual(["Old", "New"]);
  });
});
