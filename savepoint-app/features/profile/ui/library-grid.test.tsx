import { render, screen } from "@testing-library/react";

import { LibraryItemStatus } from "@/shared/types";

import { LibraryGrid } from "./library-grid";

type LibraryItem = {
  id: number;
  status: (typeof LibraryItemStatus)[keyof typeof LibraryItemStatus];
  game: {
    id: string;
    igdbId: number;
    title: string;
    coverImage: string | null;
    slug: string;
    releaseDate: Date | null;
    _count: { libraryItems: number };
  };
};

function buildItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  const base: LibraryItem = {
    id: 1,
    status: LibraryItemStatus.PLAYING,
    game: {
      id: "game-1",
      igdbId: 1001,
      title: "Elden Ring",
      coverImage: "abc123",
      slug: "elden-ring",
      releaseDate: null,
      _count: { libraryItems: 1 },
    },
    ...overrides,
  };
  return base;
}

function renderLibraryGrid(items: LibraryItem[]) {
  return render(<LibraryGrid items={items} />);
}

describe("LibraryGrid", () => {
  describe("zero items", () => {
    it("renders nothing when items array is empty", () => {
      renderLibraryGrid([]);

      expect(screen.queryByTestId("library-grid-root")).not.toBeInTheDocument();
    });
  });

  describe("grid item count", () => {
    it("renders one grid item per library item", () => {
      const items = [
        buildItem({ id: 1, game: { ...buildItem().game, slug: "game-a" } }),
        buildItem({ id: 2, game: { ...buildItem().game, slug: "game-b" } }),
        buildItem({ id: 3, game: { ...buildItem().game, slug: "game-c" } }),
      ];

      renderLibraryGrid(items);

      expect(screen.getAllByTestId("library-grid-item")).toHaveLength(3);
    });
  });

  describe("game detail links", () => {
    it("links each item to /games/{slug}", () => {
      const items = [
        buildItem({
          id: 1,
          game: {
            ...buildItem().game,
            title: "Elden Ring",
            slug: "elden-ring",
          },
        }),
        buildItem({
          id: 2,
          game: {
            ...buildItem().game,
            title: "Hollow Knight",
            slug: "hollow-knight",
          },
        }),
      ];

      renderLibraryGrid(items);

      const links = screen.getAllByRole("link");
      const hrefs = links.map((link) => link.getAttribute("href"));

      expect(hrefs).toContain("/games/elden-ring");
      expect(hrefs).toContain("/games/hollow-knight");
    });
  });

  describe("status badges", () => {
    it("renders a status badge for each item", () => {
      const items = [
        buildItem({ id: 1 }),
        buildItem({ id: 2, status: LibraryItemStatus.PLAYED }),
      ];

      renderLibraryGrid(items);

      expect(screen.getAllByTestId("library-grid-status-badge")).toHaveLength(
        2
      );
    });

    it("displays the correct status label for PLAYING", () => {
      renderLibraryGrid([buildItem({ status: LibraryItemStatus.PLAYING })]);

      expect(screen.getByTestId("library-grid-status-badge")).toHaveTextContent(
        /playing/i
      );
    });

    it("displays the correct status label for PLAYED", () => {
      renderLibraryGrid([buildItem({ status: LibraryItemStatus.PLAYED })]);

      expect(screen.getByTestId("library-grid-status-badge")).toHaveTextContent(
        /played/i
      );
    });

    it("displays the correct status label for SHELF", () => {
      renderLibraryGrid([buildItem({ status: LibraryItemStatus.SHELF })]);

      expect(screen.getByTestId("library-grid-status-badge")).toHaveTextContent(
        /shelf/i
      );
    });

    it("displays the correct status label for UP_NEXT", () => {
      renderLibraryGrid([buildItem({ status: LibraryItemStatus.UP_NEXT })]);

      expect(screen.getByTestId("library-grid-status-badge")).toHaveTextContent(
        /up.?next/i
      );
    });

    it("displays the correct status label for WISHLIST", () => {
      renderLibraryGrid([buildItem({ status: LibraryItemStatus.WISHLIST })]);

      expect(screen.getByTestId("library-grid-status-badge")).toHaveTextContent(
        /wishlist/i
      );
    });
  });

  describe("cover image", () => {
    it("renders an image with the game title as alt text", () => {
      renderLibraryGrid([
        buildItem({
          game: {
            ...buildItem().game,
            title: "Elden Ring",
            coverImage: "abc123",
          },
        }),
      ]);

      expect(
        screen.getByRole("img", { name: /elden ring/i })
      ).toBeInTheDocument();
    });

    it("renders a cover image with a non-empty src when coverImage is provided", () => {
      renderLibraryGrid([
        buildItem({
          game: { ...buildItem().game, coverImage: "abc123", title: "Celeste" },
        }),
      ]);

      const img = screen.getByRole("img", { name: /celeste/i });
      expect(img.getAttribute("src")).toBeTruthy();
    });
  });
});
