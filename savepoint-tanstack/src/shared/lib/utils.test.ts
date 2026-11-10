import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  describe("given two conflicting utilities", () => {
    it("keeps the later one", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
    });
  });

  describe("given a font-size and a text color", () => {
    it("keeps both", () => {
      expect(cn("text-xs", "text-muted-foreground")).toBe(
        "text-xs text-muted-foreground"
      );
    });
  });

  describe("given an axis utility and the shorthand after it", () => {
    it("lets the shorthand win", () => {
      expect(cn("px-6", "p-0")).toBe("p-0");
    });
  });
});
