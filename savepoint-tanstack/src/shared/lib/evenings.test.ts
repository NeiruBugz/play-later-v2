import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVENING_MINUTES,
  EVENING_MINUTES_CHOICES,
  formatEvenings,
} from "./evenings";

const hours = (value: number) => value * 3600;

describe(formatEvenings, () => {
  describe("given the default evening length", () => {
    it.each([
      [14.5, "About 8 evenings"],
      [51, "About 29 evenings"],
      [4.375, "About 3 evenings"],
      [1.5, "One evening"],
    ])("reads %s hours as %s", (gameHours, expected) => {
      expect(formatEvenings(hours(gameHours), DEFAULT_EVENING_MINUTES)).toBe(
        expected
      );
    });

    it("reads a game too short to fill one evening as One evening", () => {
      expect(formatEvenings(hours(0.2), DEFAULT_EVENING_MINUTES)).toBe(
        "One evening"
      );
    });

    it("has nothing to say when the length is unknown", () => {
      expect(formatEvenings(null, DEFAULT_EVENING_MINUTES)).toBeNull();
    });
  });

  describe("given a 180 minute evening", () => {
    it("reads 14.5 hours as About 5 evenings", () => {
      expect(formatEvenings(hours(14.5), 180)).toBe("About 5 evenings");
    });

    it("reads 2 hours as One evening", () => {
      expect(formatEvenings(hours(2), 180)).toBe("One evening");
    });
  });
});

describe("evening length choices", () => {
  it("offers 60, 90, 105, 120, 150 and 180 minutes", () => {
    expect([...EVENING_MINUTES_CHOICES]).toEqual([60, 90, 105, 120, 150, 180]);
  });

  it("defaults to 105 minutes", () => {
    expect(DEFAULT_EVENING_MINUTES).toBe(105);
  });
});
