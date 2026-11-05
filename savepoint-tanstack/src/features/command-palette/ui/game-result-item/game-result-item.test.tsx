import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Command, CommandList } from "@/shared/ui/command";

import { GameResultItem } from "./game-result-item";
import type { GameResultItemProps } from "./game-result-item.type";

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
    document.querySelector(
      'img[src*="images.igdb.com"]'
    ) as HTMLImageElement | null,
  queryAddSlot: () => screen.queryByTestId("add-slot"),
};

const GAME = {
  igdbId: 1942,
  coverImageId: "co1abc",
  name: "The Legend of Zelda: Breath of the Wild",
  slug: "the-legend-of-zelda-breath-of-the-wild",
  releaseYear: 2017,
};

type Overrides = Partial<
  Pick<
    GameResultItemProps,
    "coverImageId" | "releaseYear" | "library" | "renderAddAction"
  >
>;

function renderRow(overrides: Overrides = {}) {
  const onAfterSelect = vi.fn();
  render(
    <Command>
      <CommandList>
        <GameResultItem
          igdbId={GAME.igdbId}
          coverImageId={
            "coverImageId" in overrides
              ? overrides.coverImageId!
              : GAME.coverImageId
          }
          name={GAME.name}
          slug={GAME.slug}
          releaseYear={
            "releaseYear" in overrides
              ? overrides.releaseYear!
              : GAME.releaseYear
          }
          library={overrides.library}
          renderAddAction={overrides.renderAddAction}
          onAfterSelect={onAfterSelect}
        />
      </CommandList>
    </Command>
  );
  return { onAfterSelect };
}

const addSlot: GameResultItemProps["renderAddAction"] = ({ igdbId, name }) => (
  <button type="button" data-testid="add-slot">
    slot {igdbId} {name}
  </button>
);

describe("GameResultItem", () => {
  describe("given a game queued in Up Next", () => {
    it("shows 'Up Next #3' for a Want game", () => {
      renderRow({ library: { status: "WANT", upNextPosition: 3 } });
      expect(screen.getByText("Up Next #3")).toBeDefined();
    });

    it("shows 'Replay' for a Done game", () => {
      renderRow({ library: { status: "DONE", upNextPosition: 1 } });
      expect(screen.getByText("Replay")).toBeDefined();
    });

    it("shows no marker for a game outside the queue", () => {
      renderRow({ library: { status: "WANT", upNextPosition: null } });
      expect(screen.queryByTestId("queue-marker")).toBeNull();
    });
  });

  describe("given a game with cover, name, slug, and release year", () => {
    beforeEach(() => {
      renderRow();
    });

    it("renders an anchor pointing at /games/$slug", () => {
      const anchor = elements.getRowByName(GAME.name).closest("a");
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

  describe("given a game outside the library and an injected add slot", () => {
    it("renders the slot with the game's IGDB id and name", () => {
      renderRow({ renderAddAction: addSlot });
      expect(elements.queryAddSlot()?.textContent).toContain(
        `slot ${GAME.igdbId} ${GAME.name}`
      );
    });

    it("keeps the palette open when the slot is used", () => {
      const { onAfterSelect } = renderRow({ renderAddAction: addSlot });
      elements.queryAddSlot()?.click();
      expect(onAfterSelect).not.toHaveBeenCalled();
    });
  });

  describe("given a game already in the library", () => {
    beforeEach(() => {
      renderRow({
        library: { status: "PLAYING", upNextPosition: null },
        renderAddAction: addSlot,
      });
    });

    it("shows In library with its status instead of the add control", () => {
      expect(screen.getByText("In library")).toBeDefined();
      expect(screen.getByLabelText("Status: Playing")).toBeDefined();
      expect(elements.queryAddSlot()).toBeNull();
    });
  });

  describe("given a game without a release year", () => {
    it("does not render any year text", () => {
      renderRow({ releaseYear: null });
      expect(elements.queryYear("2017")).toBeNull();
    });
  });

  describe("given a game without a cover image id", () => {
    it("renders no cover image", () => {
      renderRow({ coverImageId: null });
      expect(elements.queryCover()).toBeNull();
    });
  });
});
