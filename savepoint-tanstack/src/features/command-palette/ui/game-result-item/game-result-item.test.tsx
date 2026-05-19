import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Command, CommandList } from "@/shared/ui/command";

import { GameResultItem } from "./game-result-item";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    onClick,
    ...rest
  }: {
    to?: string;
    params?: Record<string, string>;
    children: React.ReactNode;
    onClick?: () => void;
  } & Record<string, unknown>) => {
    let resolvedHref = to ?? "";
    if (params && to) {
      for (const [key, value] of Object.entries(params)) {
        resolvedHref = resolvedHref.replace(`$${key}`, value);
      }
    }
    return (
      <a href={resolvedHref} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  },
}));

const elements = {
  getRowByName: (name: string) => screen.getByText(name),
  queryYear: (year: string) => screen.queryByText(year),
  queryCover: () =>
    document.querySelector('img[src*="images.igdb.com"]') as HTMLImageElement | null,
};

const GAME = {
  coverImageId: "co1abc",
  name: "The Legend of Zelda: Breath of the Wild",
  slug: "the-legend-of-zelda-breath-of-the-wild",
  releaseYear: 2017,
};

type Overrides = {
  coverImageId?: string | null;
  name?: string;
  slug?: string;
  releaseYear?: number | null;
};

function renderRow(overrides: Overrides = {}) {
  const onAfterSelect = vi.fn();
  const props = {
    coverImageId:
      "coverImageId" in overrides ? overrides.coverImageId! : GAME.coverImageId,
    name: overrides.name ?? GAME.name,
    slug: overrides.slug ?? GAME.slug,
    releaseYear:
      "releaseYear" in overrides ? overrides.releaseYear! : GAME.releaseYear,
  };
  render(
    <Command>
      <CommandList>
        <GameResultItem
          coverImageId={props.coverImageId}
          name={props.name}
          slug={props.slug}
          releaseYear={props.releaseYear}
          onAfterSelect={onAfterSelect}
        />
      </CommandList>
    </Command>
  );
  return { onAfterSelect };
}

describe("GameResultItem", () => {
  describe("given a game with cover, name, slug, and release year", () => {
    beforeEach(() => {
      renderRow();
    });

    it("renders an anchor pointing at /games/$slug", () => {
      const row = elements.getRowByName(GAME.name);
      const anchor = row.closest("a");
      expect(anchor?.getAttribute("href")).toBe(`/games/${GAME.slug}`);
    });

    it("renders the cover image at the t_cover_small size", () => {
      const cover = elements.queryCover();
      expect(cover?.getAttribute("src")).toContain("t_cover_small");
      expect(cover?.getAttribute("src")).toContain(GAME.coverImageId);
    });

    it("renders the release year", () => {
      expect(elements.queryYear("2017")).not.toBeNull();
    });
  });

  describe("given a game without a release year", () => {
    beforeEach(() => {
      renderRow({ releaseYear: null });
    });

    it("does not render any year text", () => {
      expect(elements.queryYear("2017")).toBeNull();
    });
  });

  describe("given a game without a cover image id", () => {
    beforeEach(() => {
      renderRow({ coverImageId: null });
    });

    it("renders no IGDB image", () => {
      expect(elements.queryCover()).toBeNull();
    });
  });
});
