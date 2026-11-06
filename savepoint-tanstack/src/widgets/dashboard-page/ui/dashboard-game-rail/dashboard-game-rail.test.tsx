import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";

import { DashboardGameRail } from "./dashboard-game-rail";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: any) => {
    delete rest.params;
    const search = rest.search;
    delete rest.search;
    return (
      <a
        href={typeof to === "string" ? to : "#"}
        data-search={JSON.stringify(search ?? null)}
        {...rest}
      >
        {children}
      </a>
    );
  },
}));

vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageProps: () => ({
    src: "https://images.igdb.com/cover.jpg",
    srcSet: undefined,
  }),
}));

vi.mock("@/entities/library-item", () => ({
  toStatusChipStatus: (status: string) => status.toLowerCase(),
  QueueMarker: ({
    status,
    upNextPosition,
  }: {
    status: string;
    upNextPosition: number | null;
  }) =>
    upNextPosition !== null && status === "WANT" ? (
      <span data-testid="queue-marker">Up Next #{upNextPosition}</span>
    ) : null,
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
};

describe("DashboardGameRail", () => {
  describe("given the Up Next rail with queued games", () => {
    beforeEach(() => {
      render(
        <DashboardGameRail
          title="Up Next"
          items={[
            makeItem({
              id: "a",
              status: "WANT",
              upNextPosition: 1,
              game: { ...makeItem().game, title: "Hades", slug: "hades" },
            } as unknown as Partial<LibraryItemWithGame>),
            makeItem({
              id: "b",
              status: "WANT",
              upNextPosition: 2,
              game: { ...makeItem().game, title: "Celeste", slug: "celeste" },
            } as unknown as Partial<LibraryItemWithGame>),
          ]}
          viewAll={{ status: "UP_NEXT" }}
          viewAllLabel="See all"
          emptyMessage="Nothing queued yet — put up to 5 games in Up Next."
        />
      );
    });

    it("lists the games in the order given with their place markers", () => {
      const markers = screen
        .getAllByTestId("queue-marker")
        .map((el) => el.textContent);
      expect(markers).toEqual(["Up Next #1", "Up Next #2"]);
      const titles = screen
        .getAllByRole("link")
        .map((el) => el.textContent ?? "")
        .filter((text) => text.includes("Hades") || text.includes("Celeste"));
      expect(titles[0]).toContain("Hades");
      expect(titles[1]).toContain("Celeste");
    });

    it("links See all to the library with the Up Next filter", () => {
      const link = elements.getSeeAllLink();
      expect(link).toHaveAttribute("href", "/library");
      expect(link?.getAttribute("data-search")).toBe('{"status":"UP_NEXT"}');
    });
  });

  describe("given the Up Next rail is empty", () => {
    it("shows the agreed empty copy", () => {
      render(
        <DashboardGameRail
          title="Up Next"
          items={[]}
          viewAll={{ status: "UP_NEXT" }}
          viewAllLabel="See all"
          emptyMessage="Nothing queued yet — put up to 5 games in Up Next."
        />
      );
      expect(
        screen.getByText("Nothing queued yet — put up to 5 games in Up Next.")
      ).toBeDefined();
      expect(screen.queryAllByRole("link")).toHaveLength(0);
    });
  });
});
