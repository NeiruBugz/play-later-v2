import { describe, expect, it } from "vitest";

import { formatPlatformFact } from "./format-platform-fact";

describe(formatPlatformFact, () => {
  describe("given up to three platforms", () => {
    it("abbreviates and joins them with a middle dot", () => {
      expect(
        formatPlatformFact(
          ["PlayStation 5", "PC (Microsoft Windows)", "Xbox Series X|S"],
          3
        )
      ).toBe("PS5 · PC · XSX");
    });

    it("shows a single platform on its own", () => {
      expect(formatPlatformFact(["Nintendo Switch"], 3)).toBe("Switch");
    });
  });

  describe("given more platforms than the limit", () => {
    it("shows the first three and counts the rest", () => {
      expect(
        formatPlatformFact(
          [
            "PlayStation 5",
            "PC (Microsoft Windows)",
            "Xbox Series X|S",
            "Nintendo Switch",
            "PlayStation 4",
          ],
          3
        )
      ).toBe("PS5 · PC · XSX +2");
    });
  });

  describe("given no platforms", () => {
    it("returns null so the fact is not rendered", () => {
      expect(formatPlatformFact([], 3)).toBeNull();
    });
  });
});
