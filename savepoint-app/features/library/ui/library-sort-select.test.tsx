import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";

import { LibrarySortSelect } from "./library-sort-select";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);

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

describe("LibrarySortSelect", () => {
  let mockPush: ReturnType<typeof vi.fn>;

  const elements = {
    getSortSelect: () => screen.getByLabelText("Sort by"),
    getSortTrigger: () => screen.getByRole("combobox", { name: /sort by/i }),
  };

  const actions = {
    selectSortOption: async (label: string) => {
      const trigger = elements.getSortTrigger();
      await userEvent.click(trigger);

      await waitFor(() => {
        const option = screen.getByRole("option", { name: label });
        expect(option).toBeVisible();
      });

      const option = screen.getByRole("option", { name: label });
      // Note: In jsdom, clicking Radix UI Select options doesn't always trigger onChange
      // This is a known limitation of testing Radix UI components
      await userEvent.click(option);
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

    // Default: no sort params (should use defaults)
    mockUseSearchParams.mockReturnValue(createMockSearchParams({}) as any);
  });

  describe("given component renders with default sort", () => {
    it("should display sort select control", () => {
      render(<LibrarySortSelect />);

      expect(elements.getSortSelect()).toBeVisible();
    });

    it("should show default sort value of Recently Added when no URL params", () => {
      render(<LibrarySortSelect />);

      const trigger = elements.getSortTrigger();
      expect(trigger).toHaveTextContent("Recently Added");
    });
  });

  describe("given component reads current sort from URL params", () => {
    it("should display createdAt desc as Recently Added", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "createdAt",
          sortOrder: "desc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent("Recently Added");
    });

    it("should display createdAt asc as Oldest First", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortBy: "createdAt", sortOrder: "asc" }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent("Oldest First");
    });

    it("should display releaseDate desc as Release Date (Newest)", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "releaseDate",
          sortOrder: "desc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent(
        "Release Date (Newest)"
      );
    });

    it("should display releaseDate asc as Release Date (Oldest)", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "releaseDate",
          sortOrder: "asc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent(
        "Release Date (Oldest)"
      );
    });

    it("should display startedAt desc as Started (Most Recent)", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "startedAt",
          sortOrder: "desc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent(
        "Started (Most Recent)"
      );
    });

    it("should display startedAt asc as Started (Oldest)", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortBy: "startedAt", sortOrder: "asc" }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent("Started (Oldest)");
    });

    it("should display completedAt desc as Completed (Most Recent)", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "completedAt",
          sortOrder: "desc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent(
        "Completed (Most Recent)"
      );
    });

    it("should display completedAt asc as Completed (Oldest)", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "completedAt",
          sortOrder: "asc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent("Completed (Oldest)");
    });
  });

  describe("given dropdown displays all 8 sort options", () => {
    it("should show all sort options when dropdown opened", async () => {
      render(<LibrarySortSelect />);

      const trigger = elements.getSortTrigger();
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: "Recently Added" })
        ).toBeVisible();
        expect(
          screen.getByRole("option", { name: "Oldest First" })
        ).toBeVisible();
        expect(
          screen.getByRole("option", { name: "Release Date (Newest)" })
        ).toBeVisible();
        expect(
          screen.getByRole("option", { name: "Release Date (Oldest)" })
        ).toBeVisible();
        expect(
          screen.getByRole("option", { name: "Started (Most Recent)" })
        ).toBeVisible();
        expect(
          screen.getByRole("option", { name: "Started (Oldest)" })
        ).toBeVisible();
        expect(
          screen.getByRole("option", { name: "Completed (Most Recent)" })
        ).toBeVisible();
        expect(
          screen.getByRole("option", { name: "Completed (Oldest)" })
        ).toBeVisible();
      });
    });
  });

  describe("given user changes sort option", () => {
    it("should not update URL when selecting same sort option already selected", async () => {
      // Default is "Recently Added" (createdAt desc)
      render(<LibrarySortSelect />);

      await actions.selectSortOption("Recently Added");

      // Clicking the same option shouldn't trigger onChange
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should update URL with sortBy=createdAt and sortOrder=asc when Oldest First selected", async () => {
      render(<LibrarySortSelect />);

      await actions.selectSortOption("Oldest First");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortBy=createdAt/),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortOrder=asc/),
          expect.anything()
        );
      });
    });

    it("should update URL with sortBy=releaseDate and sortOrder=desc when Release Date (Newest) selected", async () => {
      render(<LibrarySortSelect />);

      await actions.selectSortOption("Release Date (Newest)");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortBy=releaseDate/),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortOrder=desc/),
          expect.anything()
        );
      });
    });

    it("should update URL with sortBy=releaseDate and sortOrder=asc when Release Date (Oldest) selected", async () => {
      render(<LibrarySortSelect />);

      await actions.selectSortOption("Release Date (Oldest)");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortBy=releaseDate/),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortOrder=asc/),
          expect.anything()
        );
      });
    });

    it("should update URL with sortBy=startedAt and sortOrder=desc when Started (Most Recent) selected", async () => {
      render(<LibrarySortSelect />);

      await actions.selectSortOption("Started (Most Recent)");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortBy=startedAt/),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortOrder=desc/),
          expect.anything()
        );
      });
    });

    it("should update URL with sortBy=startedAt and sortOrder=asc when Started (Oldest) selected", async () => {
      render(<LibrarySortSelect />);

      await actions.selectSortOption("Started (Oldest)");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortBy=startedAt/),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortOrder=asc/),
          expect.anything()
        );
      });
    });

    it("should update URL with sortBy=completedAt and sortOrder=desc when Completed (Most Recent) selected", async () => {
      render(<LibrarySortSelect />);

      await actions.selectSortOption("Completed (Most Recent)");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortBy=completedAt/),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortOrder=desc/),
          expect.anything()
        );
      });
    });

    it("should update URL with sortBy=completedAt and sortOrder=asc when Completed (Oldest) selected", async () => {
      render(<LibrarySortSelect />);

      await actions.selectSortOption("Completed (Oldest)");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortBy=completedAt/),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/sortOrder=asc/),
          expect.anything()
        );
      });
    });
  });

  describe("given sort change preserves filter parameters", () => {
    it("should preserve status filter when sort changes", async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ status: "CURRENTLY_EXPLORING" }) as any
      );

      render(<LibrarySortSelect />);

      await actions.selectSortOption("Release Date (Newest)");

      await waitFor(() => {
        const callUrl = mockPush.mock.calls[0]?.[0] as string;
        expect(callUrl).toContain("status=CURRENTLY_EXPLORING");
        expect(callUrl).toContain("sortBy=releaseDate");
        expect(callUrl).toContain("sortOrder=desc");
      });
    });

    it("should preserve platform filter when sort changes", async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ platform: "PlayStation 5" }) as any
      );

      render(<LibrarySortSelect />);

      await actions.selectSortOption("Oldest First");

      await waitFor(() => {
        const callUrl = mockPush.mock.calls[0]?.[0] as string;
        expect(callUrl).toContain("platform=PlayStation+5");
        expect(callUrl).toContain("sortBy=createdAt");
        expect(callUrl).toContain("sortOrder=asc");
      });
    });

    it("should preserve search filter when sort changes", async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ search: "zelda" }) as any
      );

      render(<LibrarySortSelect />);

      await actions.selectSortOption("Started (Most Recent)");

      await waitFor(() => {
        const callUrl = mockPush.mock.calls[0]?.[0] as string;
        expect(callUrl).toContain("search=zelda");
        expect(callUrl).toContain("sortBy=startedAt");
        expect(callUrl).toContain("sortOrder=desc");
      });
    });

    it("should preserve all filter parameters when sort changes", async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: "WISHLIST",
          platform: "PC",
          search: "mario",
        }) as any
      );

      render(<LibrarySortSelect />);

      await actions.selectSortOption("Completed (Oldest)");

      await waitFor(() => {
        const callUrl = mockPush.mock.calls[0]?.[0] as string;
        expect(callUrl).toContain("status=WISHLIST");
        expect(callUrl).toContain("platform=PC");
        expect(callUrl).toContain("search=mario");
        expect(callUrl).toContain("sortBy=completedAt");
        expect(callUrl).toContain("sortOrder=asc");
      });
    });
  });

  describe("given component handles all sort field values", () => {
    it("should handle createdAt sort field correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "createdAt",
          sortOrder: "desc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent("Recently Added");
    });

    it("should handle releaseDate sort field correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "releaseDate",
          sortOrder: "asc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent(
        "Release Date (Oldest)"
      );
    });

    it("should handle startedAt sort field correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "startedAt",
          sortOrder: "desc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent(
        "Started (Most Recent)"
      );
    });

    it("should handle completedAt sort field correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "completedAt",
          sortOrder: "asc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent("Completed (Oldest)");
    });
  });

  describe("given component handles both sort orders", () => {
    it("should handle asc sort order correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "releaseDate",
          sortOrder: "asc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent(
        "Release Date (Oldest)"
      );
    });

    it("should handle desc sort order correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "completedAt",
          sortOrder: "desc",
        }) as any
      );

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent(
        "Completed (Most Recent)"
      );
    });
  });

  describe("given default values when URL params missing", () => {
    it("should default to createdAt when sortBy missing", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortOrder: "asc" }) as any
      );

      render(<LibrarySortSelect />);

      // createdAt + asc = "Oldest First"
      expect(elements.getSortTrigger()).toHaveTextContent("Oldest First");
    });

    it("should default to desc when sortOrder missing", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortBy: "releaseDate" }) as any
      );

      render(<LibrarySortSelect />);

      // releaseDate + desc = "Release Date (Newest)"
      expect(elements.getSortTrigger()).toHaveTextContent(
        "Release Date (Newest)"
      );
    });

    it("should default to createdAt desc when both params missing", () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}) as any);

      render(<LibrarySortSelect />);

      expect(elements.getSortTrigger()).toHaveTextContent("Recently Added");
    });
  });

  describe("given updates both sortBy and sortOrder simultaneously", () => {
    it("should set both parameters in a single URL update", async () => {
      render(<LibrarySortSelect />);

      await actions.selectSortOption("Started (Most Recent)");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1);
        const callUrl = mockPush.mock.calls[0]?.[0] as string;
        expect(callUrl).toContain("sortBy=startedAt");
        expect(callUrl).toContain("sortOrder=desc");
      });
    });

    it("should overwrite existing sort parameters correctly", async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          sortBy: "createdAt",
          sortOrder: "desc",
        }) as any
      );

      render(<LibrarySortSelect />);

      await actions.selectSortOption("Completed (Oldest)");

      await waitFor(() => {
        const callUrl = mockPush.mock.calls[0]?.[0] as string;
        expect(callUrl).toContain("sortBy=completedAt");
        expect(callUrl).toContain("sortOrder=asc");
        // Should not contain old values
        expect(callUrl).not.toContain("sortBy=createdAt");
      });
    });
  });
});
