import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";

import { DashboardGameRail } from "./dashboard-game-rail";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: any) => {
    delete rest.params;
    delete rest.search;
    return (
      <a href={typeof to === "string" ? to : "#"} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageUrl: () => "https://images.igdb.com/cover.jpg",
}));

vi.mock("@/entities/library-item", () => ({
  LibraryStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
  isTouched: () => false,
}));

function makeItem(
  overrides: Partial<LibraryItemWithGame> = {}
): LibraryItemWithGame {
  return {
    id: "item-1",
    status: "PLAYING",
    platform: "PC",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-1",
    igdbId: 1234,
    game: {
      id: "game-1",
      igdbId: 1234,
      title: "Elden Ring",
      slug: "elden-ring",
      coverImage: "abc123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...overrides,
  } as LibraryItemWithGame;
}

const elements = {
  getSectionHeading: (name: string) => screen.getByRole("heading", { name }),
  getSeeAllLink: () => screen.queryByRole("link", { name: /see all/i }),
  getViewLibraryLink: () =>
    screen.queryByRole("link", { name: /view library/i }),
  getAllLinks: () => screen.queryAllByRole("link"),
  queryEmptyBrowseLink: () =>
    screen.queryByRole("link", { name: /browse games/i }),
};

describe("DashboardGameRail", () => {
  describe("given the rail has items", () => {
    beforeEach(() => {
      render(
        <DashboardGameRail
          title="Playing"
          items={[makeItem()]}
          viewAll={{ status: "PLAYING" }}
          viewAllLabel="See all"
        />
      );
    });

    it("renders a section heading with the rail title", () => {
      expect(elements.getSectionHeading("Playing")).toBeDefined();
    });

    it("renders a see-all link", () => {
      expect(elements.getSeeAllLink()).not.toBeNull();
    });
  });

  describe("given the rail has items and a custom viewAll search", () => {
    beforeEach(() => {
      render(
        <DashboardGameRail
          title="Up next"
          items={[makeItem({ status: "UP_NEXT" })]}
          viewAll={{ status: "UP_NEXT" }}
          viewAllLabel="See all"
        />
      );
    });

    it("renders a see-all link", () => {
      expect(elements.getSeeAllLink()).not.toBeNull();
    });

    it("the see-all link points to /library", () => {
      expect(elements.getSeeAllLink()).toHaveAttribute("href", "/library");
    });
  });

  describe("given the rail has items and a custom viewAllLabel", () => {
    beforeEach(() => {
      render(
        <DashboardGameRail
          title="Recently played"
          items={[makeItem({ status: "PLAYED" })]}
          viewAll={{ sortBy: "createdAt", sortOrder: "desc" }}
          viewAllLabel="View Library"
        />
      );
    });

    it("renders a link with the custom viewAllLabel", () => {
      expect(elements.getViewLibraryLink()).not.toBeNull();
    });

    it("the custom-label link also points to /library", () => {
      expect(elements.getViewLibraryLink()).toHaveAttribute("href", "/library");
    });
  });

  describe("given the rail is empty", () => {
    beforeEach(() => {
      render(
        <DashboardGameRail
          title="Playing"
          items={[]}
          viewAll={{ status: "PLAYING" }}
          viewAllLabel="See all"
          emptyMessage="No games in progress"
        />
      );
    });

    it("does not render a see-all link when there are no items", () => {
      expect(elements.getSeeAllLink()).toBeNull();
    });

    it("renders the empty-state browse link instead", () => {
      expect(elements.queryEmptyBrowseLink()).not.toBeNull();
    });
  });
});
