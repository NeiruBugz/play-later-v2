import { describe, expect, it } from "vitest";

import { deriveEntryTitle } from "./derive-entry-title";

const game = { title: "Hollow Knight" };

describe("deriveEntryTitle", () => {
  describe("given a persisted title", () => {
    it("returns the persisted title when non-empty", () => {
      expect(
        deriveEntryTitle({ title: "My Session", body: "Some body" }, game)
      ).toBe("My Session");
    });

    it("trims whitespace from the persisted title", () => {
      expect(deriveEntryTitle({ title: "  Trimmed  " }, game)).toBe("Trimmed");
    });

    it("falls through when persisted title is empty string", () => {
      const result = deriveEntryTitle(
        { title: "", body: "First line of body" },
        game
      );
      expect(result).toBe("First line of body");
    });

    it("falls through when persisted title is null", () => {
      const result = deriveEntryTitle(
        { title: null, body: "First line of body" },
        game
      );
      expect(result).toBe("First line of body");
    });
  });

  describe("given no persisted title but a body", () => {
    it("returns the first non-empty line of the body", () => {
      const result = deriveEntryTitle(
        { title: null, body: "First line\nSecond line" },
        game
      );
      expect(result).toBe("First line");
    });

    it("skips blank leading lines", () => {
      const result = deriveEntryTitle(
        { title: null, body: "\n\nActual first line\nMore text" },
        game
      );
      expect(result).toBe("Actual first line");
    });

    it("truncates at the nearest word boundary when body line exceeds 80 chars", () => {
      const longLine = "The " + "word ".repeat(20) + "end";
      const result = deriveEntryTitle({ title: null, body: longLine }, game);
      expect(result.length).toBeLessThanOrEqual(81);
      expect(result.endsWith("…")).toBe(true);
      expect(result.slice(0, -1).trim().split(" ").every(Boolean)).toBe(true);
    });

    it("hard-slices at 80 chars when no whitespace exists before position 80", () => {
      const noSpaceLine = "A".repeat(120);
      const result = deriveEntryTitle({ title: null, body: noSpaceLine }, game);
      expect(result).toBe("A".repeat(80) + "…");
    });

    it("returns body line as-is when it is exactly 80 chars", () => {
      const exactLine = "x".repeat(80);
      const result = deriveEntryTitle({ title: null, body: exactLine }, game);
      expect(result).toBe(exactLine);
    });
  });

  describe("given no title and empty/missing body", () => {
    it("falls back to <game title> — YYYY-MM-DD using opts.date", () => {
      const result = deriveEntryTitle({ title: null, body: null }, game, {
        date: new Date("2024-03-15"),
      });
      expect(result).toBe("Hollow Knight — 2024-03-15");
    });

    it("falls back to <game title> — YYYY-MM-DD using entry.createdAt", () => {
      const result = deriveEntryTitle(
        { title: null, body: "", createdAt: new Date("2024-06-01") },
        game
      );
      expect(result).toBe("Hollow Knight — 2024-06-01");
    });

    it("prefers opts.date over entry.createdAt when both are provided", () => {
      const result = deriveEntryTitle(
        { title: null, body: null, createdAt: new Date("2024-01-01") },
        game,
        { date: new Date("2024-06-15") }
      );
      expect(result).toBe("Hollow Knight — 2024-06-15");
    });

    it("uses today's date when neither opts.date nor createdAt is provided", () => {
      const result = deriveEntryTitle({ title: null, body: "   " }, game);
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      expect(result).toBe(`Hollow Knight — ${yyyy}-${mm}-${dd}`);
    });
  });
});
