import { describe, expect, it } from "vitest";

import { deriveBannerGradient } from "./derive-banner-gradient";

describe("deriveBannerGradient", () => {
  describe("given the same seed", () => {
    it("returns the same gradient string", () => {
      expect(deriveBannerGradient("alice")).toBe(deriveBannerGradient("alice"));
    });
  });

  describe("given two different seeds", () => {
    it("returns different gradient strings", () => {
      expect(deriveBannerGradient("alice")).not.toBe(
        deriveBannerGradient("bob")
      );
    });
  });

  describe("given any seed", () => {
    it("returns a 135deg linear-gradient with two oklch stops", () => {
      const value = deriveBannerGradient("neirubugzdev");
      expect(value).toMatch(
        /^linear-gradient\(135deg, oklch\([^)]+\) 0%, oklch\([^)]+\) 100%\)$/
      );
    });
  });

  describe("given an empty seed", () => {
    it("still returns a valid gradient string", () => {
      const value = deriveBannerGradient("");
      expect(value).toMatch(/^linear-gradient\(135deg, oklch\(/);
    });
  });
});
