import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchResponse } from "@/shared/types";

import { IgdbManualSearch } from "./igdb-manual-search";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const createMockSearchResponse = (
  id: number,
  name: string,
  overrides?: Partial<SearchResponse>
): SearchResponse => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  cover: {
    id: id * 100,
    image_id: `cover${id}`,
  },
  first_release_date: 1609459200,
  platforms: [
    { id: 6, name: "PC (Microsoft Windows)", abbreviation: "PC" },
    { id: 48, name: "PlayStation 4", abbreviation: "PS4" },
  ],
  release_dates: [],
  game_type: 0,
  ...overrides,
});

const mockFetch = vi.fn();

const WAIT_TIMEOUT = 1000;

const elements = {
  getSearchInput: () =>
    screen.getByPlaceholderText("Search IGDB for the correct game..."),
  getSearchingText: () => screen.getByText("Searching..."),
  querySearchingText: () => screen.queryByText("Searching..."),
  getSpinner: () => screen.getByRole("img", { hidden: true }),
  querySpinner: () => screen.queryByRole("img", { hidden: true }),
  getErrorMessage: () =>
    screen.getByText("Failed to search games. Please try again."),
  queryErrorMessage: () =>
    screen.queryByText("Failed to search games. Please try again."),
  getNoResultsMessage: () => screen.getByText("No games found"),
  queryNoResultsMessage: () => screen.queryByText("No games found"),
  getGameByName: (name: string) => screen.getByText(name),
  queryGameByName: (name: string) => screen.queryByText(name),
  getAllSelectButtons: () => screen.getAllByRole("button", { name: /select/i }),
  getSelectButtonByIndex: (index: number) =>
    screen.getAllByRole("button", { name: /select/i })[index],
  querySelectButtons: () =>
    screen.queryAllByRole("button", { name: /select/i }),
  getGameImage: (alt: string) => screen.getByAltText(alt),
  queryGameImage: (alt: string) => screen.queryByAltText(alt),
  getReleaseYear: (year: string) => screen.getByText(year),
  getUnknownReleaseYear: () => screen.getByText("Unknown"),
  getPlatformText: (text: string) => screen.getByText(text),
  getGameFallbackInitial: (initial: string) => screen.getByText(initial),
};

const actions = {
  typeInSearchInput: async (text: string) => {
    const user = userEvent.setup({ delay: null });
    const input = elements.getSearchInput();
    await user.clear(input);
    await user.type(input, text);
  },
  clickSelectButton: async (index: number) => {
    const user = userEvent.setup();
    await user.click(elements.getSelectButtonByIndex(index));
  },
};

describe("IgdbManualSearch", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("search input rendering", () => {
    it("should render search input field", () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      expect(elements.getSearchInput()).toBeVisible();
    });

    it("should have placeholder text", () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      expect(elements.getSearchInput()).toHaveAttribute(
        "placeholder",
        "Search IGDB for the correct game..."
      );
    });

    it("should be enabled by default", () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      expect(elements.getSearchInput()).toBeEnabled();
    });

    it("should be disabled when isLoading prop is true", () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} isLoading={true} />);

      expect(elements.getSearchInput()).toBeDisabled();
    });
  });

  describe("debounce behavior", () => {
    it("should not trigger search immediately after typing", async () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should trigger search after 300ms debounce delay", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [], count: 0 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledTimes(1);
          expect(mockFetch).toHaveBeenCalledWith(
            "/api/games/search?q=zelda&offset=0"
          );
        },
        { timeout: WAIT_TIMEOUT }
      );
    });

    it("should only make one API call when typing multiple characters rapidly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [], count: 0 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("the witcher 3");

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledTimes(1);
        },
        { timeout: WAIT_TIMEOUT }
      );
    });
  });

  describe("API call behavior", () => {
    it("should not call API when query is less than 3 characters", async () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("ab");

      await waitFor(
        () => {
          expect(mockFetch).not.toHaveBeenCalled();
        },
        { timeout: WAIT_TIMEOUT }
      );
    });

    it("should call API with correct query parameter when query is 3+ characters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [], count: 0 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("dark souls");

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith(
            "/api/games/search?q=dark%20souls&offset=0"
          );
        },
        { timeout: WAIT_TIMEOUT }
      );
    });

    it("should encode special characters in query", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [], count: 0 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("game & watch");

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith(
            "/api/games/search?q=game%20%26%20watch&offset=0"
          );
        },
        { timeout: WAIT_TIMEOUT }
      );
    });

    it("should always use offset=0 for searches", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [], count: 0 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith(
            "/api/games/search?q=zelda&offset=0"
          );
        },
        { timeout: WAIT_TIMEOUT }
      );
    });
  });

  describe("loading state", () => {
    it("should show loading state while searching", async () => {
      let resolveSearch: (value: unknown) => void;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });

      mockFetch.mockReturnValueOnce(searchPromise);

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(
        () => {
          expect(elements.getSearchingText()).toBeVisible();
        },
        { timeout: WAIT_TIMEOUT }
      );

      resolveSearch!({
        ok: true,
        json: async () => ({ games: [], count: 0 }),
      });

      await waitFor(() => {
        expect(elements.querySearchingText()).not.toBeInTheDocument();
      });
    });

    it("should not show loading state when query is less than 3 characters", async () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("ab");

      await waitFor(
        () => {
          expect(elements.querySearchingText()).not.toBeInTheDocument();
        },
        { timeout: WAIT_TIMEOUT }
      );
    });
  });

  describe("isLoading prop behavior", () => {
    it("should disable input when isLoading is true", () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} isLoading={true} />);

      expect(elements.getSearchInput()).toBeDisabled();
    });

    it("should disable all Select buttons when isLoading is true", async () => {
      const games = [
        createMockSearchResponse(1, "The Legend of Zelda"),
        createMockSearchResponse(2, "Zelda II"),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 2 }),
      });

      const { rerender } = render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.queryGameByName("The Legend of Zelda")).toBeVisible();
      });

      rerender(<IgdbManualSearch onSelect={mockOnSelect} isLoading={true} />);

      await waitFor(() => {
        const selectButtons = elements.getAllSelectButtons();
        selectButtons.forEach((button) => {
          expect(button).toBeDisabled();
        });
      });
    });
  });

  describe("results display", () => {
    it("should display search results after successful API call", async () => {
      const games = [
        createMockSearchResponse(1, "The Legend of Zelda"),
        createMockSearchResponse(2, "Zelda II: The Adventure of Link"),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 2 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getGameByName("The Legend of Zelda")).toBeVisible();
        expect(
          elements.getGameByName("Zelda II: The Adventure of Link")
        ).toBeVisible();
      });
    });

    it("should display game cover images", async () => {
      const games = [
        createMockSearchResponse(1, "The Legend of Zelda", {
          cover: { id: 100, image_id: "cover123" },
        }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        const image = elements.getGameImage("The Legend of Zelda");
        expect(image).toHaveAttribute(
          "src",
          "https://images.igdb.com/igdb/image/upload/t_cover_small/cover123.jpg"
        );
      });
    });

    it("should display fallback initial when game has no cover", async () => {
      const games = [
        createMockSearchResponse(1, "The Legend of Zelda", {
          cover: undefined,
        }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getGameFallbackInitial("T")).toBeVisible();
        expect(
          elements.queryGameImage("The Legend of Zelda")
        ).not.toBeInTheDocument();
      });
    });

    it("should display release year when available", async () => {
      const games = [
        createMockSearchResponse(1, "The Legend of Zelda", {
          first_release_date: 1609459200,
        }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getReleaseYear("2021")).toBeVisible();
      });
    });

    it("should display Unknown when release date is missing", async () => {
      const games = [
        createMockSearchResponse(1, "The Legend of Zelda", {
          first_release_date: undefined,
        }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getUnknownReleaseYear()).toBeVisible();
      });
    });

    it("should display platform abbreviations", async () => {
      const games = [
        createMockSearchResponse(1, "The Legend of Zelda", {
          platforms: [
            { id: 6, name: "PC (Microsoft Windows)", abbreviation: "PC" },
            { id: 48, name: "PlayStation 4", abbreviation: "PS4" },
          ],
        }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getPlatformText("PC, PS4")).toBeVisible();
      });
    });

    it("should limit platform display to first 3 platforms", async () => {
      const games = [
        createMockSearchResponse(1, "The Legend of Zelda", {
          platforms: [
            { id: 6, name: "PC", abbreviation: "PC" },
            { id: 48, name: "PS4", abbreviation: "PS4" },
            { id: 49, name: "Xbox One", abbreviation: "XONE" },
            { id: 130, name: "Switch", abbreviation: "Switch" },
          ],
        }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getPlatformText("PC, PS4, XONE")).toBeVisible();
      });
    });

    it("should render Select button for each game", async () => {
      const games = [
        createMockSearchResponse(1, "The Legend of Zelda"),
        createMockSearchResponse(2, "Zelda II"),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 2 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getAllSelectButtons()).toHaveLength(2);
      });
    });
  });

  describe("empty results", () => {
    it("should show No games found when search returns no results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [], count: 0 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zzzzzzz");

      await waitFor(() => {
        expect(elements.getNoResultsMessage()).toBeVisible();
      });
    });

    it("should not show No games found when query is less than 3 characters", async () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("ab");

      await waitFor(
        () => {
          expect(elements.queryNoResultsMessage()).not.toBeInTheDocument();
        },
        { timeout: WAIT_TIMEOUT }
      );
    });

    it("should clear results when query becomes less than 3 characters", async () => {
      const games = [createMockSearchResponse(1, "The Legend of Zelda")];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getGameByName("The Legend of Zelda")).toBeVisible();
      });

      await actions.typeInSearchInput("ab");

      await waitFor(
        () => {
          expect(
            elements.queryGameByName("The Legend of Zelda")
          ).not.toBeInTheDocument();
          expect(elements.queryNoResultsMessage()).not.toBeInTheDocument();
        },
        { timeout: WAIT_TIMEOUT }
      );
    });
  });

  describe("error handling", () => {
    it("should show error message when API request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getErrorMessage()).toBeVisible();
      });
    });

    it("should show error message when API throws exception", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getErrorMessage()).toBeVisible();
      });
    });

    it("should clear results when error occurs", async () => {
      const games = [createMockSearchResponse(1, "The Legend of Zelda")];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ games, count: 1 }),
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getGameByName("The Legend of Zelda")).toBeVisible();
      });

      await actions.typeInSearchInput("mario");

      await waitFor(() => {
        expect(elements.getErrorMessage()).toBeVisible();
      });

      expect(
        elements.queryGameByName("The Legend of Zelda")
      ).not.toBeInTheDocument();
    });

    it("should clear error when new search succeeds", async () => {
      const games = [createMockSearchResponse(1, "Super Mario Bros")];

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ games, count: 1 }),
        });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getErrorMessage()).toBeVisible();
      });

      await actions.typeInSearchInput("mario");

      await waitFor(() => {
        expect(elements.getGameByName("Super Mario Bros")).toBeVisible();
      });

      expect(elements.queryErrorMessage()).not.toBeInTheDocument();
    });
  });

  describe("selection behavior", () => {
    it("should call onSelect with correct IGDB ID when Select button is clicked", async () => {
      const games = [
        createMockSearchResponse(12345, "The Legend of Zelda"),
        createMockSearchResponse(67890, "Zelda II"),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 2 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getGameByName("The Legend of Zelda")).toBeVisible();
      });

      await actions.clickSelectButton(0);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith(12345);
    });

    it("should call onSelect with correct ID for second game", async () => {
      const games = [
        createMockSearchResponse(12345, "The Legend of Zelda"),
        createMockSearchResponse(67890, "Zelda II"),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 2 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getGameByName("Zelda II")).toBeVisible();
      });

      await actions.clickSelectButton(1);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith(67890);
    });
  });

  describe("accessibility", () => {
    it("should have accessible search input", () => {
      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      const input = elements.getSearchInput();
      expect(input).toHaveAttribute("type", "text");
    });

    it("should have descriptive button labels", async () => {
      const games = [createMockSearchResponse(1, "The Legend of Zelda")];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        const selectButton = elements.getSelectButtonByIndex(0);
        expect(selectButton).toHaveAccessibleName(/select/i);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle games with very long names", async () => {
      const longGameName =
        "A Very Long Game Title That Should Be Truncated When Displayed In The UI Component To Prevent Layout Issues";
      const games = [createMockSearchResponse(1, longGameName)];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("long");

      await waitFor(() => {
        expect(elements.getGameByName(longGameName)).toBeVisible();
      });
    });

    it("should handle special characters in game names", async () => {
      const games = [
        createMockSearchResponse(1, "BioShock™: Remastered & Enhanced"),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("bioshock");

      await waitFor(() => {
        expect(
          elements.getGameByName("BioShock™: Remastered & Enhanced")
        ).toBeVisible();
      });
    });

    it("should handle clearing the search input", async () => {
      const games = [createMockSearchResponse(1, "The Legend of Zelda")];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games, count: 1 }),
      });

      render(<IgdbManualSearch onSelect={mockOnSelect} />);

      await actions.typeInSearchInput("zelda");

      await waitFor(() => {
        expect(elements.getGameByName("The Legend of Zelda")).toBeVisible();
      });

      const user = userEvent.setup({ delay: null });
      const input = elements.getSearchInput();
      await user.clear(input);

      await waitFor(
        () => {
          expect(
            elements.queryGameByName("The Legend of Zelda")
          ).not.toBeInTheDocument();
          expect(elements.queryNoResultsMessage()).not.toBeInTheDocument();
        },
        { timeout: WAIT_TIMEOUT }
      );
    });
  });
});
