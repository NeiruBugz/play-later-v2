import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { setOwnershipFn } from "@/features/manage-library-entry/api/set-ownership-fn";
import { setStatusFn } from "@/features/manage-library-entry/api/set-status-fn";
import type { SetStatusResult } from "@/features/manage-library-entry/api/set-status-fn.worker";
import { LibraryCardMenu } from "@/features/manage-library-entry/ui/library-card-menu";
import { DropdownMenu, DropdownMenuContent } from "@/shared/ui/dropdown-menu";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
import { LibraryItemCard } from "./library-item-card";

// LibraryItemCard renders GameCard, which wraps the card in a TanStack
// <Link>. The link requires a RouterProvider context — mock it as a plain
// <a> (matches the precedent in library-grid / related-games-list
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

vi.mock("@/features/manage-library-entry/api/set-ownership-fn", () => ({
  setOwnershipFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
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
  queryLifecycleStrip: () => screen.queryByTestId("lifecycle-strip"),
  queryUnrated: () => screen.queryByText("unrated"),
  queryAddPlaythroughButton: () =>
    screen.queryByRole("button", { name: "Add playthrough" }),
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

      it("shows no rating text since this item has no rating", () => {
        expect(elements.queryUnrated()).toBeNull();
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

    describe("rating display", () => {
      describe("given an unrated item", () => {
        beforeEach(() => {
          render(<LibraryItemCard item={buildItem({ rating: null })} />);
        });

        it("shows neither stars nor an unrated placeholder", () => {
          expect(elements.queryUnrated()).toBeNull();
          expect(screen.queryByRole("img", { name: /^Rated / })).toBeNull();
        });
      });

      describe("given an item rated 7", () => {
        beforeEach(() => {
          render(<LibraryItemCard item={buildItem({ rating: 7 })} />);
        });

        it("shows three and a half stars", () => {
          expect(
            screen.getByRole("img", { name: "Rated 3.5 of 5" })
          ).toBeDefined();
        });
      });

      describe("given a rated item", () => {
        beforeEach(() => {
          render(<LibraryItemCard item={buildItem({ rating: 8 })} />);
        });

        it("shows the star rating, not the placeholder", () => {
          expect(elements.queryUnrated()).toBeNull();
          expect(
            screen.getByRole("img", { name: "Rated 4 of 5" })
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

  describe("acquisition chip", () => {
    it.each([
      ["SUBSCRIPTION", "Xbox Series X", "Game Pass"],
      ["PHYSICAL", "Switch", "Physical"],
    ] as const)(
      "shows no chip for a %s item",
      (acquisitionType, platform, label) => {
        render(
          <LibraryItemCard item={buildItem({ acquisitionType, platform })} />
        );
        expect(elements.queryAcquisitionChip(label)).toBeNull();
      }
    );
  });

  describe("ownership", () => {
    const withMenu = (item: LibraryItemWithGame) => (
      <LibraryItemCard
        item={item}
        menu={(_upNext, ownership) => (
          <LibraryCardMenu item={item} onEdit={vi.fn()} ownership={ownership} />
        )}
      />
    );
    const chooseFromMenu = async (item: LibraryItemWithGame, name: string) => {
      render(withMenu(item));
      await userEvent.click(
        screen.getByRole("button", { name: `Actions for ${item.game.title}` })
      );
      await userEvent.click(screen.getByRole("menuitem", { name }));
    };

    it("tags a Want game the user does not own", () => {
      render(
        <LibraryItemCard item={buildItem({ status: "WANT", isOwned: false })} />
      );
      expect(screen.getByText("Not owned")).toBeDefined();
    });

    it("does not tag an owned Want game", () => {
      render(
        <LibraryItemCard item={buildItem({ status: "WANT", isOwned: true })} />
      );
      expect(screen.queryByText("Not owned")).toBeNull();
    });

    it("does not tag a not-owned Playing game", () => {
      render(
        <LibraryItemCard
          item={buildItem({ status: "PLAYING", isOwned: false })}
        />
      );
      expect(screen.queryByText("Not owned")).toBeNull();
    });

    describe("given the user chooses 'I don't own it yet'", () => {
      it("shows the tag and saves the choice", async () => {
        vi.mocked(setOwnershipFn).mockResolvedValue({ isOwned: false });

        await chooseFromMenu(
          buildItem({ status: "WANT", isOwned: true }),
          "I don't own it yet"
        );

        expect(await screen.findByText("Not owned")).toBeDefined();
        expect(setOwnershipFn).toHaveBeenCalledWith({
          data: { id: 1, isOwned: false },
        });
      });

      it("takes the tag back and says so when saving fails", async () => {
        vi.mocked(setOwnershipFn).mockRejectedValue(new Error("offline"));

        render(<Toaster />);
        await chooseFromMenu(
          buildItem({ status: "WANT", isOwned: true }),
          "I don't own it yet"
        );

        expect(
          await screen.findByText("Couldn't save. Try again.")
        ).toBeDefined();
        expect(screen.queryByText("Not owned")).toBeNull();
      });
    });

    describe("given a not-owned game", () => {
      it("offers 'I own it' and removes the tag", async () => {
        vi.mocked(setOwnershipFn).mockResolvedValue({ isOwned: true });

        await chooseFromMenu(
          buildItem({ status: "WANT", isOwned: false }),
          "I own it"
        );

        await waitFor(() => expect(screen.queryByText("Not owned")).toBeNull());
      });
    });
  });

  describe("given any card", () => {
    beforeEach(() => {
      render(<LibraryItemCard item={buildItem({ id: 7 })} />);
    });

    it("offers no Add playthrough action", () => {
      expect(elements.queryAddPlaythroughButton()).toBeNull();
    });
  });

  describe("backlog-age strip", () => {
    it.each(["WANT", "PLAYING", "DONE"] as const)(
      "is absent for a %s item",
      (status) => {
        render(<LibraryItemCard item={buildItem({ status })} />);
        expect(elements.queryLifecycleStrip()).toBeNull();
      }
    );
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
