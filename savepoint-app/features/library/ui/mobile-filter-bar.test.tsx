import { uniquePlatformsFixture } from "@/test/fixtures/library";
import { server } from "@/test/setup/client-setup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { MobileFilterBar } from "./mobile-filter-bar";

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

  return { mockPush, mockReplace };
};

const renderComponent = (props: { isSteamConnected?: boolean } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(<MobileFilterBar {...props} />, { wrapper: Wrapper });
};

const STATUS_CASES: Array<{ label: string; param: string }> = [
  { label: "Up Next", param: "UP_NEXT" },
  { label: "Playing", param: "PLAYING" },
  { label: "Shelf", param: "SHELF" },
  { label: "Played", param: "PLAYED" },
  { label: "Wishlist", param: "WISHLIST" },
];

describe("MobileFilterBar", () => {
  beforeEach(() => {
    createNavigationMock();
    server.use(
      http.get("/api/library/status-counts", () =>
        HttpResponse.json({
          success: true,
          data: {
            WISHLIST: 1,
            SHELF: 2,
            UP_NEXT: 3,
            PLAYING: 4,
            PLAYED: 5,
          },
        })
      ),
      http.get("/api/library/unique-platforms", () =>
        HttpResponse.json({
          success: true,
          data: { platforms: uniquePlatformsFixture },
        })
      )
    );
  });

  describe("segmented control", () => {
    it("renders the All segment plus all five status segments", () => {
      renderComponent();

      expect(
        screen.getByRole("button", { name: "Show all statuses" })
      ).toBeVisible();
      for (const { label } of STATUS_CASES) {
        expect(
          screen.getByRole("button", { name: `Filter by ${label}` })
        ).toBeVisible();
      }
    });

    it.each(STATUS_CASES)(
      "pushes status=$param when the $label segment is clicked",
      async ({ label, param }) => {
        const { mockPush } = createNavigationMock();
        renderComponent();

        await userEvent.click(
          screen.getByRole("button", { name: `Filter by ${label}` })
        );

        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining(`status=${param}`),
          expect.anything()
        );
      }
    );

    it("clears status when the All segment is clicked", async () => {
      const { mockPush } = createNavigationMock("status=PLAYING");
      renderComponent();

      await userEvent.click(
        screen.getByRole("button", { name: "Show all statuses" })
      );

      const url = new URL(
        mockPush.mock.calls[0][0] as string,
        "http://localhost"
      );
      expect(url.searchParams.get("status")).toBeNull();
    });

    it("reflects pressed state for the active status segment", () => {
      createNavigationMock("status=PLAYING");
      renderComponent();

      expect(
        screen.getByRole("button", { name: "Filter by Playing" })
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        screen.getByRole("button", { name: "Show all statuses" })
      ).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("filters sheet", () => {
    it("opens when the Filters trigger is clicked", async () => {
      renderComponent();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "Open filters" })
      );

      expect(await screen.findByRole("dialog")).toBeVisible();
    });

    it("closes when Escape is pressed", async () => {
      renderComponent();

      await userEvent.click(
        screen.getByRole("button", { name: "Open filters" })
      );
      expect(await screen.findByRole("dialog")).toBeVisible();

      await userEvent.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("renders status counts inside the sheet", async () => {
      renderComponent();

      await userEvent.click(
        screen.getByRole("button", { name: "Open filters" })
      );

      const dialog = await screen.findByRole("dialog");
      const playingButton = within(dialog).getByRole("button", {
        name: "Filter by Playing",
      });
      expect(playingButton).toHaveTextContent("4");

      const wishlistButton = within(dialog).getByRole("button", {
        name: "Filter by Wishlist",
      });
      expect(wishlistButton).toHaveTextContent("1");
    });

    it("pushes sortBy/sortOrder when sort is changed inside the sheet", async () => {
      const { mockPush } = createNavigationMock();
      renderComponent();

      await userEvent.click(
        screen.getByRole("button", { name: "Open filters" })
      );

      const dialog = await screen.findByRole("dialog");
      const sortSelect = within(dialog).getByRole("combobox", {
        name: "Sort by",
      });

      mockPush.mockClear();
      await userEvent.click(sortSelect);
      await userEvent.click(
        await screen.findByRole("option", { name: "Title A-Z" })
      );

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=title"),
        expect.anything()
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("sortOrder=asc"),
        expect.anything()
      );
    });

    it("pushes platform param when a platform is selected in the sheet", async () => {
      const { mockPush } = createNavigationMock();
      renderComponent();

      await userEvent.click(
        screen.getByRole("button", { name: "Open filters" })
      );

      const dialog = await screen.findByRole("dialog");
      const platformCombobox = within(dialog).getByRole("combobox", {
        name: "Filter by platform",
      });

      mockPush.mockClear();
      await userEvent.click(platformCombobox);
      await userEvent.click(
        await screen.findByRole("option", { name: "PC (Windows)" })
      );

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("platform=PC"),
        expect.anything()
      );
    });
  });

  describe("steam import", () => {
    it("renders the Steam import button when isSteamConnected=true", () => {
      renderComponent({ isSteamConnected: true });

      const link = screen.getByRole("link", { name: /import from steam/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/steam/games");
    });

    it("does not render the Steam import button when isSteamConnected=false", () => {
      renderComponent({ isSteamConnected: false });

      expect(
        screen.queryByRole("link", { name: /import from steam/i })
      ).not.toBeInTheDocument();
    });
  });
});
