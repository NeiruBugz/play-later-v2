import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Command, CommandList } from "@/shared/ui/command";

import { quickAddToLibraryFn } from "../../api/quick-add-to-library-fn";
import { removeLibraryItemFn } from "../../api/remove-library-item-fn";
import { GameResultItem } from "./game-result-item";

const invalidate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate }),
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

// Server fns are not mocked-out behaviorally — we assert on call args.
vi.mock("../../api/quick-add-to-library-fn", () => ({
  quickAddToLibraryFn: vi.fn(),
}));
vi.mock("../../api/remove-library-item-fn", () => ({
  removeLibraryItemFn: vi.fn(),
}));

// Capture undo-toast invocations so the test can trigger the undo path.
const showUndoToast = vi.fn();
vi.mock("@/shared/ui/undo-toast", () => ({
  showUndoToast: (opts: { message: string; onUndo: () => void }) =>
    showUndoToast(opts),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const elements = {
  getRowByName: (name: string) => screen.getByText(name),
  queryYear: (year: string) => screen.queryByText(year),
  queryCover: () =>
    document.querySelector(
      'img[src*="images.igdb.com"]'
    ) as HTMLImageElement | null,
  getAddToUpNextButton: (name: string) =>
    screen.getByRole("button", { name: `Add ${name} to Up Next` }),
};

const actions = {
  clickAddToUpNext: (name: string) =>
    userEvent.click(elements.getAddToUpNextButton(name)),
};

const GAME = {
  igdbId: 1942,
  coverImageId: "co1abc",
  name: "The Legend of Zelda: Breath of the Wild",
  slug: "the-legend-of-zelda-breath-of-the-wild",
  releaseYear: 2017,
};

type Overrides = {
  igdbId?: number;
  coverImageId?: string | null;
  name?: string;
  slug?: string;
  releaseYear?: number | null;
};

function renderRow(overrides: Overrides = {}) {
  const onAfterSelect = vi.fn();
  const props = {
    igdbId: overrides.igdbId ?? GAME.igdbId,
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
          igdbId={props.igdbId}
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(quickAddToLibraryFn).mockResolvedValue({ id: 77 });
  vi.mocked(removeLibraryItemFn).mockResolvedValue(undefined);
});

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

    it("offers an Add to Up Next quick action", () => {
      expect(elements.getAddToUpNextButton(GAME.name)).toBeInTheDocument();
    });
  });

  describe("given the user clicks Add to Up Next", () => {
    let onAfterSelect: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      ({ onAfterSelect } = renderRow());
      await actions.clickAddToUpNext(GAME.name);
    });

    it("adds the game to the library by its IGDB id", () => {
      expect(quickAddToLibraryFn).toHaveBeenCalledWith({
        data: { igdbId: GAME.igdbId },
      });
    });

    it("surfaces an Up Next confirmation with undo", () => {
      expect(showUndoToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `Added "${GAME.name}" to Up Next`,
        })
      );
    });

    it("closes the palette after a successful add", () => {
      expect(onAfterSelect).toHaveBeenCalled();
    });
  });

  describe("given the user undoes the add", () => {
    beforeEach(async () => {
      renderRow();
      await actions.clickAddToUpNext(GAME.name);
      const opts = showUndoToast.mock.calls[0]?.[0] as {
        onUndo: () => void;
      };
      opts.onUndo();
    });

    it("removes the just-added library item", () => {
      expect(removeLibraryItemFn).toHaveBeenCalledWith({
        data: { itemId: 77 },
      });
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
