import { describe, expect, it } from "vitest";

import type {
  LibraryItemStatus,
  PlaythroughStatus,
} from "../../../../shared/lib/prisma/client.ts";
import { deriveHasBeenPlayed, deriveLibraryStatus } from "./derive-status";

type Run = { status: PlaythroughStatus };

describe("deriveLibraryStatus", () => {
  describe("given no runs (empty array)", () => {
    it("returns WISHLIST when manualPrePlay is WISHLIST", () => {
      expect(deriveLibraryStatus([], "WISHLIST")).toBe<LibraryItemStatus>(
        "WISHLIST"
      );
    });

    it("returns SHELF when manualPrePlay is SHELF", () => {
      expect(deriveLibraryStatus([], "SHELF")).toBe<LibraryItemStatus>("SHELF");
    });

    it("returns UP_NEXT when manualPrePlay is UP_NEXT", () => {
      expect(deriveLibraryStatus([], "UP_NEXT")).toBe<LibraryItemStatus>(
        "UP_NEXT"
      );
    });
  });

  describe("given runs that include at least one PLAYING run", () => {
    it("returns PLAYING when the only run is PLAYING", () => {
      const runs: Run[] = [{ status: "PLAYING" }];
      expect(deriveLibraryStatus(runs, "WISHLIST")).toBe<LibraryItemStatus>(
        "PLAYING"
      );
    });

    it("returns PLAYING when PLAYING is mixed with FINISHED", () => {
      const runs: Run[] = [
        { status: "FINISHED" },
        { status: "PLAYING" },
        { status: "FINISHED" },
      ];
      expect(deriveLibraryStatus(runs, "PLAYED")).toBe<LibraryItemStatus>(
        "PLAYING"
      );
    });

    it("returns PLAYING when PLAYING is mixed with FINISHED and ABANDONED", () => {
      const runs: Run[] = [
        { status: "FINISHED" },
        { status: "ABANDONED" },
        { status: "PLAYING" },
      ];
      expect(deriveLibraryStatus(runs, "SHELF")).toBe<LibraryItemStatus>(
        "PLAYING"
      );
    });
  });

  describe("given runs with no PLAYING run but at least one FINISHED run", () => {
    it("returns PLAYED when the only run is FINISHED", () => {
      const runs: Run[] = [{ status: "FINISHED" }];
      expect(deriveLibraryStatus(runs, "WISHLIST")).toBe<LibraryItemStatus>(
        "PLAYED"
      );
    });

    it("returns PLAYED when multiple FINISHED runs exist", () => {
      const runs: Run[] = [{ status: "FINISHED" }, { status: "FINISHED" }];
      expect(deriveLibraryStatus(runs, "UP_NEXT")).toBe<LibraryItemStatus>(
        "PLAYED"
      );
    });
  });

  describe("given runs that are all ABANDONED", () => {
    it("returns PLAYED when the only run is ABANDONED", () => {
      const runs: Run[] = [{ status: "ABANDONED" }];
      expect(deriveLibraryStatus(runs, "WISHLIST")).toBe<LibraryItemStatus>(
        "PLAYED"
      );
    });

    it("returns PLAYED when multiple ABANDONED runs exist", () => {
      const runs: Run[] = [{ status: "ABANDONED" }, { status: "ABANDONED" }];
      expect(deriveLibraryStatus(runs, "UP_NEXT")).toBe<LibraryItemStatus>(
        "PLAYED"
      );
    });
  });

  describe("given runs with mixed FINISHED and ABANDONED (no PLAYING)", () => {
    it("returns PLAYED", () => {
      const runs: Run[] = [
        { status: "FINISHED" },
        { status: "ABANDONED" },
        { status: "FINISHED" },
      ];
      expect(deriveLibraryStatus(runs, "SHELF")).toBe<LibraryItemStatus>(
        "PLAYED"
      );
    });
  });
});

describe("deriveHasBeenPlayed", () => {
  it("returns false for an empty run list", () => {
    expect(deriveHasBeenPlayed([])).toBe(false);
  });

  it("returns false when the only run is PLAYING", () => {
    expect(deriveHasBeenPlayed([{ status: "PLAYING" }])).toBe(false);
  });

  it("returns false when all runs are PLAYING", () => {
    expect(
      deriveHasBeenPlayed([{ status: "PLAYING" }, { status: "PLAYING" }])
    ).toBe(false);
  });

  it("returns true when the only run is FINISHED", () => {
    expect(deriveHasBeenPlayed([{ status: "FINISHED" }])).toBe(true);
  });

  it("returns true when the only run is ABANDONED", () => {
    expect(deriveHasBeenPlayed([{ status: "ABANDONED" }])).toBe(true);
  });

  it("returns true when runs contain a mix of FINISHED and PLAYING", () => {
    expect(
      deriveHasBeenPlayed([{ status: "PLAYING" }, { status: "FINISHED" }])
    ).toBe(true);
  });

  it("returns true when runs contain a mix of ABANDONED and PLAYING", () => {
    expect(
      deriveHasBeenPlayed([{ status: "PLAYING" }, { status: "ABANDONED" }])
    ).toBe(true);
  });

  it("returns true when runs contain FINISHED, ABANDONED, and PLAYING", () => {
    expect(
      deriveHasBeenPlayed([
        { status: "FINISHED" },
        { status: "ABANDONED" },
        { status: "PLAYING" },
      ])
    ).toBe(true);
  });
});
