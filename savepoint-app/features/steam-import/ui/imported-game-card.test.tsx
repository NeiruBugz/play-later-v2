import type { ImportedGame } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImportedGameCard } from "./imported-game-card";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockDismissMutate = vi.fn();

const mockDismissGame = {
  mutate: mockDismissMutate,
  isPending: false,
};

vi.mock("../hooks/use-dismiss-game", () => ({
  useDismissGame: () => mockDismissGame,
}));

vi.mock("./import-game-modal", () => ({
  ImportGameModal: ({
    isOpen,
    onClose,
    game,
  }: {
    isOpen: boolean;
    onClose: () => void;
    game: { name: string };
  }) => (
    <div data-testid="import-game-modal" data-open={isOpen}>
      <div>Import Game Modal</div>
      <div>Game: {game.name}</div>
      <button onClick={onClose}>Close Modal</button>
    </div>
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

const elements = {
  getGameName: (name: string) => screen.getByText(name),
  getHeading: () => screen.getByRole("heading", { level: 3 }),
  getPlaytime: (time: string) => screen.getByText(time),
  getNeverPlayedText: () => screen.getByText("Never played"),
  getLastPlayedText: (text: string) => screen.getByText(text),
  getImage: (alt: string) => screen.getByAltText(alt),
  queryImage: (alt: string) => screen.queryByAltText(alt),
  getFallbackLetter: (letter: string) => screen.getByText(letter),
  getBulletSeparator: () => screen.getByText("•"),
  getStatusBadge: () => screen.getByRole("status"),
  getStatusBadgeByLabel: (label: string) => screen.getByText(label),
  getDismissButton: () => screen.getByRole("button", { name: /dismiss game/i }),
  getImportButton: () =>
    screen.getByRole("button", { name: /import game to library/i }),
  getModal: () => screen.getByTestId("import-game-modal"),
  queryModal: () => screen.queryByTestId("import-game-modal"),
  getModalCloseButton: () =>
    screen.getByRole("button", { name: /close modal/i }),
  getModalGameText: (name: string) => screen.getByText(`Game: ${name}`),
};

const actions = {
  clickDismiss: async () => {
    const user = userEvent.setup();
    await user.click(elements.getDismissButton());
  },
  clickImport: async () => {
    const user = userEvent.setup();
    await user.click(elements.getImportButton());
  },
  closeModal: async () => {
    const user = userEvent.setup();
    await user.click(elements.getModalCloseButton());
  },
};

describe("ImportedGameCard", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-01-20T12:00:00Z"));
    mockDismissMutate.mockClear();
    mockDismissGame.isPending = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("game name rendering", () => {
    it("should render game name correctly", () => {
      const game = createMockImportedGame({ name: "The Witcher 3" });

      render(<ImportedGameCard game={game} />);

      expect(elements.getGameName("The Witcher 3")).toBeVisible();
    });

    it("should truncate long game names", () => {
      const game = createMockImportedGame({
        name: "A Very Long Game Name That Should Be Truncated Eventually",
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getHeading()).toHaveClass("truncate");
    });
  });

  describe("playtime formatting", () => {
    it("should format playtime in hours when >= 60 minutes", () => {
      const game = createMockImportedGame({ playtime: 750 });

      render(<ImportedGameCard game={game} />);

      expect(elements.getPlaytime("12.5 hrs")).toBeVisible();
    });

    it("should format playtime in minutes when < 60 minutes", () => {
      const game = createMockImportedGame({ playtime: 45 });

      render(<ImportedGameCard game={game} />);

      expect(elements.getPlaytime("45 min")).toBeVisible();
    });

    it("should display 'Never played' when playtime is 0", () => {
      const game = createMockImportedGame({ playtime: 0 });

      render(<ImportedGameCard game={game} />);

      expect(elements.getNeverPlayedText()).toBeVisible();
    });

    it("should display 'Never played' when playtime is null", () => {
      const game = createMockImportedGame({ playtime: null });

      render(<ImportedGameCard game={game} />);

      expect(elements.getNeverPlayedText()).toBeVisible();
    });

    it("should format playtime with one decimal place", () => {
      const game = createMockImportedGame({ playtime: 127 });

      render(<ImportedGameCard game={game} />);

      expect(elements.getPlaytime("2.1 hrs")).toBeVisible();
    });
  });

  describe("last played date formatting", () => {
    it("should format recent date relatively (5 days ago)", () => {
      const fiveDaysAgo = new Date("2026-01-15T12:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: fiveDaysAgo });

      render(<ImportedGameCard game={game} />);

      expect(
        elements.getLastPlayedText("Last played: 5 days ago")
      ).toBeVisible();
    });

    it("should format recent date relatively (today)", () => {
      const today = new Date("2026-01-20T10:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: today });

      render(<ImportedGameCard game={game} />);

      expect(elements.getLastPlayedText("Last played: today")).toBeVisible();
    });

    it("should format recent date relatively (yesterday)", () => {
      const yesterday = new Date("2026-01-19T12:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: yesterday });

      render(<ImportedGameCard game={game} />);

      expect(
        elements.getLastPlayedText("Last played: yesterday")
      ).toBeVisible();
    });

    it("should format old date absolutely when > 7 days ago", () => {
      const eightDaysAgo = new Date("2026-01-12T12:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: eightDaysAgo });

      render(<ImportedGameCard game={game} />);

      expect(
        elements.getLastPlayedText("Last played: Jan 12, 2026")
      ).toBeVisible();
    });

    it("should display 'Never' when lastPlayedAt is null", () => {
      const game = createMockImportedGame({ lastPlayedAt: null });

      render(<ImportedGameCard game={game} />);

      expect(elements.getLastPlayedText("Last played: Never")).toBeVisible();
    });
  });

  describe("icon rendering", () => {
    it("should show Steam icon when iconHash and appId are available", () => {
      const game = createMockImportedGame({
        img_icon_url: "abc123def456",
        storefrontGameId: "440",
      });

      render(<ImportedGameCard game={game} />);

      const image = elements.getImage("Team Fortress 2");
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

      expect(elements.getFallbackLetter("P")).toBeVisible();
      expect(elements.queryImage("Portal 2")).not.toBeInTheDocument();
    });

    it("should show fallback when appId is null", () => {
      const game = createMockImportedGame({
        name: "Half-Life",
        img_icon_url: "abc123",
        storefrontGameId: null,
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getFallbackLetter("H")).toBeVisible();
      expect(elements.queryImage("Half-Life")).not.toBeInTheDocument();
    });

    it("should uppercase first letter in fallback", () => {
      const game = createMockImportedGame({
        name: "dota 2",
        img_icon_url: null,
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getFallbackLetter("D")).toBeVisible();
    });

    it("should handle empty string icon gracefully", () => {
      const game = createMockImportedGame({
        name: "Counter-Strike",
        img_icon_url: "",
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getFallbackLetter("C")).toBeVisible();
    });
  });

  describe("accessibility", () => {
    it("should have heading role for game name", () => {
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      expect(elements.getHeading()).toHaveTextContent("Team Fortress 2");
    });

    it("should have proper alt text for Steam icon", () => {
      const game = createMockImportedGame({
        name: "Stardew Valley",
        img_icon_url: "icon123",
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getImage("Stardew Valley")).toBeVisible();
    });
  });

  describe("card styling", () => {
    it("should display metadata with bullet separator", () => {
      const game = createMockImportedGame({
        playtime: 120,
        lastPlayedAt: new Date("2026-01-18T12:00:00Z"),
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getBulletSeparator()).toBeVisible();
      expect(elements.getPlaytime("2.0 hrs")).toBeVisible();
      expect(
        elements.getLastPlayedText("Last played: 2 days ago")
      ).toBeVisible();
    });
  });

  describe("smart status badge", () => {
    it("should display 'Owned' badge for games with 0 playtime", () => {
      const game = createMockImportedGame({
        playtime: 0,
        lastPlayedAt: null,
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getStatusBadgeByLabel("Owned")).toBeVisible();
      expect(elements.getStatusBadge()).toHaveAttribute(
        "aria-label",
        "Status: Owned"
      );
    });

    it("should display 'Owned' badge for games with null playtime", () => {
      const game = createMockImportedGame({
        playtime: null,
        lastPlayedAt: null,
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getStatusBadgeByLabel("Owned")).toBeVisible();
    });

    it("should display 'Playing' badge for games played within last 7 days", () => {
      const threeDaysAgo = new Date("2026-01-17T12:00:00Z");
      const game = createMockImportedGame({
        playtime: 100,
        lastPlayedAt: threeDaysAgo,
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getStatusBadgeByLabel("Playing")).toBeVisible();
      expect(elements.getStatusBadge()).toHaveAttribute(
        "aria-label",
        "Status: Playing"
      );
    });

    it("should display 'Playing' badge for game played today", () => {
      const today = new Date("2026-01-20T10:00:00Z");
      const game = createMockImportedGame({
        playtime: 250,
        lastPlayedAt: today,
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getStatusBadgeByLabel("Playing")).toBeVisible();
    });

    it("should display 'Played' badge for games played exactly 7 days ago (boundary test)", () => {
      const exactlySevenDaysAgo = new Date("2026-01-13T12:00:00Z");
      const game = createMockImportedGame({
        playtime: 600,
        lastPlayedAt: exactlySevenDaysAgo,
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getStatusBadgeByLabel("Played")).toBeVisible();
    });

    it("should display 'Played' badge for games played more than 7 days ago", () => {
      const tenDaysAgo = new Date("2026-01-10T12:00:00Z");
      const game = createMockImportedGame({
        playtime: 1500,
        lastPlayedAt: tenDaysAgo,
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getStatusBadgeByLabel("Played")).toBeVisible();
      expect(elements.getStatusBadge()).toHaveAttribute(
        "aria-label",
        "Status: Played"
      );
    });

    it("should display 'Played' badge for games with playtime but no lastPlayedAt date", () => {
      const game = createMockImportedGame({
        playtime: 500,
        lastPlayedAt: null,
      });

      render(<ImportedGameCard game={game} />);

      expect(elements.getStatusBadgeByLabel("Played")).toBeVisible();
    });

    it("should have status role for accessibility", () => {
      const game = createMockImportedGame({
        playtime: 100,
        lastPlayedAt: new Date("2026-01-19T12:00:00Z"),
      });

      render(<ImportedGameCard game={game} />);

      const statusBadge = elements.getStatusBadge();
      expect(statusBadge).toBeVisible();
      expect(statusBadge).toHaveAttribute("role", "status");
    });
  });

  describe("dismiss button", () => {
    it("should render dismiss button", () => {
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      expect(elements.getDismissButton()).toBeVisible();
    });

    it("should call dismiss mutation with correct game ID when clicked", async () => {
      const game = createMockImportedGame({ id: "test-game-123" });

      render(<ImportedGameCard game={game} />);

      await actions.clickDismiss();

      expect(mockDismissMutate).toHaveBeenCalledTimes(1);
      expect(mockDismissMutate).toHaveBeenCalledWith({
        importedGameId: "test-game-123",
      });
    });

    it("should disable dismiss button when dismiss mutation is pending", () => {
      mockDismissGame.isPending = true;
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      expect(elements.getDismissButton()).toBeDisabled();
    });

    it("should have proper accessibility attributes", () => {
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      const dismissButton = elements.getDismissButton();
      expect(dismissButton).toHaveAttribute("aria-label", "Dismiss game");
      expect(dismissButton).toHaveAttribute("title", "Dismiss game");
    });
  });

  describe("import button and modal", () => {
    it("should render import button", () => {
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      expect(elements.getImportButton()).toBeVisible();
    });

    it("should not show modal initially", () => {
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      const modal = elements.queryModal();
      expect(modal).toHaveAttribute("data-open", "false");
    });

    it("should open import modal when import button is clicked", async () => {
      const game = createMockImportedGame({
        name: "Test Game",
      });

      render(<ImportedGameCard game={game} />);

      await actions.clickImport();

      const modal = elements.getModal();
      expect(modal).toHaveAttribute("data-open", "true");
      expect(elements.getModalGameText("Test Game")).toBeVisible();
    });

    it("should close modal when close button is clicked", async () => {
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      await actions.clickImport();
      expect(elements.getModal()).toHaveAttribute("data-open", "true");

      await actions.closeModal();
      expect(elements.getModal()).toHaveAttribute("data-open", "false");
    });

    it("should pass correct game data to modal", async () => {
      const game = createMockImportedGame({
        id: "test-game-123",
        name: "Portal 2",
      });

      render(<ImportedGameCard game={game} />);

      await actions.clickImport();

      expect(elements.getModalGameText("Portal 2")).toBeVisible();
    });

    it("should disable import button when dismiss mutation is pending", () => {
      mockDismissGame.isPending = true;
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      expect(elements.getImportButton()).toBeDisabled();
    });

    it("should have proper accessibility attributes", () => {
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      const importButton = elements.getImportButton();
      expect(importButton).toHaveAttribute(
        "aria-label",
        "Import game to library"
      );
      expect(importButton).toHaveAttribute("title", "Import game to library");
    });

    it("should use default variant for primary action", () => {
      const game = createMockImportedGame();

      render(<ImportedGameCard game={game} />);

      const importButton = elements.getImportButton();
      expect(importButton.className).not.toContain("ghost");
    });
  });
});
