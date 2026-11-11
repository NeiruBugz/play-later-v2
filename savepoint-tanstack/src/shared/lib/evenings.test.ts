import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVENING_MINUTES,
  EVENING_MINUTES_CHOICES,
  formatEveningLengthInput,
  formatEvenings,
  parseEveningLengthInput,
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

describe(parseEveningLengthInput, () => {
  it.each([
    ["150", "minutes", 150],
    ["30", "minutes", 30],
    ["360", "minutes", 360],
    ["2.25", "hours", 135],
    ["2.999", "hours", 180],
    ["0.5", "hours", 30],
    ["6", "hours", 360],
  ] as const)("reads %s %s as %i minutes", (value, unit, expected) => {
    expect(parseEveningLengthInput(value, unit)).toBe(expected);
  });

  it.each([
    ["20", "minutes"],
    ["361", "minutes"],
    ["7", "hours"],
    ["0", "minutes"],
    ["-90", "minutes"],
    ["", "minutes"],
    ["abc", "hours"],
  ] as const)("rejects %j %s", (value, unit) => {
    expect(parseEveningLengthInput(value, unit)).toBeNull();
  });
});

describe(formatEveningLengthInput, () => {
  it.each([
    [135, { value: "135", unit: "minutes" }],
    [120, { value: "2", unit: "hours" }],
    [240, { value: "4", unit: "hours" }],
    [270, { value: "270", unit: "minutes" }],
    [45, { value: "45", unit: "minutes" }],
  ])("shows %i minutes as %j", (minutes, expected) => {
    expect(formatEveningLengthInput(minutes)).toEqual(expected);
  });
});
