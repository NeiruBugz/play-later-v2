import { describe, expect, it } from "vitest";

import { DEFAULT_EVENING_MINUTES, formatEvenings } from "./evenings";

const hours = (value: number) => value * 3600;

describe("@spec: 028-continue-identity-stand-out @regression game length reads as evenings", () => {
  describe.each([
    { mainStory: 14.5, reads: "About 8 evenings" },
    { mainStory: 1.5, reads: "One evening" },
    { mainStory: 51, reads: "About 29 evenings" },
    { mainStory: 4.375, reads: "About 3 evenings" },
  ])(
    "given a Main story time of $mainStory hours and the 1.75 h evening",
    ({ mainStory, reads }) => {
      it(`reads ${reads}`, () => {
        expect(formatEvenings(hours(mainStory), DEFAULT_EVENING_MINUTES)).toBe(
          reads
        );
      });
    }
  );

  describe("given a game with only a 100% time and no Main story time", () => {
    it("has no length and no placeholder text", () => {
      expect(formatEvenings(null, DEFAULT_EVENING_MINUTES)).toBeNull();
    });
  });

  describe("given the evening length is changed to 3 h", () => {
    it("reads a 14.5-hour game as About 5 evenings and a 2-hour game as One evening", () => {
      expect(formatEvenings(hours(14.5), 180)).toBe("About 5 evenings");
      expect(formatEvenings(hours(2), 180)).toBe("One evening");
    });
  });
});
