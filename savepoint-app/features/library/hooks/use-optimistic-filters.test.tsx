import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { useOptimisticFilters } from "./use-optimistic-filters";

const createNavigationMock = (initialQuery = "") => {
  let currentParams = new URLSearchParams(initialQuery);

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

function StatusChips() {
  const { filters, isPending, pendingField, setStatus } =
    useOptimisticFilters();
  const currentStatus = filters.status ?? "__all__";

  return (
    <div>
      <button
        type="button"
        aria-pressed={currentStatus === "__all__"}
        aria-label="Show all statuses"
        onClick={() => setStatus(null)}
        disabled={isPending && pendingField === "status"}
        data-testid="all-btn"
      >
        All
      </button>
      {(["PLAYING", "PLAYED", "WISHLIST", "SHELF", "UP_NEXT"] as const).map(
        (status) => {
          const isActive = currentStatus === status;
          const isThisPending = isPending && pendingField === "status";
          return (
            <button
              key={status}
              type="button"
              aria-pressed={isActive}
              aria-label={`Filter by ${status}`}
              onClick={() => setStatus(status)}
              disabled={isThisPending}
              data-testid={`status-${status}`}
            >
              {isThisPending && isActive && (
                <span data-testid={`spinner-${status}`}>spinner</span>
              )}
              {status}
            </button>
          );
        }
      )}
      {isPending && <span data-testid="global-pending">pending</span>}
    </div>
  );
}

function SortSelect() {
  const { filters, isPending, pendingField, setSort } = useOptimisticFilters();
  return (
    <div>
      <span data-testid="sort-value">
        {filters.sortBy}-{filters.sortOrder}
      </span>
      <button
        type="button"
        aria-label="Sort by title asc"
        onClick={() => setSort("title", "asc")}
        disabled={isPending && pendingField === "sort"}
        data-testid="sort-btn"
      >
        Title A-Z
      </button>
      {isPending && pendingField === "sort" && (
        <span data-testid="sort-spinner">spinner</span>
      )}
    </div>
  );
}

describe("useOptimisticFilters", () => {
  describe("status chip optimistic state", () => {
    it("immediately reflects pressed state after click, before router resolves", async () => {
      createNavigationMock();
      render(<StatusChips />);

      const playingBtn = screen.getByRole("button", {
        name: "Filter by PLAYING",
      });
      expect(playingBtn).toHaveAttribute("aria-pressed", "false");

      await userEvent.click(playingBtn);

      expect(
        screen.getByRole("button", { name: "Filter by PLAYING" })
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("calls router.push with correct status param when a status chip is clicked", async () => {
      const { mockPush } = createNavigationMock();
      render(<StatusChips />);

      await userEvent.click(
        screen.getByRole("button", { name: "Filter by WISHLIST" })
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("status=WISHLIST"),
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it("clears status when All is clicked", async () => {
      const { mockPush } = createNavigationMock("status=PLAYING");
      render(<StatusChips />);

      await userEvent.click(
        screen.getByRole("button", { name: "Show all statuses" })
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1);
        const url = new URL(
          mockPush.mock.calls[0][0] as string,
          "http://localhost"
        );
        expect(url.searchParams.get("status")).toBeNull();
      });
    });

    it("reads initial pressed state from URL search params", () => {
      createNavigationMock("status=PLAYED");
      render(<StatusChips />);

      expect(
        screen.getByRole("button", { name: "Filter by PLAYED" })
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        screen.getByRole("button", { name: "Show all statuses" })
      ).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("sort optimistic state", () => {
    it("immediately reflects new sort value after click", async () => {
      createNavigationMock();
      render(<SortSelect />);

      expect(screen.getByTestId("sort-value")).toHaveTextContent(
        "updatedAt-desc"
      );

      await userEvent.click(
        screen.getByRole("button", { name: "Sort by title asc" })
      );

      expect(screen.getByTestId("sort-value")).toHaveTextContent("title-asc");
    });

    it("calls router.push with sortBy and sortOrder params", async () => {
      const { mockPush } = createNavigationMock();
      render(<SortSelect />);

      await userEvent.click(
        screen.getByRole("button", { name: "Sort by title asc" })
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("sortBy=title"),
          expect.anything()
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("sortOrder=asc"),
          expect.anything()
        );
      });
    });
  });

  describe("multiple rapid clicks", () => {
    it("commits the last clicked status to the URL", async () => {
      const { mockPush } = createNavigationMock();
      render(<StatusChips />);

      await userEvent.click(
        screen.getByRole("button", { name: "Filter by PLAYING" })
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Filter by WISHLIST" })
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Filter by PLAYED" })
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenLastCalledWith(
          expect.stringContaining("status=PLAYED"),
          expect.anything()
        );
      });
    });
  });

  describe("clearAll", () => {
    it("calls router.push with no filter params", async () => {
      const { mockPush } = createNavigationMock(
        "status=PLAYING&platform=PC&search=witcher"
      );

      function ClearBtn() {
        const { clearAll } = useOptimisticFilters();
        return (
          <button
            type="button"
            onClick={clearAll}
            aria-label="Clear all filters"
          >
            Clear
          </button>
        );
      }

      render(<ClearBtn />);

      await userEvent.click(
        screen.getByRole("button", { name: "Clear all filters" })
      );

      await waitFor(() => {
        const url = new URL(
          mockPush.mock.calls[0][0] as string,
          "http://localhost"
        );
        expect(url.searchParams.get("status")).toBeNull();
        expect(url.searchParams.get("platform")).toBeNull();
        expect(url.searchParams.get("search")).toBeNull();
      });
    });
  });
});
