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
  igdbMatchStatus: "MATCHED",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  userId: "u-1",
};

const elements = {
  getCheckbox: () =>
    screen.getByRole("checkbox", { name: /Select Half-Life 2/ }),
  queryAddButton: () =>
    screen.queryByRole("button", { name: "Add Half-Life 2 to library" }),
  querySearchButton: () =>
    screen.queryByRole("button", { name: "Search IGDB for Half-Life 2" }),
  queryDismissButton: () =>
    screen.queryByRole("button", { name: "Dismiss Half-Life 2" }),
  queryRestoreButton: () =>
    screen.queryByRole("button", { name: "Restore Half-Life 2" }),
  queryName: () => screen.queryByText("Half-Life 2"),
};

describe("ImportedGameCard", () => {
  describe("given a MATCHED game", () => {
    const onAdd = vi.fn();
    const onDismiss = vi.fn();
    const onSelectionChange = vi.fn();

    beforeEach(() => {
      onAdd.mockReset();
      onDismiss.mockReset();
      onSelectionChange.mockReset();
      render(
        <ImportedGameCard
          game={baseGame}
          selected={false}
          onSelectionChange={onSelectionChange}
          onAddToLibrary={onAdd}
          onDismiss={onDismiss}
        />
      );
    });

    it("renders the game name", () => {
      expect(elements.queryName()).not.toBeNull();
    });

    it("renders the Add-to-library button", () => {
      expect(elements.queryAddButton()).not.toBeNull();
    });

    it("does NOT render the IGDB search button", () => {
      expect(elements.querySearchButton()).toBeNull();
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

    it("fires onSelectionChange with (id, true) when the checkbox is toggled", async () => {
      await userEvent.click(elements.getCheckbox());
      expect(onSelectionChange).toHaveBeenCalledWith("ig-1", true);
    });
  });

  describe("given an UNMATCHED game", () => {
    const onManualSearch = vi.fn();
    beforeEach(() => {
      onManualSearch.mockReset();
      render(
        <ImportedGameCard
          game={{ ...baseGame, igdbMatchStatus: "UNMATCHED" }}
          selected={false}
          onSelectionChange={vi.fn()}
          onManualSearch={onManualSearch}
          onDismiss={vi.fn()}
        />
      );
    });

    it("renders the Search-IGDB button instead of Add", () => {
      expect(elements.querySearchButton()).not.toBeNull();
      expect(elements.queryAddButton()).toBeNull();
    });

    it("fires onManualSearch when the Search-IGDB button is clicked", async () => {
      await userEvent.click(elements.querySearchButton()!);
      expect(onManualSearch).toHaveBeenCalledOnce();
    });

    it("disables the bulk-select checkbox (only MATCHED rows are bulk-addable)", () => {
      expect(elements.getCheckbox()).toBeDisabled();
    });
  });

  describe("given a PENDING game", () => {
    beforeEach(() => {
      render(
        <ImportedGameCard
          game={{ ...baseGame, igdbMatchStatus: "PENDING" }}
          selected={false}
          onSelectionChange={vi.fn()}
          onManualSearch={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
    });

    it("renders the Search-IGDB button (same as UNMATCHED)", () => {
      expect(elements.querySearchButton()).not.toBeNull();
    });

    it("does NOT render the Add button", () => {
      expect(elements.queryAddButton()).toBeNull();
    });
  });

  describe("given an IGNORED game", () => {
    const onRestore = vi.fn();
    beforeEach(() => {
      onRestore.mockReset();
      render(
        <ImportedGameCard
          game={{ ...baseGame, igdbMatchStatus: "IGNORED" }}
          selected={false}
          onSelectionChange={vi.fn()}
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
