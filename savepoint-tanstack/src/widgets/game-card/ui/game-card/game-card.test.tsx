import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameCard } from "./game-card";

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

const baseGame = {
  slug: "hollow-knight",
  title: "Hollow Knight",
  coverImageId: "co9wzc",
};

const elements = {
  getTitle: () =>
    screen.getByRole("heading", { level: 3, name: "Hollow Knight" }),
  queryCover: () => screen.queryByAltText("Hollow Knight"),
  queryCoverPlaceholder: () =>
    screen.queryByRole("img", { name: "Hollow Knight" }),
  getLink: () => screen.getByRole("link", { name: /View Hollow Knight/ }),
  queryLink: () => screen.queryByRole("link", { name: /View Hollow Knight/ }),
  getBadge: () => screen.getByText("NEW"),
  getFooter: () => screen.getByText("Footer slot"),
};

describe("GameCard", () => {
  describe("given a game with a bare IGDB coverImageId", () => {
    beforeEach(() => {
      render(<GameCard game={baseGame} />);
    });

    it("renders the title as h3", () => {
      expect(elements.getTitle()).toBeDefined();
    });

    it("renders a cover <img> sized for a card (t_cover_big)", () => {
      const img = elements.queryCover();
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg"
      );
    });

    it("offers the t_cover_big_2x candidate for dense displays", () => {
      expect(elements.queryCover()?.getAttribute("srcset")).toContain(
        "t_cover_big_2x/co9wzc.jpg 2x"
      );
    });

    it("wraps the card in a TanStack Link to /games/$slug by default", () => {
      expect(elements.getLink()).toHaveAttribute(
        "href",
        "/games/hollow-knight"
      );
    });
  });

  describe("given a game with no coverImageId", () => {
    beforeEach(() => {
      render(<GameCard game={{ ...baseGame, coverImageId: null }} />);
    });

    it("does NOT render an <img>", () => {
      expect(elements.queryCover()).toBeNull();
    });

    it("renders a role=img placeholder with the title in its accessible name", () => {
      expect(elements.queryCoverPlaceholder()).not.toBeNull();
    });
  });

  describe("given asLink=false and an onClick handler", () => {
    const onClick = vi.fn();

    beforeEach(() => {
      onClick.mockClear();
      render(<GameCard game={baseGame} asLink={false} onClick={onClick} />);
    });

    it("does not render a wrapping link", () => {
      expect(elements.queryLink()).toBeNull();
    });

    it("invokes onClick when the card is clicked", async () => {
      await userEvent.click(elements.getTitle());
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("given a badges slot and a footer child", () => {
    beforeEach(() => {
      render(
        <GameCard game={baseGame} badges={<span>NEW</span>} asLink={false}>
          <span>Footer slot</span>
        </GameCard>
      );
    });

    it("renders the badges slot", () => {
      expect(elements.getBadge()).toBeDefined();
    });

    it("renders the footer child", () => {
      expect(elements.getFooter()).toBeDefined();
    });
  });

  describe("given density='detailed' with meta", () => {
    beforeEach(() => {
      render(
        <GameCard
          game={{
            ...baseGame,
            releaseYear: 2017,
            platforms: ["PlayStation 5", "Nintendo Switch"],
          }}
          density="detailed"
          asLink={false}
        />
      );
    });

    it("renders the release year", () => {
      expect(screen.getByText("2017")).toBeDefined();
    });

    it("renders platforms through PlatformBadges with abbreviated labels", () => {
      // PlatformBadges abbreviates "PlayStation 5" → "PS5" and
      // "Nintendo Switch" → "Switch"; the old full-name chips are gone.
      expect(screen.getByText("PS5")).toBeDefined();
      expect(screen.getByText("Switch")).toBeDefined();
      expect(screen.queryByText("PlayStation 5")).toBeNull();
    });

    it("does not render the old grey full-name chip", () => {
      // Family color + variant coverage lives in PlatformBadges' own test;
      // here we only prove GameCard routes platforms through that component.
      expect(screen.queryByText("PlayStation 5")).toBeNull();
    });
  });

  describe("given density='minimal' with no platforms", () => {
    beforeEach(() => {
      render(<GameCard game={baseGame} density="minimal" asLink={false} />);
    });

    it("renders no platform row", () => {
      // minimal density renders no meta block at all; the related-games and
      // library cover cards pass no platforms — PlatformBadges must not render.
      expect(screen.queryByText("PS5")).toBeNull();
    });
  });
});
