import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchGamesFn as entitySearchGamesFn } from "@/entities/game";
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

// IgdbManualSearch imports searchGamesFn from @/entities/game — mock that path
// so we can control results in tests that interact with the manual-search view.
vi.mock("@/entities/game", () => ({
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

  describe("given the game has a lastPlayedAt date (non-null)", () => {
    beforeEach(() => {
      render(
        <ImportGameModal
          isOpen
          game={{
            ...baseGame,
            lastPlayedAt: new Date("2024-03-15T00:00:00.000Z"),
          }}
          onClose={vi.fn()}
          onImported={vi.fn()}
        />
      );
    });

    it("renders a formatted date string instead of 'Never'", () => {
      // The formatted date varies by locale so just check it's not "Never".
      const lastPlayed = screen.queryByText("Never");
      expect(lastPlayed).toBeNull();
    });
  });

  describe("given import succeeds and onImported is provided", () => {
    const onImported = vi.fn();
    const onClose = vi.fn();

    beforeEach(async () => {
      vi.mocked(importGameToLibraryFn).mockResolvedValue({
        libraryItemId: 2,
        gameId: "g-2",
        gameSlug: "half-life-2",
      } as never);
      render(
        <ImportGameModal
          isOpen
          game={baseGame}
          onClose={onClose}
          onImported={onImported}
        />
      );
      await actions.clickImport();
    });

    it("calls onImported after a successful import", () => {
      expect(onImported).toHaveBeenCalled();
    });

    it("calls onClose after a successful import", () => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("given import throws a generic error (not NeedsManualMatchError)", () => {
    beforeEach(async () => {
      vi.mocked(importGameToLibraryFn).mockRejectedValue(
        new Error("Network error")
      );
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

    it("shows the error via toast.error", async () => {
      const { toast } = await import("sonner");
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Network error");
    });

    it("stays on the status-picker view (does not switch to search)", () => {
      expect(elements.queryImportButton()).not.toBeNull();
      expect(elements.querySearchInput()).toBeNull();
    });
  });

  describe("given import throws a non-Error object", () => {
    beforeEach(async () => {
      vi.mocked(importGameToLibraryFn).mockRejectedValue({ code: "UNKNOWN" });
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

    it("shows a fallback message via toast.error", async () => {
      const { toast } = await import("sonner");
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Could not import game"
      );
    });
  });

  describe("given the user presses Escape to close the dialog (onOpenChange close path)", () => {
    const onClose = vi.fn();

    beforeEach(async () => {
      onClose.mockReset();
      render(
        <ImportGameModal
          isOpen
          game={baseGame}
          onClose={onClose}
          onImported={vi.fn()}
        />
      );
      await userEvent.keyboard("{Escape}");
    });

    it("calls onClose when Escape is pressed (onOpenChange false path)", () => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("given the user is in manual-search view and selects an IGDB result (onSelect path)", () => {
    const onClose = vi.fn();
    const onImported = vi.fn();

    beforeEach(async () => {
      onClose.mockReset();
      onImported.mockReset();

      vi.mocked(entitySearchGamesFn).mockResolvedValue({
        games: [
          {
            id: 777,
            name: "Half-Life 2",
            slug: "half-life-2",
            first_release_date: 1099267200,
            platforms: [{ id: 6, name: "PC", abbreviation: "PC" }],
          },
        ],
        count: 1,
      } as never);

      vi.mocked(importGameToLibraryFn).mockResolvedValue({
        libraryItemId: 5,
        gameId: "g-5",
        gameSlug: "half-life-2",
      } as never);

      render(
        <ImportGameModal
          isOpen
          startOnSearch
          game={baseGame}
          onClose={onClose}
          onImported={onImported}
        />
      );

      const input = screen.getByRole("textbox", { name: "IGDB search query" });
      await userEvent.type(input, "half");
      // Advance past the 300ms debounce.
      vi.advanceTimersByTime(400);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: "Select Half-Life 2" })
        ).not.toBeNull();
      });
      await userEvent.click(
        screen.getByRole("button", { name: "Select Half-Life 2" })
      );
    });

    it("calls importGameToLibraryFn with the selected igdbId as manualIgdbId", async () => {
      await waitFor(() => {
        expect(vi.mocked(importGameToLibraryFn)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ manualIgdbId: 777 }),
          })
        );
      });
    });

    it("calls onImported and onClose after a successful manual import", async () => {
      await waitFor(() => {
        expect(onImported).toHaveBeenCalled();
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
