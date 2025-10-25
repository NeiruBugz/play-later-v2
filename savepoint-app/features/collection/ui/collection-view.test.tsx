import type { CollectionItem } from "@/data-access-layer/services/collection/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useGetCollection } from "../hooks/use-get-collection";
import { CollectionView } from "./collection-view";

const mockRouter = {
  push: vi.fn(),
};

const mockSearchParams = {
  get: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("../hooks/use-get-collection", () => ({
  useGetCollection: vi.fn(),
}));

const mockUseGetCollection = vi.mocked(useGetCollection);

type MockCollectionReturn = ReturnType<typeof useGetCollection>;

const createMockCollectionItem = (
  overrides?: Partial<CollectionItem>
): CollectionItem => ({
  game: {
    id: "game-1",
    title: "The Legend of Zelda",
    igdbId: 1234,
    hltbId: null,
    description: null,
    coverImage: "cover1",
    releaseDate: new Date("2017-03-03"),
    mainStory: null,
    mainExtra: null,
    completionist: null,
    steamAppId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    libraryItems: [],
  },
  libraryItems: [
    {
      id: 1,
      userId: "user-1",
      gameId: "game-1",
      status: "CURRENTLY_EXPLORING",
      platform: "Nintendo Switch",
      acquisitionType: "DIGITAL",
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: null,
      completedAt: null,
    },
  ],
  ...overrides,
});

const mockHookReturn = (
  overrides?: Partial<MockCollectionReturn>
): MockCollectionReturn => ({
  data: {
    collection: [],
    count: 0,
  },
  isLoading: false,
  error: null,
  isFetching: false,
  refetch: vi.fn(),
  ...overrides,
});

const elements = {
  getHeading: () => screen.getByRole("heading", { name: "My Library" }),
  getCollectionCount: (count: number) =>
    screen.getByText(`${count} games in your collection`),
  queryCollectionCount: (pattern: RegExp) => screen.queryByText(pattern),
  getLoadingMessage: () => screen.getByText("Loading..."),
  queryLoadingMessage: () => screen.queryByText("Loading..."),
  getLoadingState: () => screen.getByText("Loading your collection..."),
  queryLoadingState: () => screen.queryByText("Loading your collection..."),
  getErrorHeading: () =>
    screen.getByRole("heading", { name: "Unable to Load Your Library" }),
  queryErrorHeading: () =>
    screen.queryByRole("heading", { name: "Unable to Load Your Library" }),
  getTryAgainButton: () =>
    screen.getByRole("button", { name: /retry loading collection/i }),
  queryTryAgainButton: () =>
    screen.queryByRole("button", { name: /retry loading collection/i }),
  getClearFiltersButton: () =>
    screen.getByRole("button", { name: /clear.*filters/i }),
  queryClearFiltersButton: () =>
    screen.queryByRole("button", { name: /clear.*filters/i }),
  getDashboardButton: () =>
    screen.getByRole("button", { name: /go to dashboard/i }),
  getApplyFiltersButton: () =>
    screen.getByRole("button", { name: /apply.*filters/i }),
  queryApplyFiltersButton: () =>
    screen.queryByRole("button", { name: /apply.*filters/i }),
  getSearchInput: () => screen.getByLabelText("Search games by title"),
  getStatusSelect: () =>
    screen.getByRole("combobox", { name: /filter by status/i }),
  getPlatformSelect: () =>
    screen.getByRole("combobox", { name: /filter by platform/i }),
  getGameCard: (title: string) => screen.getByText(title),
  queryGameCard: (title: string) => screen.queryByText(title),
  getNoGamesMessage: () => screen.getByText("No games found"),
  queryNoGamesMessage: () => screen.queryByText("No games found"),
};

const actions = {
  clickTryAgain: async () => {
    const user = userEvent.setup();
    await user.click(elements.getTryAgainButton());
  },
  clickClearFilters: async () => {
    const user = userEvent.setup();
    await user.click(elements.getClearFiltersButton());
  },
  clickDashboard: async () => {
    const user = userEvent.setup();
    await user.click(elements.getDashboardButton());
  },
  clickApplyFilters: async () => {
    const user = userEvent.setup();
    await user.click(elements.getApplyFiltersButton());
  },
};

describe("CollectionView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.get.mockReturnValue(null);
    mockUseGetCollection.mockReturnValue(mockHookReturn());
  });

  describe("given component renders with no filters", () => {
    it("should display library heading", () => {
      render(<CollectionView availablePlatforms={[]} />);

      expect(elements.getHeading()).toBeVisible();
    });

    it("should show collection count when loaded", () => {
      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          data: { collection: [], count: 5 },
        })
      );

      render(<CollectionView availablePlatforms={[]} />);

      expect(elements.getCollectionCount(5)).toBeVisible();
    });

    it("should show loading message while fetching", () => {
      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          isLoading: true,
        })
      );

      render(<CollectionView availablePlatforms={[]} />);

      expect(elements.getLoadingMessage()).toBeVisible();
    });
  });

  describe("given collection is loading", () => {
    beforeEach(() => {
      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          isLoading: true,
        })
      );
      render(<CollectionView availablePlatforms={[]} />);
    });

    it("should display loading state", () => {
      expect(elements.getLoadingState()).toBeVisible();
    });

    it("should not display collection grid", () => {
      expect(elements.queryNoGamesMessage()).not.toBeInTheDocument();
    });

    it("should show loading in collection count", () => {
      expect(elements.getLoadingMessage()).toBeVisible();
    });
  });

  describe("given collection has items", () => {
    beforeEach(() => {
      const mockItems = [
        createMockCollectionItem({
          game: { id: "game-1", title: "Zelda" },
        } as any),
        createMockCollectionItem({
          game: { id: "game-2", title: "Mario" },
        } as any),
      ];

      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          data: { collection: mockItems, count: 2 },
        })
      );

      render(<CollectionView availablePlatforms={[]} />);
    });

    it("should display collection count", () => {
      expect(elements.getCollectionCount(2)).toBeVisible();
    });

    it("should display all game cards", () => {
      expect(elements.getGameCard("Zelda")).toBeVisible();
      expect(elements.getGameCard("Mario")).toBeVisible();
    });

    it("should not display loading state", () => {
      expect(elements.queryLoadingState()).not.toBeInTheDocument();
    });

    it("should not display error state", () => {
      expect(elements.queryErrorHeading()).not.toBeInTheDocument();
    });
  });

  describe("given collection is empty", () => {
    beforeEach(() => {
      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          data: { collection: [], count: 0 },
        })
      );

      render(<CollectionView availablePlatforms={[]} />);
    });

    it("should display zero count", () => {
      expect(elements.getCollectionCount(0)).toBeVisible();
    });

    it("should display no games message", () => {
      expect(elements.getNoGamesMessage()).toBeVisible();
    });

    it("should suggest adjusting filters", () => {
      expect(
        screen.getByText(/try adjusting your filters/i)
      ).toBeInTheDocument();
    });
  });

  describe("given collection fetch fails", () => {
    beforeEach(() => {
      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          error: new Error("Failed to fetch collection"),
        })
      );

      render(<CollectionView availablePlatforms={[]} />);
    });

    it("should display error heading", () => {
      expect(elements.getErrorHeading()).toBeVisible();
    });

    it("should display error message", () => {
      expect(
        screen.getByText(/having trouble loading your game collection/i)
      ).toBeInTheDocument();
    });

    it("should display Try Again button", () => {
      expect(elements.getTryAgainButton()).toBeVisible();
    });

    it("should display Go to Dashboard button", () => {
      expect(elements.getDashboardButton()).toBeVisible();
    });

    it("should not display collection grid", () => {
      expect(elements.queryNoGamesMessage()).not.toBeInTheDocument();
    });
  });

  describe("given user clicks Try Again button", () => {
    it("should call refetch", async () => {
      const mockRefetch = vi.fn();
      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          error: new Error("Failed to fetch"),
          refetch: mockRefetch,
        })
      );

      render(<CollectionView availablePlatforms={[]} />);

      await actions.clickTryAgain();

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("given user clicks Go to Dashboard button", () => {
    it("should navigate to dashboard", async () => {
      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          error: new Error("Failed to fetch"),
        })
      );

      render(<CollectionView availablePlatforms={[]} />);

      await actions.clickDashboard();

      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("given active filters exist", () => {
    beforeEach(() => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === "search") return "zelda";
        if (key === "status") return "CURIOUS_ABOUT";
        return null;
      });

      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          error: new Error("Failed to fetch"),
        })
      );

      render(<CollectionView availablePlatforms={[]} />);
    });

    it("should show Clear Filters button in error state", () => {
      expect(elements.getClearFiltersButton()).toBeVisible();
    });

    it("should mention clearing filters in error message", () => {
      expect(
        screen.getByText(/try clearing your filters/i)
      ).toBeInTheDocument();
    });
  });

  describe("given user clicks Clear Filters button", () => {
    it("should navigate to clean library URL", async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === "search") return "zelda";
        return null;
      });

      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          error: new Error("Failed to fetch"),
        })
      );

      render(<CollectionView availablePlatforms={[]} />);

      await actions.clickClearFilters();

      expect(mockRouter.push).toHaveBeenCalledWith("/library");
    });
  });

  describe("given no active filters", () => {
    it("should not show Clear Filters button in error state", () => {
      mockSearchParams.get.mockReturnValue(null);

      mockUseGetCollection.mockReturnValue(
        mockHookReturn({
          error: new Error("Failed to fetch"),
        })
      );

      render(<CollectionView availablePlatforms={[]} />);

      expect(elements.queryClearFiltersButton()).not.toBeInTheDocument();
    });
  });

  describe("given user applies filters", () => {
    it("should navigate with search filter", async () => {
      render(<CollectionView availablePlatforms={[]} />);

      const user = userEvent.setup();
      await user.type(elements.getSearchInput(), "zelda");
      await actions.clickApplyFilters();

      expect(mockRouter.push).toHaveBeenCalledWith("/library?search=zelda");
    });
  });

  describe("given platforms are provided", () => {
    it("should pass platforms to CollectionFilters", () => {
      const platforms = ["PC", "PlayStation 5", "Nintendo Switch"];

      render(<CollectionView availablePlatforms={platforms} />);

      expect(elements.getPlatformSelect()).toBeVisible();
    });
  });

  describe("given URL has search parameter", () => {
    it("should parse and use search filter", () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === "search") return "mario";
        return null;
      });

      render(<CollectionView availablePlatforms={[]} />);

      expect(mockUseGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "mario",
        })
      );
    });
  });

  describe("given URL has status parameter", () => {
    it("should parse and use status filter", () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === "status") return "CURRENTLY_EXPLORING";
        return null;
      });

      render(<CollectionView availablePlatforms={[]} />);

      expect(mockUseGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "CURRENTLY_EXPLORING",
        })
      );
    });
  });

  describe("given URL has platform parameter", () => {
    it("should parse and use platform filter", () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === "platform") return "PC";
        return null;
      });

      render(<CollectionView availablePlatforms={[]} />);

      expect(mockUseGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: "PC",
        })
      );
    });
  });

  describe("given URL has page parameter", () => {
    it("should parse and use page number", () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === "page") return "3";
        return null;
      });

      render(<CollectionView availablePlatforms={[]} />);

      expect(mockUseGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
        })
      );
    });
  });

  describe("given URL has multiple filter parameters", () => {
    it("should parse and use all filters", () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        const params: Record<string, string> = {
          search: "zelda",
          status: "CURIOUS_ABOUT",
          platform: "Nintendo Switch",
          page: "2",
        };
        return params[key] || null;
      });

      render(<CollectionView availablePlatforms={[]} />);

      expect(mockUseGetCollection).toHaveBeenCalledWith({
        search: "zelda",
        status: "CURIOUS_ABOUT",
        platform: "Nintendo Switch",
        page: 2,
      });
    });
  });

  describe("given user clears all filters", () => {
    it("should navigate to library without query params", async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === "search") return "zelda";
        if (key === "status") return "CURIOUS_ABOUT";
        return null;
      });

      render(<CollectionView availablePlatforms={[]} />);

      const user = userEvent.setup();
      const clearButton = screen.getByRole("button", { name: /clear all/i });
      await user.click(clearButton);

      expect(mockRouter.push).toHaveBeenCalledWith("/library");
    });
  });

  describe("given filter validation", () => {
    it("should handle empty string filters", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<CollectionView availablePlatforms={[]} />);

      expect(mockUseGetCollection).toHaveBeenCalledWith({
        search: "",
        status: "",
        platform: "",
        page: undefined,
      });
    });

    it("should handle invalid page number as undefined", () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === "page") return "invalid";
        return null;
      });

      render(<CollectionView availablePlatforms={[]} />);

      expect(mockUseGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          page: undefined,
        })
      );
    });
  });
});
