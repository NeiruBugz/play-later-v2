import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportedGameWithGame } from "@/entities/imported-game/model/types";

import { ImportedGameCard } from "./imported-game-card";

const baseGame: ImportedGameWithGame = {
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
  gameId: null,
  lookedUpAt: null,
  game: null,
};

const HALF_LIFE_COVER =
  "https://images.igdb.com/igdb/image/upload/t_cover_big/co1nmw.jpg";

const foundGame: ImportedGameWithGame = {
  ...baseGame,
  gameId: "game-1",
  lookedUpAt: new Date("2026-11-14T10:00:00.000Z"),
  game: {
    title: "Half-Life 2",
    coverImage: HALF_LIFE_COVER,
    releaseDate: new Date("2004-11-16T00:00:00.000Z"),
  },
};

const needsMatchGame: ImportedGameWithGame = {
  ...baseGame,
  lookedUpAt: new Date("2026-11-14T10:00:00.000Z"),
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
  queryNeedsMatchBadge: () => screen.queryByText("Needs a match"),
  queryYear: () => screen.queryByText("2004"),
  queryCover: () =>
    screen.queryByRole("img", { name: "Cover for Half-Life 2" }),
  getImage: () => screen.getByRole("img"),
  getTitleHeading: (name: string) => screen.getByRole("heading", { name }),
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

    it("keeps the row Add action secondary, not the page primary", () => {
      expect(elements.queryAddButton()).toHaveClass("border-border");
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
  describe("given a game the sync found in the catalogue", () => {
    beforeEach(() => {
      render(
        <ImportedGameCard
          game={foundGame}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
    });

    it("shows the catalogue cover", () => {
      expect(elements.queryCover()).toHaveAttribute(
        "src",
        expect.stringContaining("images.igdb.com/igdb/image/upload/")
      );
      expect(elements.queryCover()).toHaveAttribute(
        "src",
        expect.stringContaining("co1nmw.jpg")
      );
    });

    it("shows the release year", () => {
      expect(elements.queryYear()).not.toBeNull();
    });

    it("does not say the game needs a match", () => {
      expect(elements.queryNeedsMatchBadge()).toBeNull();
    });

    it("still offers the Add action", () => {
      expect(elements.queryAddButton()).not.toBeNull();
    });
  });

  describe("given a found game whose catalogue title differs from its Steam name", () => {
    beforeEach(() => {
      render(
        <ImportedGameCard
          game={{ ...foundGame, name: "HALF-LIFE 2 (Steam edition)" }}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
    });

    it("heads the card with the catalogue title", () => {
      expect(elements.getTitleHeading("Half-Life 2")).toBeInTheDocument();
    });
  });

  describe("given a found game with no catalogue cover", () => {
    beforeEach(() => {
      render(
        <ImportedGameCard
          game={{
            ...foundGame,
            img_icon_url: "abc123",
            game: { ...foundGame.game!, coverImage: null },
          }}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
    });

    it("falls back to the Steam icon", () => {
      expect(elements.getImage()).toHaveAttribute(
        "src",
        "https://media.steampowered.com/steamcommunity/public/images/apps/220/abc123.jpg"
      );
    });
  });

  describe("given a found game with no release date", () => {
    it("shows no year", () => {
      const { container } = render(
        <ImportedGameCard
          game={{
            ...foundGame,
            game: { ...foundGame.game!, releaseDate: null },
          }}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );

      expect(container).not.toHaveTextContent(/\d{4}/);
    });
  });

  describe("given a game that was looked up but not matched", () => {
    beforeEach(() => {
      render(
        <ImportedGameCard
          game={{ ...needsMatchGame, img_icon_url: "abc123" }}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
    });

    it("says the game needs a match", () => {
      expect(elements.queryNeedsMatchBadge()).not.toBeNull();
    });

    it("shows the Steam icon and no year", () => {
      expect(elements.getImage()).toHaveAttribute(
        "src",
        "https://media.steampowered.com/steamcommunity/public/images/apps/220/abc123.jpg"
      );
      expect(elements.queryYear()).toBeNull();
    });
  });

  describe("given a game that was not looked up yet", () => {
    beforeEach(() => {
      render(
        <ImportedGameCard
          game={baseGame}
          onAddToLibrary={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
    });

    it("does not say the game needs a match", () => {
      expect(elements.queryNeedsMatchBadge()).toBeNull();
    });
  });
});
