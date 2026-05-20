import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportedGame } from "@/entities/imported-game/model/types";
import { searchGamesFn } from "@/features/add-game/api/search-games-fn";
import { importGameToLibraryFn } from "@/features/steam-import/api/import-game-to-library";

import { ImportGameModal } from "./import-game-modal";

vi.mock("@/features/steam-import/api/import-game-to-library", () => ({
  importGameToLibraryFn: vi.fn(),
}));

vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const baseGame: ImportedGame = {
  id: "ig-1",
  name: "Half-Life 2",
  storefront: "STEAM",
  storefrontGameId: "220",
  playtime: 120,
  playtimeWindows: 120,
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
  getImportButton: () => screen.getByRole("button", { name: "Import" }),
  queryImportButton: () => screen.queryByRole("button", { name: "Import" }),
  queryCancelButton: () => screen.queryByRole("button", { name: "Cancel" }),
  queryBackButton: () => screen.queryByRole("button", { name: "Back" }),
  querySearchInput: () =>
    screen.queryByRole("textbox", { name: "IGDB search query" }),
  queryStatusTrigger: () => screen.queryByLabelText("Library status"),
  queryFallbackMessage: () =>
    screen.queryByText(/Search IGDB and pick the correct entry\./),
};

const actions = {
  clickImport: () => userEvent.click(elements.getImportButton()),
  clickBack: async () => {
    const btn = elements.queryBackButton();
    if (!btn) throw new Error("Back button not present");
    await userEvent.click(btn);
  },
};

describe(ImportGameModal, () => {
  beforeEach(() => {
    vi.mocked(importGameToLibraryFn).mockReset();
    vi.mocked(searchGamesFn).mockReset();
  });

  describe("given the modal opens on the status-picker view", () => {
    beforeEach(() => {
      render(
        <ImportGameModal
          isOpen
          game={baseGame}
          onClose={vi.fn()}
          onImported={vi.fn()}
        />
      );
    });

    it("shows the Import action and the Library status control", () => {
      expect(elements.queryImportButton()).not.toBeNull();
      expect(elements.queryStatusTrigger()).not.toBeNull();
      expect(elements.querySearchInput()).toBeNull();
    });

    it("invokes importGameToLibraryFn without manualIgdbId on submit", async () => {
      vi.mocked(importGameToLibraryFn).mockResolvedValue({
        libraryItemId: 1,
        gameId: "g-1",
        gameSlug: "half-life-2",
      } as never);
      await actions.clickImport();
      expect(vi.mocked(importGameToLibraryFn)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          importedGameId: "ig-1",
          status: expect.any(String),
        }),
      });
      const call = vi.mocked(importGameToLibraryFn).mock.calls[0]?.[0];
      expect(call?.data).not.toHaveProperty("manualIgdbId");
    });
  });

  describe("given import throws NeedsManualMatchError", () => {
    beforeEach(async () => {
      const err = Object.assign(new Error("needs manual"), {
        name: "NeedsManualMatchError",
      });
      vi.mocked(importGameToLibraryFn).mockRejectedValue(err);
      render(
        <ImportGameModal
          isOpen
          game={baseGame}
          onClose={vi.fn()}
          onImported={vi.fn()}
        />
      );
      await actions.clickImport();
    });

    it("switches to the manual-search view", () => {
      expect(elements.querySearchInput()).not.toBeNull();
      expect(elements.queryFallbackMessage()).not.toBeNull();
    });

    it("offers a Back button to return to status pick", async () => {
      expect(elements.queryBackButton()).not.toBeNull();
      await actions.clickBack();
      expect(elements.queryImportButton()).not.toBeNull();
    });
  });

  describe("given the caller opens with startOnSearch=true", () => {
    beforeEach(() => {
      render(
        <ImportGameModal
          isOpen
          game={baseGame}
          startOnSearch
          onClose={vi.fn()}
          onImported={vi.fn()}
        />
      );
    });

    it("renders the manual-search input directly", () => {
      expect(elements.querySearchInput()).not.toBeNull();
      expect(elements.queryImportButton()).toBeNull();
    });
  });
});
