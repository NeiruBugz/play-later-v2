import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";

import { LibraryItemCard } from "./library-item-card";

// LibraryItemCard renders GameCard, which wraps the card in a TanStack
// <Link>. The link requires a RouterProvider context — mock it as a plain
// <a> (matches the precedent in library-grid / related-games-infinite-list
// / game-card).
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    href,
    params,
    children,
    ...rest
  }: {
    to?: string;
    href?: string;
    params?: Record<string, string>;
    children: ReactNode;
  } & Record<string, unknown>) => {
    let resolvedHref = to ?? href ?? "";
    if (params && to) {
      for (const [key, value] of Object.entries(params)) {
        resolvedHref = resolvedHref.replace(`$${key}`, value);
      }
    }
    return (
      <a href={resolvedHref} {...rest}>
        {children}
      </a>
    );
  },
}));

const buildItem = (
  overrides: Partial<LibraryItemWithGame> & {
    gameTitle?: string;
    coverImage?: string | null;
    gameSlug?: string;
  } = {}
): LibraryItemWithGame => ({
  id: 1,
  userId: "user-1",
  gameId: "game-1",
  status: "PLAYING",
  platform: "PC",
  rating: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-02T00:00:00Z"),
  statusChangedAt: null,
  acquisitionType: "DIGITAL",
  startedAt: null,
  completedAt: null,
  hasBeenPlayed: false,
  ...overrides,
  game: {
    id: "game-1",
    igdbId: 1,
    title: overrides.gameTitle ?? "Hollow Knight",
    slug: overrides.gameSlug ?? "hollow-knight",
    coverImage: overrides.coverImage ?? null,
    releaseDate: null,
  },
});

const elements = {
  getCardLink: (title: string) =>
    screen.getByRole("link", { name: `View ${title}` }),
  queryCardLink: (title: string) =>
    screen.queryByRole("link", { name: `View ${title}` }),
  queryCoverImage: (title: string) =>
    screen.queryByAltText(`Cover for ${title}`),
  queryCoverPlaceholder: (title: string) =>
    screen.queryByRole("img", { name: `Cover for ${title}` }),
  getStatusText: (label: string) => screen.getByText(label),
  queryMenuButton: () => screen.queryByRole("button", { name: "menu-trigger" }),
};

describe("LibraryItemCard", () => {
  describe("given an item without a cover image", () => {
    beforeEach(() => {
      render(<LibraryItemCard item={buildItem({ coverImage: null })} />);
    });

    it("renders the cover placeholder with the title", () => {
      expect(elements.queryCoverPlaceholder("Hollow Knight")).not.toBeNull();
    });

    it("does not render an <img>", () => {
      expect(elements.queryCoverImage("Hollow Knight")).toBeNull();
    });

    it("wraps the card in a link to /games/$slug", () => {
      expect(elements.getCardLink("Hollow Knight")).toHaveAttribute(
        "href",
        "/games/hollow-knight"
      );
    });
  });

  describe("given an item with a bare IGDB imageId", () => {
    beforeEach(() => {
      render(<LibraryItemCard item={buildItem({ coverImage: "co9wzc" })} />);
    });

    it("builds a full IGDB URL at t_cover_big with the 'Cover for' alt prefix", () => {
      const img = elements.queryCoverImage("Hollow Knight");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg"
      );
    });
  });

  describe("given an item with an IGDB-shaped cover URL", () => {
    beforeEach(() => {
      render(
        <LibraryItemCard
          item={buildItem({
            coverImage:
              "https://images.igdb.com/igdb/image/upload/t_thumb/co1234.jpg",
          })}
        />
      );
    });

    it("upgrades the size segment from t_thumb to t_cover_big", () => {
      const img = elements.queryCoverImage("Hollow Knight");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg"
      );
    });
  });

  describe("given each LibraryItemStatus value", () => {
    it.each([
      ["PLAYING", "Playing"],
      ["PLAYED", "Played"],
      ["UP_NEXT", "Up Next"],
      ["SHELF", "Shelf"],
      ["WISHLIST", "Wishlist"],
    ] as const)(
      "renders %s as the human label %s (overlaid on the cover)",
      (status, label) => {
        render(<LibraryItemCard item={buildItem({ status })} />);
        expect(elements.getStatusText(label)).toBeDefined();
      }
    );
  });

  describe("given a menu slot", () => {
    beforeEach(() => {
      render(
        <LibraryItemCard
          item={buildItem()}
          menu={
            <button type="button" aria-label="menu-trigger">
              menu
            </button>
          }
        />
      );
    });

    it("renders the menu inside the card", () => {
      expect(elements.queryMenuButton()).not.toBeNull();
    });

    it("renders the menu as a SIBLING of the card link, not a descendant", () => {
      // Structural invariant — the menu must not live inside the <a>.
      // If the menu were a descendant of the link, the user's "menu click
      // triggers navigation" bug would still be reachable through Radix
      // Slot patterns / focus restoration / nested-interactive ambiguities.
      // Rendering as a sibling makes the bubble path physically impossible.
      const link = elements.getCardLink("Hollow Knight");
      const menuButton = elements.queryMenuButton();
      expect(menuButton).not.toBeNull();
      expect(link.contains(menuButton)).toBe(false);
    });
  });
});
