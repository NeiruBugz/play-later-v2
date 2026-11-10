import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { openCommandPalette } from "@/features/command-palette";

import { UpNextShelf } from "./up-next-shelf";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: any) => {
    delete rest.params;
    delete rest.search;
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/features/command-palette", () => ({
  openCommandPalette: vi.fn(),
}));

vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageProps: () => ({
    src: "https://images.igdb.com/cover.jpg",
    srcSet: undefined,
  }),
}));

const QUEUE_TITLES = ["Hades", "Celeste", "Hollow Knight", "Tunic", "Inside"];
const EMPTY_COPY = "Nothing queued yet — put up to 5 games in Up Next.";

function makeQueued(position: number, title: string) {
  return {
    id: `q${position}`,
    status: "WANT",
    platform: "PC",
    doneOutcome: null,
    upNextPosition: position,
    game: {
      id: `game-${position}`,
      igdbId: position,
      title,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
      coverImage: "abc",
    },
  } as unknown as LibraryItemWithGame;
}

const elements = {
  getQueueScroller: () =>
    screen.getByRole("list", { name: "Up Next, in play order" }),
  queryQueueScroller: () =>
    screen.queryByRole("list", { name: "Up Next, in play order" }),
  getQueuedGames: () =>
    within(elements.getQueueScroller()).getAllByRole("listitem"),
  getCoverTitle: (queuedGame: HTMLElement) =>
    within(queuedGame).getByRole("img").getAttribute("alt"),
  getNextGameLinks: () =>
    within(elements.getQueueScroller())
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "true"),
  getFindAGameButton: () =>
    screen.getByRole("button", { name: "Find a game to add" }),
};

const actions = {
  clickFindAGame: async () => {
    await userEvent.click(elements.getFindAGameButton());
  },
};

describe("UpNextShelf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given a queue of five games", () => {
    beforeEach(() => {
      render(
        <UpNextShelf
          items={QUEUE_TITLES.map((title, index) =>
            makeQueued(index + 1, title)
          )}
        />
      );
    });

    it("shows the covers in queue order", () => {
      expect(elements.getQueuedGames().map(elements.getCoverTitle)).toEqual(
        QUEUE_TITLES
      );
    });

    it("marks the first game as the one to play next", () => {
      const [first] = elements.getQueuedGames();
      expect(within(first).getByRole("link")).toHaveAttribute(
        "aria-current",
        "true"
      );
      expect(within(first).getByText("Play next")).toBeVisible();
    });

    it("marks no other game as next", () => {
      expect(elements.getNextGameLinks()).toHaveLength(1);
      expect(screen.getAllByText("Play next")).toHaveLength(1);
    });
  });

  describe("given an empty queue", () => {
    beforeEach(async () => {
      render(<UpNextShelf items={[]} />);
      await actions.clickFindAGame();
    });

    it("shows no queue list", () => {
      expect(elements.queryQueueScroller()).toBeNull();
    });

    it("explains that nothing is queued yet", () => {
      expect(screen.getByText(EMPTY_COPY)).toBeVisible();
    });

    it("opens the command palette from Find a game to add", () => {
      expect(openCommandPalette).toHaveBeenCalledTimes(1);
    });
  });
});
