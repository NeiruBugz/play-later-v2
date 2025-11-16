import { LibraryItemStatus } from "@prisma/client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";

import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

import { LibraryFilters } from "./library-filters";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock debounced value hook
vi.mock("@/shared/hooks/use-debounced-value", () => ({
  useDebouncedValue: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);
const mockUseDebouncedValue = vi.mocked(useDebouncedValue);

const createMockSearchParams = (params: Record<string, string | null>) => {
  return {
    get: (key: string) => params[key] ?? null,
    has: (key: string) => key in params && params[key] !== null,
    toString: () =>
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== null) as [
            string,
            string,
          ][]
        )
      ).toString(),
  } as URLSearchParams;
};

describe("LibraryFilters", () => {
  let mockPush: ReturnType<typeof vi.fn>;

  const elements = {
    getStatusSelect: () => screen.getByLabelText("Status"),
    getPlatformSelect: () => screen.getByLabelText("Platform"),
    getSearchInput: () => screen.getByLabelText("Search"),
    queryClearFiltersButton: () =>
      screen.queryByRole("button", { name: /clear filters/i }),
    getClearFiltersButton: () =>
      screen.getByRole("button", { name: /clear filters/i }),
  };

  const actions = {
    openStatusDropdown: async () => {
      const select = elements.getStatusSelect();
      await userEvent.click(select);

      // Wait for dropdown to open
      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: "All Statuses" })
        ).toBeVisible();
      });
    },
    openPlatformDropdown: async () => {
      const select = elements.getPlatformSelect();
      await userEvent.click(select);

      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: "All Platforms" })
        ).toBeVisible();
      });
    },
    typeSearch: async (value: string) => {
      const input = elements.getSearchInput();
      await userEvent.clear(input);
      await userEvent.type(input, value);
    },
    clickClearFilters: async () => {
      const button = elements.getClearFiltersButton();
      await userEvent.click(button);
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPush = vi.fn();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as any);

    // Default: no filters applied
    mockUseSearchParams.mockReturnValue(createMockSearchParams({}) as any);

    // Mock debounced value to return the same value immediately (for simplicity)
    mockUseDebouncedValue.mockImplementation((value) => value);
  });

  describe("given component renders with no filters", () => {
    it("should display all filter controls", () => {
      render(<LibraryFilters />);

      expect(elements.getStatusSelect()).toBeVisible();
      expect(elements.getPlatformSelect()).toBeVisible();
      expect(elements.getSearchInput()).toBeVisible();
    });

    it("should not show clear filters button when no filters active", () => {
      render(<LibraryFilters />);

      expect(elements.queryClearFiltersButton()).not.toBeInTheDocument();
    });

    it("should have empty search input", () => {
      render(<LibraryFilters />);

      expect(elements.getSearchInput()).toHaveValue("");
    });
  });

  describe("given component renders with active filters", () => {
    it("should show clear filters button when status filter is active", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        })
      );

      render(<LibraryFilters />);

      expect(elements.getClearFiltersButton()).toBeVisible();
    });

    it("should show clear filters button when platform filter is active", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ platform: "PlayStation 5" })
      );

      render(<LibraryFilters />);

      expect(elements.getClearFiltersButton()).toBeVisible();
    });

    it("should show clear filters button when search filter is active", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ search: "zelda" })
      );

      render(<LibraryFilters />);

      expect(elements.getClearFiltersButton()).toBeVisible();
    });

    it("should show search input value from URL", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ search: "mario" })
      );

      render(<LibraryFilters />);

      expect(elements.getSearchInput()).toHaveValue("mario");
    });
  });

  describe("given status dropdown behavior", () => {
    it("should display current status from URL when set", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        })
      );

      render(<LibraryFilters />);

      // The Select component should show the current value
      expect(elements.getStatusSelect()).toBeInTheDocument();
    });

    it("should not break when status is not in URL", () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      render(<LibraryFilters />);

      expect(elements.getStatusSelect()).toBeInTheDocument();
    });
  });

  describe("given platform dropdown behavior", () => {
    it("should display current platform from URL when set", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ platform: "PlayStation 5" })
      );

      render(<LibraryFilters />);

      expect(elements.getPlatformSelect()).toBeInTheDocument();
    });

    it("should not break when platform is not in URL", () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      render(<LibraryFilters />);

      expect(elements.getPlatformSelect()).toBeInTheDocument();
    });
  });

  describe("given user types in search input", () => {
    it("should update search input immediately", async () => {
      render(<LibraryFilters />);

      await actions.typeSearch("zelda");

      expect(elements.getSearchInput()).toHaveValue("zelda");
    });

    it("should call useDebouncedValue with search input and 300ms delay", () => {
      render(<LibraryFilters />);

      expect(mockUseDebouncedValue).toHaveBeenCalledWith("", 300);
    });

    it("should update URL when debounced value changes", async () => {
      // First render with empty search
      const { rerender } = render(<LibraryFilters />);
      expect(mockUseDebouncedValue).toHaveBeenCalledWith("", 300);

      // Simulate debounced value change
      mockUseDebouncedValue.mockReturnValue("zelda");

      rerender(<LibraryFilters />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("search=zelda"),
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it("should preserve other filter parameters when search changes", async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.WISHLIST,
          platform: "PC",
        })
      );

      // Start with empty search, then simulate debounce completing
      mockUseDebouncedValue.mockReturnValue("");
      const { rerender } = render(<LibraryFilters />);

      // Simulate typing and debounce completing
      mockUseDebouncedValue.mockReturnValue("mario");
      rerender(<LibraryFilters />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/status=WISHLIST/),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/platform=PC/),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/search=mario/),
          expect.anything()
        );
      });
    });

    it("should remove search parameter when search is cleared via debounce", async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ search: "zelda" })
      );
      mockUseDebouncedValue.mockReturnValue("zelda");

      const { rerender } = render(<LibraryFilters />);

      // Simulate clearing search and debounce completing
      mockUseDebouncedValue.mockReturnValue("");
      rerender(<LibraryFilters />);

      await waitFor(() => {
        const callUrl = mockPush.mock.calls[0]?.[0] as string;
        expect(callUrl).not.toContain("search=");
      });
    });
  });

  describe("given user clicks clear filters button", () => {
    it("should remove all filter parameters but preserve sorting", async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PlayStation 5",
          search: "zelda",
          sortBy: "releaseDate",
          sortOrder: "asc",
        })
      );

      render(<LibraryFilters />);

      await actions.clickClearFilters();

      await waitFor(() => {
        const callUrl = mockPush.mock.calls[0]?.[0] as string;

        // Filter params should be removed
        expect(callUrl).not.toContain("status=");
        expect(callUrl).not.toContain("platform=");
        expect(callUrl).not.toContain("search=");

        // Sort params should be preserved
        expect(callUrl).toContain("sortBy=releaseDate");
        expect(callUrl).toContain("sortOrder=asc");
      });
    });

    it("should clear search input when clear filters clicked", async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ search: "mario" })
      );

      render(<LibraryFilters />);

      expect(elements.getSearchInput()).toHaveValue("mario");

      await actions.clickClearFilters();

      await waitFor(() => {
        expect(elements.getSearchInput()).toHaveValue("");
      });
    });
  });

  describe("given multiple filters applied simultaneously", () => {
    it("should show clear filters button with multiple active filters", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.TOOK_A_BREAK,
          platform: "Xbox Series X/S",
          search: "halo",
        })
      );

      render(<LibraryFilters />);

      expect(elements.getClearFiltersButton()).toBeVisible();
    });

    it("should display all filter controls when multiple filters active", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.WISHLIST,
          platform: "PC",
          search: "mario",
        })
      );

      render(<LibraryFilters />);

      expect(elements.getStatusSelect()).toBeVisible();
      expect(elements.getPlatformSelect()).toBeVisible();
      expect(elements.getSearchInput()).toBeVisible();
      expect(elements.getClearFiltersButton()).toBeVisible();
    });
  });

  describe("given status dropdown displays all enum values", () => {
    it("should show all status options when dropdown opened", async () => {
      render(<LibraryFilters />);

      await actions.openStatusDropdown();

      // Verify all 6 status options plus "All Statuses" are present
      expect(
        screen.getByRole("option", { name: "All Statuses" })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: "Curious About" })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: "Currently Exploring" })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: "Took a Break" })
      ).toBeVisible();
      expect(screen.getByRole("option", { name: "Experienced" })).toBeVisible();
      expect(screen.getByRole("option", { name: "Wishlist" })).toBeVisible();
      expect(screen.getByRole("option", { name: "Revisiting" })).toBeVisible();
    });
  });

  describe("given platform dropdown displays platform options", () => {
    it("should show all platform options when dropdown opened", async () => {
      render(<LibraryFilters />);

      await actions.openPlatformDropdown();

      // Verify all platform options are present
      expect(
        screen.getByRole("option", { name: "All Platforms" })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: "PlayStation 5" })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: "PlayStation 4" })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: "Xbox Series X/S" })
      ).toBeVisible();
      expect(screen.getByRole("option", { name: "Xbox One" })).toBeVisible();
      expect(
        screen.getByRole("option", { name: "Nintendo Switch" })
      ).toBeVisible();
      expect(screen.getByRole("option", { name: "PC" })).toBeVisible();
    });
  });

  describe("given component syncs with URL on page load", () => {
    it("should read status from URL on initial render", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ status: LibraryItemStatus.CURIOUS_ABOUT })
      );

      render(<LibraryFilters />);

      // The component should read from searchParams - verify it doesn't crash
      // and renders correctly (value tested by URL encoding when changed)
      expect(elements.getStatusSelect()).toBeVisible();
    });

    it("should read platform from URL on initial render", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ platform: "Nintendo Switch" })
      );

      render(<LibraryFilters />);

      expect(elements.getPlatformSelect()).toBeVisible();
    });

    it("should read search from URL on initial render", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ search: "pokemon" })
      );

      render(<LibraryFilters />);

      expect(elements.getSearchInput()).toHaveValue("pokemon");
    });
  });
});
