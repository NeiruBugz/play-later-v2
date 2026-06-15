import { describe, expect, it } from "vitest";

import {
  aggregatePlaythroughs,
  type AggregatedPlaythroughs,
} from "./aggregate";

type RunInput = {
  playtimeMinutes: number;
  rating: number | null;
  completion: string | null;
};

describe("aggregatePlaythroughs", () => {
  describe("given an empty run list", () => {
    it("returns zero totals and undefined optional fields", () => {
      const result = aggregatePlaythroughs([]);
      expect(result).toEqual<AggregatedPlaythroughs>({
        totalPlaytimeMinutes: 0,
        count: 0,
        bestRating: undefined,
        completion: undefined,
      });
    });
  });

  describe("totalPlaytimeMinutes", () => {
    it("sums playtimeMinutes across all runs", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 120, rating: null, completion: null },
        { playtimeMinutes: 60, rating: null, completion: null },
        { playtimeMinutes: 0, rating: null, completion: null },
      ];
      expect(aggregatePlaythroughs(runs).totalPlaytimeMinutes).toBe(180);
    });

    it("is 0 when all runs have 0 playtimeMinutes", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: null, completion: null },
      ];
      expect(aggregatePlaythroughs(runs).totalPlaytimeMinutes).toBe(0);
    });
  });

  describe("count", () => {
    it("equals the number of runs", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 30, rating: null, completion: null },
        { playtimeMinutes: 60, rating: null, completion: null },
        { playtimeMinutes: 90, rating: null, completion: null },
      ];
      expect(aggregatePlaythroughs(runs).count).toBe(3);
    });

    it("is 1 for a single run", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 10, rating: 7, completion: "Story" },
      ];
      expect(aggregatePlaythroughs(runs).count).toBe(1);
    });
  });

  describe("bestRating", () => {
    it("returns the highest non-null rating across runs", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: 5, completion: null },
        { playtimeMinutes: 0, rating: 9, completion: null },
        { playtimeMinutes: 0, rating: 7, completion: null },
      ];
      expect(aggregatePlaythroughs(runs).bestRating).toBe(9);
    });

    it("ignores null ratings and returns the max non-null value", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: null, completion: null },
        { playtimeMinutes: 0, rating: 6, completion: null },
        { playtimeMinutes: 0, rating: null, completion: null },
      ];
      expect(aggregatePlaythroughs(runs).bestRating).toBe(6);
    });

    it("returns undefined when all ratings are null", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: null, completion: null },
        { playtimeMinutes: 0, rating: null, completion: null },
      ];
      expect(aggregatePlaythroughs(runs).bestRating).toBeUndefined();
    });

    it("returns the single non-null rating when only one run has a rating", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: 8, completion: null },
      ];
      expect(aggregatePlaythroughs(runs).bestRating).toBe(8);
    });
  });

  describe("completion", () => {
    it("returns undefined when all runs have null completion", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: null, completion: null },
        { playtimeMinutes: 0, rating: null, completion: null },
      ];
      expect(aggregatePlaythroughs(runs).completion).toBeUndefined();
    });

    it("returns Platinum when any run has Platinum completion, even with others", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: null, completion: "Story" },
        { playtimeMinutes: 0, rating: null, completion: "Platinum" },
        { playtimeMinutes: 0, rating: null, completion: "100%" },
      ];
      expect(aggregatePlaythroughs(runs).completion).toBe("Platinum");
    });

    it("returns Platinum even when Platinum is not the first entry in the array", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: null, completion: "100%" },
        { playtimeMinutes: 0, rating: null, completion: "Platinum" },
      ];
      expect(aggregatePlaythroughs(runs).completion).toBe("Platinum");
    });

    it("returns the first non-null completion when no Platinum exists", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: null, completion: null },
        { playtimeMinutes: 0, rating: null, completion: "Story" },
        { playtimeMinutes: 0, rating: null, completion: "100%" },
      ];
      expect(aggregatePlaythroughs(runs).completion).toBe("Story");
    });

    it("returns the only non-null completion when a single run has one", () => {
      const runs: RunInput[] = [
        { playtimeMinutes: 0, rating: null, completion: "100%" },
      ];
      expect(aggregatePlaythroughs(runs).completion).toBe("100%");
    });
  });
});
