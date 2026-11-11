import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { openCommandPalette } from "@/features/command-palette";

import { UpNextShelf } from "./up-next-shelf";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: any) => {
    const search = rest.search as Record<string, string> | undefined;
    delete rest.params;
    delete rest.search;
    const query = search ? `?${new URLSearchParams(search).toString()}` : "";
    return (
      <a href={`${to}${query}`} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/entities/session/model", () => ({
  useEveningMinutes: () => 105,
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

const THIRTY_ONE_HOURS_SECONDS = 31 * 3600;

function makeQueued(
  position: number,
  title: string,
  overrides: { status?: string; timeToCreditsSeconds?: number | null } = {}
) {
  return {
    id: `q${position}`,
    status: overrides.status ?? "WANT",
    platform: "PC",
    doneOutcome: null,
    upNextPosition: position,
    game: {
      id: `game-${position}`,
      igdbId: position,
      title,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
      coverImage: "abc",
      timeToCreditsSeconds: overrides.timeToCreditsSeconds ?? null,
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
  getSeeAllLink: () => screen.getByRole("link", { name: /see all/i }),
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

    it("marks the first game as the one in front", () => {
      const [first] = elements.getQueuedGames();
      expect(within(first).getByRole("link")).toHaveAttribute(
        "aria-current",
        "true"
      );
      expect(elements.getNextGameLinks()).toHaveLength(1);
    });

    it("says nothing about play next", () => {
      expect(screen.queryByText("Play next")).toBeNull();
    });

    it("shows no status chips", () => {
      expect(screen.queryByText("Want")).toBeNull();
      expect(screen.queryByText("Playing")).toBeNull();
      expect(screen.queryByText("Done")).toBeNull();
    });

    it("captions each cover with its title when no length is known", () => {
      const [first, second] = elements.getQueuedGames();
      expect(within(first).getByText("Hades")).toBeVisible();
      expect(within(second).getByText("Celeste")).toBeVisible();
    });

    it("sends See all to the Library's Up Next filter", () => {
      expect(elements.getSeeAllLink()).toHaveAttribute(
        "href",
        "/library?status=UP_NEXT"
      );
    });
  });

  describe("given the first game is 31 hours long", () => {
    beforeEach(() => {
      render(
        <UpNextShelf
          items={[
            makeQueued(1, "Hades", {
              timeToCreditsSeconds: THIRTY_ONE_HOURS_SECONDS,
            }),
            makeQueued(2, "Celeste", {
              timeToCreditsSeconds: THIRTY_ONE_HOURS_SECONDS,
            }),
          ]}
        />
      );
    });

    it("captions the first cover in evenings", () => {
      const [first] = elements.getQueuedGames();
      expect(within(first).getByText("About 18 evenings")).toBeVisible();
    });

    it("keeps the other covers captioned with their titles", () => {
      const [, second] = elements.getQueuedGames();
      expect(within(second).getByText("Celeste")).toBeVisible();
      expect(within(second).queryByText("About 18 evenings")).toBeNull();
    });
  });

  describe("given a Done game queued for a replay", () => {
    it("captions it Replay in a later position", () => {
      render(
        <UpNextShelf
          items={[
            makeQueued(1, "Hades"),
            makeQueued(2, "Celeste", { status: "DONE" }),
          ]}
        />
      );
      const [first, second] = elements.getQueuedGames();
      expect(within(second).getByText("Replay")).toBeVisible();
      expect(within(first).queryByText("Replay")).toBeNull();
    });

    it("captions it Replay in first position, even when its length is known", () => {
      render(
        <UpNextShelf
          items={[
            makeQueued(1, "Hades", {
              status: "DONE",
              timeToCreditsSeconds: THIRTY_ONE_HOURS_SECONDS,
            }),
            makeQueued(2, "Celeste"),
          ]}
        />
      );
      const [first] = elements.getQueuedGames();
      expect(within(first).getByText("Replay")).toBeVisible();
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
