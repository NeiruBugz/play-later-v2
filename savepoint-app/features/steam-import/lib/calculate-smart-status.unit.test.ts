import type { ImportedGame } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { LibraryItemStatus } from "@/shared/types";

import { calculateSmartStatus } from "./calculate-smart-status";

describe("calculateSmartStatus", () => {
  const baseImportedGame: ImportedGame = {
    id: "test-id",
    name: "Test Game",
    storefront: "STEAM",
    storefrontGameId: "12345",
    playtime: 0,
    playtimeWindows: 0,
    playtimeMac: 0,
    playtimeLinux: 0,
    lastPlayedAt: null,
    img_icon_url: null,
    img_logo_url: null,
    igdbMatchStatus: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    userId: "user-123",
  };

  describe("OWNED status", () => {
    it("returns OWNED when playtime is 0", () => {
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 0,
        lastPlayedAt: null,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.OWNED);
    });

    it("returns OWNED when playtime is null", () => {
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: null,
        lastPlayedAt: null,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.OWNED);
    });

    it("returns OWNED when playtime is undefined", () => {
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: undefined as unknown as null,
        lastPlayedAt: null,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.OWNED);
    });

    it("returns OWNED even if lastPlayedAt is set but playtime is 0", () => {
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 0,
        lastPlayedAt: new Date(),
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.OWNED);
    });
  });

  describe("PLAYING status", () => {
    it("returns PLAYING when played within 7 days", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 120,
        lastPlayedAt: twoDaysAgo,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYING);
    });

    it("returns PLAYING when played today", () => {
      const now = new Date();
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 60,
        lastPlayedAt: now,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYING);
    });

    it("returns PLAYING when played 6 days ago", () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 300,
        lastPlayedAt: sixDaysAgo,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYING);
    });
  });

  describe("PLAYED status", () => {
    it("returns PLAYED when played more than 7 days ago", () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 500,
        lastPlayedAt: tenDaysAgo,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYED);
    });

    it("returns PLAYED when played 30 days ago", () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 1000,
        lastPlayedAt: thirtyDaysAgo,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYED);
    });

    it("returns PLAYED when lastPlayedAt is null but playtime exists", () => {
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 250,
        lastPlayedAt: null,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYED);
    });

    it("returns PLAYED when playtime > 0 but lastPlayedAt is undefined", () => {
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 150,
        lastPlayedAt: undefined as unknown as null,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYED);
    });
  });

  describe("edge cases", () => {
    it("handles exactly 7 days ago as PLAYED (boundary case)", () => {
      const exactlySevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      );
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 100,
        lastPlayedAt: exactlySevenDaysAgo,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYED);
    });

    it("handles 6 days 23 hours 59 minutes ago as PLAYING", () => {
      const almostSevenDays = new Date(
        Date.now() - (7 * 24 * 60 * 60 * 1000 - 60 * 1000)
      );
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 200,
        lastPlayedAt: almostSevenDays,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYING);
    });

    it("handles very large playtime values", () => {
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 999999,
        lastPlayedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYED);
    });

    it("handles very small playtime values (1 minute)", () => {
      const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const game: ImportedGame = {
        ...baseImportedGame,
        playtime: 1,
        lastPlayedAt: yesterday,
      };

      expect(calculateSmartStatus(game)).toBe(LibraryItemStatus.PLAYING);
    });
  });
});
