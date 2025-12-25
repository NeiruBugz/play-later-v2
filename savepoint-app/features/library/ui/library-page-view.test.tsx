import {
  uniquePlatformsFixture,
} from "@/test/fixtures/library";
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
const createNavigationMock = () => {
  let currentParams = new URLSearchParams();

  const mockPush = vi.fn((url: string) => {
    const urlObj = new URL(url, "http://localhost");
    currentParams = urlObj.searchParams;
  });

  vi.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as ReturnType<typeof useRouter>);

  vi.mocked(useSearchParams).mockImplementation(
    () => currentParams as ReadonlyURLSearchParams
  );

  return { mockPush, getParams: () => currentParams };
};

const elements = {
  getLibraryHeading: () => screen.getByRole("heading", { name: "My Library" }),
  getSortSelect: () => screen.getByRole("combobox", { name: "Sort by" }),
  getPlatformFilter: () =>
    screen.getByRole("combobox", { name: "Filter by platform" }),
  getSearchInput: () =>
    screen.getByRole("searchbox", { name: "Search games by title" }),
  getAllStatusesButton: () =>
    screen.getByRole("button", { name: "Show all statuses" }),
  getStatusButton: (status: string) =>
    screen.getByRole("button", { name: `Filter by ${status}` }),
  getPlatformOption: (platform: string) =>
    screen.getByRole("option", { name: platform }),
  getClearFiltersButton: () =>
    screen.getByRole("button", { name: "Clear all filters" }),
  queryClearFiltersButton: () =>
    screen.queryByRole("button", { name: "Clear all filters" }),
  queryLibraryGrid: () =>
    screen.queryByRole("feed", { name: "Your game library" }),
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
    await userEvent.click(screen.getByRole("option", { name: option }));
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

  return render(<LibraryPageView />, { wrapper: Wrapper });
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
      expect(elements.getPlatformFilter()).toBeVisible();
      expect(elements.getSearchInput()).toBeVisible();
    });

    it("displays all status buttons", async () => {
      renderComponent();

      await waitFor(() => {
        expect(elements.getAllStatusesButton()).toBeVisible();
      });

      expect(elements.getStatusButton("Curious About")).toBeVisible();
      expect(elements.getStatusButton("Currently Exploring")).toBeVisible();
      expect(elements.getStatusButton("Taking a Break")).toBeVisible();
      expect(elements.getStatusButton("Experienced")).toBeVisible();
      expect(elements.getStatusButton("Wishlist")).toBeVisible();
      expect(elements.getStatusButton("Revisiting")).toBeVisible();
    });

    it("displays sort select with default value", async () => {
      renderComponent();

      await waitFor(() => {
        expect(elements.getSortSelect()).toBeVisible();
      });

      expect(elements.getSortSelect()).toHaveTextContent("Recently Added");
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

        await actions.clickStatusButton("Curious About");

        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("status=CURIOUS_ABOUT"),
          expect.anything()
        );

        rerender(<LibraryPageView />);

        await waitFor(() => {
          expect(elements.getStatusButton("Curious About")).toHaveAttribute(
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
      rerender(<LibraryPageView />);

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
        expect(elements.getStatusButton("Curious About")).toBeVisible();
      });

      // Apply status filter
      await actions.clickStatusButton("Curious About");

      // Re-render to reflect status change
      rerender(<LibraryPageView />);

      await waitFor(() => {
        expect(elements.getStatusButton("Curious About")).toHaveAttribute(
          "aria-pressed",
          "true"
        );
      });

      // Apply platform filter
      await userEvent.click(elements.getPlatformFilter());

      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: "PC (Windows)" })
        ).toBeVisible();
      });

      await userEvent.click(
        screen.getByRole("option", { name: "PC (Windows)" })
      );

      // Re-render to reflect platform filter and show clear button
      rerender(<LibraryPageView />);

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
      rerender(<LibraryPageView />);

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

      // Initially shows "Recently Added"
      expect(elements.getSortSelect()).toHaveTextContent("Recently Added");

      // Clear any calls from initial render
      mockPush.mockClear();

      // Select a different sort option
      await actions.selectSort("Release Date (Newest)");

      // Verify router.push was called with correct params
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=releaseDate"),
        expect.anything()
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("sortOrder=desc"),
        expect.anything()
      );

      // Re-render to reflect updated URL state
      rerender(<LibraryPageView />);

      await waitFor(() => {
        expect(elements.getSortSelect()).toHaveTextContent(
          "Release Date (Newest)"
        );
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
});
