import type { ImportedGame } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImportedGameCard } from "./imported-game-card";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const createMockImportedGame = (
  overrides: Partial<ImportedGame> = {}
): ImportedGame => ({
  id: "game-1",
  userId: "user-1",
  storefront: "STEAM",
  storefrontGameId: "440",
  name: "Team Fortress 2",
  playtime: 1250,
  playtimeWindows: 1000,
  playtimeMac: 150,
  playtimeLinux: 100,
  lastPlayedAt: new Date("2026-01-15T12:00:00Z"),
  img_icon_url: "abc123def456",
  img_logo_url: null,
  igdbMatchStatus: "PENDING",
  createdAt: new Date("2026-01-18T10:00:00Z"),
  updatedAt: new Date("2026-01-18T10:00:00Z"),
  deletedAt: null,
  ...overrides,
});

describe("ImportedGameCard", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-01-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("game name rendering", () => {
    it("should render game name correctly", () => {
      const game = createMockImportedGame({ name: "The Witcher 3" });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("The Witcher 3")).toBeVisible();
    });

    it("should truncate long game names", () => {
      const game = createMockImportedGame({
        name: "A Very Long Game Name That Should Be Truncated Eventually",
      });

      render(<ImportedGameCard game={game} />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveClass("truncate");
    });
  });

  describe("playtime formatting", () => {
    it("should format playtime in hours when >= 60 minutes", () => {
      const game = createMockImportedGame({ playtime: 750 });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("12.5 hrs")).toBeVisible();
    });

    it("should format playtime in minutes when < 60 minutes", () => {
      const game = createMockImportedGame({ playtime: 45 });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("45 min")).toBeVisible();
    });

    it("should display 'Never played' when playtime is 0", () => {
      const game = createMockImportedGame({ playtime: 0 });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("Never played")).toBeVisible();
    });

    it("should display 'Never played' when playtime is null", () => {
      const game = createMockImportedGame({ playtime: null });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("Never played")).toBeVisible();
    });

    it("should format playtime with one decimal place", () => {
      const game = createMockImportedGame({ playtime: 127 });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("2.1 hrs")).toBeVisible();
    });
  });

  describe("last played date formatting", () => {
    it("should format recent date relatively (5 days ago)", () => {
      const fiveDaysAgo = new Date("2026-01-15T12:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: fiveDaysAgo });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("Last played: 5 days ago")).toBeVisible();
    });

    it("should format recent date relatively (today)", () => {
      const today = new Date("2026-01-20T10:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: today });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("Last played: today")).toBeVisible();
    });

    it("should format recent date relatively (yesterday)", () => {
      const yesterday = new Date("2026-01-19T12:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: yesterday });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("Last played: yesterday")).toBeVisible();
    });

    it("should format old date absolutely when > 7 days ago", () => {
      const eightDaysAgo = new Date("2026-01-12T12:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: eightDaysAgo });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("Last played: Jan 12, 2026")).toBeVisible();
    });

    it("should display 'Never' when lastPlayedAt is null", () => {
      const game = createMockImportedGame({ lastPlayedAt: null });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("Last played: Never")).toBeVisible();
    });
  });

  describe("icon rendering", () => {
    it("should show Steam icon when iconHash and appId are available", () => {
      const game = createMockImportedGame({
        img_icon_url: "abc123def456",
        storefrontGameId: "440",
      });

      render(<ImportedGameCard game={game} />);

      const image = screen.getByAltText("Team Fortress 2");
      expect(image).toBeVisible();
      expect(image).toHaveAttribute(
        "src",
        "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/440/abc123def456.jpg"
      );
    });

    it("should show fallback with first letter when icon is not available", () => {
      const game = createMockImportedGame({
        name: "Portal 2",
        img_icon_url: null,
      });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("P")).toBeVisible();
      expect(screen.queryByAltText("Portal 2")).not.toBeInTheDocument();
    });

    it("should show fallback when appId is null", () => {
      const game = createMockImportedGame({
        name: "Half-Life",
        img_icon_url: "abc123",
        storefrontGameId: null,
      });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("H")).toBeVisible();
      expect(screen.queryByAltText("Half-Life")).not.toBeInTheDocument();
    });

    it("should uppercase first letter in fallback", () => {
      const game = createMockImportedGame({
        name: "dota 2",
        img_icon_url: null,
      });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("D")).toBeVisible();
    });

    it("should handle empty string icon gracefully", () => {
      const game = createMockImportedGame({
        name: "Counter-Strike",
        img_icon_url: "",
      });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("C")).toBeVisible();
    });
  });

  describe("accessibility", () => {
    it("should have heading role for game name", () => {
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Team Fortress 2");
    });

    it("should have proper alt text for Steam icon", () => {
      const game = createMockImportedGame({
        name: "Stardew Valley",
        img_icon_url: "icon123",
      });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByAltText("Stardew Valley")).toBeVisible();
    });
  });

  describe("card styling", () => {
    it("should display metadata with bullet separator", () => {
      const game = createMockImportedGame({
        playtime: 120,
        lastPlayedAt: new Date("2026-01-18T12:00:00Z"),
      });

      render(<ImportedGameCard game={game} />);

      expect(screen.getByText("•")).toBeVisible();
      expect(screen.getByText("2.0 hrs")).toBeVisible();
      expect(screen.getByText("Last played: 2 days ago")).toBeVisible();
    });
  });
});
