import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { SearchResponse } from "@/shared/types";

import { useSearchGamesByName } from "../hooks/use-search-games-by-name";
import { GameSearchForm } from "./game-search-form";

vi.mock("../hooks/use-search-games-by-name", () => ({
  useSearchGamesByName: vi.fn(),
}));

const mockUseSearchGamesByName = vi.mocked(useSearchGamesByName);

type MockSearchReturn = ReturnType<typeof useSearchGamesByName>;

const createMockGame = (
  overrides?: Partial<SearchResponse>
): SearchResponse => ({
  id: 1,
  name: "The Legend of Zelda",
  category: 0,
  game_type: 0,
  first_release_date: 1234567890,
  cover: { id: 123, image_id: "abc123" },
  platforms: [{ id: 1, name: "Nintendo Switch" }],
  ...overrides,
});

const mockHookReturn = (
  overrides?: Partial<MockSearchReturn>
): MockSearchReturn => ({
  games: [],
  isLoading: false,
  isFetching: false,
  error: null,
  isError: false,
  ...overrides,
});

const elements = {
  getSearchInput: () =>
    screen.getByPlaceholderText("Search for games... (min 3 characters)"),
  getClearButton: () => screen.getByRole("button", { name: /clear search/i }),
  queryClearButton: () =>
    screen.queryByRole("button", { name: /clear search/i }),
  getMinLengthHint: () =>
    screen.getByText("Type at least 3 characters to search"),
  queryMinLengthHint: () =>
    screen.queryByText("Type at least 3 characters to search"),
  getTypingIndicator: () => screen.getByText("Typing..."),
  queryTypingIndicator: () => screen.queryByText("Typing..."),
  getLoadingMessage: () => screen.getByText("Searching for games..."),
  queryLoadingMessage: () => screen.queryByText("Searching for games..."),
  getEmptyMessage: () => screen.getByText("No games found"),
  queryEmptyMessage: () => screen.queryByText("No games found"),
  getErrorMessage: () => screen.getByText("Search failed"),
  queryErrorMessage: () => screen.queryByText("Search failed"),
  getResultCount: (text: string) => screen.getByText(text),
  queryResultCount: (pattern: RegExp | string) => screen.queryByText(pattern),
  getGameByName: (name: string) => screen.getByText(name),
  queryGameByName: (name: string) => screen.queryByText(name),
};

const actions = {
  typeInSearchInput: async (query: string) => {
    const user = userEvent.setup();
    await user.type(elements.getSearchInput(), query);
  },
  clearSearchInput: async () => {
    const user = userEvent.setup();
    await user.click(elements.getClearButton());
  },
};

describe("GameSearchForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchGamesByName.mockReturnValue(mockHookReturn());
  });

  describe("given form just opened", () => {
    it("should display search input with focus", () => {
      render(<GameSearchForm />);

      const input = elements.getSearchInput();
      expect(input).toBeVisible();
      expect(input).toHaveFocus();
    });
  });

  describe("given user types short query", () => {
    beforeEach(async () => {
      render(<GameSearchForm />);
      await actions.typeInSearchInput("ze");
    });

    it("should display minimum length hint", () => {
      expect(elements.getMinLengthHint()).toBeVisible();
    });

    it("should display clear button", () => {
      expect(elements.getClearButton()).toBeVisible();
    });

    it("should not trigger search", () => {
      expect(mockUseSearchGamesByName).toHaveBeenCalledWith("");
    });
  });

  describe("given user types valid query and waits for debounce", () => {
    beforeEach(async () => {
      render(<GameSearchForm />);
      await actions.typeInSearchInput("zelda");
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    it("should trigger search with query", () => {
      expect(mockUseSearchGamesByName).toHaveBeenCalledWith("zelda");
    });
  });

  describe("given search is loading", () => {
    beforeEach(() => {
      mockUseSearchGamesByName.mockReturnValue(
        mockHookReturn({ isLoading: true })
      );
      render(<GameSearchForm />);
    });

    it("should display loading message after typing valid query", async () => {
      await actions.typeInSearchInput("zelda");
      await new Promise((resolve) => setTimeout(resolve, 350));

      await waitFor(() => {
        expect(elements.getLoadingMessage()).toBeVisible();
      });
    });
  });

  describe("given search returns empty results", () => {
    beforeEach(() => {
      mockUseSearchGamesByName.mockReturnValue(mockHookReturn({ games: [] }));
      render(<GameSearchForm />);
    });

    it("should display empty state message", async () => {
      await actions.typeInSearchInput("nonexistent");
      await new Promise((resolve) => setTimeout(resolve, 350));

      await waitFor(() => {
        expect(elements.getEmptyMessage()).toBeVisible();
        expect(screen.getByText(/nonexistent/i)).toBeVisible();
      });
    });
  });

  describe("given search returns multiple results", () => {
    const mockGames = [
      createMockGame({ id: 1, name: "The Legend of Zelda" }),
      createMockGame({ id: 2, name: "Zelda II: The Adventure of Link" }),
      createMockGame({ id: 3, name: "The Legend of Zelda: Ocarina of Time" }),
    ];

    beforeEach(() => {
      mockUseSearchGamesByName.mockReturnValue(
        mockHookReturn({ games: mockGames })
      );
      render(<GameSearchForm />);
    });

    it("should display result count and all game names", async () => {
      await actions.typeInSearchInput("zelda");
      await new Promise((resolve) => setTimeout(resolve, 350));

      await waitFor(() => {
        expect(elements.getResultCount("Found 3 games")).toBeVisible();
        expect(elements.getGameByName("The Legend of Zelda")).toBeVisible();
        expect(
          elements.getGameByName("Zelda II: The Adventure of Link")
        ).toBeVisible();
        expect(
          elements.getGameByName("The Legend of Zelda: Ocarina of Time")
        ).toBeVisible();
      });
    });
  });

  describe("given search returns single result", () => {
    beforeEach(() => {
      mockUseSearchGamesByName.mockReturnValue(
        mockHookReturn({ games: [createMockGame()] })
      );
      render(<GameSearchForm />);
    });

    it("should display singular result count", async () => {
      await actions.typeInSearchInput("zelda");
      await new Promise((resolve) => setTimeout(resolve, 350));

      await waitFor(() => {
        expect(elements.getResultCount("Found 1 game")).toBeVisible();
      });
    });
  });

  describe("given search fails with error", () => {
    beforeEach(() => {
      mockUseSearchGamesByName.mockReturnValue(
        mockHookReturn({
          isError: true,
          error: new Error("IGDB API is unavailable"),
        })
      );
      render(<GameSearchForm />);
    });

    it("should display error message", async () => {
      await actions.typeInSearchInput("zelda");
      await new Promise((resolve) => setTimeout(resolve, 350));

      await waitFor(() => {
        expect(elements.getErrorMessage()).toBeVisible();
        expect(screen.getByText("IGDB API is unavailable")).toBeVisible();
      });
    });

    it("should not display results", async () => {
      await actions.typeInSearchInput("zelda");
      await new Promise((resolve) => setTimeout(resolve, 350));

      await waitFor(() => {
        expect(elements.queryResultCount(/found/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("given search is refetching", () => {
    beforeEach(() => {
      mockUseSearchGamesByName.mockReturnValue(
        mockHookReturn({
          games: [createMockGame()],
          isFetching: true,
        })
      );
      render(<GameSearchForm />);
    });

    it("should display results while refetching", async () => {
      await actions.typeInSearchInput("zelda");
      await new Promise((resolve) => setTimeout(resolve, 350));

      await waitFor(() => {
        expect(elements.getResultCount("Found 1 game")).toBeVisible();
      });
    });
  });

  describe("given user clears input", () => {
    beforeEach(async () => {
      mockUseSearchGamesByName.mockReturnValue(
        mockHookReturn({ games: [createMockGame()] })
      );
      render(<GameSearchForm />);

      await actions.typeInSearchInput("zelda");
      await new Promise((resolve) => setTimeout(resolve, 350));

      await waitFor(() => {
        expect(elements.getResultCount("Found 1 game")).toBeVisible();
      });
    });

    it("should clear input and hide results", async () => {
      await actions.clearSearchInput();

      expect(elements.getSearchInput()).toHaveValue("");
      expect(elements.queryClearButton()).not.toBeInTheDocument();
      expect(elements.queryResultCount("Found 1 game")).not.toBeInTheDocument();
    });
  });
});
