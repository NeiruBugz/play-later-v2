import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardContinueList } from "./dashboard-continue-list";
import type { DashboardContinueListProps } from "./dashboard-continue-list.type";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, params, children, ...rest }: any) => {
    delete rest.search;
    const href =
      typeof to === "string" && params?.slug
        ? to.replace("$slug", params.slug)
        : (to ?? "#");
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageUrl: () => "https://images.igdb.com/cover.jpg",
}));

function makeItem(
  id: string,
  title: string,
  slug: string,
  coverImage: string | null = "abc"
): DashboardContinueListProps["items"][number] {
  return {
    id,
    status: "PLAYING",
    platform: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-1",
    libraryItemId: id,
    igdbId: 1,
    game: {
      id: `game-${id}`,
      igdbId: 1,
      title,
      slug,
      coverImage,
      description: null,
      releaseDate: null,
      developer: null,
      publisher: null,
      genres: [],
      platforms: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  } as any;
}

const elements = {
  getHeading: () => screen.getByText("// CONTINUE"),
  queryHeading: () => screen.queryByText("// CONTINUE"),
  getCoverImage: (title: string) =>
    screen.getByRole("img", { name: `Cover for ${title}` }),
  getGameLink: (title: string) =>
    screen.getByRole("link", { name: new RegExp(title) }),
};

describe("DashboardContinueList", () => {
  describe("given an empty items list", () => {
    beforeEach(() => {
      render(<DashboardContinueList items={[]} />);
    });

    it("renders nothing", () => {
      expect(elements.queryHeading()).toBeNull();
    });
  });

  describe("given a list of playing games", () => {
    beforeEach(() => {
      render(
        <DashboardContinueList
          items={[
            makeItem("1", "Elden Ring", "elden-ring"),
            makeItem("2", "Celeste", "celeste"),
          ]}
        />
      );
    });

    it("renders the terminal label heading", () => {
      expect(elements.getHeading()).toBeDefined();
    });

    it("renders a row for each game with a cover image", () => {
      expect(elements.getCoverImage("Elden Ring")).toBeDefined();
      expect(elements.getCoverImage("Celeste")).toBeDefined();
    });

    it("each row links to the game detail page", () => {
      expect(elements.getGameLink("Elden Ring")).toHaveAttribute(
        "href",
        "/games/elden-ring"
      );
      expect(elements.getGameLink("Celeste")).toHaveAttribute(
        "href",
        "/games/celeste"
      );
    });
  });

  describe("given a game with no cover image", () => {
    beforeEach(() => {
      render(
        <DashboardContinueList
          items={[makeItem("3", "Unknown Game", "unknown-game", null)]}
        />
      );
    });

    it("renders a placeholder img role with correct alt text", () => {
      expect(
        screen.getByRole("img", { name: "Cover for Unknown Game" })
      ).toBeDefined();
    });
  });
});
