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
  queryCover: () => screen.queryByAltText("Cover for Hollow Knight"),
  queryCoverPlaceholder: () =>
    screen.queryByRole("img", { name: "Cover for Hollow Knight" }),
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

    it("renders a cover <img> with a full IGDB URL at t_cover_big", () => {
      const img = elements.queryCover();
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg"
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

  describe("given no coverImageId and a cover accent", () => {
    beforeEach(() => {
      render(
        <GameCard
          game={{ ...baseGame, coverImageId: null }}
          coverAccentClassName="bg-gradient-to-br from-[var(--status-shelf)] to-background"
          asLink={false}
        />
      );
    });

    it("applies the accent class to the placeholder", () => {
      expect(elements.queryCoverPlaceholder()?.className).toContain(
        "from-[var(--status-shelf)]"
      );
    });

    it("paints the title onto the gradient placeholder", () => {
      // The title now appears twice: the h3 below the cover + the overlay
      // span on the accent placeholder.
      expect(screen.getAllByText("Hollow Knight").length).toBeGreaterThan(1);
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
          game={{ ...baseGame, releaseYear: 2017, platforms: ["PC", "Switch"] }}
          density="detailed"
          asLink={false}
        />
      );
    });

    it("renders the release year", () => {
      expect(screen.getByText("2017")).toBeDefined();
    });

    it("renders the first platform", () => {
      expect(screen.getByText("PC")).toBeDefined();
    });
  });
});
