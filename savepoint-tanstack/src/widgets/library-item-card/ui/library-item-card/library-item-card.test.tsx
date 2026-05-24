import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";

import { LibraryItemCard } from "./library-item-card";

// LibraryItemCard renders GameCard, which wraps the card in a TanStack
// <Link>. The link requires a RouterProvider context — mock it as a plain
// <a> (matches the precedent in library-grid / related-games-infinite-list
// / game-card). Also mock the CTA's server fn so we don't reach the Start
// runtime, and the journal-compose dialog body so the test stays focused.
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
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

vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/features/compose-journal-entry/api/create-journal-entry-fn", () => ({
  createJournalEntryFn: vi.fn(),
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
  queryTriedBadge: () => screen.queryByText("Tried"),
  queryAcquisitionChip: (label: string) => screen.queryByText(label),
  queryLifecycleTrack: () => screen.queryByTestId("lifecycle-strip-track"),
  getLifecycleText: () =>
    screen.getByTestId("lifecycle-strip").textContent ?? "",
  queryUnrated: () => screen.queryByText("unrated"),
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

    it("builds a full IGDB URL at t_720p with the 'Cover for' alt prefix", () => {
      const img = elements.queryCoverImage("Hollow Knight");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_720p/co9wzc.jpg"
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

    it("upgrades the size segment from t_thumb to t_720p", () => {
      const img = elements.queryCoverImage("Hollow Knight");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_720p/co1234.jpg"
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

  describe("meta footer + CTA (Phase 3 visual-parity push)", () => {
    describe("given a PLAYING item with a platform and a started date", () => {
      beforeEach(() => {
        render(
          <LibraryItemCard
            item={buildItem({
              status: "PLAYING",
              platform: "PlayStation 5",
              startedAt: new Date("2025-01-02T00:00:00Z"),
            })}
          />
        );
      });

      it("renders the platform badge", () => {
        expect(screen.getByText("PlayStation 5")).toBeDefined();
      });

      it("dates the play window in the lifecycle caption", () => {
        // The inline contextual date was retired; temporal info now lives in
        // the lifecycle strip caption ("started Nw").
        expect(elements.getLifecycleText()).toMatch(/started/);
      });

      it('shows "unrated" since this item has no rating', () => {
        expect(elements.queryUnrated()).not.toBeNull();
      });

      it('renders the "Log Session" CTA for status PLAYING', () => {
        expect(
          screen.getByRole("button", { name: "Log Session" })
        ).toBeDefined();
      });
    });

    describe("given a SHELF item", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "SHELF" })} />);
      });

      it('renders the "Queue It" CTA', () => {
        expect(screen.getByRole("button", { name: "Queue It" })).toBeDefined();
      });
    });

    describe("given an UP_NEXT item", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "UP_NEXT" })} />);
      });

      it('renders the "Start Playing" CTA', () => {
        expect(
          screen.getByRole("button", { name: "Start Playing" })
        ).toBeDefined();
      });
    });

    describe("given a PLAYED item", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "PLAYED" })} />);
      });

      it('renders the "Replay" CTA', () => {
        expect(screen.getByRole("button", { name: "Replay" })).toBeDefined();
      });
    });

    // The lifecycle caption dates a finish from completedAt (when the player
    // actually finished), never updatedAt. Regression guard for the
    // strip-vs-date contradiction ("done Oct 2023" / "Finished yesterday")
    // spotted on the library grid before the inline date was retired.
    describe("given a PLAYED item completed long ago but edited recently", () => {
      beforeEach(() => {
        render(
          <LibraryItemCard
            item={buildItem({
              status: "PLAYED",
              completedAt: new Date("2023-10-12T00:00:00Z"),
              updatedAt: new Date("2025-01-02T00:00:00Z"),
            })}
          />
        );
      });

      it("reads the finish from completedAt in the lifecycle caption", () => {
        expect(elements.getLifecycleText()).toMatch(/done/);
      });
    });

    describe("rating display", () => {
      describe("given an unrated item", () => {
        beforeEach(() => {
          render(<LibraryItemCard item={buildItem({ rating: null })} />);
        });

        it('shows the "unrated" placeholder instead of stars', () => {
          expect(elements.queryUnrated()).not.toBeNull();
        });
      });

      describe("given a rated item", () => {
        beforeEach(() => {
          render(<LibraryItemCard item={buildItem({ rating: 8 })} />);
        });

        it("shows the star rating, not the placeholder", () => {
          expect(elements.queryUnrated()).toBeNull();
          expect(
            screen.getByRole("img", { name: "Rating: 4 out of 5 stars" })
          ).toBeDefined();
        });
      });
    });

    describe("given a WISHLIST item", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "WISHLIST" })} />);
      });

      it('renders the "Add to Shelf" CTA', () => {
        expect(
          screen.getByRole("button", { name: "Add to Shelf" })
        ).toBeDefined();
      });
    });

    describe("status pill shape (canonical pill + leading dot)", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "PLAYING" })} />);
      });

      it("renders a glassy rounded pill with a colored leading dot", () => {
        const dot = screen.getByTestId("library-status-badge-dot");
        expect(dot).toBeDefined();
        expect(dot).toHaveAttribute("data-status-variant", "playing");
      });
    });
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

  describe("mobile responsive variant (Phase 4)", () => {
    beforeEach(() => {
      render(<LibraryItemCard item={buildItem()} />);
    });

    it("uses flex-row at mobile and flex-col at md+", () => {
      const root = screen.getByTestId("library-item-card-root");
      expect(root.className).toMatch(/\bflex-row\b/);
      expect(root.className).toMatch(/\bmd:flex-col\b/);
    });
  });

  // F04 — a backlog item with a real play signal (startedAt) reads as "Tried".
  // Derived from startedAt/completedAt/status, not the dead `hasBeenPlayed` flag.
  describe('"Tried" badge (touched backlog item)', () => {
    describe("given a SHELF item the user has started", () => {
      beforeEach(() => {
        render(
          <LibraryItemCard
            item={buildItem({
              status: "SHELF",
              startedAt: new Date("2025-02-01T00:00:00Z"),
            })}
          />
        );
      });

      it("flags it as Tried", () => {
        expect(elements.queryTriedBadge()).not.toBeNull();
      });
    });

    describe("given a SHELF item with no play signal", () => {
      beforeEach(() => {
        render(
          <LibraryItemCard
            item={buildItem({
              status: "SHELF",
              startedAt: null,
              completedAt: null,
            })}
          />
        );
      });

      it("does not flag it as Tried", () => {
        expect(elements.queryTriedBadge()).toBeNull();
      });
    });

    describe("given a PLAYING item", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "PLAYING" })} />);
      });

      it("does not show Tried — the status already says Playing", () => {
        expect(elements.queryTriedBadge()).toBeNull();
      });
    });
  });

  // F03 — acquisitionType surfaced as a chip (subscription resolves by platform).
  describe("acquisition chip", () => {
    describe("given a subscription item on an Xbox platform", () => {
      beforeEach(() => {
        render(
          <LibraryItemCard
            item={buildItem({
              acquisitionType: "SUBSCRIPTION",
              platform: "Xbox Series X",
            })}
          />
        );
      });

      it("reads the subscription brand as Game Pass", () => {
        expect(elements.queryAcquisitionChip("Game Pass")).not.toBeNull();
      });
    });

    describe("given an owned (DIGITAL) item", () => {
      beforeEach(() => {
        render(
          <LibraryItemCard item={buildItem({ acquisitionType: "DIGITAL" })} />
        );
      });

      it("omits the chip — the default source stays implicit", () => {
        expect(elements.queryAcquisitionChip("Owned")).toBeNull();
      });
    });

    describe("given a physical item", () => {
      beforeEach(() => {
        render(
          <LibraryItemCard
            item={buildItem({
              acquisitionType: "PHYSICAL",
              platform: "Switch",
            })}
          />
        );
      });

      it("shows a Physical chip", () => {
        expect(elements.queryAcquisitionChip("Physical")).not.toBeNull();
      });
    });
  });

  // F07 — lifecycle strip renders for every status; it is the card's sole
  // temporal caption (added / started / done) since the inline date retired.
  describe("lifecycle strip", () => {
    describe("given an owned item (SHELF)", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "SHELF" })} />);
      });

      it("renders the lifecycle strip", () => {
        expect(elements.queryLifecycleTrack()).not.toBeNull();
      });
    });

    describe("given a WISHLIST item", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "WISHLIST" })} />);
      });

      it("renders the lifecycle strip (how long it has been wishlisted)", () => {
        expect(elements.queryLifecycleTrack()).not.toBeNull();
      });
    });
  });
});
