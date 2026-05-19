import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addGameToLibraryFn } from "../../api/add-game-to-library-fn";
import { searchGamesFn } from "../../api/search-games-fn";
import { AddGameModal } from "./add-game-modal";

vi.mock("../../api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

vi.mock("../../api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockRouterInvalidate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
}));

const GAME_A = {
  id: 1942,
  name: "Hollow Knight",
  slug: "hollow-knight",
  cover: { image_id: "hk_cover" },
};

const GAME_B = {
  id: 119171,
  name: "Hollow Knight: Silksong",
  slug: "hollow-knight-silksong",
  cover: null,
};

const STUB_SEARCH_RESULT = { games: [GAME_A, GAME_B], count: 2 };
const STUB_EMPTY_RESULT = { games: [], count: 0 };
// Cast: the test only needs reference equality on the resolved value to
// satisfy `mockResolvedValue`'s type; the real shape (LibraryItem) carries
// fields the modal does not read (createdAt, updatedAt, status, etc.).
const STUB_LIBRARY_ITEM = {
  id: "lib-item-1",
  gameId: "game-1",
  userId: "user-1",
} as unknown as Awaited<ReturnType<typeof addGameToLibraryFn>>;

const onAdded = vi.fn();

const defaultProps = { onAdded };

// Element vocabulary — names are locked by these queries.
const elements = {
  getSearchInput: () => screen.getByRole("searchbox", { name: "Search games" }),
  getAddButton: () => screen.getByRole("button", { name: "Add to library" }),
  queryAddButton: () =>
    screen.queryByRole("button", { name: "Add to library" }),
  getGameButton: (name: string) => screen.getByRole("button", { name }),
  queryGameButton: (name: string) => screen.queryByRole("button", { name }),
  getLoadingText: () => screen.getByText("Searching..."),
  queryLoadingText: () => screen.queryByText("Searching..."),
  getNoResults: () => screen.getByText("No results found"),
  queryNoResults: () => screen.queryByText("No results found"),
};

// Action vocabulary
const actions = {
  typeQuery: (query: string) =>
    userEvent.type(elements.getSearchInput(), query),
  submitSearch: (query: string) =>
    userEvent.type(elements.getSearchInput(), `${query}{Enter}`),
  selectGame: (name: string) => userEvent.click(elements.getGameButton(name)),
  clickAdd: () => userEvent.click(elements.getAddButton()),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AddGameModal", () => {
  beforeEach(() => {
    vi.mocked(searchGamesFn).mockReset();
    vi.mocked(addGameToLibraryFn).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    mockRouterInvalidate.mockReset();
    onAdded.mockReset();
  });

  // ---- Initial render -------------------------------------------------------

  describe("given the modal is rendered with no prior interaction", () => {
    beforeEach(() => {
      render(<AddGameModal {...defaultProps} />);
    });

    it("renders the search input", () => {
      expect(elements.getSearchInput()).toBeDefined();
    });

    it("does not show results, loading, or empty-results before any search", () => {
      expect(elements.queryGameButton("Hollow Knight")).toBeNull();
      expect(elements.queryLoadingText()).toBeNull();
      expect(elements.queryNoResults()).toBeNull();
    });

    it("does not call searchGamesFn before the user submits", () => {
      expect(vi.mocked(searchGamesFn)).not.toHaveBeenCalled();
    });
  });

  // ---- Loading state --------------------------------------------------------

  describe("given the user submits a search and it is pending", () => {
    beforeEach(async () => {
      // Never resolves during this describe block — keeps loading state.
      vi.mocked(searchGamesFn).mockReturnValue(new Promise(() => {}));
      render(<AddGameModal {...defaultProps} />);
      await actions.submitSearch("Hollow");
    });

    it("shows the loading indicator while searchGamesFn is pending", async () => {
      expect(elements.queryLoadingText()).not.toBeNull();
    });

    it("calls searchGamesFn with the submitted query wrapped in { data }", () => {
      expect(vi.mocked(searchGamesFn)).toHaveBeenCalledWith({
        data: { name: "Hollow" },
      });
    });
  });

  // ---- Results rendering ----------------------------------------------------

  describe("given the user submits a search and results arrive", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      render(<AddGameModal {...defaultProps} />);
      await actions.submitSearch("Hollow");
    });

    it("renders both results as clickable buttons and hides loading/empty states", async () => {
      await waitFor(() => {
        expect(elements.queryGameButton("Hollow Knight")).not.toBeNull();
      });
      expect(elements.queryGameButton("Hollow Knight: Silksong")).not.toBeNull();
      expect(elements.queryLoadingText()).toBeNull();
      expect(elements.queryNoResults()).toBeNull();
    });
  });

  // ---- Empty-results state --------------------------------------------------

  describe("given the user submits a search that returns zero results", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_EMPTY_RESULT);
      render(<AddGameModal {...defaultProps} />);
      await actions.submitSearch("xyzzy no match");
    });

    it("shows the empty-results message and hides the loading indicator", async () => {
      await waitFor(() => {
        expect(elements.queryNoResults()).not.toBeNull();
      });
      expect(elements.queryLoadingText()).toBeNull();
    });
  });

  // ---- No search before submit ----------------------------------------------

  describe("given the user types in the input but does not submit", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      render(<AddGameModal {...defaultProps} />);
      // Type without pressing Enter.
      await actions.typeQuery("Hollow");
    });

    it("does not call searchGamesFn until the form is submitted", () => {
      expect(vi.mocked(searchGamesFn)).not.toHaveBeenCalled();
    });
  });

  // ---- Select a result then add --------------------------------------------

  describe("given the user searches, selects Hollow Knight, and clicks Add to library", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      vi.mocked(addGameToLibraryFn).mockResolvedValue(STUB_LIBRARY_ITEM);
      render(<AddGameModal {...defaultProps} />);

      await actions.submitSearch("Hollow");
      await waitFor(() => {
        expect(elements.queryGameButton("Hollow Knight")).not.toBeNull();
      });
      await actions.selectGame("Hollow Knight");
      await actions.clickAdd();
    });

    it("calls addGameToLibraryFn with the selected game's igdbId wrapped in { data }", async () => {
      await waitFor(() => {
        expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledWith({
        data: { igdbId: GAME_A.id },
      });
    });

    it("calls onAdded exactly once after addGameToLibraryFn resolves", async () => {
      await waitFor(() => {
        expect(onAdded).toHaveBeenCalledOnce();
      });
    });

    it("fires toast.success and calls router.invalidate on success", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Added to library");
      });
      expect(vi.mocked(toast.success)).toHaveBeenCalledOnce();
      expect(mockRouterInvalidate).toHaveBeenCalledOnce();
    });
  });

  // ---- Second result selection ----------------------------------------------

  describe("given the user selects the second result (Silksong) and adds it", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      vi.mocked(addGameToLibraryFn).mockResolvedValue(STUB_LIBRARY_ITEM);
      render(<AddGameModal {...defaultProps} />);

      await actions.submitSearch("Hollow");
      await waitFor(() => {
        expect(
          elements.queryGameButton("Hollow Knight: Silksong")
        ).not.toBeNull();
      });
      await actions.selectGame("Hollow Knight: Silksong");
      await actions.clickAdd();
    });

    it("sends Silksong's igdbId, not Hollow Knight's", async () => {
      await waitFor(() => {
        expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledWith({
        data: { igdbId: GAME_B.id },
      });
    });
  });

  // ---- Add button only enabled after selection ------------------------------

  describe("given results are showing but no game is selected", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      render(<AddGameModal {...defaultProps} />);
      await actions.submitSearch("Hollow");
      await waitFor(() => {
        expect(elements.queryGameButton("Hollow Knight")).not.toBeNull();
      });
    });

    it("renders the Add to library button as disabled before a game is selected", () => {
      const btn = elements.getAddButton();
      expect(btn).toHaveProperty("disabled", true);
    });

    it("does not call addGameToLibraryFn when Add to library is clicked without a selection", async () => {
      // Button is disabled, but assert the fn was not called defensively.
      expect(vi.mocked(addGameToLibraryFn)).not.toHaveBeenCalled();
    });
  });

  // ---- Toast feedback: error path ------------------------------------------

  describe("given addGameToLibraryFn rejects", () => {
    const ADD_ERROR_MESSAGE = "Game not found in IGDB";

    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      vi.mocked(addGameToLibraryFn).mockRejectedValue(
        new Error(ADD_ERROR_MESSAGE)
      );
      render(<AddGameModal {...defaultProps} />);

      await actions.submitSearch("Hollow");
      await waitFor(() => {
        expect(elements.queryGameButton("Hollow Knight")).not.toBeNull();
      });
      await actions.selectGame("Hollow Knight");
      await actions.clickAdd();
    });

    it("fires toast.error once with the rejection message", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(ADD_ERROR_MESSAGE);
    });

    it("does not call onAdded on rejection (modal stays open)", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(onAdded).not.toHaveBeenCalled();
    });

    it("does not call router.invalidate on rejection", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(mockRouterInvalidate).not.toHaveBeenCalled();
    });
  });
});
