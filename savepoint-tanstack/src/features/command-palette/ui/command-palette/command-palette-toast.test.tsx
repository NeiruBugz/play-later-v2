import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddGameAction } from "@/features/add-game/ui/add-game-action";
import { AddFlowProvider } from "@/widgets/add-flow";

import { CommandPalette } from "./command-palette";

const mocks = vi.hoisted(() => ({
  addGameFn: vi.fn(),
  undoAddGameFn: vi.fn(),
  searchGamesFn: vi.fn(),
  setStatusFn: vi.fn(),
  undoStatusFn: vi.fn(),
  addToUpNextFn: vi.fn(),
  onOpenChange: vi.fn(),
  isDesktop: true,
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({ children, ...rest }: { children: React.ReactNode }) => (
    <a {...rest}>{children}</a>
  ),
}));
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => mocks.isDesktop,
  useMediaQuery: () => mocks.isDesktop,
}));
vi.mock("@/features/add-game/api/add-game-fn", () => ({
  addGameFn: mocks.addGameFn,
}));
vi.mock("@/features/add-game/api/undo-add-game-fn", () => ({
  undoAddGameFn: mocks.undoAddGameFn,
}));
vi.mock("../../api/search-games-fn", () => ({
  searchGamesFn: mocks.searchGamesFn,
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

describe.each([
  { name: "dialog", isDesktop: true },
  { name: "sheet", isDesktop: false },
])("command palette $name with the add confirmation toast", ({ isDesktop }) => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.isDesktop = isDesktop;
    mocks.searchGamesFn.mockResolvedValue({
      games: [
        {
          id: 7,
          name: "Hades",
          slug: "hades",
          cover: null,
          first_release_date: null,
          platforms: [],
          library: null,
        },
      ],
      count: 1,
    });
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
    mocks.addToUpNextFn.mockResolvedValue({ position: 1 });

    render(
      <AddFlowProvider>
        <CommandPalette
          open
          onOpenChange={mocks.onOpenChange}
          renderAddAction={({ igdbId, name }) => (
            <AddGameAction game={{ igdbId, name, library: null }} />
          )}
        />
        <Toaster />
      </AddFlowProvider>
    );
    await userEvent.type(
      screen.getByRole("combobox", { name: "Search games" }),
      "hades"
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Add Hades" })
    );
    await screen.findByText("Added Hades to Want");
  });

  it.each(["Undo", "Start playing", "Put in Up Next"])(
    "stays open when %s is tapped in the toast",
    async (action) => {
      await userEvent.click(screen.getByRole("button", { name: action }));

      expect(mocks.onOpenChange).not.toHaveBeenCalled();
    }
  );
});
