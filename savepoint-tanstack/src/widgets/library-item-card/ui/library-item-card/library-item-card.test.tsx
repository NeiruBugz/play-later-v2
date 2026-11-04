import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { setStatusFn } from "@/features/manage-library-entry/api/set-status-fn";
import type { SetStatusResult } from "@/features/manage-library-entry/api/set-status-fn.worker";
import { DropdownMenu, DropdownMenuContent } from "@/shared/ui/dropdown-menu";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
import { LibraryItemCard } from "./library-item-card";

// LibraryItemCard renders GameCard, which wraps the card in a TanStack
// <Link>. The link requires a RouterProvider context — mock it as a plain
// <a> (matches the precedent in library-grid / related-games-infinite-list
// / game-card). Also mock the CTA's server fn so we don't reach the Start
// runtime.
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

vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: vi.fn(),
}));

vi.mock("@/features/up-next/api/add-to-up-next-fn", () => ({
  addToUpNextFn: vi.fn(),
}));
vi.mock("@/features/up-next/api/remove-from-up-next-fn", () => ({
  removeFromUpNextFn: vi.fn(),
}));

vi.mock("@/shared/lib/use-media-query", () => ({ useIsDesktop: () => true }));

const statusResult = (
  status: "WANT" | "PLAYING" | "DONE"
): SetStatusResult => ({
  status,
  upNextPosition: null,
  undo: {
    snapshot: {},
    createdPlayId: null,
    closedPlayId: null,
  } as unknown as SetStatusResult["undo"],
});

// The platform chip renders the abbreviation/icon inside a Badge <div> that
// carries the variant classes. Walking to the nearest classed ancestor reaches
// the Badge — mirrors the helper in entities/game/ui/platform-badges.test.tsx.
const badgeClassNameFor = (text: HTMLElement | null): string => {
  // eslint-disable-next-line testing-library/no-node-access
  const badge = text?.closest("[class]");
  return badge?.className ?? "";
};

const buildItem = (
  overrides: Partial<LibraryItemWithGame> & {
    gameTitle?: string;
    coverImage?: string | null;
    gameSlug?: string;
  } = {}
): LibraryItemWithGame => {
  const { gameTitle, coverImage, gameSlug, ...itemOverrides } = overrides;
  return buildLibraryItemWithGame(
    { id: 1, status: "PLAYING", platform: "PC", ...itemOverrides },
    {
      id: "game-1",
      title: gameTitle ?? "Hollow Knight",
      slug: gameSlug ?? "hollow-knight",
      coverImage: coverImage ?? null,
    }
  );
};

const elements = {
  getCardLink: (title: string) =>
    screen.getByRole("link", { name: `View ${title}` }),
  queryCardLink: (title: string) =>
    screen.queryByRole("link", { name: `View ${title}` }),
  queryCoverImage: (title: string) =>
    screen.queryByAltText(`Cover for ${title}`),
  queryCoverPlaceholder: (title: string) =>
    screen.queryByRole("img", { name: `Cover for ${title}` }),
  getStatusBadge: (label: string) => screen.getByLabelText(`Status: ${label}`),
  getStatusControl: (label: string) =>
    screen.getByRole("button", { name: `Status: ${label}. Change` }),
  getNextStep: (name: string) => screen.getByRole("button", { name }),
  getPickerOption: (name: string) => screen.getByRole("radio", { name }),
  queryMenuButton: () => screen.queryByRole("button", { name: "menu-trigger" }),
  queryAcquisitionChip: (label: string) => screen.queryByText(label),
  queryLifecycleTrack: () => screen.queryByTestId("lifecycle-strip-track"),
  getLifecycleText: () =>
    screen.getByTestId("lifecycle-strip").textContent ?? "",
  queryUnrated: () => screen.queryByText("unrated"),
  queryAddPlaythroughButton: () =>
    screen.queryByRole("button", { name: "Add playthrough" }),
  getAddPlaythroughButton: () =>
    screen.getByRole("button", { name: "Add playthrough" }),
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
      ["WANT", "Want"],
      ["PLAYING", "Playing"],
      ["DONE", "Done"],
    ] as const)(
      "renders %s as the human label %s (overlaid on the cover)",
      (status, label) => {
        render(<LibraryItemCard item={buildItem({ status })} />);
        expect(elements.getStatusBadge(label)).toBeDefined();
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

      it("renders the platform badge with the abbreviated platform label", () => {
        expect(screen.getByText("PS5")).toBeDefined();
      });

      it("colors the platform badge with the playstation family variant", () => {
        // The platform chip delegates to the shared PlatformBadgeItem, which
        // abbreviates the label and tints it via the badge `playstation`
        // variant (brand color) rather than the neutral `subtle` variant.
        const className = badgeClassNameFor(screen.getByText("PS5"));
        expect(className).toContain("text-[#0070d1]");
        expect(className).not.toContain("text-muted-foreground");
      });

      it("dates the play window in the lifecycle caption", () => {
        // The inline contextual date was retired; temporal info now lives in
        // the lifecycle strip caption ("started Nw").
        expect(elements.getLifecycleText()).toMatch(/started/);
      });

      it('shows "unrated" since this item has no rating', () => {
        expect(elements.queryUnrated()).not.toBeNull();
      });

      it('renders the "Mark done" next-step CTA for status PLAYING', () => {
        expect(screen.getByRole("button", { name: "Mark done" })).toBeDefined();
      });
    });

    describe("given an item on a neutral platform (Stadia)", () => {
      beforeEach(() => {
        render(
          <LibraryItemCard
            item={buildItem({ status: "PLAYING", platform: "Stadia" })}
          />
        );
      });

      it("renders the platform badge with the subtle (neutral) variant", () => {
        // Stadia has no family mapping, so it keeps its full label and falls
        // back to the neutral `subtle` badge variant (muted foreground).
        const className = badgeClassNameFor(screen.getByText("Stadia"));
        expect(className).toContain("text-muted-foreground");
        expect(className).not.toContain("text-[#0070d1]");
      });
    });

    describe("given a WANT item", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "WANT" })} />);
      });

      it('renders the "Start playing" CTA', () => {
        expect(
          screen.getByRole("button", { name: "Start playing" })
        ).toBeDefined();
      });
    });

    describe("given a DONE item", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "DONE" })} />);
      });

      it('renders the "Play again" CTA', () => {
        expect(
          screen.getByRole("button", { name: "Play again" })
        ).toBeDefined();
      });
    });

    describe("when the next-step button is tapped on a WANT item", () => {
      beforeEach(async () => {
        vi.mocked(setStatusFn).mockReset();
        vi.mocked(setStatusFn).mockResolvedValue(statusResult("PLAYING"));
        render(
          <>
            <LibraryItemCard item={buildItem({ id: 9, status: "WANT" })} />
            <Toaster />
          </>
        );
        await userEvent.click(elements.getNextStep("Start playing"));
      });

      it("calls setStatusFn with the card id and the Playing target", () => {
        expect(setStatusFn).toHaveBeenCalledWith({
          data: { id: 9, to: "PLAYING" },
        });
      });

      it("shows Playing on the card badge, the status control and the button", async () => {
        expect(
          await screen.findByText("Hollow Knight is now Playing")
        ).toBeDefined();
        expect(elements.getStatusBadge("Playing")).toBeDefined();
        expect(elements.getStatusControl("Playing")).toBeDefined();
        expect(elements.getNextStep("Mark done")).toBeDefined();
      });
    });

    describe("when the user taps the status pill and picks Done", () => {
      beforeEach(async () => {
        vi.mocked(setStatusFn).mockReset();
        vi.mocked(setStatusFn).mockResolvedValue(statusResult("DONE"));
        render(
          <LibraryItemCard item={buildItem({ id: 4, status: "PLAYING" })} />
        );
        await userEvent.click(elements.getStatusControl("Playing"));
      });

      it("opens the picker with three radios", () => {
        expect(screen.getAllByRole("radio")).toHaveLength(3);
      });

      it("updates the card to Done and saves the choice", async () => {
        await userEvent.click(elements.getPickerOption("Done"));
        expect(setStatusFn).toHaveBeenCalledWith({
          data: { id: 4, to: "DONE" },
        });
        await waitFor(() =>
          expect(elements.getStatusBadge("Done")).toBeDefined()
        );
        expect(elements.getNextStep("Play again")).toBeDefined();
      });
    });

    describe("when saving the status fails", () => {
      beforeEach(async () => {
        vi.mocked(setStatusFn).mockReset();
        vi.mocked(setStatusFn).mockRejectedValue(new Error("boom"));
        render(
          <>
            <LibraryItemCard item={buildItem({ id: 5, status: "WANT" })} />
            <Toaster />
          </>
        );
        await userEvent.click(elements.getNextStep("Start playing"));
      });

      it("shows the save-failed message", async () => {
        expect(
          await screen.findByText("Couldn't save. Try again.")
        ).toBeDefined();
      });

      it("reverts the card to Want", async () => {
        await screen.findByText("Couldn't save. Try again.");
        expect(elements.getStatusBadge("Want")).toBeDefined();
        expect(elements.getNextStep("Start playing")).toBeDefined();
      });
    });

    describe('given layout="row" (library list view)', () => {
      beforeEach(() => {
        render(
          <LibraryItemCard item={buildItem({ status: "WANT" })} layout="row" />
        );
      });

      it("shows the next-step button and status control in the row", () => {
        expect(elements.getNextStep("Start playing")).toBeDefined();
        expect(elements.getStatusControl("Want")).toBeDefined();
      });

      it("stays a row at md and up", () => {
        const root = screen.getByTestId("library-item-card-root");
        expect(root.className).not.toMatch(/md:flex-col/);
      });
    });

    // The lifecycle caption dates a finish from completedAt (when the player
    // actually finished), never updatedAt. Regression guard for the
    // strip-vs-date contradiction ("done Oct 2023" / "Finished yesterday")
    // spotted on the library grid before the inline date was retired.
    describe("given a DONE item completed long ago but edited recently", () => {
      beforeEach(() => {
        render(
          <LibraryItemCard
            item={buildItem({
              status: "DONE",
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

    describe("status pill shape (canonical pill + leading dot)", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "PLAYING" })} />);
      });

      it("renders a glassy rounded pill with a colored leading dot", () => {
        const dot = screen.getByTestId("library-status-badge-dot");
        expect(dot).toBeDefined();
        expect(dot).toHaveAttribute("data-status-variant", "playing");
      });

      it("keeps the label title case and never truncated", () => {
        const badge = screen.getByLabelText("Status: Playing");
        expect(badge.className).not.toMatch(/\buppercase\b/);
        expect(badge.className).toMatch(/whitespace-nowrap/);
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

  // 2.13 — "Add playthrough" quick-add entry point (spec 016).
  // The control must appear ONLY when the host supplies `onAddPlaythrough` so
  // the public-profile read-only grid stays clean.
  describe('"Add playthrough" quick-add control (spec 016 §2.13)', () => {
    describe("given onAddPlaythrough is provided", () => {
      const onAddPlaythrough = vi.fn();

      beforeEach(() => {
        render(
          <LibraryItemCard
            item={buildItem({ id: 7 })}
            onAddPlaythrough={onAddPlaythrough}
          />
        );
      });

      it("renders the Add playthrough control", () => {
        expect(elements.queryAddPlaythroughButton()).not.toBeNull();
      });

      it("calls onAddPlaythrough with the library item id when clicked", async () => {
        await userEvent.click(elements.getAddPlaythroughButton());
        expect(onAddPlaythrough).toHaveBeenCalledWith(7);
      });
    });

    describe("given onAddPlaythrough is NOT provided", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ id: 7 })} />);
      });

      it("does not render the Add playthrough control", () => {
        expect(elements.queryAddPlaythroughButton()).toBeNull();
      });
    });
  });

  // F07 — lifecycle strip renders for every status; it is the card's sole
  // temporal caption (added / started / done) since the inline date retired.
  describe("lifecycle strip", () => {
    describe("given a WANT item", () => {
      beforeEach(() => {
        render(<LibraryItemCard item={buildItem({ status: "WANT" })} />);
      });

      it("renders the lifecycle strip", () => {
        expect(elements.queryLifecycleTrack()).not.toBeNull();
      });
    });
  });
  describe("queue marker", () => {
    it("reads 'Up Next #2' on a queued Want game", () => {
      render(
        <LibraryItemCard
          item={buildItem({ status: "WANT", upNextPosition: 2 })}
        />
      );
      expect(screen.getByText("Up Next #2")).toBeDefined();
    });

    it("reads 'Replay' on a queued Done game", () => {
      render(
        <LibraryItemCard
          item={buildItem({ status: "DONE", upNextPosition: 1 })}
        />
      );
      expect(screen.getByText("Replay")).toBeDefined();
    });

    it("shows no marker for a game that is not queued", () => {
      render(<LibraryItemCard item={buildItem({ status: "WANT" })} />);
      expect(screen.queryByTestId("queue-marker")).toBeNull();
    });
  });

  describe("menu composition", () => {
    const menu = (upNext: ReactNode) => (
      <DropdownMenu open>
        <DropdownMenuContent>{upNext}</DropdownMenuContent>
      </DropdownMenu>
    );

    it("offers Put in Up Next in the menu of a Want game", () => {
      render(
        <LibraryItemCard item={buildItem({ status: "WANT" })} menu={menu} />
      );
      expect(
        screen.getByRole("menuitem", { name: "Put in Up Next" })
      ).toBeDefined();
    });

    it("offers Remove from Up Next for a queued game", () => {
      render(
        <LibraryItemCard
          item={buildItem({ status: "WANT", upNextPosition: 1 })}
          menu={menu}
        />
      );
      expect(
        screen.getByRole("menuitem", { name: "Remove from Up Next" })
      ).toBeDefined();
    });

    it("offers no Up Next action for a Playing game", () => {
      render(
        <LibraryItemCard item={buildItem({ status: "PLAYING" })} menu={menu} />
      );
      expect(screen.queryByRole("menuitem")).toBeNull();
    });
  });
});
