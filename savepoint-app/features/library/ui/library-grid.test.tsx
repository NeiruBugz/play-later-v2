import { renderWithTestProviders } from "@/test/utils/test-provider";
import { LibraryItemStatus } from "@/shared/types";
import { createLibraryItemFixture } from "@fixtures/library";
import { screen, waitFor } from "@testing-library/react";

import { useLibraryData } from "../hooks/use-library-data";
import { useLibraryFilters } from "../hooks/use-library-filters";
import { LibraryGrid } from "./library-grid";

vi.mock("../hooks/use-library-data", () => ({
  useLibraryData: vi.fn(),
}));

vi.mock("../hooks/use-library-filters", () => ({
  useLibraryFilters: vi.fn(),
}));

vi.mock("../server-actions/update-library-status", () => ({
  updateLibraryStatusAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUseLibraryData = vi.mocked(useLibraryData);
const mockUseLibraryFilters = vi.mocked(useLibraryFilters);

const elements = {
  getGrid: () => screen.queryByRole("generic", { hidden: true }),
  getErrorMessage: () => screen.queryByText(/Failed to Load Library/i),
  getReloadButton: () => screen.queryByRole("button", { name: /Reload Page/i }),
  getEmptyStateMessage: () => screen.queryByText(/Your Library is Empty/i),
  getBrowseGamesButton: () =>
    screen.queryByRole("link", { name: /Browse Games/i }),
};

describe("LibraryGrid", () => {
  const defaultFilters = {
    status: undefined,
    platform: undefined,
    search: undefined,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLibraryFilters.mockReturnValue(defaultFilters);
  });

  describe("given component is loading data", () => {
    it("should show loading skeleton while fetching", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getErrorMessage()).not.toBeInTheDocument();
      expect(elements.getEmptyStateMessage()).not.toBeInTheDocument();
    });

    it("should not show error message while loading", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getErrorMessage()).not.toBeInTheDocument();
    });

    it("should not show empty state while loading", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getEmptyStateMessage()).not.toBeInTheDocument();
    });
  });

  describe("given fetch failed with error", () => {
    it("should show error state on fetch failure", () => {
      const errorMessage = "Network error occurred";
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error(errorMessage),
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getErrorMessage()).toBeVisible();
      expect(screen.getByText(errorMessage)).toBeVisible();
    });

    it("should display reload button in error state", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getReloadButton()).toBeVisible();
    });

    it("should not show grid when error occurs", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(screen.queryByText("Game 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Game 2")).not.toBeInTheDocument();
    });
  });

  describe("given user has no games in library", () => {
    it("should show empty state when no games", () => {
      mockUseLibraryData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getEmptyStateMessage()).toBeVisible();
    });

    it("should show empty state when data is undefined", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getEmptyStateMessage()).toBeVisible();
    });

    it("should show Browse Games link in empty state", () => {
      mockUseLibraryData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getBrowseGamesButton()).toBeVisible();
      expect(elements.getBrowseGamesButton()).toHaveAttribute(
        "href",
        "/games/search"
      );
    });
  });

  describe("given user has games in library", () => {
    it("should render grid of game cards", () => {
      const mockData = [
        createLibraryItemFixture({
          id: 1,
          gameId: "game-1",
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          game: {
            id: "game-1",
            title: "The Legend of Zelda",
            slug: "the-legend-of-zelda",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
        createLibraryItemFixture({
          id: 2,
          gameId: "game-2",
          status: LibraryItemStatus.EXPERIENCED,
          game: {
            id: "game-2",
            title: "Super Mario Odyssey",
            slug: "super-mario-odyssey",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
      ];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(screen.getByText("The Legend of Zelda")).toBeVisible();
      expect(screen.getByText("Super Mario Odyssey")).toBeVisible();
    });

    it("should display correct number of cards based on data", () => {
      const mockData = [
        createLibraryItemFixture({
          id: 1,
          gameId: "game-1",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          game: {
            id: "game-1",
            title: "Game 1",
            slug: "game-1",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
        createLibraryItemFixture({
          id: 2,
          gameId: "game-2",
          status: LibraryItemStatus.WISHLIST,
          game: {
            id: "game-2",
            title: "Game 2",
            slug: "game-2",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
        createLibraryItemFixture({
          id: 3,
          gameId: "game-3",
          status: LibraryItemStatus.EXPERIENCED,
          game: {
            id: "game-3",
            title: "Game 3",
            slug: "game-3",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
      ];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(screen.getByText("Game 1")).toBeVisible();
      expect(screen.getByText("Game 2")).toBeVisible();
      expect(screen.getByText("Game 3")).toBeVisible();
    });

    it("should apply responsive grid layout classes", () => {
      const mockData = [
        createLibraryItemFixture({
          id: 1,
          gameId: "game-1",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          game: {
            id: "game-1",
            title: "Test Game",
            slug: "test-game",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
      ];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(screen.getByText("Test Game")).toBeVisible();
    });

    it("should not show loading skeleton when data is loaded", () => {
      const mockData = [
        createLibraryItemFixture({
          id: 1,
          gameId: "game-1",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          game: {
            id: "game-1",
            title: "Test Game",
            slug: "test-game",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
      ];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(screen.getByText("Test Game")).toBeVisible();
    });

    it("should not show error state when data is loaded", () => {
      const mockData = [
        createLibraryItemFixture({
          id: 1,
          gameId: "game-1",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          game: {
            id: "game-1",
            title: "Test Game",
            slug: "test-game",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
      ];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getErrorMessage()).not.toBeInTheDocument();
    });

    it("should not show empty state when data is loaded", () => {
      const mockData = [
        createLibraryItemFixture({
          id: 1,
          gameId: "game-1",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          game: {
            id: "game-1",
            title: "Test Game",
            slug: "test-game",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
      ];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(elements.getEmptyStateMessage()).not.toBeInTheDocument();
    });
  });

  describe("given filters change", () => {
    it("should update when filters change", async () => {
      const initialData = [
        createLibraryItemFixture({
          id: 1,
          gameId: "game-1",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          game: {
            id: "game-1",
            title: "Game 1",
            slug: "game-1",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
      ];
      const filteredData = [
        createLibraryItemFixture({
          id: 2,
          gameId: "game-2",
          status: LibraryItemStatus.EXPERIENCED,
          game: {
            id: "game-2",
            title: "Game 2",
            slug: "game-2",
            entryCount: 1,
            coverImage: null,
            releaseDate: null,
          },
        }),
      ];

      mockUseLibraryFilters.mockReturnValue(defaultFilters);
      mockUseLibraryData.mockReturnValue({
        data: initialData,
        isLoading: false,
        error: null,
      } as any);

      const { rerender } = renderWithTestProviders(<LibraryGrid />);

      expect(screen.getByText("Game 1")).toBeInTheDocument();

      const newFilters = {
        ...defaultFilters,
        status: LibraryItemStatus.EXPERIENCED,
      };
      mockUseLibraryFilters.mockReturnValue(newFilters);
      mockUseLibraryData.mockReturnValue({
        data: filteredData,
        isLoading: false,
        error: null,
      } as any);

      rerender(<LibraryGrid />);

      await waitFor(() => {
        expect(screen.queryByText("Game 1")).not.toBeInTheDocument();
        expect(screen.getByText("Game 2")).toBeVisible();
      });
    });

    it("should pass filter values to useLibraryData hook", () => {
      const filters = {
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        platform: "PlayStation 5",
        search: "zelda",
        sortBy: "releaseDate" as const,
        sortOrder: "asc" as const,
      };

      mockUseLibraryFilters.mockReturnValue(filters);
      mockUseLibraryData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      renderWithTestProviders(<LibraryGrid />);

      expect(mockUseLibraryData).toHaveBeenCalledWith(filters);
    });
  });
});
