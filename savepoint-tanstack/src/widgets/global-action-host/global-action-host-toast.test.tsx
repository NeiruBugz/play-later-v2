import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddFlowProvider } from "@/widgets/add-flow";

import { GlobalActionHost } from "./index";

const mocks = vi.hoisted(() => ({
  addGameFn: vi.fn(),
  undoAddGameFn: vi.fn(),
  searchGamesFn: vi.fn(),
  setStatusFn: vi.fn(),
  undoStatusFn: vi.fn(),
  addToUpNextFn: vi.fn(),
  navigate: vi.fn(),
  isDesktop: true,
}));

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => ({ action: "add-game" }),
  useNavigate: () => mocks.navigate,
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({ children, ...rest }: { children: React.ReactNode }) => (
    <a {...rest}>{children}</a>
  ),
}));
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => mocks.isDesktop,
  useMediaQuery: () => mocks.isDesktop,
}));
vi.mock("@/features/compose-journal-entry", () => ({
  LogSessionForGame: () => null,
  LogSessionGamePicker: () => null,
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
])("add $name with the add confirmation toast", ({ isDesktop }) => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.isDesktop = isDesktop;
    mocks.searchGamesFn.mockResolvedValue({
      games: [{ id: 7, name: "Hades", slug: "hades", library: null }],
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
        <GlobalActionHost />
        <Toaster />
      </AddFlowProvider>
    );
    await userEvent.type(screen.getByLabelText("Search games"), "hades");
    await userEvent.click(
      await screen.findByRole("button", { name: "Add Hades" })
    );
    await screen.findByText("Added Hades to Want");
  });

  it.each(["Undo", "Start playing", "Put in Up Next"])(
    "stays open when %s is tapped in the toast",
    async (action) => {
      await userEvent.click(screen.getByRole("button", { name: action }));

      expect(mocks.navigate).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Search games")).toBeDefined();
    }
  );
});
