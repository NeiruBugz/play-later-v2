import { uniquePlatformsFixture } from "@/test/fixtures/library";
import { createLibraryHandlers } from "@/test/mocks/handlers";
import { server } from "@/test/setup/client-setup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { LibraryPageView } from "./library-page-view";

/**
 * Creates a stateful navigation mock that synchronizes useRouter and useSearchParams.
 * When router.push is called with a URL, the searchParams are updated accordingly.
 */
const createNavigationMock = (initialQuery = "") => {
  let currentParams = new URLSearchParams(initialQuery);

  const mockPush = vi.fn((url: string) => {
    const urlObj = new URL(url, "http://localhost");
    currentParams = urlObj.searchParams;
  });

  const mockReplace = vi.fn((url: string) => {
    const urlObj = new URL(url, "http://localhost");
    currentParams = urlObj.searchParams;
  });

  vi.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as ReturnType<typeof useRouter>);

  vi.mocked(useSearchParams).mockImplementation(
    () => currentParams as ReadonlyURLSearchParams
  );

  return { mockPush, mockReplace, getParams: () => currentParams };
};

const elements = {
  getLibraryHeading: () => screen.getByRole("heading", { name: "Library" }),
  getSortSelect: () => screen.getByRole("combobox", { name: "Sort by" }),
  getPlatformFilter: () =>
    screen.getByRole("combobox", { name: "Filter by platform" }),
  getMoreFiltersButton: () =>
    screen.getByRole("button", { name: /more/i, expanded: false }),
  queryMoreFiltersButton: () => screen.queryByRole("button", { name: /more/i }),
  getSearchInput: () =>
    screen.getByRole("searchbox", { name: "Filter library by title" }),
  getAllStatusesButton: () =>
    screen.getAllByRole("button", { name: "Show all statuses" })[0],
  getStatusButton: (status: string) =>
    screen.getAllByRole("button", { name: `Filter by ${status}` })[0],
  getPlatformOption: (platform: string) =>
    screen.getByRole("option", { name: platform }),
  getSortOption: (option: string) =>
    screen.getByRole("option", { name: option }),
  getClearFiltersButton: () =>
    screen.getAllByRole("button", { name: "Clear all filters" })[0],
  queryClearFiltersButton: () =>
    screen.queryAllByRole("button", { name: "Clear all filters" })[0] ?? null,
  queryLibraryGrid: () =>
    screen.queryByRole("list", { name: "Your game library" }),
  queryEmptyState: () => screen.queryByText(/your library is empty/i),
  queryErrorState: () => screen.queryByText(/failed to load library/i),
};

const actions = {
  clickStatusButton: (status: string) =>
    userEvent.click(elements.getStatusButton(status)),
  clickAllStatuses: () => userEvent.click(elements.getAllStatusesButton()),
  clickClearFilters: () => userEvent.click(elements.getClearFiltersButton()),
  clickPlatformFilter: () => userEvent.click(elements.getPlatformFilter()),
  clickPlatformOption: (platform: string) =>
    userEvent.click(elements.getPlatformOption(platform)),
  selectSort: async (option: string) => {
    await userEvent.click(elements.getSortSelect());
    await userEvent.click(elements.getSortOption(option));
  },
  openMoreFilters: async () => {
    const button = elements.queryMoreFiltersButton();
    if (button && button.getAttribute("aria-expanded") !== "true") {
      await userEvent.click(button);
    }
  },
};

const renderComponent = () => {
  // Create a fresh QueryClient for each test to avoid cache pollution
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Disable garbage collection (immediate cleanup)
        staleTime: 0, // Data is always stale
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );

  return render(<LibraryPageView isSteamConnected={false} />, {
    wrapper: Wrapper,
  });
};

describe("LibraryPageView", () => {
  beforeEach(() => {
    createNavigationMock();
  });

  describe("given page renders", () => {
    it("displays all filter controls", async () => {
      renderComponent();

      await waitFor(() => {
        expect(elements.getLibraryHeading()).toBeVisible();
      });

      expect(elements.getSortSelect()).toBeVisible();
      expect(elements.getSearchInput()).toBeVisible();

      await actions.openMoreFilters();
      expect(elements.getPlatformFilter()).toBeVisible();
    });

    it("displays all status buttons", async () => {
      renderComponent();

      await waitFor(() => {
        expect(elements.getAllStatusesButton()).toBeVisible();
      });

      expect(elements.getStatusButton("Wishlist")).toBeVisible();
      expect(elements.getStatusButton("Shelf")).toBeVisible();
      expect(elements.getStatusButton("Up Next")).toBeVisible();
      expect(elements.getStatusButton("Playing")).toBeVisible();
      expect(elements.getStatusButton("Played")).toBeVisible();
    });

    it("displays sort select with default value", async () => {
      renderComponent();

      await waitFor(() => {
        expect(elements.getSortSelect()).toBeVisible();
      });

      expect(elements.getSortSelect()).toHaveTextContent("Recently Updated");
    });

    it("does not display clear filters button when no filters are active", async () => {
      renderComponent();

      await waitFor(() => {
        expect(elements.getLibraryHeading()).toBeVisible();
      });

      expect(elements.queryClearFiltersButton()).not.toBeInTheDocument();
    });

    it("displays library grid when data loads successfully", async () => {
      renderComponent();

      await waitFor(() => {
        expect(elements.queryLibraryGrid()).toBeVisible();
      });

      expect(elements.queryEmptyState()).not.toBeInTheDocument();
      expect(elements.queryErrorState()).not.toBeInTheDocument();
    });
  });

  describe("given page opened", () => {
    describe("and user changes status", () => {
      it("displays games matching that status", async () => {
        const { mockPush } = createNavigationMock();
        const { rerender } = renderComponent();

        await actions.clickStatusButton("Wishlist");

        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("status=WISHLIST"),
          expect.anything()
        );

        rerender(<LibraryPageView isSteamConnected={false} />);

        await waitFor(() => {
          expect(elements.getStatusButton("Wishlist")).toHaveAttribute(
            "aria-pressed",
            "true"
          );
        });

        expect(elements.getAllStatusesButton()).toHaveAttribute(
          "aria-pressed",
          "false"
        );
      });
    });
  });

  describe("given user filters by platform", () => {
    it("displays platforms from API in combobox", async () => {
      renderComponent();

      await waitFor(() => {
        expect(elements.getLibraryHeading()).toBeVisible();
      });

      await actions.openMoreFilters();
      await waitFor(() => {
        expect(elements.getPlatformFilter()).toBeVisible();
      });

      await actions.clickPlatformFilter();

      await waitFor(() => {
        expect(elements.getPlatformOption("PC (Windows)")).toBeVisible();
      });

      expect(elements.getPlatformOption("PlayStation 5")).toBeVisible();
      expect(elements.getPlatformOption("Nintendo Switch")).toBeVisible();
      expect(elements.getPlatformOption("All Platforms")).toBeVisible();
    });

    it("calls router.push with correct platform param and updates UI", async () => {
      const { mockPush } = createNavigationMock();
      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(elements.getLibraryHeading()).toBeVisible();
      });

      await actions.openMoreFilters();
      await waitFor(() => {
        expect(elements.getPlatformFilter()).toBeVisible();
      });

      await actions.clickPlatformFilter();

      await waitFor(() => {
        expect(elements.getPlatformOption("PC (Windows)")).toBeVisible();
      });

      await actions.clickPlatformOption("PC (Windows)");

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("platform=PC"),
        expect.anything()
      );

      // Re-render to reflect platform filter change
      rerender(<LibraryPageView isSteamConnected={false} />);

      await actions.openMoreFilters();

      await waitFor(() => {
        expect(elements.getPlatformFilter()).toHaveTextContent("PC (Windows)");
      });
    });
  });

  describe("given user searches", () => {
    it("calls router.push with search param after debounce", async () => {
      const { mockPush } = createNavigationMock();

      renderComponent();

      await waitFor(() => {
        expect(elements.getSearchInput()).toBeVisible();
      });

      // Clear any calls from initial render
      mockPush.mockClear();

      // Type search term using userEvent
      await userEvent.type(elements.getSearchInput(), "witcher");

      // Verify router.push was called with search param after debounce
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("search=witcher"),
          expect.anything()
        );
      });
    });
  });

  describe("given user clears filters", () => {
    it("removes all filter params from URL and resets UI to default state", async () => {
      const { mockPush } = createNavigationMock();
      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(elements.getStatusButton("Wishlist")).toBeVisible();
      });

      // Apply status filter
      await actions.clickStatusButton("Wishlist");

      // Re-render to reflect status change
      rerender(<LibraryPageView isSteamConnected={false} />);

      await waitFor(() => {
        expect(elements.getStatusButton("Wishlist")).toHaveAttribute(
          "aria-pressed",
          "true"
        );
      });

      // Apply platform filter
      await actions.openMoreFilters();
      await waitFor(() => {
        expect(elements.getPlatformFilter()).toBeVisible();
      });
      await userEvent.click(elements.getPlatformFilter());

      await waitFor(() => {
        expect(elements.getPlatformOption("PC (Windows)")).toBeVisible();
      });

      await userEvent.click(elements.getPlatformOption("PC (Windows)"));

      // Re-render to reflect platform filter and show clear button
      rerender(<LibraryPageView isSteamConnected={false} />);

      await waitFor(() => {
        expect(elements.getClearFiltersButton()).toBeVisible();
      });

      // Clear the mock to focus on clear filters call
      mockPush.mockClear();

      // Click clear filters button
      await actions.clickClearFilters();

      // Verify router.push was called
      expect(mockPush).toHaveBeenCalledTimes(1);

      // Verify no status, platform, or search params
      const lastCall = mockPush.mock.calls[0];
      const url = new URL(lastCall[0], "http://localhost");
      expect(url.searchParams.get("status")).toBeNull();
      expect(url.searchParams.get("platform")).toBeNull();
      expect(url.searchParams.get("search")).toBeNull();

      // Re-render to reflect cleared state
      rerender(<LibraryPageView isSteamConnected={false} />);

      await waitFor(() => {
        expect(elements.getAllStatusesButton()).toHaveAttribute(
          "aria-pressed",
          "true"
        );
      });

      // Verify All Statuses is active
      expect(elements.getAllStatusesButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );

      // Verify platform filter shows "All Platforms"
      expect(elements.getPlatformFilter()).toHaveTextContent("All Platforms");

      // Verify search input is empty
      expect(elements.getSearchInput()).toHaveValue("");
    });
  });

  describe("given user changes sort", () => {
    it("calls router.push with sortBy and sortOrder params and displays selected option", async () => {
      const { mockPush } = createNavigationMock();
      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(elements.getSortSelect()).toBeVisible();
      });

      // Initially shows "Recently Updated"
      expect(elements.getSortSelect()).toHaveTextContent("Recently Updated");

      // Clear any calls from initial render
      mockPush.mockClear();

      // Select a different sort option (using a primary option that's always visible)
      await actions.selectSort("Title A-Z");

      // Verify router.push was called with correct params
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=title"),
        expect.anything()
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("sortOrder=asc"),
        expect.anything()
      );

      // Re-render to reflect updated URL state
      rerender(<LibraryPageView isSteamConnected={false} />);

      await waitFor(() => {
        expect(elements.getSortSelect()).toHaveTextContent("Title A-Z");
      });
    });
  });

  describe("given empty library", () => {
    beforeEach(() => {
      // Override MSW handler to return empty library - call before render
      server.resetHandlers(...createLibraryHandlers([]));
    });

    it("displays empty state component", async () => {
      renderComponent();

      await waitFor(
        () => {
          expect(elements.queryEmptyState()).toBeVisible();
        },
        { timeout: 3000 }
      );

      expect(elements.queryLibraryGrid()).not.toBeInTheDocument();
      expect(elements.queryErrorState()).not.toBeInTheDocument();
    });
  });

  describe("given API error", () => {
    beforeEach(() => {
      // Override MSW handler to return error response
      server.resetHandlers(
        http.get("/api/library", () => {
          return HttpResponse.json(
            { success: false, error: "Failed to load library" },
            { status: 500 }
          );
        }),
        http.get("/api/library/unique-platforms", () => {
          return HttpResponse.json({
            success: true,
            data: { platforms: uniquePlatformsFixture },
          });
        })
      );
    });

    it("displays error state component", async () => {
      renderComponent();

      await waitFor(
        () => {
          expect(elements.queryErrorState()).toBeVisible();
        },
        { timeout: 3000 }
      );

      expect(elements.queryLibraryGrid()).not.toBeInTheDocument();
      expect(elements.queryEmptyState()).not.toBeInTheDocument();
    });
  });

  describe("rating-based sort, min-rating, and unrated-only URL round-trip", () => {
    it("writes sortBy=rating-desc (no sortOrder) when 'Highest rated' is selected", async () => {
      const { mockPush } = createNavigationMock();
      renderComponent();

      await waitFor(() => {
        expect(elements.getSortSelect()).toBeVisible();
      });

      mockPush.mockClear();

      await actions.selectSort("Highest rated");

      expect(mockPush).toHaveBeenCalledTimes(1);
      const pushedUrl = new URL(
        mockPush.mock.calls[0][0] as string,
        "http://localhost"
      );
      expect(pushedUrl.searchParams.get("sortBy")).toBe("rating-desc");
      expect(pushedUrl.searchParams.get("sortOrder")).toBeNull();
    });

    it("restores 'Highest rated' label when URL contains ?sortBy=rating-desc", async () => {
      createNavigationMock("sortBy=rating-desc");
      renderComponent();

      await waitFor(() => {
        expect(elements.getSortSelect()).toHaveTextContent("Highest rated");
      });
    });

    it("forwards minRating to /api/library request when present in URL", async () => {
      createNavigationMock("minRating=8");

      let requestedUrl: string | null = null;
      server.use(
        http.get("/api/library", ({ request }) => {
          requestedUrl = request.url;
          return HttpResponse.json({
            success: true,
            data: { items: [], total: 0, hasMore: false },
          });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(requestedUrl).not.toBeNull();
      });

      const url = new URL(requestedUrl as unknown as string);
      expect(url.searchParams.get("minRating")).toBe("8");
    });

    it("forwards unratedOnly=1 to /api/library request when present in URL", async () => {
      createNavigationMock("unratedOnly=1");

      let requestedUrl: string | null = null;
      server.use(
        http.get("/api/library", ({ request }) => {
          requestedUrl = request.url;
          return HttpResponse.json({
            success: true,
            data: { items: [], total: 0, hasMore: false },
          });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(requestedUrl).not.toBeNull();
      });

      const url = new URL(requestedUrl as unknown as string);
      expect(url.searchParams.get("unratedOnly")).toBe("1");
    });

    it("ignores invalid minRating (out of range) and omits it from the API request", async () => {
      createNavigationMock("minRating=99");

      let requestedUrl: string | null = null;
      server.use(
        http.get("/api/library", ({ request }) => {
          requestedUrl = request.url;
          return HttpResponse.json({
            success: true,
            data: { items: [], total: 0, hasMore: false },
          });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(requestedUrl).not.toBeNull();
      });

      const url = new URL(requestedUrl as unknown as string);
      expect(url.searchParams.get("minRating")).toBeNull();
    });
  });

  describe("Steam import button", () => {
    it("does not display Import from Steam button when Steam is not connected", () => {
      render(<LibraryPageView isSteamConnected={false} />, {
        wrapper: ({ children }) => (
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider session={null}>
              <QueryClientProvider client={new QueryClient()}>
                {children}
              </QueryClientProvider>
            </SessionProvider>
          </ThemeProvider>
        ),
      });

      const importButton = screen.queryByRole("link", {
        name: /import from steam/i,
      });
      expect(importButton).not.toBeInTheDocument();
    });

    it("displays Import from Steam button when Steam is connected", () => {
      render(<LibraryPageView isSteamConnected={true} />, {
        wrapper: ({ children }) => (
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider session={null}>
              <QueryClientProvider client={new QueryClient()}>
                {children}
              </QueryClientProvider>
            </SessionProvider>
          </ThemeProvider>
        ),
      });

      const importButton = screen.getByRole("link", {
        name: /import from steam/i,
      });
      expect(importButton).toBeInTheDocument();
      expect(importButton).toHaveAttribute("href", "/steam/games");
    });
  });
});
