import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";
import { deleteLibraryItemFn } from "@/features/manage-library-entry/api/delete-library-item-fn";
import { setStatusFn } from "@/features/manage-library-entry/api/set-status-fn";

import type { LibraryItem } from "../../../../../shared/lib/prisma/client";
import { buildLibraryItem } from "../../../../../test/factories/builders.ts";
import { LibraryStatusSwitcher } from "./library-status-switcher";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
}));

vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/get-platform-options", () => ({
  getPlatformOptionsFn: vi.fn(() =>
    Promise.resolve([{ label: "This game", platforms: ["PC"] }])
  ),
}));

vi.mock("@/features/manage-library-entry/api/search-platforms-fn", () => ({
  searchPlatformsFn: vi.fn(() => Promise.resolve([])),
}));

const DESKTOP_QUERY = "(min-width: 768px)";

const setViewport = (variant: "desktop" | "mobile") => {
  const isDesktop = variant === "desktop";
  const matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === DESKTOP_QUERY ? isDesktop : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.stubGlobal("matchMedia", matchMedia);
};

const buildEntry = (overrides: Partial<LibraryItem> = {}): LibraryItem =>
  buildLibraryItem({ id: 42, status: "PLAYING", ...overrides });

// ---------------------------------------------------------------------------
// Element vocabulary — "how we find UI elements" in one place
// ---------------------------------------------------------------------------
const elements = {
  // Interactive status pill (no-runs path)
  getPill: (label: string) =>
    screen.getByRole("button", { name: `Change library status: ${label}` }),
  queryPill: (label: string) =>
    screen.queryByRole("button", { name: `Change library status: ${label}` }),

  getAddToLibrary: () => screen.getByRole("button", { name: "Add to library" }),
  queryAddToLibrary: () =>
    screen.queryByRole("button", { name: "Add to library" }),

  // Status menu (interactive dropdown / sheet)
  getMenu: () => screen.getByRole("menu", { name: "Set status" }),
  queryMenu: () => screen.queryByRole("menu", { name: "Set status" }),
  getStatusOption: (label: string) =>
    screen.getByRole("menuitemradio", { name: label }),

  queryRating: () => screen.queryByRole("slider"),
  getMoreTrigger: () =>
    screen.getByRole("button", { name: "More library actions" }),
};

// ---------------------------------------------------------------------------
// Action vocabulary — domain-verb user interactions
// ---------------------------------------------------------------------------
const actions = {
  openMenu: async (label: string) => userEvent.click(elements.getPill(label)),
  selectStatus: async (label: string) =>
    userEvent.click(elements.getStatusOption(label)),
};

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe("LibraryStatusSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setViewport("desktop");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("given an existing entry with status PLAYING (desktop)", () => {
    beforeEach(() => {
      vi.mocked(setStatusFn).mockResolvedValue({
        status: "DONE",
        upNextPosition: null,
        undo: {} as never,
      });
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry()}
        />
      );
    });

    it("shows a pill labelled with the current status", () => {
      expect(elements.getPill("Playing")).toBeDefined();
    });

    it("does not render a rating control (rating lives in Your Record)", () => {
      expect(elements.queryRating()).toBeNull();
    });

    it("keeps the overflow / remove affordance available", () => {
      expect(elements.getMoreTrigger()).toBeDefined();
    });

    it("does not show the status menu until the pill is clicked", () => {
      expect(elements.queryMenu()).toBeNull();
    });

    it("never shows the retired run-derived / manual-override controls", () => {
      expect(screen.queryByText("Follows your playthroughs")).toBeNull();
      expect(screen.queryByText("Set manually")).toBeNull();
      expect(screen.queryByText("Follow my playthroughs")).toBeNull();
    });

    describe("when the pill is clicked open", () => {
      beforeEach(async () => {
        await actions.openMenu("Playing");
      });

      it("opens a menu listing exactly Want, Playing and Done", () => {
        const menu = elements.getMenu();
        expect(
          within(menu)
            .getAllByRole("menuitemradio")
            .map((o) => o.textContent)
        ).toEqual(["Want", "Playing", "Done"]);
      });

      it("checks the current status option", () => {
        expect(elements.getStatusOption("Playing")).toHaveAttribute(
          "aria-checked",
          "true"
        );
        expect(elements.getStatusOption("Want")).toHaveAttribute(
          "aria-checked",
          "false"
        );
      });

      describe("and a different status is selected", () => {
        beforeEach(async () => {
          await actions.selectStatus("Done");
        });

        it("calls setStatusFn with the item id and chosen status", async () => {
          await waitFor(() => {
            expect(vi.mocked(setStatusFn)).toHaveBeenCalledWith({
              data: { id: 42, to: "DONE" },
            });
          });
        });

        it("closes the menu", async () => {
          await waitFor(() => {
            expect(elements.queryMenu()).toBeNull();
          });
        });

        it("reflects the new status on the pill", async () => {
          await waitFor(() => {
            expect(elements.getPill("Done")).toBeDefined();
          });
        });
      });
    });

    describe("when Remove from library is chosen from the overflow menu", () => {
      beforeEach(async () => {
        vi.mocked(deleteLibraryItemFn).mockResolvedValue(undefined as never);
        await userEvent.click(elements.getMoreTrigger());
        await userEvent.click(
          await screen.findByRole("menuitem", { name: "Remove from library" })
        );
      });

      it("asks for confirmation without removing yet", async () => {
        expect(
          await screen.findByText("Remove Hollow Knight from your library?")
        ).toBeDefined();
        expect(
          screen.getByText(
            "Its play history and rating will be deleted. Your notes stay in your Journal."
          )
        ).toBeDefined();
        expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
      });

      it("keeps the game when Cancel is chosen", async () => {
        await userEvent.click(
          await screen.findByRole("button", { name: "Cancel" })
        );
        expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
      });

      it("removes the game with the entry id when Remove is chosen", async () => {
        await userEvent.click(
          await screen.findByRole("button", { name: "Remove" })
        );
        await waitFor(() => {
          expect(vi.mocked(deleteLibraryItemFn)).toHaveBeenCalledWith({
            data: { itemId: 42 },
          });
        });
      });
    });
  });

  describe("given the server rejects a status change", () => {
    beforeEach(async () => {
      vi.mocked(setStatusFn).mockRejectedValue(new Error("server error"));
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry()}
        />
      );
      await actions.openMenu("Playing");
      await actions.selectStatus("Done");
    });

    it("reverts the pill to the original status", async () => {
      await waitFor(() => {
        expect(elements.getPill("Playing")).toBeDefined();
      });
    });
  });

  describe("given no library entry yet (desktop)", () => {
    beforeEach(() => {
      vi.mocked(addGameToLibraryFn).mockResolvedValue(
        buildEntry({ status: "WANT" })
      );
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={null}
        />
      );
    });

    it("renders an Add to library action instead of a status pill", () => {
      expect(elements.queryAddToLibrary()).not.toBeNull();
      expect(elements.queryPill("Want")).toBeNull();
    });

    it("does not render a rating control", () => {
      expect(elements.queryRating()).toBeNull();
    });

    describe("when a status is chosen from the add menu", () => {
      beforeEach(async () => {
        await userEvent.click(elements.getAddToLibrary());
        await actions.selectStatus("Want");
      });

      it("calls addGameToLibraryFn with the chosen status", async () => {
        await waitFor(() => {
          expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledWith({
            data: { igdbId: 1234, status: "WANT" },
          });
        });
      });
    });
  });

  describe("given an existing entry on mobile", () => {
    beforeEach(async () => {
      setViewport("mobile");
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry()}
        />
      );
      await actions.openMenu("Playing");
    });

    it("opens the status menu inside a bottom sheet", () => {
      expect(elements.getMenu()).toBeDefined();
      expect(screen.getByTestId("status-sheet")).toBeDefined();
    });

    it("checks the current status inside the sheet", () => {
      expect(elements.getStatusOption("Playing")).toHaveAttribute(
        "aria-checked",
        "true"
      );
    });
  });
});
