import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportedGame } from "@/entities/imported-game/model/types";

import { ImportedGameCard } from "./imported-game-card";

const baseGame: ImportedGame = {
  id: "ig-1",
  name: "Half-Life 2",
  storefront: "STEAM",
  storefrontGameId: "220",
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
  userId: "u-1",
};

const elements = {
  queryAddButton: () =>
    screen.queryByRole("button", { name: "Add Half-Life 2" }),
  queryDismissButton: () =>
    screen.queryByRole("button", { name: "Remove Half-Life 2" }),
  queryRestoreButton: () =>
    screen.queryByRole("button", { name: "Restore Half-Life 2" }),
  queryName: () => screen.queryByText("Half-Life 2"),
  queryLastPlayed: () => screen.queryByText(/last played/),
};

describe("ImportedGameCard", () => {
  describe("given a PENDING game", () => {
    const onAdd = vi.fn();
    const onDismiss = vi.fn();

    beforeEach(() => {
      onAdd.mockReset();
      onDismiss.mockReset();
      render(
        <ImportedGameCard
          game={baseGame}
          onAddToLibrary={onAdd}
          onDismiss={onDismiss}
        />
      );
    });

    it("renders the game name", () => {
      expect(elements.queryName()).not.toBeNull();
    });

    it("renders the Add-to-library button (any non-IGNORED row)", () => {
      expect(elements.queryAddButton()).not.toBeNull();
    });

    it("renders the dismiss button", () => {
      expect(elements.queryDismissButton()).not.toBeNull();
    });

    it("fires onAddToLibrary when the Add button is clicked", async () => {
      await userEvent.click(elements.queryAddButton()!);
      expect(onAdd).toHaveBeenCalledOnce();
    });

    it("fires onDismiss when the dismiss button is clicked", async () => {
      await userEvent.click(elements.queryDismissButton()!);
      expect(onDismiss).toHaveBeenCalledOnce();
    });
  });

  describe("given the suggested-status badge", () => {
    it("reads Want for a game that was not played recently", () => {
      render(
        <ImportedGameCard
          game={baseGame}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Suggested status: Want")).toHaveTextContent(
        "Want"
      );
    });

    it("reads Playing, not the raw enum, for a game played yesterday", () => {
      render(
        <ImportedGameCard
          game={{
            ...baseGame,
            lastPlayedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          }}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      const badge = screen.getByLabelText("Suggested status: Playing");
      expect(badge).toHaveTextContent("Playing");
      expect(badge).not.toHaveTextContent("PLAYING");
    });
  });

  describe("given a game with a last-played timestamp", () => {
    beforeEach(() => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      render(
        <ImportedGameCard
          game={{ ...baseGame, playtime: 300, lastPlayedAt: tenDaysAgo }}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
    });

    it("surfaces when the game was last played", () => {
      expect(elements.queryLastPlayed()).not.toBeNull();
    });

    it("shows the 300 minutes of playtime as 5 h", () => {
      expect(screen.getByText("5 h")).toBeDefined();
    });
  });

  describe("given a game with no last-played timestamp", () => {
    beforeEach(() => {
      render(
        <ImportedGameCard
          game={{ ...baseGame, lastPlayedAt: null }}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
    });

    it("omits the last-played line entirely", () => {
      expect(elements.queryLastPlayed()).toBeNull();
    });
  });

  describe("given an UNMATCHED game", () => {
    beforeEach(() => {
      render(
        <ImportedGameCard
          game={{ ...baseGame, igdbMatchStatus: "UNMATCHED" }}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
    });

    it("renders the Add-to-library button (auto-match retries on click; falls through to manual)", () => {
      expect(elements.queryAddButton()).not.toBeNull();
    });
  });

  describe("given an IGNORED game", () => {
    const onRestore = vi.fn();
    beforeEach(() => {
      onRestore.mockReset();
      render(
        <ImportedGameCard
          game={{ ...baseGame, igdbMatchStatus: "IGNORED" }}
          onAddToLibrary={onRestore}
          onDismiss={vi.fn()}
        />
      );
    });

    it("renders the Restore button", () => {
      expect(elements.queryRestoreButton()).not.toBeNull();
    });

    it("does NOT render the dismiss button (already ignored)", () => {
      expect(elements.queryDismissButton()).toBeNull();
    });
  });
});
