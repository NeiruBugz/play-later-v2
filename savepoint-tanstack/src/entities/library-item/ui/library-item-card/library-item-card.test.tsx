import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "../../model/types";
import { LibraryItemCard } from "./library-item-card";
import { buildCoverImageUrl } from "./library-item-card.utility";

// LibraryItemCard renders a TanStack <Link> for the details navigation;
// the link requires a RouterProvider context. Mock it as a plain <a> here
// (mirrors the precedent in widgets/landing-hero/ui/landing-hero/landing-hero.test.tsx).
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
    children: React.ReactNode;
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
    slug: "hollow-knight",
    coverImage: overrides.coverImage ?? null,
    releaseDate: null,
  },
});

const elements = {
  getTitleHeading: (title: string) =>
    screen.getByRole("heading", { name: title, level: 3 }),
  queryCoverImage: (alt: string) => screen.queryByAltText(alt),
  getStatusText: (label: string) => screen.getByText(label),
};

describe("LibraryItemCard", () => {
  describe("given an item without a cover image", () => {
    beforeEach(() => {
      render(<LibraryItemCard item={buildItem({ coverImage: null })} />);
    });

    it("renders the game title", () => {
      expect(elements.getTitleHeading("Hollow Knight")).toBeDefined();
    });

    it("does not render an <img>", () => {
      expect(elements.queryCoverImage("Hollow Knight")).toBeNull();
    });
  });

  describe("given an item with a bare IGDB imageId", () => {
    beforeEach(() => {
      render(<LibraryItemCard item={buildItem({ coverImage: "co9wzc" })} />);
    });

    it("builds a full IGDB URL at t_cover_big", () => {
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
    ] as const)("renders %s as the human label %s", (status, label) => {
      render(<LibraryItemCard item={buildItem({ status })} />);
      expect(elements.getStatusText(label)).toBeDefined();
    });
  });
});

describe("buildCoverImageUrl", () => {
  it("returns null when input is null", () => {
    expect(buildCoverImageUrl(null)).toBeNull();
  });

  it("returns null when input is undefined", () => {
    expect(buildCoverImageUrl(undefined)).toBeNull();
  });

  it("builds a full IGDB URL from a bare imageId at t_cover_big by default", () => {
    expect(buildCoverImageUrl("co9wzc")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg"
    );
  });

  it("honors the size argument when building from a bare imageId", () => {
    expect(buildCoverImageUrl("co9wzc", "t_cover_big_2x")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co9wzc.jpg"
    );
  });

  it("upgrades an IGDB t_thumb URL to t_cover_big by default", () => {
    expect(
      buildCoverImageUrl(
        "https://images.igdb.com/igdb/image/upload/t_thumb/co1.jpg"
      )
    ).toBe("https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg");
  });

  it("honors the size argument when upgrading a URL", () => {
    expect(
      buildCoverImageUrl(
        "https://images.igdb.com/igdb/image/upload/t_thumb/co1.jpg",
        "t_cover_big_2x"
      )
    ).toBe("https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1.jpg");
  });

  it("passes through non-IGDB URLs unchanged", () => {
    expect(buildCoverImageUrl("https://cdn.example.com/foo.jpg")).toBe(
      "https://cdn.example.com/foo.jpg"
    );
  });
});
