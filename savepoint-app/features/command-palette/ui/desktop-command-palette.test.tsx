import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import {
  deleteLibraryItemAction,
  quickAddToLibraryAction,
} from "@/features/manage-library-entry/server-actions";
import { showUndoToast } from "@/shared/components/ui/undo-toast";

import { DesktopCommandPalette } from "./desktop-command-palette";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/manage-library-entry/server-actions", () => ({
  quickAddToLibraryAction: vi.fn(),
  deleteLibraryItemAction: vi.fn(),
}));

vi.mock("@/shared/components/ui/undo-toast", () => ({
  showUndoToast: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../server-actions/get-recent-games", () => ({
  getRecentGamesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

const useGameSearchMock = vi.fn();
vi.mock("@/features/game-search/hooks/use-game-search", () => ({
  useGameSearch: (query: string) => useGameSearchMock(query),
}));

vi.mock("@/shared/hooks/use-debounced-value", () => ({
  useDebouncedValue: (value: string) => value,
}));

const successResult = {
  success: true as const,
  data: {
    id: 99,
    userId: "user-1",
    gameId: "game-1",
    status: "UP_NEXT" as const,
    platform: null,
    acquisitionType: "DIGITAL" as const,
    startedAt: null,
    completedAt: null,
    hasBeenPlayed: false,
    statusChangedAt: null,
    rating: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

function setSearchResults(
  games: Array<{ id: number; name: string; slug: string }>
) {
  useGameSearchMock.mockReturnValue({
    data: {
      pages: [
        {
          games: games.map((g) => ({
            ...g,
            cover: null,
            first_release_date: null,
            platforms: [],
          })),
        },
      ],
    },
    isLoading: false,
    error: null,
  });
}

describe("DesktopCommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameSearchMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  it("renders the 'Add to Up Next' hint chip on each search result row", async () => {
    setSearchResults([
      { id: 111, name: "Hades", slug: "hades" },
      { id: 222, name: "Celeste", slug: "celeste" },
    ]);

    const onClose = vi.fn();
    render(<DesktopCommandPalette isOpen={true} onClose={onClose} />);

    const input = screen.getByPlaceholderText("Search all games to add...");
    await userEvent.type(input, "had");

    await waitFor(() => {
      expect(screen.getByText("Hades")).toBeInTheDocument();
    });

    const hints = await screen.findAllByTestId("quick-add-hint");
    expect(hints).toHaveLength(2);
    hints.forEach((hint) => {
      expect(hint).toHaveTextContent("Add to Up Next");
    });
  });

  it("dispatches quickAddToLibraryAction and closes the palette when Enter is pressed on a result", async () => {
    vi.mocked(quickAddToLibraryAction).mockResolvedValue(successResult);
    setSearchResults([{ id: 111, name: "Hades", slug: "hades" }]);

    const onClose = vi.fn();
    render(<DesktopCommandPalette isOpen={true} onClose={onClose} />);

    const input = screen.getByPlaceholderText("Search all games to add...");
    await userEvent.type(input, "had");

    await waitFor(() => {
      expect(screen.getByText("Hades")).toBeInTheDocument();
    });

    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(quickAddToLibraryAction).toHaveBeenCalledWith({ igdbId: 111 });
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("emits an undo toast on successful quick-add and wires the undo callback to deleteLibraryItemAction", async () => {
    vi.mocked(quickAddToLibraryAction).mockResolvedValue(successResult);
    vi.mocked(deleteLibraryItemAction).mockResolvedValue({
      success: true as const,
      data: { id: 99 },
    } as never);
    setSearchResults([{ id: 111, name: "Hades", slug: "hades" }]);

    render(<DesktopCommandPalette isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText("Search all games to add...");
    await userEvent.type(input, "had");

    await waitFor(() => {
      expect(screen.getByText("Hades")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Hades"));

    await waitFor(() => {
      expect(showUndoToast).toHaveBeenCalledTimes(1);
    });
    const callArg = vi.mocked(showUndoToast).mock.calls[0][0];
    expect(callArg.message).toContain("Hades");

    callArg.onUndo();
    await waitFor(() => {
      expect(deleteLibraryItemAction).toHaveBeenCalledWith({
        libraryItemId: 99,
      });
    });
  });

  it("Esc closes the palette without dispatching quickAddToLibraryAction", async () => {
    setSearchResults([{ id: 111, name: "Hades", slug: "hades" }]);

    const onClose = vi.fn();
    render(<DesktopCommandPalette isOpen={true} onClose={onClose} />);

    const input = screen.getByPlaceholderText("Search all games to add...");
    await userEvent.type(input, "had");

    await waitFor(() => {
      expect(screen.getByText("Hades")).toBeInTheDocument();
    });

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(quickAddToLibraryAction).not.toHaveBeenCalled();
  });
});
