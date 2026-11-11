import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardPageData } from "@/features/dashboard";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
import { ContinuePanel } from "./continue-panel";

type Playing = DashboardPageData["playing"][number];
type Queued = DashboardPageData["upNextQueue"][number];
type Lists = { playing: Playing[]; upNextQueue: Queued[] };

const { setStatusFnMock, undoStatusFnMock, invalidateMock, navigateMock } =
  vi.hoisted(() => ({
    setStatusFnMock: vi.fn(),
    undoStatusFnMock: vi.fn(),
    invalidateMock: vi.fn(),
    navigateMock: vi.fn(),
  }));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
  useNavigate: () => navigateMock,
  Link: ({ to, children, ...rest }: { to?: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: setStatusFnMock,
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: undoStatusFnMock,
}));
vi.mock("@/entities/session/model", () => ({
  useEveningMinutes: () => 105,
}));
vi.mock("@/shared/lib/user-facing-error", () => ({
  SAVE_FAILED_MESSAGE: "Couldn't save. Try again.",
  getUserFacingErrorMessage: () => "Couldn't save. Try again.",
}));

const NOW = new Date(2026, 5, 15, 12, 0, 0);
const daysAgo = (days: number) => new Date(2026, 5, 15 - days, 9, 0, 0);
const EIGHTEEN_EVENINGS_SECONDS = 18 * 105 * 60;
const UNDO_PAYLOAD = { snapshot: {}, createdPlayId: null, closedPlayId: null };

function playing(
  id: number,
  title: string,
  opts: {
    lastSessionDaysAgo?: number;
    becamePlayingDaysAgo?: number;
    platform?: string | null;
  } = {}
): Playing {
  const { lastSessionDaysAgo, becamePlayingDaysAgo = 100 } = opts;
  return {
    ...buildLibraryItemWithGame(
      {
        id,
        status: "PLAYING",
        platform: opts.platform === undefined ? "PC" : opts.platform,
      },
      { id: `game-${id}`, title, slug: title.toLowerCase() }
    ),
    lastSessionAt:
      lastSessionDaysAgo === undefined ? null : daysAgo(lastSessionDaysAgo),
    becamePlayingAt: daysAgo(becamePlayingDaysAgo),
  };
}

function queued(
  id: number,
  title: string,
  opts: {
    status?: "WANT" | "DONE";
    platform?: string | null;
    withLength?: boolean;
  } = {}
): Queued {
  const item = buildLibraryItemWithGame(
    {
      id,
      status: opts.status ?? "WANT",
      upNextPosition: id,
      platform: opts.platform === undefined ? "PS5" : opts.platform,
    },
    { id: `game-${id}`, title, slug: title.toLowerCase() }
  );
  return {
    ...item,
    game: {
      ...item.game,
      coverHue: 140,
      coverChroma: 0.08,
      timeToCreditsSeconds: opts.withLength ? EIGHTEEN_EVENINGS_SECONDS : null,
    },
  };
}

const threeGames: Lists = {
  playing: [
    playing(1, "Hades", { lastSessionDaysAgo: 3, platform: "PC" }),
    playing(2, "Celeste", { lastSessionDaysAgo: 14 }),
    playing(3, "Tunic", { lastSessionDaysAgo: 40 }),
  ],
  upNextQueue: [queued(10, "Disco Elysium", { withLength: true })],
};

const elements = {
  getQuestion: (text: string) => screen.getByRole("heading", { name: text }),
  queryQuestion: (text: string) =>
    screen.queryByRole("heading", { name: text }),
  getButton: (name: string) => screen.getByRole("button", { name }),
  queryButton: (name: string) => screen.queryByRole("button", { name }),
  getText: (text: string) => screen.getByText(text),
  queryText: (text: string) => screen.queryByText(text),
  getContextLine: () => screen.getByTestId("continue-panel-context"),
  // eslint-disable-next-line testing-library/no-node-access -- CoverTint exposes only data-tint
  getTint: () => document.querySelector("[data-tint]"),
};

const actions = {
  notTonight: () => userEvent.click(elements.getButton("Not tonight")),
  askMeAgain: () => userEvent.click(elements.getButton("Ask me again")),
  logTime: () => userEvent.click(elements.getButton("Log time")),
  startPlaying: () => userEvent.click(elements.getButton("Start playing")),
  undo: async () =>
    userEvent.click(await screen.findByRole("button", { name: "Undo" })),
};

function renderPanel(lists: Lists) {
  const view = render(
    <>
      <ContinuePanel {...lists} />
      <Toaster />
    </>
  );
  const reload = (next: Lists) =>
    view.rerender(
      <>
        <ContinuePanel {...next} />
        <Toaster />
      </>
    );
  return { ...view, reload };
}

describe("ContinuePanel", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    invalidateMock.mockReset();
    navigateMock.mockReset();
    setStatusFnMock.mockReset();
    undoStatusFnMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given three Playing games and a queued game", () => {
    beforeEach(() => {
      renderPanel(threeGames);
    });

    it("asks to continue the most recently played game with its last session and platform", () => {
      expect(elements.getQuestion("Continue Hades?")).toBeVisible();
      expect(elements.getText("Last session 3 days ago")).toBeVisible();
      expect(elements.getContextLine()).toHaveTextContent(
        "Last session 3 days ago"
      );
      expect(elements.getContextLine()).toHaveTextContent("PC");
    });

    it("offers Log time and Not tonight", () => {
      expect(elements.getButton("Log time")).toBeVisible();
      expect(elements.getButton("Not tonight")).toBeVisible();
    });

    it("tints the panel", () => {
      expect(elements.getTint()).toHaveAttribute("data-tint", "on");
    });

    describe("when the user taps Not tonight twice", () => {
      it("steps to 2 weeks ago, then a month ago", async () => {
        await actions.notTonight();
        expect(elements.getQuestion("Continue Celeste?")).toBeVisible();
        expect(elements.getText("Last session 2 weeks ago")).toBeVisible();

        await actions.notTonight();
        expect(elements.getQuestion("Continue Tunic?")).toBeVisible();
        expect(elements.getText("Last session a month ago")).toBeVisible();
      });
    });

    describe("when the user taps Not tonight three times", () => {
      beforeEach(async () => {
        await actions.notTonight();
        await actions.notTonight();
        await actions.notTonight();
      });

      it("asks to start the first Up Next game with its place and length", () => {
        expect(elements.getQuestion("Start Disco Elysium?")).toBeVisible();
        expect(elements.getText("First in Up Next")).toBeVisible();
        expect(elements.getText("About 18 evenings")).toBeVisible();
        expect(elements.getButton("Start playing")).toBeVisible();
      });

      describe("and once more", () => {
        beforeEach(async () => {
          await actions.notTonight();
        });

        it("rests, with no tint and no Not tonight", () => {
          expect(
            elements.getText("Nothing tonight is fine too.")
          ).toBeVisible();
          expect(
            elements.getText("Your games will be here when you come back.")
          ).toBeVisible();
          expect(elements.getTint()).toHaveAttribute("data-tint", "off");
          expect(elements.queryButton("Not tonight")).toBeNull();
        });

        it("returns to the first game on Ask me again", async () => {
          await actions.askMeAgain();

          expect(elements.getQuestion("Continue Hades?")).toBeVisible();
          expect(elements.getText("Last session 3 days ago")).toBeVisible();
        });
      });
    });

    describe("when the user taps Log time", () => {
      it("opens the Log sheet for that game", async () => {
        await actions.logTime();

        expect(navigateMock).toHaveBeenCalledTimes(1);
        const { search } = navigateMock.mock.calls[0][0] as {
          search: (prev: Record<string, unknown>) => Record<string, unknown>;
        };
        expect(search({})).toMatchObject({
          action: "log-session",
          game: "hades",
        });
      });
    });
  });

  describe("given the user skipped to the second game and logged time on it", () => {
    it("keeps asking about it after the data reloads, reading Last session today", async () => {
      const { reload } = renderPanel(threeGames);
      await actions.notTonight();
      await actions.logTime();

      reload({
        playing: [
          playing(2, "Celeste", { lastSessionDaysAgo: 0 }),
          threeGames.playing[0],
          threeGames.playing[2],
        ],
        upNextQueue: threeGames.upNextQueue,
      });

      expect(elements.getQuestion("Continue Celeste?")).toBeVisible();
      expect(elements.getText("Last session today")).toBeVisible();
    });
  });

  describe("given the Log sheet was closed without saving", () => {
    it("leaves the question unchanged", async () => {
      const { reload } = renderPanel(threeGames);
      await actions.logTime();

      reload(threeGames);

      expect(elements.getQuestion("Continue Hades?")).toBeVisible();
      expect(elements.getText("Last session 3 days ago")).toBeVisible();
    });
  });

  describe("given a Playing game that never had a session", () => {
    it("says when it was started", () => {
      renderPanel({
        playing: [playing(1, "Hades", { becamePlayingDaysAgo: 15 })],
        upNextQueue: [],
      });

      expect(elements.getText("Started playing 2 weeks ago")).toBeVisible();
    });
  });

  describe("given nothing is Playing and a Want game is first in Up Next", () => {
    const wantLists: Lists = {
      playing: [],
      upNextQueue: [queued(10, "Disco Elysium", { withLength: true })],
    };
    const startedLists: Lists = {
      playing: [playing(10, "Disco Elysium", { becamePlayingDaysAgo: 0 })],
      upNextQueue: [],
    };
    let reload: (next: Lists) => void;

    beforeEach(() => {
      reload = renderPanel(wantLists).reload;
    });

    it("asks to start it", () => {
      expect(elements.getQuestion("Start Disco Elysium?")).toBeVisible();
    });

    describe("when the user taps Start playing", () => {
      beforeEach(async () => {
        setStatusFnMock.mockResolvedValue({
          status: "PLAYING",
          upNextPosition: null,
          undo: UNDO_PAYLOAD,
        });
        undoStatusFnMock.mockResolvedValue({
          status: "WANT",
          upNextPosition: 10,
          queueRestored: true,
        });
        invalidateMock.mockImplementationOnce(async () => reload(startedLists));
        invalidateMock.mockImplementationOnce(async () => reload(wantLists));

        await actions.startPlaying();
      });

      it("asks to continue it, started today", async () => {
        await waitFor(() =>
          expect(elements.getQuestion("Continue Disco Elysium?")).toBeVisible()
        );
        expect(elements.getText("Started playing today")).toBeVisible();
      });

      it("brings the start question back when the user taps Undo", async () => {
        await actions.undo();

        await waitFor(() =>
          expect(elements.getQuestion("Start Disco Elysium?")).toBeVisible()
        );
      });
    });
  });

  describe("given a Done game first in Up Next and nothing Playing", () => {
    beforeEach(() => {
      renderPanel({
        playing: [],
        upNextQueue: [queued(11, "Journey", { status: "DONE" })],
      });
    });

    it("asks to play it again", () => {
      expect(elements.getQuestion("Play Journey again?")).toBeVisible();
      expect(elements.getButton("Play again")).toBeVisible();
      expect(elements.queryButton("Start playing")).toBeNull();
    });
  });

  describe("given a game with no recorded platform", () => {
    it("shows the session line without a stray separator", () => {
      renderPanel({
        playing: [
          playing(1, "Hades", { lastSessionDaysAgo: 3, platform: null }),
        ],
        upNextQueue: [],
      });

      expect(elements.getContextLine().textContent?.trim()).toBe(
        "Last session 3 days ago"
      );
    });

    it("shows the Up Next line without a stray separator", () => {
      renderPanel({
        playing: [],
        upNextQueue: [queued(10, "Disco Elysium", { platform: null })],
      });

      expect(elements.getContextLine().textContent?.trim()).toBe(
        "First in Up Next"
      );
    });
  });

  describe("given no Playing games and an empty Up Next", () => {
    it("renders no panel", () => {
      const { container } = renderPanel({ playing: [], upNextQueue: [] });

      expect(within(container).queryByRole("heading")).toBeNull();
      expect(elements.queryButton("Not tonight")).toBeNull();
      expect(elements.queryButton("Ask me again")).toBeNull();
    });
  });
});
