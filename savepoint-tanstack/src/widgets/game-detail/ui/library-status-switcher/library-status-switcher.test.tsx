import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  getPill: () =>
    screen.getByRole("button", { name: /^Change library status:/ }),
  queryPill: () =>
    screen.queryByRole("button", { name: /^Change library status:/ }),
  getAddToLibrary: () => screen.getByRole("button", { name: "Add to library" }),
  queryAddToLibrary: () =>
    screen.queryByRole("button", { name: "Add to library" }),
  getMenu: () => screen.getByRole("menu", { name: "Set status" }),
  queryMenu: () => screen.queryByRole("menu", { name: "Set status" }),
  getStatusOption: (label: string) =>
    screen.getByRole("menuitemradio", { name: label }),
  queryRating: () => screen.queryByRole("slider"),
  getMoreTrigger: () =>
    screen.getByRole("button", { name: "More library actions" }),
};

const actions = {
  openMenu: async () => userEvent.click(elements.getPill()),
  selectStatus: async (label: string) =>
    userEvent.click(elements.getStatusOption(label)),
};

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
      setViewport("desktop");
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

    it("shows a pill labelled with the current status", () => {
      expect(elements.getPill()).toHaveAccessibleName(
        "Change library status: Playing"
      );
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

    describe("when the pill is clicked open", () => {
      beforeEach(async () => {
        await actions.openMenu();
      });

      it("opens a menu listing all 5 statuses", () => {
        const menu = elements.getMenu();
        for (const label of [
          "Wishlist",
          "Shelf",
          "Up Next",
          "Playing",
          "Played",
        ]) {
          expect(
            within(menu).getByRole("menuitemradio", { name: label })
          ).toBeDefined();
        }
      });

      it("checks the current status option", () => {
        expect(elements.getStatusOption("Playing")).toHaveAttribute(
          "aria-checked",
          "true"
        );
        expect(elements.getStatusOption("Shelf")).toHaveAttribute(
          "aria-checked",
          "false"
        );
      });

      describe("and a different status is selected", () => {
        beforeEach(async () => {
          await actions.selectStatus("Shelf");
        });

        it("calls updateLibraryItemFn with the chosen status", async () => {
          await waitFor(() => {
            expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledWith({
              data: { itemId: 42, status: "SHELF" },
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
            expect(elements.getPill()).toHaveAccessibleName(
              "Change library status: Shelf"
            );
          });
        });
      });
    });

    describe("when removed via the overflow menu", () => {
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

  describe("given an existing UP_NEXT entry that has been played (desktop)", () => {
    beforeEach(async () => {
      setViewport("desktop");
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry({ status: "UP_NEXT", hasBeenPlayed: true })}
        />
      );
      await actions.openMenu();
    });

    it("labels Up Next as Replay on the pill and in the menu", () => {
      expect(elements.queryPill()).toHaveAccessibleName(
        "Change library status: Replay"
      );
      expect(
        screen.getByRole("menuitemradio", { name: "Replay" })
      ).toBeDefined();
    });
  });

  describe("given no library entry yet (desktop)", () => {
    beforeEach(() => {
      setViewport("desktop");
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

    it("renders an Add to library action instead of a status pill", () => {
      expect(elements.queryAddToLibrary()).not.toBeNull();
      expect(elements.queryPill()).toBeNull();
    });

    it("does not render a rating control", () => {
      expect(elements.queryRating()).toBeNull();
    });

    describe("when a status is chosen from the add menu", () => {
      beforeEach(async () => {
        await userEvent.click(elements.getAddToLibrary());
        await actions.selectStatus("Up Next");
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
      await actions.openMenu();
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
