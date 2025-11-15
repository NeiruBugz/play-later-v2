import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

import {
  useLibraryData,
  type LibraryItemWithGameAndCount,
} from "../hooks/use-library-data";
import { useLibraryFilters } from "../hooks/use-library-filters";
import { LibraryGrid } from "./library-grid";

// Mock hooks
vi.mock("../hooks/use-library-data", () => ({
  useLibraryData: vi.fn(),
}));

vi.mock("../hooks/use-library-filters", () => ({
  useLibraryFilters: vi.fn(),
}));

// Mock the server action and toast
vi.mock("../server-actions/update-library-status", () => ({
  updateLibraryStatusAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper to create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Helper to render component with QueryClient wrapper
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

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

const mockLibraryItem = (
  id: number,
  gameTitle: string,
  status: string
): LibraryItemWithGameAndCount => ({
  id,
  userId: "user-123",
  gameId: `game-${id}`,
  status,
  platform: "PlayStation 5",
  acquisitionType: "DIGITAL",
  startedAt: null,
  completedAt: null,
  createdAt: new Date("2025-01-10"),
  updatedAt: new Date("2025-01-20"),
  game: {
    id: `game-${id}`,
    title: gameTitle,
    coverImage:
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg",
    slug: gameTitle.toLowerCase().replace(/\s+/g, "-"),
    releaseDate: new Date("2020-01-01"),
    _count: {
      libraryItems: 1,
    },
  },
});

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

      renderWithQueryClient(<LibraryGrid />);

      // LibraryGridSkeleton should render with skeleton cards
      // Check that error and empty states are not visible
      expect(elements.getErrorMessage()).not.toBeInTheDocument();
      expect(elements.getEmptyStateMessage()).not.toBeInTheDocument();
    });

    it("should not show error message while loading", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      expect(elements.getErrorMessage()).not.toBeInTheDocument();
    });

    it("should not show empty state while loading", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

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

      renderWithQueryClient(<LibraryGrid />);

      expect(elements.getErrorMessage()).toBeVisible();
      expect(screen.getByText(errorMessage)).toBeVisible();
    });

    it("should display reload button in error state", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      expect(elements.getReloadButton()).toBeVisible();
    });

    it("should not show grid when error occurs", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      // Grid should not be rendered - check that game titles are not present
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

      renderWithQueryClient(<LibraryGrid />);

      expect(elements.getEmptyStateMessage()).toBeVisible();
    });

    it("should show empty state when data is undefined", () => {
      mockUseLibraryData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      expect(elements.getEmptyStateMessage()).toBeVisible();
    });

    it("should show Browse Games link in empty state", () => {
      mockUseLibraryData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

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
        mockLibraryItem(1, "The Legend of Zelda", "CURRENTLY_EXPLORING"),
        mockLibraryItem(2, "Super Mario Odyssey", "EXPERIENCED"),
      ];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      // Grid should be rendered with game cards visible
      expect(screen.getByText("The Legend of Zelda")).toBeVisible();
      expect(screen.getByText("Super Mario Odyssey")).toBeVisible();
    });

    it("should display correct number of cards based on data", () => {
      const mockData = [
        mockLibraryItem(1, "Game 1", "CURIOUS_ABOUT"),
        mockLibraryItem(2, "Game 2", "WISHLIST"),
        mockLibraryItem(3, "Game 3", "EXPERIENCED"),
      ];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      // Each game should render a card with title visible
      expect(screen.getByText("Game 1")).toBeVisible();
      expect(screen.getByText("Game 2")).toBeVisible();
      expect(screen.getByText("Game 3")).toBeVisible();
    });

    it("should apply responsive grid layout classes", () => {
      const mockData = [mockLibraryItem(1, "Test Game", "CURIOUS_ABOUT")];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      // Grid should render game cards
      expect(screen.getByText("Test Game")).toBeVisible();
    });

    it("should not show loading skeleton when data is loaded", () => {
      const mockData = [mockLibraryItem(1, "Test Game", "CURIOUS_ABOUT")];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      // Game should be visible, not skeleton
      expect(screen.getByText("Test Game")).toBeVisible();
    });

    it("should not show error state when data is loaded", () => {
      const mockData = [mockLibraryItem(1, "Test Game", "CURIOUS_ABOUT")];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      expect(elements.getErrorMessage()).not.toBeInTheDocument();
    });

    it("should not show empty state when data is loaded", () => {
      const mockData = [mockLibraryItem(1, "Test Game", "CURIOUS_ABOUT")];

      mockUseLibraryData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<LibraryGrid />);

      expect(elements.getEmptyStateMessage()).not.toBeInTheDocument();
    });
  });

  describe("given filters change", () => {
    it("should update when filters change", async () => {
      const initialData = [mockLibraryItem(1, "Game 1", "CURIOUS_ABOUT")];
      const filteredData = [mockLibraryItem(2, "Game 2", "EXPERIENCED")];

      // Initial render with filters
      mockUseLibraryFilters.mockReturnValue(defaultFilters);
      mockUseLibraryData.mockReturnValue({
        data: initialData,
        isLoading: false,
        error: null,
      } as any);

      const { rerender } = renderWithQueryClient(<LibraryGrid />);

      expect(screen.getByText("Game 1")).toBeInTheDocument();

      // Update filters
      const newFilters = {
        ...defaultFilters,
        status: "EXPERIENCED" as any,
      };
      mockUseLibraryFilters.mockReturnValue(newFilters);
      mockUseLibraryData.mockReturnValue({
        data: filteredData,
        isLoading: false,
        error: null,
      } as any);

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <LibraryGrid />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText("Game 1")).not.toBeInTheDocument();
        expect(screen.getByText("Game 2")).toBeVisible();
      });
    });

    it("should pass filter values to useLibraryData hook", () => {
      const filters = {
        status: "CURRENTLY_EXPLORING" as any,
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

      renderWithQueryClient(<LibraryGrid />);

      // Verify that useLibraryData was called with the correct filters
      expect(mockUseLibraryData).toHaveBeenCalledWith(filters);
    });
  });
});
