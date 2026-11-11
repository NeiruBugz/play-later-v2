import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildLibraryItem } from "../../../../../test/factories/builders.ts";
import type { GameNote } from "../game-notes-list";
import { YourPlayCard } from "./your-play-card";
import type { YourPlayCardProps } from "./your-play-card.type";

const navigateMock = vi.fn();
const eveningMinutesMock = vi.hoisted(() => vi.fn(() => 105));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
  useNavigate: () => navigateMock,
  Link: ({ to, params, children, ...rest }: any) => (
    <a href={to.replace("$id", params?.id)} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/entities/session/model", () => ({
  useEveningMinutes: eveningMinutesMock,
}));
vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));
vi.mock("@/features/library-prompts/api/answer-prompt-fn", () => ({
  answerPromptFn: vi.fn(),
}));
vi.mock("@/features/library-prompts/api/dismiss-prompt-fn", () => ({
  dismissPromptFn: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const makeNote = (id: string, content: string, day: number): GameNote => ({
  id,
  content,
  playedMinutes: null,
  createdAt: new Date(`2024-03-0${day}T12:00:00Z`),
});

const fiveNotes: GameNote[] = [
  makeNote("n3", "Third note", 3),
  makeNote("n1", "First note", 1),
  makeNote("n5", "Fifth note", 5),
  makeNote("n2", "Second note", 2),
  makeNote("n4", "Fourth note", 4),
];

function renderCard(overrides: Partial<YourPlayCardProps> = {}) {
  return render(
    <YourPlayCard
      entry={buildLibraryItem({ id: 42, status: "PLAYING", rating: null })}
      gameTitle="Hollow Knight"
      gameSlug="hollow-knight"
      prompts={{ why: false, stayed: false }}
      notes={[]}
      history={[]}
      playtimeTotalMinutes={0}
      playtimeSessionCount={0}
      {...overrides}
    />
  );
}

const elements = {
  getTitle: () => screen.getByRole("heading", { name: "Your play" }),
  getNewNote: () => screen.getByRole("button", { name: "New note" }),
  queryAllNotes: () => screen.queryByRole("button", { name: /^All notes/ }),
  getAllNotes: (count: number) =>
    screen.getByRole("button", { name: `All notes (${count})` }),
  getNoteLinks: () => screen.queryAllByRole("link"),
  queryWhyQuestion: () =>
    screen.queryByLabelText("Why do you want to play this?"),
  queryHistoryToggle: () => screen.queryByRole("button", { name: "History" }),
  queryRatingSlider: (name: string) => screen.queryByRole("slider", { name }),
};

const actions = {
  openNewNote: () => userEvent.click(elements.getNewNote()),
  expandNotes: (count: number) => userEvent.click(elements.getAllNotes(count)),
};

describe("YourPlayCard", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    eveningMinutesMock.mockReturnValue(105);
  });

  describe("given 3 sessions totalling 4.5 hours", () => {
    beforeEach(() => {
      renderCard({ playtimeTotalMinutes: 270, playtimeSessionCount: 3 });
    });

    it("reads the session count and time played", () => {
      expect(screen.getByText("3 sessions · 4.5 h")).toBeInTheDocument();
    });

    it("never says there are no sessions", () => {
      expect(screen.queryByText("No sessions yet")).toBeNull();
    });
  });

  describe("given a single 2 hour session", () => {
    beforeEach(() => {
      renderCard({ playtimeTotalMinutes: 120, playtimeSessionCount: 1 });
    });

    it("uses the singular", () => {
      expect(screen.getByText("1 session · 2 h")).toBeInTheDocument();
    });
  });

  describe("given no sessions", () => {
    beforeEach(() => {
      renderCard({ playtimeTotalMinutes: 0, playtimeSessionCount: 0 });
    });

    it("reads No sessions yet", () => {
      expect(screen.getByText("No sessions yet")).toBeInTheDocument();
    });

    it("shows no zero hours anywhere", () => {
      expect(document.body).not.toHaveTextContent("0 h");
    });
  });

  describe("given the evening setting is 3 hours", () => {
    beforeEach(() => {
      eveningMinutesMock.mockReturnValue(180);
      renderCard({ playtimeTotalMinutes: 270, playtimeSessionCount: 3 });
    });

    it("still reads time played as 4.5 h", () => {
      expect(screen.getByText("3 sessions · 4.5 h")).toBeInTheDocument();
    });
  });

  describe("given a game rated 7", () => {
    beforeEach(() => {
      renderCard({ entry: buildLibraryItem({ id: 42, rating: 7 }) });
    });

    it("shows three and a half stars the user can change", () => {
      expect(elements.queryRatingSlider("Rated 3.5 of 5")).not.toBeNull();
    });
  });

  describe("when the user taps New note", () => {
    beforeEach(async () => {
      renderCard();
      await actions.openNewNote();
    });

    it("opens the Log sheet for this game", () => {
      const { search } = navigateMock.mock.calls[0]![0];
      expect(search({})).toMatchObject({
        action: "log-session",
        game: "hollow-knight",
      });
    });
  });

  describe("given 5 notes", () => {
    beforeEach(() => {
      renderCard({ notes: fiveNotes });
    });

    it("shows only the two newest, with their dates", () => {
      const links = elements.getNoteLinks();
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent("Mar 05, 2024");
      expect(links[0]).toHaveTextContent("Fifth note");
      expect(links[1]).toHaveTextContent("Mar 04, 2024");
      expect(links[1]).toHaveTextContent("Fourth note");
    });

    it("offers All notes (5)", () => {
      expect(elements.getAllNotes(5)).toBeInTheDocument();
    });

    describe("when the user taps All notes (5)", () => {
      beforeEach(async () => {
        await actions.expandNotes(5);
      });

      it("shows all five in the card, newest first", () => {
        expect(elements.getNoteLinks().map((link) => link.textContent)).toEqual(
          [
            expect.stringContaining("Fifth note"),
            expect.stringContaining("Fourth note"),
            expect.stringContaining("Third note"),
            expect.stringContaining("Second note"),
            expect.stringContaining("First note"),
          ]
        );
      });
    });
  });

  describe("given 2 notes", () => {
    beforeEach(() => {
      renderCard({ notes: fiveNotes.slice(0, 2) });
    });

    it("shows both and no All notes link", () => {
      expect(elements.getNoteLinks()).toHaveLength(2);
      expect(elements.queryAllNotes()).toBeNull();
    });
  });

  describe("given a Want game with the why question on offer", () => {
    beforeEach(() => {
      renderCard({
        entry: buildLibraryItem({ id: 42, status: "WANT" }),
        prompts: { why: true, stayed: false },
      });
    });

    it("asks Why do you want to play this? with a text field", () => {
      expect(elements.queryWhyQuestion()).toBeInTheDocument();
    });
  });

  describe("given a Playing game", () => {
    beforeEach(() => {
      renderCard({
        entry: buildLibraryItem({ id: 42, status: "PLAYING" }),
        prompts: { why: true, stayed: true },
      });
    });

    it("shows no question", () => {
      expect(screen.queryByRole("textbox")).toBeNull();
    });
  });

  describe("given ended plays", () => {
    beforeEach(() => {
      renderCard({
        history: [
          {
            id: "play-1",
            startedAt: new Date(2024, 0, 5),
            finishedAt: new Date(2024, 0, 19),
          },
        ],
      });
    });

    it("offers a collapsed History", () => {
      expect(elements.queryHistoryToggle()).toHaveAttribute(
        "aria-expanded",
        "false"
      );
    });
  });

  describe("given no ended plays", () => {
    beforeEach(() => {
      renderCard({ history: [] });
    });

    it("shows no History", () => {
      expect(elements.queryHistoryToggle()).toBeNull();
    });
  });

  describe("the card title", () => {
    beforeEach(() => {
      renderCard();
    });

    it("reads Your play", () => {
      expect(elements.getTitle()).toBeInTheDocument();
    });
  });
});
