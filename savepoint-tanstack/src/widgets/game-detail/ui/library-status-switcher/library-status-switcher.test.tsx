import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";
import { deleteLibraryItemFn } from "@/features/manage-library-entry/api/delete-library-item-fn";
import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";
import { clearLibraryStatusManualFn } from "@/features/manage-playthrough/api/clear-library-status-manual-fn";
import { setLibraryStatusManualFn } from "@/features/manage-playthrough/api/set-library-status-manual-fn";

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

vi.mock(
  "@/features/manage-playthrough/api/set-library-status-manual-fn",
  () => ({
    setLibraryStatusManualFn: vi.fn(),
  })
);

vi.mock(
  "@/features/manage-playthrough/api/clear-library-status-manual-fn",
  () => ({
    clearLibraryStatusManualFn: vi.fn(),
  })
);

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
  statusIsManual: false,
  rating: null,
  ...overrides,
});

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

  // Run-derived read-only status pill (data-testid exposed by impl)
  getDerivedPill: () => screen.getByTestId("derived-status-pill"),
  queryDerivedPill: () => screen.queryByTestId("derived-status-pill"),

  // Captions rendered when status is run-derived
  getFollowsCaption: () => screen.getByText("Follows your playthroughs"),
  queryFollowsCaption: () => screen.queryByText("Follows your playthroughs"),

  // Caption rendered when status is manually pinned
  getManualCaption: () => screen.getByText("Set manually"),
  queryManualCaption: () => screen.queryByText("Set manually"),

  // Action buttons in the run-aware states
  getSetManuallyButton: () =>
    screen.getByRole("button", { name: "Set manually" }),
  querySetManuallyButton: () =>
    screen.queryByRole("button", { name: "Set manually" }),
  getFollowMyPlaythroughsButton: () =>
    screen.getByRole("button", { name: "Follow my playthroughs" }),
  queryFollowMyPlaythroughsButton: () =>
    screen.queryByRole("button", { name: "Follow my playthroughs" }),

  // Status picker revealed after clicking "Set manually"
  queryStatusPicker: () => screen.queryByRole("menu", { name: "Set status" }),

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
  clickSetManually: async () =>
    userEvent.click(elements.getSetManuallyButton()),
  clickFollowMyPlaythroughs: async () =>
    userEvent.click(elements.getFollowMyPlaythroughsButton()),
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

  // -------------------------------------------------------------------------
  // State 1: No runs — existing interactive menu (unchanged path)
  // -------------------------------------------------------------------------

  describe("given an existing entry with status PLAYING (desktop) — no runs", () => {
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
          playthroughCount={0}
          derivedStatus="PLAYING"
          statusIsManual={false}
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

    it("does not render a derived-status pill (no runs path is interactive)", () => {
      expect(elements.queryDerivedPill()).toBeNull();
    });

    it("does not show the 'Follows your playthroughs' caption", () => {
      expect(elements.queryFollowsCaption()).toBeNull();
    });

    describe("when the pill is clicked open", () => {
      beforeEach(async () => {
        await actions.openMenu("Playing");
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
            expect(elements.getPill("Shelf")).toBeDefined();
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

  describe("given an existing UP_NEXT entry that has been played (desktop) — no runs", () => {
    beforeEach(async () => {
      setViewport("desktop");
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry({ status: "UP_NEXT", hasBeenPlayed: true })}
          playthroughCount={0}
          derivedStatus="UP_NEXT"
          statusIsManual={false}
        />
      );
      await actions.openMenu("Replay");
    });

    it("labels Up Next as Replay on the pill and in the menu", () => {
      expect(elements.queryPill("Replay")).not.toBeNull();
      expect(
        screen.getByRole("menuitemradio", { name: "Replay" })
      ).toBeDefined();
    });
  });

  describe("given no library entry yet (desktop) — no runs", () => {
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
          playthroughCount={0}
          derivedStatus="SHELF"
          statusIsManual={false}
        />
      );
    });

    it("renders an Add to library action instead of a status pill", () => {
      expect(elements.queryAddToLibrary()).not.toBeNull();
      expect(elements.queryPill("Up Next")).toBeNull();
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

  describe("given an existing entry on mobile — no runs", () => {
    beforeEach(async () => {
      setViewport("mobile");
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry()}
          playthroughCount={0}
          derivedStatus="PLAYING"
          statusIsManual={false}
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

  // -------------------------------------------------------------------------
  // State 2: Runs + !statusIsManual — read-only derived pill
  // -------------------------------------------------------------------------

  describe("given an entry with runs and statusIsManual=false (derived status PLAYING)", () => {
    beforeEach(() => {
      setViewport("desktop");
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry({ status: "PLAYING", statusIsManual: false })}
          playthroughCount={1}
          derivedStatus="PLAYING"
          statusIsManual={false}
        />
      );
    });

    it("renders a read-only derived-status pill (no interactive status button)", () => {
      expect(elements.getDerivedPill()).toBeDefined();
      expect(elements.queryPill("Playing")).toBeNull();
    });

    it("shows the 'Follows your playthroughs' caption", () => {
      expect(elements.getFollowsCaption()).toBeDefined();
    });

    it("does not show a 'Set manually' caption (that is for the manual state)", () => {
      expect(elements.queryManualCaption()).toBeNull();
    });

    it("does not show the 'Follow my playthroughs' action", () => {
      expect(elements.queryFollowMyPlaythroughsButton()).toBeNull();
    });

    it("does not open a status picker before 'Set manually' is clicked", () => {
      expect(elements.queryStatusPicker()).toBeNull();
    });

    it("shows the 'Set manually' action button", () => {
      expect(elements.getSetManuallyButton()).toBeDefined();
    });

    describe("when 'Set manually' is clicked", () => {
      beforeEach(async () => {
        await actions.clickSetManually();
      });

      it("reveals a status picker menu", () => {
        expect(elements.getMenu()).toBeDefined();
      });

      describe("and a status is selected from the picker", () => {
        beforeEach(async () => {
          vi.mocked(setLibraryStatusManualFn).mockResolvedValue(
            undefined as never
          );
          await actions.selectStatus("Played");
        });

        it("calls setLibraryStatusManualFn with the chosen status and item id", async () => {
          await waitFor(() => {
            expect(vi.mocked(setLibraryStatusManualFn)).toHaveBeenCalledWith({
              data: { libraryItemId: 42, status: "PLAYED" },
            });
          });
        });

        it("optimistically reflects the chosen status in the derived pill before the server responds", async () => {
          await waitFor(() => {
            expect(elements.getDerivedPill().textContent).toContain("Played");
          });
        });
      });

      describe("and the server rejects the status change", () => {
        beforeEach(async () => {
          vi.mocked(setLibraryStatusManualFn).mockRejectedValue(
            new Error("server error")
          );
          await actions.selectStatus("Played");
        });

        it("reverts the pill to the original status on error", async () => {
          await waitFor(() => {
            expect(elements.getDerivedPill().textContent).toContain("Playing");
          });
        });
      });
    });
  });

  describe("given an entry with runs, derived status PLAYED (hasBeenPlayed=true), statusIsManual=false", () => {
    beforeEach(() => {
      setViewport("desktop");
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry({
            status: "PLAYED",
            hasBeenPlayed: true,
            statusIsManual: false,
          })}
          playthroughCount={2}
          derivedStatus="PLAYED"
          statusIsManual={false}
        />
      );
    });

    it("renders a read-only pill (not an interactive status button)", () => {
      expect(elements.getDerivedPill()).toBeDefined();
      expect(elements.queryPill("Played")).toBeNull();
    });

    it("shows the 'Follows your playthroughs' caption", () => {
      expect(elements.getFollowsCaption()).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // State 3: Runs + statusIsManual=true — pinned pill + "Follow my playthroughs"
  // -------------------------------------------------------------------------

  describe("given an entry with runs and statusIsManual=true (pinned to PLAYED)", () => {
    beforeEach(() => {
      setViewport("desktop");
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry({ status: "PLAYED", statusIsManual: true })}
          playthroughCount={1}
          derivedStatus="PLAYING"
          statusIsManual={true}
        />
      );
    });

    it("renders a read-only pill showing the pinned status", () => {
      expect(elements.getDerivedPill()).toBeDefined();
      // No interactive status button
      expect(elements.queryPill("Played")).toBeNull();
    });

    it("shows the 'Set manually' caption (not 'Follows your playthroughs')", () => {
      expect(elements.getManualCaption()).toBeDefined();
      expect(elements.queryFollowsCaption()).toBeNull();
    });

    it("shows the 'Follow my playthroughs' action button", () => {
      expect(elements.getFollowMyPlaythroughsButton()).toBeDefined();
    });

    it("does not show a 'Set manually' action button (already manual)", () => {
      expect(elements.querySetManuallyButton()).toBeNull();
    });

    describe("when 'Follow my playthroughs' is clicked", () => {
      beforeEach(async () => {
        vi.mocked(clearLibraryStatusManualFn).mockResolvedValue(
          undefined as never
        );
        await actions.clickFollowMyPlaythroughs();
      });

      it("calls clearLibraryStatusManualFn with the item id", async () => {
        await waitFor(() => {
          expect(vi.mocked(clearLibraryStatusManualFn)).toHaveBeenCalledWith({
            data: { libraryItemId: 42 },
          });
        });
      });

      it("optimistically shows the derived status (PLAYING) in the pill before the server responds", async () => {
        await waitFor(() => {
          expect(elements.getDerivedPill().textContent).toContain("Playing");
        });
      });
    });

    describe("when 'Follow my playthroughs' is clicked and the server rejects", () => {
      beforeEach(async () => {
        vi.mocked(clearLibraryStatusManualFn).mockRejectedValue(
          new Error("server error")
        );
        await actions.clickFollowMyPlaythroughs();
      });

      it("reverts the pill back to the pinned status (PLAYED) on error", async () => {
        await waitFor(() => {
          expect(elements.getDerivedPill().textContent).toContain("Played");
        });
      });
    });
  });

  describe("given an entry with runs, statusIsManual=true, pinned to SHELF", () => {
    beforeEach(() => {
      setViewport("desktop");
      render(
        <LibraryStatusSwitcher
          igdbId={1234}
          gameTitle="Hollow Knight"
          entry={buildEntry({ status: "SHELF", statusIsManual: true })}
          playthroughCount={1}
          derivedStatus="PLAYING"
          statusIsManual={true}
        />
      );
    });

    it("shows the pinned status pill (not the derived PLAYING status)", () => {
      expect(elements.getDerivedPill()).toBeDefined();
      // Must NOT show an interactive button for PLAYING (derived) or SHELF (pinned)
      expect(elements.queryPill("Playing")).toBeNull();
      expect(elements.queryPill("Shelf")).toBeNull();
    });

    it("shows the 'Set manually' caption", () => {
      expect(elements.getManualCaption()).toBeDefined();
    });
  });
});
