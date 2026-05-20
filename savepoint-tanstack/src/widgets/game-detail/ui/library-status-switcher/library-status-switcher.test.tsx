import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";
import { deleteLibraryItemFn } from "@/features/manage-library-entry/api/delete-library-item-fn";
import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";

import type { LibraryItem } from "../../../../../shared/lib/prisma/client";
import { LibraryStatusSwitcher } from "./library-status-switcher";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
}));

vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
}));

const buildEntry = (overrides: Partial<LibraryItem> = {}): LibraryItem => ({
  id: 42,
  status: "PLAYING",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-02T00:00:00Z"),
  statusChangedAt: null,
  platform: null,
  userId: "user-1",
  acquisitionType: "DIGITAL",
  gameId: "game-1",
  startedAt: null,
  completedAt: null,
  hasBeenPlayed: false,
  rating: null,
  ...overrides,
});

const elements = {
  getPill: (label: string) => screen.getByRole("tab", { name: label }),
  getMoreTrigger: () =>
    screen.getByRole("button", { name: "More library actions" }),
};

const actions = {
  clickPill: async (label: string) => userEvent.click(elements.getPill(label)),
};

describe("LibraryStatusSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given no library entry yet", () => {
    beforeEach(() => {
      vi.mocked(addGameToLibraryFn).mockResolvedValue(
        buildEntry({ status: "UP_NEXT" })
      );
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={null}
        />
      );
    });

    it("renders all 5 pills with no active selection", () => {
      for (const label of [
        "Up Next",
        "Playing",
        "Shelf",
        "Played",
        "Wishlist",
      ]) {
        expect(elements.getPill(label)).toHaveAttribute(
          "aria-selected",
          "false"
        );
      }
    });

    describe("when the user clicks the Up Next pill", () => {
      beforeEach(async () => {
        await actions.clickPill("Up Next");
      });

      it("calls addGameToLibraryFn with the chosen status", async () => {
        await waitFor(() => {
          expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledWith({
            data: { igdbId: 1234, status: "UP_NEXT" },
          });
        });
      });
    });
  });

  describe("given an existing entry with status PLAYING", () => {
    beforeEach(() => {
      vi.mocked(updateLibraryItemFn).mockResolvedValue(
        buildEntry({ status: "SHELF" })
      );
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry()}
        />
      );
    });

    it("marks the Playing pill as active", () => {
      expect(elements.getPill("Playing")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("renders the rating slider", () => {
      expect(screen.getByRole("slider")).toBeDefined();
    });

    it("renders the overflow menu trigger", () => {
      expect(elements.getMoreTrigger()).toBeDefined();
    });

    describe("when the user clicks the Shelf pill", () => {
      beforeEach(async () => {
        await actions.clickPill("Shelf");
      });

      it("calls updateLibraryItemFn with the chosen status", async () => {
        await waitFor(() => {
          expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledWith({
            data: { itemId: 42, status: "SHELF" },
          });
        });
      });

      it("flips the active pill to Shelf optimistically", () => {
        expect(elements.getPill("Shelf")).toHaveAttribute(
          "aria-selected",
          "true"
        );
      });
    });

    describe("when deleteLibraryItemFn is invoked via the overflow menu", () => {
      beforeEach(async () => {
        vi.mocked(deleteLibraryItemFn).mockResolvedValue(undefined as never);
        await userEvent.click(elements.getMoreTrigger());
        await userEvent.click(
          await screen.findByRole("menuitem", { name: "Remove from library" })
        );
      });

      it("calls deleteLibraryItemFn with the entry id", async () => {
        await waitFor(() => {
          expect(vi.mocked(deleteLibraryItemFn)).toHaveBeenCalledWith({
            data: { itemId: 42 },
          });
        });
      });
    });
  });
});
