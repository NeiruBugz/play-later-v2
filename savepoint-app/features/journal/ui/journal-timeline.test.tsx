import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen } from "@testing-library/react";
import React from "react";

import { JournalVisibility } from "@/shared/types";

import { JournalTimeline } from "./journal-timeline";

vi.mock("@/widgets/game-card", () => ({
  GameCardCover: ({ gameTitle }: { gameTitle: string }) => (
    <div data-testid={`cover-${gameTitle}`} aria-label={gameTitle} />
  ),
}));

vi.mock("../server-actions/get-journal-entries", () => ({
  getJournalEntriesAction: vi.fn(),
}));

vi.mock("../server-actions/get-games-by-ids", () => ({
  getGamesByIdsAction: vi.fn(),
}));

vi.mock("./journal-entry-card", () => ({
  JournalEntryCard: ({
    entry,
    game,
  }: {
    entry: { id: string };
    game: { title: string };
  }) => (
    <div data-testid={`entry-${entry.id}`} data-game={game.title}>
      entry
    </div>
  ),
}));

function makeEntry(overrides: { id: string; gameId: string; createdAt: Date }) {
  return {
    id: overrides.id,
    userId: "user-1",
    gameId: overrides.gameId,
    libraryItemId: null,
    kind: "REFLECTION" as const,
    title: `Entry ${overrides.id}`,
    content: "Some content",
    playedMinutes: null,
    tags: [],
    mood: null,
    playSession: null,
    visibility: JournalVisibility.PRIVATE,
    createdAt: overrides.createdAt,
    updatedAt: overrides.createdAt,
    publishedAt: null,
  };
}

const game1 = {
  id: "game-1",
  title: "Hollow Knight",
  slug: "hollow-knight",
  coverImage: null,
};

const game2 = {
  id: "game-2",
  title: "Celeste",
  slug: "celeste",
  coverImage: null,
};

const initialGames = {
  "game-1": game1,
  "game-2": game2,
};

describe("JournalTimeline — empty state", () => {
  it("renders nothing-logged copy when entries is empty", () => {
    renderWithTestProviders(
      <JournalTimeline initialEntries={[]} initialGames={{}} />
    );
    expect(screen.getByText("Nothing logged yet")).toBeInTheDocument();
  });

  it("shows log-a-session button in empty state", () => {
    renderWithTestProviders(
      <JournalTimeline initialEntries={[]} initialGames={{}} />
    );
    expect(
      screen.getByRole("link", { name: /log a session/i })
    ).toBeInTheDocument();
  });
});

describe("JournalTimeline — populated state groups by game", () => {
  const entry1 = makeEntry({
    id: "e1",
    gameId: "game-1",
    createdAt: new Date("2024-03-15T10:00:00Z"),
  });
  const entry2 = makeEntry({
    id: "e2",
    gameId: "game-1",
    createdAt: new Date("2024-03-10T10:00:00Z"),
  });
  const entry3 = makeEntry({
    id: "e3",
    gameId: "game-2",
    createdAt: new Date("2024-03-20T10:00:00Z"),
  });

  it("groups two entries for the same game under one header", () => {
    renderWithTestProviders(
      <JournalTimeline
        initialEntries={[entry1, entry2]}
        initialGames={initialGames}
      />
    );

    expect(screen.getAllByText("Hollow Knight")).toHaveLength(1);
    expect(screen.getByTestId("entry-e1")).toBeInTheDocument();
    expect(screen.getByTestId("entry-e2")).toBeInTheDocument();
  });

  it("renders separate headers for different games", () => {
    renderWithTestProviders(
      <JournalTimeline
        initialEntries={[entry1, entry3]}
        initialGames={initialGames}
      />
    );

    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    expect(screen.getByText("Celeste")).toBeInTheDocument();
  });

  it("shows correct entry count per group", () => {
    renderWithTestProviders(
      <JournalTimeline
        initialEntries={[entry1, entry2]}
        initialGames={initialGames}
      />
    );

    expect(screen.getByText("2 entries")).toBeInTheDocument();
  });

  it("shows '1 entry' singular label for a single-entry group", () => {
    renderWithTestProviders(
      <JournalTimeline initialEntries={[entry1]} initialGames={initialGames} />
    );

    expect(screen.getByText("1 entry")).toBeInTheDocument();
  });

  it("orders groups by most-recent entry first", () => {
    renderWithTestProviders(
      <JournalTimeline
        initialEntries={[entry1, entry2, entry3]}
        initialGames={initialGames}
      />
    );

    const headers = screen.getAllByRole("heading", { level: 2 });
    const groupHeaders = headers.filter(
      (h) => h.textContent === "Celeste" || h.textContent === "Hollow Knight"
    );
    expect(groupHeaders[0]).toHaveTextContent("Celeste");
    expect(groupHeaders[1]).toHaveTextContent("Hollow Knight");
  });

  it("sorts entries within a group by createdAt descending", () => {
    renderWithTestProviders(
      <JournalTimeline
        initialEntries={[entry2, entry1]}
        initialGames={initialGames}
      />
    );

    const allEntries = screen.getAllByTestId(/^entry-/);
    const ids = allEntries.map((el) => el.getAttribute("data-testid"));
    expect(ids.indexOf("entry-e1")).toBeLessThan(ids.indexOf("entry-e2"));
  });

  it("group header links to /games/<slug>", () => {
    renderWithTestProviders(
      <JournalTimeline initialEntries={[entry1]} initialGames={initialGames} />
    );

    const link = screen.getByRole("link", { name: /hollow knight/i });
    expect(link).toHaveAttribute("href", "/games/hollow-knight");
  });

  it("skips entries with null gameId", () => {
    const noGameEntry = makeEntry({
      id: "e-nogame",
      gameId: null as unknown as string,
      createdAt: new Date("2024-03-15T10:00:00Z"),
    });
    renderWithTestProviders(
      <JournalTimeline
        initialEntries={[entry1, noGameEntry]}
        initialGames={initialGames}
      />
    );

    expect(screen.queryByTestId("entry-e-nogame")).not.toBeInTheDocument();
    expect(screen.getByTestId("entry-e1")).toBeInTheDocument();
  });
});
