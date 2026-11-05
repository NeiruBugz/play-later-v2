import { describe, expect, it } from "vitest";

import { formatHours } from "./date";

describe("formatHours", () => {
  it.each([
    [90, "1.5 h"],
    [30, "0.5 h"],
    [720, "12 h"],
    [60, "1 h"],
    [45, "0.8 h"],
    [100, "1.7 h"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatHours(minutes)).toBe(expected);
  });

  it("drops the trailing .0 on whole hours", () => {
    expect(formatHours(120)).toBe("2 h");
  });
});
