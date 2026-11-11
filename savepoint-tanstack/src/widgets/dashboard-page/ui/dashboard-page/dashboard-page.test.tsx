import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardPageData } from "@/features/dashboard";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
import { DashboardPage } from "./dashboard-page";

type Playing = DashboardPageData["playing"][number];
type Queued = DashboardPageData["upNextQueue"][number];

const { navigateMock, invalidateMock, setStatusFnMock, isDesktop } = vi.hoisted(
  () => ({
    navigateMock: vi.fn(),
    invalidateMock: vi.fn(),
    setStatusFnMock: vi.fn(),
    isDesktop: { current: false },
  })
);

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  useRouter: () => ({ invalidate: invalidateMock }),
  Link: ({
    to,
    children,
    search,
    ...rest
  }: {
    to?: string;
    children: ReactNode;
    search?: Record<string, string>;
  }) => {
    const query = search ? `?${new URLSearchParams(search).toString()}` : "";
    return (
      <a href={`${to}${query}`} {...rest}>
        {children}
      </a>
    );
  },
}));
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => isDesktop.current,
  useMediaQuery: () => isDesktop.current,
}));
vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: setStatusFnMock,
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
vi.mock("@/shared/lib/user-facing-error", () => ({
  SAVE_FAILED_MESSAGE: "Couldn't save. Try again.",
  getUserFacingErrorMessage: () => "Couldn't save. Try again.",
}));
vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageUrl: () => "https://images.igdb.com/cover.jpg",
  buildCoverImageProps: () => ({
    src: "https://images.igdb.com/cover.jpg",
    srcSet: undefined,
  }),
}));

function playing(id: number, title: string): Playing {
  return {
    ...buildLibraryItemWithGame(
      { id, status: "PLAYING", platform: "PC" },
      { id: `game-${id}`, title, slug: title.toLowerCase() }
    ),
    lastSessionAt: null,
    becamePlayingAt: new Date(2026, 5, 1),
  };
}

function queued(position: number, title: string): Queued {
  return buildLibraryItemWithGame(
    { id: 100 + position, status: "WANT", upNextPosition: position },
    { id: `game-q${position}`, title, slug: title.toLowerCase() }
  );
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

const threePlayingAndQueue = makeData({
  playing: [playing(1, "Hades"), playing(2, "Celeste"), playing(3, "Tunic")],
  upNextQueue: [queued(1, "Disco"), queued(2, "Inside")],
  upNextTotal: 2,
  counts: { WANT: 6, PLAYING: 3, DONE: 4 },
});

const elements = {
  queryHomeTitle: () => screen.queryByRole("heading", { level: 1 }),
  getHomeTitle: () => screen.getByRole("heading", { level: 1 }),
  queryAddGame: () => screen.queryByRole("button", { name: "Add game" }),
  getAddGame: () => screen.getByRole("button", { name: "Add game" }),
  getQuestion: (text: string) => screen.getByRole("heading", { name: text }),
  getUpNext: () => screen.getByRole("region", { name: "Up Next" }),
  getAlsoPlaying: () => screen.getByRole("region", { name: "Also playing" }),
  queryAlsoPlaying: () =>
    screen.queryByRole("region", { name: "Also playing" }),
  getCounts: () => screen.getByTestId("dashboard-counts-line"),
  getEmptyStates: () => screen.queryAllByRole("status"),
};

function renderPage(data: DashboardPageData) {
  const view = render(
    <>
      <DashboardPage data={data} />
      <Toaster />
    </>
  );
  const reload = (next: DashboardPageData) =>
    view.rerender(
      <>
        <DashboardPage data={next} />
        <Toaster />
      </>
    );
  return { ...view, reload };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    invalidateMock.mockReset();
    setStatusFnMock.mockReset();
    isDesktop.current = false;
  });

  describe("given the phone layout", () => {
    beforeEach(() => {
      isDesktop.current = false;
      renderPage(threePlayingAndQueue);
    });

    it("has no Home title, so the question panel comes first", () => {
      expect(elements.queryHomeTitle()).toBeNull();
      expect(elements.getQuestion("Continue Hades?")).toBeVisible();
    });

    it("has no Add game button", () => {
      expect(elements.queryAddGame()).toBeNull();
    });
  });

  describe("given the desktop layout", () => {
    beforeEach(() => {
      isDesktop.current = true;
      renderPage(threePlayingAndQueue);
    });

    it("titles the screen Home", () => {
      expect(elements.getHomeTitle()).toHaveTextContent("Home");
    });

    it("offers Add game as an outline button", () => {
      expect(elements.getAddGame()).toHaveClass("border-border");
      expect(elements.getAddGame()).not.toHaveClass("bg-primary");
    });

    it("opens the add search from Add game", async () => {
      await userEvent.click(elements.getAddGame());
      const { search } = navigateMock.mock.calls[0][0];
      expect(search({})).toEqual({ action: "add-game", game: undefined });
    });
  });

  describe("given three Playing games and a queue", () => {
    beforeEach(() => {
      renderPage(threePlayingAndQueue);
    });

    it("stacks the question panel, the shelf, Also playing, then the counts", () => {
      const inPageOrder = [
        elements.getQuestion("Continue Hades?"),
        elements.getUpNext(),
        elements.getAlsoPlaying(),
        elements.getCounts(),
      ];
      const sortedByPosition = [...inPageOrder].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      );
      expect(sortedByPosition).toEqual(inPageOrder);
    });

    it("lists the Playing games after the first under Also playing", () => {
      const rows = within(elements.getAlsoPlaying()).getAllByRole("listitem");
      expect(
        rows.map((row) => within(row).getByRole("link").textContent)
      ).toEqual(["Celeste", "Tunic"]);
    });

    it("tells the status counts once, in one line", () => {
      expect(elements.getCounts()).toHaveTextContent(
        "13 games · 6 want · 3 playing · 4 done"
      );
    });

    it("shows no empty state", () => {
      expect(elements.getEmptyStates()).toHaveLength(0);
    });

    it("keeps Also playing the same after Not tonight", async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "Not tonight" })
      );
      expect(elements.getQuestion("Continue Celeste?")).toBeVisible();
      const rows = within(elements.getAlsoPlaying()).getAllByRole("listitem");
      expect(rows).toHaveLength(2);
      expect(within(rows[0]).getByRole("link")).toHaveTextContent("Celeste");
    });
  });

  describe("given one Playing game and a queued game", () => {
    it("shows no Also playing section", () => {
      renderPage(
        makeData({
          playing: [playing(1, "Hades")],
          upNextQueue: [queued(1, "Disco")],
          counts: { WANT: 1, PLAYING: 1, DONE: 0 },
        })
      );
      expect(elements.queryAlsoPlaying()).toBeNull();
    });

    describe("when the user skips to the queued game and taps Start playing", () => {
      it("lists the earlier Playing game under Also playing", async () => {
        const hades = playing(1, "Hades");
        const disco = playing(2, "Disco");
        const { reload } = renderPage(
          makeData({
            playing: [hades],
            upNextQueue: [queued(2, "Disco")],
            counts: { WANT: 1, PLAYING: 1, DONE: 0 },
          })
        );
        setStatusFnMock.mockResolvedValue({
          status: "PLAYING",
          upNextPosition: null,
          undo: { snapshot: {}, createdPlayId: null, closedPlayId: null },
        });
        invalidateMock.mockImplementationOnce(async () =>
          reload(
            makeData({
              playing: [disco, hades],
              counts: { WANT: 0, PLAYING: 2, DONE: 0 },
            })
          )
        );

        await userEvent.click(
          screen.getByRole("button", { name: "Not tonight" })
        );
        await userEvent.click(
          screen.getByRole("button", { name: "Start playing" })
        );

        await waitFor(() =>
          expect(
            within(elements.getAlsoPlaying()).getByText("Hades")
          ).toBeVisible()
        );
      });
    });
  });

  describe("given nothing is Playing and the queue has games", () => {
    beforeEach(() => {
      renderPage(
        makeData({
          upNextQueue: [queued(1, "Disco")],
          upNextTotal: 1,
          counts: { WANT: 1, PLAYING: 0, DONE: 0 },
        })
      );
    });

    it("shows Nothing playing right now with Pick from Up Next", () => {
      expect(elements.getEmptyStates()).toHaveLength(1);
      expect(screen.getByText("Nothing playing right now")).toBeVisible();
      expect(
        screen.getByRole("link", { name: "Pick from Up Next" })
      ).toHaveAttribute("href", "/library?status=UP_NEXT");
    });

    it("shows no Also playing section", () => {
      expect(elements.queryAlsoPlaying()).toBeNull();
    });
  });

  describe("given an empty library", () => {
    beforeEach(() => {
      renderPage(makeData());
    });

    it("shows Nothing playing right now with Add a game", async () => {
      expect(screen.getByText("Nothing playing right now")).toBeVisible();
      await userEvent.click(screen.getByRole("button", { name: "Add a game" }));
      const { search } = navigateMock.mock.calls[0][0];
      expect(search({})).toEqual({ action: "add-game", game: undefined });
    });

    it("explains the empty queue once, inside the Up Next section", () => {
      expect(screen.getAllByText(QUEUE_EMPTY_COPY)).toHaveLength(1);
      expect(
        within(elements.getUpNext()).getByText(QUEUE_EMPTY_COPY)
      ).toBeVisible();
    });

    it("shows no counts line", () => {
      expect(screen.queryByTestId("dashboard-counts-line")).toBeNull();
    });
  });
});
