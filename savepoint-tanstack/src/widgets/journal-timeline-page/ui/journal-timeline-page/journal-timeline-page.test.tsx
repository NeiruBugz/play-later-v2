import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JournalTimelineEntry } from "@/widgets/journal-timeline";

import { JournalTimelinePage } from "./journal-timeline-page";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  Link: ({ to, children, ...rest }: any) => {
    delete rest.params;
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    );
  },
}));

const gameOptions = [
  { id: "game-1", title: "Hollow Knight" },
  { id: "game-2", title: "Celeste" },
];

function makeEntry(
  overrides?: Partial<JournalTimelineEntry>
): JournalTimelineEntry {
  return {
    id: "entry-1",
    content: "Tonight's session went well.",
    playedMinutes: null,
    createdAt: new Date("2024-01-15T12:00:00Z"),
    game: {
      id: "game-1",
      title: "Hollow Knight",
      slug: "hollow-knight",
      coverImage: null,
    },
    ...overrides,
  };
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function renderPage(
  entries: JournalTimelineEntry[],
  selectedGame?: string | undefined
) {
  render(
    <JournalTimelinePage
      entries={entries}
      gameOptions={gameOptions}
      selectedGame={selectedGame}
    />
  );
}

function searchAfter(callIndex = 0): Record<string, unknown> {
  const { search } = navigateMock.mock.calls[callIndex][0] as {
    search: (prev: Record<string, unknown>) => Record<string, unknown>;
  };
  return search({});
}

const elements = {
  getNewNoteButton: () => screen.getByRole("button", { name: "New note" }),
  getEntryOpener: (date: string) =>
    screen.getByRole("button", { name: `Open note from ${date}` }),
  getFilter: () =>
    screen.getByRole("combobox", { name: "Filter by game", hidden: true }),
  getFilterOption: (name: string) =>
    screen.getByRole("option", { name, hidden: true }),
};

const actions = {
  pickFilter: async (name: string) => {
    await userEvent.click(elements.getFilter());
    await userEvent.click(elements.getFilterOption(name));
  },
};

describe("JournalTimelinePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an empty timeline", () => {
    beforeEach(() => {
      renderPage([]);
    });

    it("shows 0 notes", () => {
      expect(screen.getByText("0 notes")).toBeDefined();
    });
  });

  describe("given one note", () => {
    beforeEach(() => {
      renderPage([makeEntry()]);
    });

    it("shows 1 note (singular)", () => {
      expect(screen.getByText("1 note")).toBeDefined();
    });
  });

  describe("given the user taps New note", () => {
    beforeEach(async () => {
      renderPage([makeEntry()]);
      await userEvent.click(elements.getNewNoteButton());
    });

    it("opens the Log form instead of staying on the list", () => {
      expect(searchAfter()).toMatchObject({ action: "log-session" });
    });
  });

  describe("given the user taps a note", () => {
    const entry = makeEntry({ id: "entry-card-click" });

    beforeEach(async () => {
      renderPage([entry]);
      await userEvent.click(
        elements.getEntryOpener(formatDate(entry.createdAt))
      );
    });

    it("navigates to the note view", () => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/journal/$id",
        params: { id: "entry-card-click" },
      });
    });
  });

  describe("given the Journal filter", () => {
    beforeEach(() => {
      renderPage([makeEntry()]);
    });

    it("filters to a game when it is picked", async () => {
      await actions.pickFilter("Celeste");
      expect(searchAfter()).toMatchObject({ gameId: "game-2" });
    });

    it("filters to notes without a game when No game is picked", async () => {
      await actions.pickFilter("No game");
      expect(searchAfter()).toMatchObject({ gameId: "none" });
    });
  });

  describe("given a game is already selected and All is picked", () => {
    beforeEach(async () => {
      renderPage([makeEntry()], "game-1");
      await actions.pickFilter("All");
    });

    it("clears the filter", () => {
      expect(searchAfter().gameId).toBeUndefined();
    });
  });

  describe("given the notes the loader returned for a game", () => {
    beforeEach(() => {
      renderPage(
        [
          makeEntry({ id: "a", content: "Beat the first boss." }),
          makeEntry({ id: "b", content: "Found the map." }),
        ],
        "game-1"
      );
    });

    it("lists those notes and shows the game as selected", () => {
      expect(screen.getByText("Beat the first boss.")).toBeDefined();
      expect(screen.getByText("Found the map.")).toBeDefined();
      expect(elements.getFilter()).toHaveTextContent("Hollow Knight");
    });
  });

  describe("given the No game filter is selected", () => {
    beforeEach(() => {
      renderPage(
        [makeEntry({ id: "c", content: "One big RPG at a time.", game: null })],
        "none"
      );
    });

    it("lists the note without a game and shows No game as selected", () => {
      expect(screen.getByText("One big RPG at a time.")).toBeDefined();
      expect(elements.getFilter()).toHaveTextContent("No game");
    });
  });

  describe("given notes", () => {
    beforeEach(() => {
      renderPage([makeEntry({ id: "e1" }), makeEntry({ id: "e2" })]);
    });

    it("renders the stats rail with a Log time button", () => {
      expect(
        screen.getByRole("complementary", { name: "Journaling stats" })
      ).toBeDefined();
      expect(screen.getByRole("button", { name: "Log time" })).toBeDefined();
    });
  });
});
