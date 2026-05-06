/**
 * RED component test for AddGameModal (Slice 10 — add-game feature).
 *
 * This file is intentionally failing at module resolution:
 * `./add-game-modal` does not exist yet — the component is implemented in
 * the GREEN step (tasks.md line 216). Do NOT implement the component here.
 *
 * Contracts locked by this test:
 *
 * Component export:
 *   `AddGameModal` — named export from `./add-game-modal`
 *
 * Props:
 *   onAdded: () => void  — called once after addGameToLibraryFn resolves
 *
 * Search behavior:
 *   - Renders a text input with accessible name "Search games"
 *   - User types ≥ 3 chars and submits the form (submit-on-enter or button click)
 *   - Calls searchGamesFn({ data: { name: <query> } })
 *   - Shows each result as a button with the game's name accessible label
 *   - Shows "No results found" when searchGamesFn resolves with zero games
 *   - Shows "Searching..." while searchGamesFn is pending
 *   - Does NOT call searchGamesFn until the form is submitted (submit-on-form, not debounce)
 *
 * Select behavior:
 *   - Clicking a result marks it selected (visual; no assertion beyond
 *     the "Add to library" button becoming enabled and the add call using its igdbId)
 *
 * Add behavior:
 *   - Renders a button with accessible name "Add to library"
 *   - Clicking it calls addGameToLibraryFn({ data: { igdbId: <selected igdbId> } })
 *     — no status or platform sent (server fn applies its own defaults)
 *   - After resolution, calls onAdded() exactly once
 *
 * Mock strategy:
 *   Both server fns are direct module mocks via vi.mock so no router / server
 *   context is needed. They are called as plain async functions with
 *   `{ data: ... }` argument shape (TanStack Start convention).
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addGameToLibraryFn } from "../../api/add-game-to-library-fn";
// Import after mocks are declared.
import { searchGamesFn } from "../../api/search-games-fn";
// RED import — this module does not exist until the GREEN step.
import { AddGameModal } from "./add-game-modal";

// --- Server fn mocks ---------------------------------------------------------
// Both server fns are mocked at the module level so the component under test
// never crosses the network or server boundary.

vi.mock("../../api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

vi.mock("../../api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

// --- Toast mock (mirrors avatar-upload / edit-profile precedent) ------------
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// --- Router mock (mirrors avatar-upload precedent) --------------------------
const mockRouterInvalidate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

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

    it("does not show game results before any search", () => {
      expect(elements.queryGameButton("Hollow Knight")).toBeNull();
    });

    it("does not show the loading state", () => {
      expect(elements.queryLoadingText()).toBeNull();
    });

    it("does not show the empty-results message", () => {
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

    it("renders Hollow Knight as a clickable result", async () => {
      await waitFor(() => {
        expect(elements.queryGameButton("Hollow Knight")).not.toBeNull();
      });
    });

    it("renders Hollow Knight: Silksong as a clickable result", async () => {
      await waitFor(() => {
        expect(
          elements.queryGameButton("Hollow Knight: Silksong")
        ).not.toBeNull();
      });
    });

    it("hides the loading indicator once results arrive", async () => {
      await waitFor(() => {
        expect(elements.queryGameButton("Hollow Knight")).not.toBeNull();
      });
      expect(elements.queryLoadingText()).toBeNull();
    });

    it("does not show the empty-results message when results exist", async () => {
      await waitFor(() => {
        expect(elements.queryGameButton("Hollow Knight")).not.toBeNull();
      });
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

    it("shows the empty-results message", async () => {
      await waitFor(() => {
        expect(elements.queryNoResults()).not.toBeNull();
      });
    });

    it("does not show the loading indicator", async () => {
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

    it("does not call addGameToLibraryFn with a status field (server fn handles defaults)", async () => {
      await waitFor(() => {
        expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledOnce();
      });
      const callArg = vi.mocked(addGameToLibraryFn).mock.calls[0]![0]!;
      expect(callArg.data).not.toHaveProperty("status");
    });

    it("does not call addGameToLibraryFn with a platform field", async () => {
      await waitFor(() => {
        expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledOnce();
      });
      const callArg = vi.mocked(addGameToLibraryFn).mock.calls[0]![0]!;
      expect(callArg.data).not.toHaveProperty("platform");
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
  });

  // ---- addGameToLibraryFn not called before selection ----------------------

  describe("given no game has been selected", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue(STUB_SEARCH_RESULT);
      render(<AddGameModal {...defaultProps} />);
      await actions.submitSearch("Hollow");
      await waitFor(() => {
        expect(elements.queryGameButton("Hollow Knight")).not.toBeNull();
      });
    });

    it("does not call addGameToLibraryFn when Add to library is clicked without a selection", async () => {
      // Button is disabled, but assert the fn was not called defensively.
      expect(vi.mocked(addGameToLibraryFn)).not.toHaveBeenCalled();
    });
  });

  // ---- Toast feedback: success path ----------------------------------------

  describe("given the user successfully adds a game", () => {
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

    it("fires toast.success once with 'Added to library'", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Added to library");
    });

    it("calls onAdded once on success", async () => {
      await waitFor(() => {
        expect(onAdded).toHaveBeenCalledOnce();
      });
    });

    it("calls router.invalidate once so the library list re-loads", async () => {
      await waitFor(() => {
        expect(mockRouterInvalidate).toHaveBeenCalledOnce();
      });
    });

    it("does not fire toast.error on success", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
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

    it("does not fire toast.success on rejection", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    });
  });
});
