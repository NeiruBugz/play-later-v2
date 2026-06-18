import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  first_release_date: 1488326400,
};

const GAME_B = {
  id: 119171,
  name: "Hollow Knight: Silksong",
  slug: "hollow-knight-silksong",
  cover: null,
  first_release_date: null,
};

const STUB_SEARCH_RESULT = { games: [GAME_A, GAME_B], count: 2 };
const STUB_EMPTY_RESULT = { games: [], count: 0 };

const onAdded = vi.fn();

const defaultProps = { onAdded };

const elements = {
  getSearchInput: () => screen.getByRole("searchbox", { name: "Search games" }),
  queryQuickAddButton: (name: string) =>
    screen.queryByRole("button", { name: `Add ${name} to library` }),
  getQuickAddButton: (name: string) =>
    screen.getByRole("button", { name: `Add ${name} to library` }),
  getLoadingText: () => screen.getByText("Searching..."),
  queryLoadingText: () => screen.queryByText("Searching..."),
  getNoResults: () => screen.getByText("No results found"),
  queryNoResults: () => screen.queryByText("No results found"),
  queryIgdbResultsHeader: () => screen.queryByText("// IGDB RESULTS"),
  getIgdbResultsHeader: () => screen.getByText("// IGDB RESULTS"),
  queryResultName: (name: string) => screen.queryByText(name),
};

const actions = {
  typeQuery: (query: string) =>
    userEvent.type(elements.getSearchInput(), query),
  submitSearch: (query: string) =>
    userEvent.type(elements.getSearchInput(), `${query}{Enter}`),
  clickQuickAdd: (name: string) =>
    userEvent.click(elements.getQuickAddButton(name)),
};

describe("AddGameModal", () => {
  beforeEach(() => {
    vi.mocked(searchGamesFn).mockReset();
    vi.mocked(addGameToLibraryFn).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    mockRouterInvalidate.mockReset();
    onAdded.mockReset();
  });

  describe("given the modal is rendered with no prior interaction", () => {
    beforeEach(() => {
      render(<AddGameModal {...defaultProps} />);
    });

    it("renders the search input", () => {
      expect(elements.getSearchInput()).toBeDefined();
    });

    it("does not show results, loading, or empty-results before any search", () => {
      expect(elements.queryResultName("Hollow Knight")).toBeNull();
      expect(elements.queryLoadingText()).toBeNull();
      expect(elements.queryNoResults()).toBeNull();
    });

    it("does not call searchGamesFn before the user submits", () => {
      expect(vi.mocked(searchGamesFn)).not.toHaveBeenCalled();
    });
  });

  describe("given the user submits a search and it is pending", () => {
    beforeEach(async () => {
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

  describe("given the user submits a search and results arrive", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      render(<AddGameModal {...defaultProps} />);
      await actions.submitSearch("Hollow");
    });

    it("renders both results with per-row Add buttons and hides loading/empty states", async () => {
      await waitFor(() => {
        expect(elements.queryQuickAddButton("Hollow Knight")).not.toBeNull();
      });
      expect(
        elements.queryQuickAddButton("Hollow Knight: Silksong")
      ).not.toBeNull();
      expect(elements.queryLoadingText()).toBeNull();
      expect(elements.queryNoResults()).toBeNull();
    });

    it("renders the IGDB RESULTS section header", async () => {
      await waitFor(() => {
        expect(elements.queryIgdbResultsHeader()).not.toBeNull();
      });
    });

    it("shows the game title text for each result", async () => {
      await waitFor(() => {
        expect(elements.queryResultName("Hollow Knight")).not.toBeNull();
      });
      expect(
        elements.queryResultName("Hollow Knight: Silksong")
      ).not.toBeNull();
    });
  });

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

  describe("given the user types in the input but does not submit", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      render(<AddGameModal {...defaultProps} />);
      await actions.typeQuery("Hollow");
    });

    it("does not call searchGamesFn until the form is submitted", () => {
      expect(vi.mocked(searchGamesFn)).not.toHaveBeenCalled();
    });
  });

  describe("given the user searches and taps the per-row Add button for Hollow Knight", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      vi.mocked(addGameToLibraryFn).mockResolvedValue(undefined as never);
      render(<AddGameModal {...defaultProps} />);

      await actions.submitSearch("Hollow");
      await waitFor(() => {
        expect(elements.queryQuickAddButton("Hollow Knight")).not.toBeNull();
      });
      await actions.clickQuickAdd("Hollow Knight");
    });

    it("calls addGameToLibraryFn with Hollow Knight's igdbId wrapped in { data }", async () => {
      await waitFor(() => {
        expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledWith({
        data: { igdbId: GAME_A.id },
      });
    });

    it("fires toast.success and calls router.invalidate on success", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledOnce();
      });
      expect(mockRouterInvalidate).toHaveBeenCalledOnce();
    });
  });

  describe("given the user searches and taps the per-row Add button for Silksong", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      vi.mocked(addGameToLibraryFn).mockResolvedValue(undefined as never);
      render(<AddGameModal {...defaultProps} />);

      await actions.submitSearch("Hollow");
      await waitFor(() => {
        expect(
          elements.queryQuickAddButton("Hollow Knight: Silksong")
        ).not.toBeNull();
      });
      await actions.clickQuickAdd("Hollow Knight: Silksong");
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

  describe("given the user submits the search form with an empty query", () => {
    beforeEach(async () => {
      render(<AddGameModal {...defaultProps} />);
      const searchInput = screen.getByRole("searchbox", {
        name: "Search games",
      });
      // eslint-disable-next-line testing-library/no-node-access
      const form = searchInput.closest("form")!;
      fireEvent.submit(form);
    });

    it("does not call searchGamesFn when the query is empty", () => {
      expect(vi.mocked(searchGamesFn)).not.toHaveBeenCalled();
    });
  });

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
        expect(elements.queryQuickAddButton("Hollow Knight")).not.toBeNull();
      });
      await actions.clickQuickAdd("Hollow Knight");
    });

    it("fires toast.error once with the rejection message", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(ADD_ERROR_MESSAGE);
    });
  });
});
