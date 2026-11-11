import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardPageData } from "@/features/dashboard";

import { DashboardPage } from "./dashboard-page";

const mockNavigate = vi.fn();

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
  useNavigate: () => mockNavigate,
  useRouter: () => ({ invalidate: vi.fn() }),
}));

vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: vi.fn(),
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: vi.fn(),
}));
vi.mock("@/entities/session/model", () => ({
  useEveningMinutes: () => 105,
}));

vi.mock("@/features/command-palette", () => ({
  openCommandPalette: vi.fn(),
}));

vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageUrl: () => "https://images.igdb.com/cover.jpg",
  buildCoverImageProps: () => ({
    src: "https://images.igdb.com/cover.jpg",
    srcSet: undefined,
  }),
}));

function makeItem(id: string, title: string, overrides: object = {}) {
  return {
    id,
    status: "PLAYING",
    platform: "PC",
    upNextPosition: null,
    game: {
      id: `game-${id}`,
      igdbId: 1,
      title,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
      coverImage: "abc",
    },
    ...overrides,
  } as unknown as DashboardPageData["playing"][number];
}

function makeQueued(position: number, title: string) {
  return makeItem(`q${position}`, title, {
    status: "WANT",
    upNextPosition: position,
  });
}

function makeData(
  overrides: Partial<DashboardPageData> = {}
): DashboardPageData {
  return {
    playing: [],
    upNextQueue: [],
    upNextTotal: 0,
    counts: { WANT: 0, PLAYING: 0, DONE: 0 },
    ...overrides,
  } as DashboardPageData;
}

const QUEUE_EMPTY_COPY = "Nothing queued yet — put up to 5 games in Up Next.";

const elements = {
  getHomeHeading: () => screen.getByRole("heading", { level: 1 }),
  getPlayingSection: () => screen.getByRole("region", { name: "Playing" }),
  getUpNextSection: () => screen.getByRole("region", { name: "Up Next" }),
  getCountsStrips: () => screen.queryAllByLabelText("Library status summary"),
  getAddGameButtons: () =>
    screen.getAllByRole("button", { name: "Add a game" }),
  queryPickFromUpNext: () =>
    screen.queryByRole("link", { name: "Pick from Up Next" }),
  getEmptyStates: () => screen.queryAllByRole("status"),
};

describe("DashboardPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given one Playing game and a full queue", () => {
    beforeEach(() => {
      render(
        <DashboardPage
          data={makeData({
            playing: [makeItem("p1", "Elden Ring")],
            upNextQueue: [
              makeQueued(1, "Hades"),
              makeQueued(2, "Celeste"),
              makeQueued(3, "Hollow Knight"),
            ],
            upNextTotal: 5,
            counts: { WANT: 6, PLAYING: 1, DONE: 4 },
          })}
        />
      );
    });

    it("titles the screen Home", () => {
      expect(elements.getHomeHeading()).toHaveTextContent("Home");
    });

    it("shows the Playing game exactly once", () => {
      expect(screen.getAllByText("Elden Ring")).toHaveLength(1);
    });

    it("keeps the Playing game inside the Playing section only", () => {
      expect(
        within(elements.getUpNextSection()).queryByText("Elden Ring")
      ).toBeNull();
    });

    it("shows the status counts once", () => {
      expect(elements.getCountsStrips()).toHaveLength(1);
      const strip = elements.getCountsStrips()[0];
      expect(strip).toHaveTextContent("11 games");
      expect(within(strip).getByRole("link", { name: /Want 6/ })).toBeVisible();
      expect(within(strip).getByRole("link", { name: /Done 4/ })).toBeVisible();
    });

    it("lists the queued games in queue order with their markers", () => {
      const upNext = within(elements.getUpNextSection());
      const titles = upNext
        .getAllByRole("link")
        .map((el) => el.textContent ?? "")
        .filter((text) => /Hades|Celeste|Hollow Knight/.test(text));
      expect(
        titles.map((text) => text.match(/Hades|Celeste|Hollow/)![0])
      ).toEqual(["Hades", "Celeste", "Hollow"]);
      expect(upNext.getAllByText(/Up Next #/)).toHaveLength(3);
    });

    it("links See all to the library's Up Next view", () => {
      expect(
        within(elements.getUpNextSection()).getByRole("link", {
          name: /see all/i,
        })
      ).toHaveAttribute("href", "/library?status=UP_NEXT");
    });

    it("shows no empty state", () => {
      expect(elements.getEmptyStates()).toHaveLength(0);
    });

    it("lays out Up Next first, then Playing, so Up Next is the first thing on a phone", () => {
      const sections = screen
        .getAllByRole("region")
        .map((el) => el.getAttribute("aria-labelledby"));
      expect(sections).toEqual([
        "home-up-next-heading",
        "home-playing-heading",
      ]);
      expect(
        within(elements.getPlayingSection()).getAllByRole("listitem")
      ).toHaveLength(1);
    });

    it("logs time for the Playing game from its Log button", async () => {
      await userEvent.click(screen.getByRole("button", { name: "Log" }));
      const { search } = mockNavigate.mock.calls[0][0];
      expect(search({})).toEqual({ action: "log-session", game: "elden-ring" });
    });
  });

  describe("given a stats card, distribution bar or recent history would once have shown", () => {
    beforeEach(() => {
      render(
        <DashboardPage
          data={makeData({
            playing: [makeItem("p1", "Elden Ring")],
            counts: { WANT: 3, PLAYING: 1, DONE: 3 },
          })}
        />
      );
    });

    it("shows none of them and avoids retired words", () => {
      const text = document.body.textContent ?? "";
      expect(text).not.toMatch(/recently played/i);
      expect(text).not.toMatch(
        /dashboard|playthrough|backlog|completed|log session/i
      );
      expect(screen.queryByRole("progressbar")).toBeNull();
      expect(
        screen.queryByRole("img", { name: /distribution|chart/i })
      ).toBeNull();
    });
  });

  describe("given nothing is Playing and the queue has games", () => {
    beforeEach(() => {
      render(
        <DashboardPage
          data={makeData({
            upNextQueue: [makeQueued(1, "Hades")],
            upNextTotal: 1,
            counts: { WANT: 1, PLAYING: 0, DONE: 0 },
          })}
        />
      );
    });

    it("shows exactly one empty state", () => {
      expect(elements.getEmptyStates()).toHaveLength(1);
    });

    it("offers Pick from Up Next, opening the library's Up Next view", () => {
      expect(elements.queryPickFromUpNext()).toHaveAttribute(
        "href",
        "/library?status=UP_NEXT"
      );
    });

    it("does not offer a second Add a game button in the empty state", () => {
      expect(
        within(elements.getEmptyStates()[0]).queryByRole("button", {
          name: "Add a game",
        })
      ).toBeNull();
    });
  });

  describe("given nothing is Playing and the queue is empty", () => {
    beforeEach(() => {
      render(<DashboardPage data={makeData()} />);
    });

    it("shows exactly one empty state with Add a game", () => {
      expect(elements.getEmptyStates()).toHaveLength(1);
      expect(elements.getAddGameButtons()).toHaveLength(1);
      expect(elements.queryPickFromUpNext()).toBeNull();
    });

    it("opens the add search from Add a game", async () => {
      await userEvent.click(elements.getAddGameButtons()[0]);
      const { search } = mockNavigate.mock.calls[0][0];
      expect(search({})).toEqual({ action: "add-game", game: undefined });
    });

    it("explains the empty queue once, inside the Up Next section", () => {
      expect(screen.getAllByText(QUEUE_EMPTY_COPY)).toHaveLength(1);
      expect(
        within(elements.getUpNextSection()).getByText(QUEUE_EMPTY_COPY)
      ).toBeVisible();
      expect(screen.queryByRole("link", { name: /see all/i })).toBeNull();
    });

    it("has a single main landmark region of its own: none, since the app shell owns it", () => {
      expect(screen.queryByRole("main")).toBeNull();
    });

    it("shows no counts strip for an empty library", () => {
      expect(elements.getCountsStrips()).toHaveLength(0);
    });
  });

  describe("given a Playing game and an empty queue", () => {
    beforeEach(() => {
      render(
        <DashboardPage
          data={makeData({
            playing: [makeItem("p1", "Elden Ring")],
            counts: { WANT: 0, PLAYING: 1, DONE: 0 },
          })}
        />
      );
    });

    it("keeps the Up Next empty copy and shows no empty state", () => {
      expect(
        within(elements.getUpNextSection()).getByText(QUEUE_EMPTY_COPY)
      ).toBeVisible();
      expect(elements.getEmptyStates()).toHaveLength(0);
    });
  });

  describe("given the Home header", () => {
    it("opens the add search from the Add game button", async () => {
      render(<DashboardPage data={makeData()} />);
      await userEvent.click(screen.getByRole("button", { name: "Add game" }));
      const { search } = mockNavigate.mock.calls[0][0];
      expect(search({})).toEqual({ action: "add-game", game: undefined });
    });
  });
});
