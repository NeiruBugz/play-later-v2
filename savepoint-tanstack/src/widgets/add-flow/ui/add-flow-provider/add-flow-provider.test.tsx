import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddGameAction } from "@/features/add-game/ui/add-game-action";
import { AddGameContent } from "@/features/add-game/ui/add-game-content";
import { CommandPalette } from "@/features/command-palette/ui/command-palette";
import { SearchGamesResults } from "@/features/search-games/ui/search-games-results";

import { AddFlowProvider } from "./add-flow-provider";

const mocks = vi.hoisted(() => ({
  addGameFn: vi.fn(),
  undoAddGameFn: vi.fn(),
  searchGamesFn: vi.fn(),
  searchLibraryAwareGamesFn: vi.fn(),
  setStatusFn: vi.fn(),
  undoStatusFn: vi.fn(),
  addToUpNextFn: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
  useNavigate: () => vi.fn(),
  Link: ({
    to,
    params,
    search,
    children,
    ...rest
  }: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
    children: ReactNode;
  }) => {
    let href = to;
    for (const [key, value] of Object.entries(params ?? {})) {
      href = href.replace(`$${key}`, value);
    }
    if (search) href += `?${new URLSearchParams(search).toString()}`;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => true,
  useMediaQuery: () => true,
}));
vi.mock("@/features/add-game/api/add-game-fn", () => ({
  addGameFn: mocks.addGameFn,
}));
vi.mock("@/features/add-game/api/undo-add-game-fn", () => ({
  undoAddGameFn: mocks.undoAddGameFn,
}));
vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: mocks.searchGamesFn,
}));
vi.mock("@/features/command-palette/api/search-games-fn", () => ({
  searchGamesFn: mocks.searchGamesFn,
}));
vi.mock("@/features/search-games/api/search-library-aware-games", () => ({
  searchLibraryAwareGamesFn: mocks.searchLibraryAwareGamesFn,
}));
vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: mocks.setStatusFn,
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: mocks.undoStatusFn,
}));
vi.mock("@/features/up-next/api/add-to-up-next-fn", () => ({
  addToUpNextFn: mocks.addToUpNextFn,
}));

const searchItem = {
  id: 7,
  name: "Hades",
  slug: "hades",
  cover: null,
  first_release_date: null,
  platforms: [],
  library: null,
};

const searchResult = { games: [searchItem], count: 1, ownedCount: 0 };

const elements = {
  getAdd: () => screen.getByRole("button", { name: "Add Hades" }),
  findButton: (name: string) => screen.findByRole("button", { name }),
  queryButton: (name: string) => screen.queryByRole("button", { name }),
  findText: (text: string) => screen.findByText(text),
  queryText: (text: string) => screen.queryByText(text),
};

const actions = {
  tapAdd: async () => userEvent.click(await elements.findButton("Add Hades")),
  tap: async (name: string) => userEvent.click(await elements.findButton(name)),
};

const entryPoints: {
  name: string;
  render: () => void;
  reachAddControl: () => Promise<void>;
}[] = [
  {
    name: "the search page",
    render: () =>
      render(
        <AddFlowProvider>
          <SearchGamesResults
            query="hades"
            renderAddAction={({ igdbId, name }) => (
              <AddGameAction game={{ igdbId, name, library: null }} />
            )}
          />
          <Toaster />
        </AddFlowProvider>
      ),
    reachAddControl: async () => {
      await elements.findButton("Add Hades");
    },
  },
  {
    name: "the add dialog",
    render: () =>
      render(
        <AddFlowProvider>
          <AddGameContent />
          <Toaster />
        </AddFlowProvider>
      ),
    reachAddControl: async () => {
      await userEvent.type(screen.getByLabelText("Search games"), "hades");
      await elements.findButton("Add Hades");
    },
  },
  {
    name: "the command palette",
    render: () =>
      render(
        <AddFlowProvider>
          <CommandPalette
            open
            onOpenChange={vi.fn()}
            renderAddAction={({ igdbId, name }) => (
              <AddGameAction game={{ igdbId, name, library: null }} />
            )}
          />
          <Toaster />
        </AddFlowProvider>
      ),
    reachAddControl: async () => {
      await userEvent.type(
        screen.getByRole("combobox", { name: "Search games" }),
        "hades"
      );
      await elements.findButton("Add Hades");
    },
  },
];

describe("AddFlowProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchGamesFn.mockResolvedValue(searchResult);
    mocks.searchLibraryAwareGamesFn.mockResolvedValue(searchResult);
    mocks.addGameFn.mockResolvedValue({
      libraryItemId: 11,
      created: true,
      status: "WANT",
      upNextPosition: null,
    });
    mocks.undoAddGameFn.mockResolvedValue({});
    mocks.setStatusFn.mockResolvedValue({
      status: "PLAYING",
      upNextPosition: null,
      undo: { snapshot: {} },
    });
    mocks.undoStatusFn.mockResolvedValue({
      status: "WANT",
      upNextPosition: null,
      queueRestored: true,
    });
    mocks.addToUpNextFn.mockResolvedValue({ position: 1 });
  });

  describe.each(entryPoints)("from $name", (entryPoint) => {
    beforeEach(async () => {
      entryPoint.render();
      await entryPoint.reachAddControl();
      await actions.tapAdd();
    });

    it("adds the game and confirms with all three actions", async () => {
      expect(mocks.addGameFn).toHaveBeenCalledWith({ data: { igdbId: 7 } });
      expect(await elements.findText("Added Hades to Want")).toBeDefined();
      expect(await elements.findButton("Start playing")).toBeDefined();
      expect(await elements.findButton("Put in Up Next")).toBeDefined();
      expect(await elements.findButton("Undo")).toBeDefined();
    });

    it("shows In library on the result and leaves the control open", async () => {
      expect(await elements.findText("In library")).toBeDefined();
      expect(elements.queryButton("Add Hades")).toBeNull();
    });

    it("starts playing and shows the status Undo toast", async () => {
      await actions.tap("Start playing");
      expect(mocks.setStatusFn).toHaveBeenCalledWith({
        data: { id: 11, to: "PLAYING" },
      });
      expect(await elements.findText("Hades is now Playing")).toBeDefined();
      expect(await elements.findButton("Undo")).toBeDefined();
    });

    it("puts the game in Up Next and shows the queue marker", async () => {
      await actions.tap("Put in Up Next");
      expect(mocks.addToUpNextFn).toHaveBeenCalledWith({ data: { id: 11 } });
      expect(await elements.findText("Up Next #1")).toBeDefined();
    });

    it("undoes the add", async () => {
      await actions.tap("Undo");
      expect(mocks.undoAddGameFn).toHaveBeenCalledWith({
        data: { libraryItemId: 11 },
      });
      expect(await elements.findButton("Add Hades")).toBeDefined();
    });
  });

  describe("given the queue is full", () => {
    beforeEach(async () => {
      mocks.addToUpNextFn.mockRejectedValue({
        code: "CONFLICT",
        context: { code: "UP_NEXT_FULL" },
      });
      entryPoints[1]!.render();
      await entryPoints[1]!.reachAddControl();
      await actions.tapAdd();
      await actions.tap("Put in Up Next");
    });

    it("shows the full-queue message and keeps the confirmation", async () => {
      expect(
        await elements.findText(
          "Up Next holds 5 games. Remove one to add this."
        )
      ).toBeDefined();
      expect(await elements.findButton("Put in Up Next")).toBeDefined();
    });
  });

  describe("given the add cannot be saved", () => {
    beforeEach(async () => {
      mocks.addGameFn.mockRejectedValue(new Error("down"));
      entryPoints[1]!.render();
      await entryPoints[1]!.reachAddControl();
      await actions.tapAdd();
    });

    it("says so and offers the plus again", async () => {
      expect(
        await elements.findText("Couldn't add Hades. Try again.")
      ).toBeDefined();
      await waitFor(() => expect(elements.getAdd()).toBeEnabled());
    });
  });

  describe("given the game was already in the library", () => {
    beforeEach(async () => {
      mocks.addGameFn.mockResolvedValue({
        libraryItemId: 11,
        created: false,
        status: "WANT",
        upNextPosition: null,
      });
      entryPoints[1]!.render();
      await entryPoints[1]!.reachAddControl();
      await actions.tapAdd();
    });

    it("shows its status and offers no Undo", async () => {
      expect(
        await elements.findText("Hades is already in your library")
      ).toBeDefined();
      expect(elements.queryButton("Undo")).toBeNull();
    });
  });
});
