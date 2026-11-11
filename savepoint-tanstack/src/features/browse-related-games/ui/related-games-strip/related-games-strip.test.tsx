import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RelatedCollection, RelatedGame } from "../../api";
import { RelatedGamesStrip } from "./related-games-strip";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, params, children, ...rest }: any) => (
    <a href={to.replace("$slug", params?.slug)} {...rest}>
      {children}
    </a>
  ),
}));

function makeGames(count: number): RelatedGame[] {
  return Array.from({ length: count }, (_, index) => ({
    igdbId: index + 1,
    slug: `mg-${index + 1}`,
    title: `Metal Gear ${index + 1}`,
    coverImageId: `cover${index + 1}`,
  }));
}

const collection = (
  collectionName: string,
  games: RelatedGame[],
  collectionId = 1
): RelatedCollection => ({ collectionId, collectionName, games });

const elements = {
  getTitle: (name: string) => screen.getByRole("heading", { name }),
  queryTitle: (name: string) => screen.queryByRole("heading", { name }),
  getRow: () => screen.getByRole("list"),
  getItems: () => within(screen.getByRole("list")).getAllByRole("listitem"),
  getAll: (total: number) =>
    screen.getByRole("button", { name: `All ${total}` }),
  queryAll: () => screen.queryByRole("button", { name: /^All \d+$/ }),
  getShowFewer: () => screen.getByRole("button", { name: "Show fewer" }),
};

describe("RelatedGamesStrip", () => {
  describe("given a series with 35 related games", () => {
    beforeEach(() => {
      render(
        <RelatedGamesStrip
          sections={[collection("Metal Gear", makeGames(35))]}
        />
      );
    });

    it("is titled More in Metal Gear", () => {
      expect(elements.getTitle("More in Metal Gear")).toBeInTheDocument();
    });

    it("scrolls sideways in one row with a gap between covers", () => {
      expect(elements.getRow()).toHaveClass("overflow-x-auto");
      expect(elements.getRow()).toHaveClass("gap-3");
    });

    it("shows the first six games, each captioned with its title", () => {
      expect(elements.getItems().map((item) => item.textContent)).toEqual([
        "Metal Gear 1",
        "Metal Gear 2",
        "Metal Gear 3",
        "Metal Gear 4",
        "Metal Gear 5",
        "Metal Gear 6",
      ]);
    });

    it("links each game to its page", () => {
      expect(
        screen.getByRole("link", { name: /Metal Gear 1$/ })
      ).toHaveAttribute("href", "/games/mg-1");
    });

    it("gives every cover the same size", () => {
      const classNames = new Set(
        elements.getItems().map((item) => item.className)
      );
      expect(classNames.size).toBe(1);
    });

    it("offers All 35", () => {
      expect(elements.getAll(35)).toBeInTheDocument();
    });

    describe("when the user taps All 35", () => {
      beforeEach(async () => {
        await userEvent.click(elements.getAll(35));
      });

      it("shows all 35 games in the same row", () => {
        expect(elements.getItems()).toHaveLength(35);
      });

      it("offers Show fewer, which goes back to six", async () => {
        await userEvent.click(elements.getShowFewer());
        expect(elements.getItems()).toHaveLength(6);
      });
    });
  });

  describe("given a game in several series", () => {
    beforeEach(() => {
      render(
        <RelatedGamesStrip
          sections={[
            collection("Metal Gear", makeGames(3), 1),
            collection("Konami Classics", makeGames(4), 2),
          ]}
        />
      );
    });

    it("shows only the first series", () => {
      expect(elements.getTitle("More in Metal Gear")).toBeInTheDocument();
      expect(elements.queryTitle("More in Konami Classics")).toBeNull();
      expect(elements.getItems()).toHaveLength(3);
    });

    it("offers no All link when everything already fits", () => {
      expect(elements.queryAll()).toBeNull();
    });
  });

  describe("given a related game with no cover art", () => {
    beforeEach(() => {
      render(
        <RelatedGamesStrip
          sections={[
            collection("Metal Gear", [
              {
                igdbId: 9,
                slug: "mg-9",
                title: "Metal Gear Acid",
                coverImageId: null,
              },
            ]),
          ]}
        />
      );
    });

    it("shows the no-cover placeholder carrying its name", () => {
      expect(
        screen.getByRole("img", { name: "Metal Gear Acid" })
      ).toBeInTheDocument();
      expect(elements.getItems()[0]).toHaveTextContent("Metal Gear Acid");
    });
  });

  describe("given no related games", () => {
    it("renders nothing for no series", () => {
      const { container } = render(<RelatedGamesStrip sections={[]} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing for a series with no games", () => {
      const { container } = render(
        <RelatedGamesStrip sections={[collection("Metal Gear", [])]} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });
});
