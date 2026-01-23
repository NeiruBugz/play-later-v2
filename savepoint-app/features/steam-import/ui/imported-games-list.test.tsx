import type { ImportedGame } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ImportedGamesList } from "@/features/steam-import/ui/imported-games-list";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const createMockImportedGame = (id: string, name: string): ImportedGame => ({
  id,
  userId: "user-1",
  storefront: "STEAM",
  storefrontGameId: id,
  name,
  playtime: 100,
  playtimeWindows: 80,
  playtimeMac: 15,
  playtimeLinux: 5,
  lastPlayedAt: new Date("2026-01-15T12:00:00Z"),
  img_icon_url: "icon123",
  img_logo_url: null,
  igdbMatchStatus: "PENDING",
  createdAt: new Date("2026-01-18T10:00:00Z"),
  updatedAt: new Date("2026-01-18T10:00:00Z"),
  deletedAt: null,
});

const createMockGamesList = (count: number): ImportedGame[] =>
  Array.from({ length: count }, (_, i) =>
    createMockImportedGame(`game-${i + 1}`, `Game ${i + 1}`)
  );

const elements = {
  getSkeletons: () => screen.getAllByRole("status", { hidden: true }),
  queryGameByName: (name: string) => screen.queryByText(name),
  getGameByName: (name: string) => screen.getByText(name),
  getErrorTitle: () => screen.getByText("Failed to Load Games"),
  getErrorMessage: (msg: string) => screen.getByText(msg),
  getRetryButton: () => screen.getByRole("button", { name: /retry/i }),
  queryRetryButton: () => screen.queryByRole("button", { name: /retry/i }),
  getEmptyTitle: () => screen.getByText("No games imported yet"),
  getEmptyDescription: () =>
    screen.getByText(
      "Import your Steam library to see your games here. Connect your Steam account to get started."
    ),
  getCountHeader: (text: string) => screen.getByText(text),
  getList: () => screen.getByRole("list", { name: /imported games/i }),
  getListItems: () => screen.getAllByRole("listitem"),
  getPagination: () => screen.getByRole("navigation", { name: /pagination/i }),
  queryPagination: () =>
    screen.queryByRole("navigation", { name: /pagination/i }),
  getPageIndicator: (text: string) => screen.getByText(text),
  getPreviousButton: () =>
    screen.getByRole("button", { name: /go to previous page/i }),
  getNextButton: () => screen.getByRole("button", { name: /go to next page/i }),
};

const actions = {
  clickRetry: async () => {
    await userEvent.click(elements.getRetryButton());
  },
  clickNext: async () => {
    await userEvent.click(elements.getNextButton());
  },
  clickPrevious: async () => {
    await userEvent.click(elements.getPreviousButton());
  },
};

describe("ImportedGamesList", () => {
  describe("loading state", () => {
    it("should show loading skeleton when isLoading is true", () => {
      render(
        <ImportedGamesList
          games={[]}
          totalCount={0}
          currentPage={1}
          pageSize={10}
          isLoading={true}
          onPageChange={vi.fn()}
        />
      );

      const skeletons = elements.getSkeletons();
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should render correct number of skeleton loaders based on pageSize", () => {
      render(
        <ImportedGamesList
          games={[]}
          totalCount={0}
          currentPage={1}
          pageSize={5}
          isLoading={true}
          onPageChange={vi.fn()}
        />
      );

      const cardSkeletons = elements
        .getSkeletons()
        .filter((el) => el.classList.contains("h-20"));
      expect(cardSkeletons).toHaveLength(5);
    });

    it("should not render games when loading", () => {
      const games = createMockGamesList(3);

      render(
        <ImportedGamesList
          games={games}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          isLoading={true}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.queryGameByName("Game 1")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("should show error message when error is provided", () => {
      const error = new Error("Failed to load games");

      render(
        <ImportedGamesList
          games={[]}
          totalCount={0}
          currentPage={1}
          pageSize={10}
          error={error}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getErrorTitle()).toBeVisible();
      expect(elements.getErrorMessage("Failed to load games")).toBeVisible();
    });

    it("should show retry button in error state when onRetry is provided", () => {
      const error = new Error("Network error");
      const onRetry = vi.fn();

      render(
        <ImportedGamesList
          games={[]}
          totalCount={0}
          currentPage={1}
          pageSize={10}
          error={error}
          onRetry={onRetry}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getRetryButton()).toBeVisible();
    });

    it("should call onRetry when retry button is clicked", async () => {
      const error = new Error("Network error");
      const onRetry = vi.fn();

      render(
        <ImportedGamesList
          games={[]}
          totalCount={0}
          currentPage={1}
          pageSize={10}
          error={error}
          onRetry={onRetry}
          onPageChange={vi.fn()}
        />
      );

      await actions.clickRetry();

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should not show retry button when onRetry is not provided", () => {
      const error = new Error("Network error");

      render(
        <ImportedGamesList
          games={[]}
          totalCount={0}
          currentPage={1}
          pageSize={10}
          error={error}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.queryRetryButton()).not.toBeInTheDocument();
    });

    it("should show default error message when error message is empty", () => {
      const error = new Error();

      render(
        <ImportedGamesList
          games={[]}
          totalCount={0}
          currentPage={1}
          pageSize={10}
          error={error}
          onPageChange={vi.fn()}
        />
      );

      expect(
        elements.getErrorMessage(
          "An error occurred while loading your imported games. Please try again."
        )
      ).toBeVisible();
    });
  });

  describe("empty state", () => {
    it("should show empty state when totalCount is 0", () => {
      render(
        <ImportedGamesList
          games={[]}
          totalCount={0}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getEmptyTitle()).toBeVisible();
      expect(elements.getEmptyDescription()).toBeVisible();
    });

    it("should not show pagination in empty state", () => {
      render(
        <ImportedGamesList
          games={[]}
          totalCount={0}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.queryPagination()).not.toBeInTheDocument();
    });
  });

  describe("games list rendering", () => {
    it("should render total count header correctly with plural", () => {
      const games = createMockGamesList(5);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={1}
          pageSize={5}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getCountHeader("25 games")).toBeVisible();
    });

    it("should render total count header correctly with singular", () => {
      const games = createMockGamesList(1);

      render(
        <ImportedGamesList
          games={games}
          totalCount={1}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getCountHeader("1 game")).toBeVisible();
    });

    it("should render list of ImportedGameCard components", () => {
      const games = createMockGamesList(3);

      render(
        <ImportedGamesList
          games={games}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getGameByName("Game 1")).toBeVisible();
      expect(elements.getGameByName("Game 2")).toBeVisible();
      expect(elements.getGameByName("Game 3")).toBeVisible();
    });

    it("should render games in a list with proper ARIA role", () => {
      const games = createMockGamesList(2);

      render(
        <ImportedGamesList
          games={games}
          totalCount={2}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getList()).toBeVisible();
      expect(elements.getListItems()).toHaveLength(2);
    });
  });

  describe("pagination controls", () => {
    it("should render pagination controls when totalPages > 1", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getPagination()).toBeVisible();
    });

    it("should not render pagination controls when totalPages = 1", () => {
      const games = createMockGamesList(5);

      render(
        <ImportedGamesList
          games={games}
          totalCount={5}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.queryPagination()).not.toBeInTheDocument();
    });

    it("should show correct page indicator text", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={50}
          currentPage={2}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getPageIndicator("Page 2 of 5")).toBeVisible();
    });

    it("should disable Previous button on first page", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getPreviousButton()).toBeDisabled();
    });

    it("should disable Next button on last page", () => {
      const games = createMockGamesList(5);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={3}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getNextButton()).toBeDisabled();
    });

    it("should enable Previous button when not on first page", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={2}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getPreviousButton()).toBeEnabled();
    });

    it("should enable Next button when not on last page", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getNextButton()).toBeEnabled();
    });

    it("should call onPageChange with incremented page when Next is clicked", async () => {
      const onPageChange = vi.fn();
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={1}
          pageSize={10}
          onPageChange={onPageChange}
        />
      );

      await actions.clickNext();

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("should call onPageChange with decremented page when Previous is clicked", async () => {
      const onPageChange = vi.fn();
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={2}
          pageSize={10}
          onPageChange={onPageChange}
        />
      );

      await actions.clickPrevious();

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it("should calculate total pages correctly", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={47}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getPageIndicator("Page 1 of 5")).toBeVisible();
    });
  });

  describe("accessibility", () => {
    it("should have proper navigation landmark for pagination", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getPagination()).toBeVisible();
    });

    it("should have aria-live region for page indicator", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      const pageIndicator = elements.getPageIndicator("Page 1 of 3");
      expect(pageIndicator).toHaveAttribute("aria-live", "polite");
    });

    it("should have proper button labels for screen readers", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={25}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getPreviousButton()).toBeVisible();
      expect(elements.getNextButton()).toBeVisible();
    });
  });

  describe("edge cases", () => {
    it("should handle exactly one page of games", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={10}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.queryPagination()).not.toBeInTheDocument();
    });

    it("should handle last page with fewer items than pageSize", () => {
      const games = createMockGamesList(7);

      render(
        <ImportedGamesList
          games={games}
          totalCount={27}
          currentPage={3}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getCountHeader("27 games")).toBeVisible();
      expect(elements.getPageIndicator("Page 3 of 3")).toBeVisible();
      expect(elements.getListItems()).toHaveLength(7);
    });

    it("should handle large totalCount correctly", () => {
      const games = createMockGamesList(10);

      render(
        <ImportedGamesList
          games={games}
          totalCount={1234}
          currentPage={5}
          pageSize={10}
          onPageChange={vi.fn()}
        />
      );

      expect(elements.getCountHeader("1234 games")).toBeVisible();
      expect(elements.getPageIndicator("Page 5 of 124")).toBeVisible();
    });
  });
});
