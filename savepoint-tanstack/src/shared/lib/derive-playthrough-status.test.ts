/**
 * Unit tests for deriveLibraryStatus and deriveHasBeenPlayed.
 * Pure functions — no Prisma mock needed.
 */

import { describe, expect, it } from "vitest";

import {
  deriveHasBeenPlayed,
  deriveLibraryStatus,
} from "./derive-playthrough-status";

describe("deriveLibraryStatus", () => {
  describe("given zero runs with a stored run-derived status (PLAYED or PLAYING)", () => {
    it("resets PLAYED to SHELF (neutral pre-play default)", () => {
      expect(deriveLibraryStatus([], "PLAYED")).toBe("SHELF");
    });

    it("resets PLAYING to SHELF (neutral pre-play default)", () => {
      expect(deriveLibraryStatus([], "PLAYING")).toBe("SHELF");
    });
  });

  describe("given zero runs with a stored pre-play status", () => {
    it("preserves WISHLIST", () => {
      expect(deriveLibraryStatus([], "WISHLIST")).toBe("WISHLIST");
    });

    it("preserves SHELF", () => {
      expect(deriveLibraryStatus([], "SHELF")).toBe("SHELF");
    });

    it("preserves UP_NEXT", () => {
      expect(deriveLibraryStatus([], "UP_NEXT")).toBe("UP_NEXT");
    });
  });

  describe("given runs including a PLAYING run", () => {
    it("returns PLAYING regardless of stored status", () => {
      expect(
        deriveLibraryStatus(
          [{ status: "PLAYING" }, { status: "FINISHED" }],
          "SHELF"
        )
      ).toBe("PLAYING");
    });
  });

  describe("given runs with no PLAYING run (all FINISHED or ABANDONED)", () => {
    it("returns PLAYED when all runs are FINISHED", () => {
      expect(deriveLibraryStatus([{ status: "FINISHED" }], "SHELF")).toBe(
        "PLAYED"
      );
    });

    it("returns PLAYED when all runs are ABANDONED (spec §2.8 abandoned-only → PLAYED)", () => {
      expect(
        deriveLibraryStatus(
          [{ status: "ABANDONED" }, { status: "ABANDONED" }],
          "SHELF"
        )
      ).toBe("PLAYED");
    });
  });
});

describe("deriveHasBeenPlayed", () => {
  it("returns false for an empty run list", () => {
    expect(deriveHasBeenPlayed([])).toBe(false);
  });

  it("returns false when all runs are PLAYING", () => {
    expect(deriveHasBeenPlayed([{ status: "PLAYING" }])).toBe(false);
  });

  it("returns true when at least one run is FINISHED", () => {
    expect(
      deriveHasBeenPlayed([{ status: "PLAYING" }, { status: "FINISHED" }])
    ).toBe(true);
  });

  it("returns true when at least one run is ABANDONED", () => {
    expect(deriveHasBeenPlayed([{ status: "ABANDONED" }])).toBe(true);
  });
});
