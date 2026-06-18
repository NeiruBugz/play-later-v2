import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { JournalTimeline, type JournalTimelineEntry } from "./journal-timeline";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

function makeEntry(
  overrides?: Partial<JournalTimelineEntry>
): JournalTimelineEntry {
  const createdAt = overrides?.createdAt ?? new Date("2024-01-15T12:00:00Z");
  return {
    id: "entry-1",
    kind: "QUICK",
    title: null,
    content: "Default test content",
    createdAt,
    updatedAt: createdAt,
    game: {
      id: "game-1",
      title: "Test Game",
      slug: "test-game",
      coverImage: null,
    },
    ...overrides,
  };
}

const elements = {
  queryEmptyState: () => screen.queryByText("Nothing logged yet"),
  getEmptyState: () => screen.getByText("Nothing logged yet"),
  queryEntryContent: (text: string) => screen.queryByText(text),
  getEntryContent: (text: string) => screen.getByText(text),
  queryGameTitle: (title: string) => screen.queryByText(title),
  getGameTitle: (title: string) => screen.getByText(title),
  getAllEntries: () => screen.getAllByRole("article"),
  queryAllEntries: () => screen.queryAllByRole("article"),
  getTimeline: () => screen.getByRole("list", { hidden: true }),
  queryTimeline: () => screen.queryByRole("list", { hidden: true }),
  getGameHeading: (title: string) =>
    screen.getByRole("heading", { name: title }),
};

describe("JournalTimeline", () => {
  describe("given entries: []", () => {
    beforeEach(() => {
      render(<JournalTimeline entries={[]} />);
    });

    it("renders the empty-state message", () => {
      expect(elements.getEmptyState()).toBeDefined();
    });

    it("renders no entry articles", () => {
      expect(elements.queryAllEntries()).toHaveLength(0);
    });
  });

  describe("given a single entry with a game attached", () => {
    const entry = makeEntry({
      id: "entry-single",
      content: "Played through the opening act tonight.",
      game: {
        id: "game-abc",
        title: "Hollow Knight",
        slug: "hollow-knight",
        coverImage: null,
      },
    });

    beforeEach(() => {
      render(<JournalTimeline entries={[entry]} />);
    });

    it("renders the entry content text", () => {
      expect(
        elements.getEntryContent("Played through the opening act tonight.")
      ).toBeDefined();
    });

    it("renders the game title as a card heading", () => {
      expect(elements.getGameHeading("Hollow Knight")).toBeDefined();
    });

    it("does not render the empty-state message", () => {
      expect(elements.queryEmptyState()).toBeNull();
    });
  });

  describe("given three entries", () => {
    const entries = [
      makeEntry({ id: "e1", content: "First session notes." }),
      makeEntry({ id: "e2", content: "Second session notes." }),
      makeEntry({ id: "e3", content: "Third session notes." }),
    ];

    beforeEach(() => {
      render(<JournalTimeline entries={entries} />);
    });

    it("renders all three entry articles", () => {
      expect(elements.getAllEntries()).toHaveLength(3);
    });
  });

  describe("given entries of mixed kinds (QUICK and REFLECTION)", () => {
    const entries = [
      makeEntry({
        id: "e-quick",
        kind: "QUICK",
        content: "Quick note content.",
      }),
      makeEntry({
        id: "e-reflection",
        kind: "REFLECTION",
        content: "Long-form reflection content.",
      }),
    ];

    beforeEach(() => {
      render(<JournalTimeline entries={entries} />);
    });

    it("renders the QUICK entry", () => {
      expect(elements.getEntryContent("Quick note content.")).toBeDefined();
    });

    it("renders the REFLECTION entry", () => {
      expect(
        elements.getEntryContent("Long-form reflection content.")
      ).toBeDefined();
    });

    it("renders both entries — neither kind is filtered out", () => {
      expect(elements.getAllEntries()).toHaveLength(2);
    });
  });

  describe("given an entry with game: null", () => {
    const entry = makeEntry({
      id: "entry-no-game",
      content: "Gaming thought without a linked game.",
      game: null,
    });

    beforeEach(() => {
      render(<JournalTimeline entries={[entry]} />);
    });

    it("renders without crashing", () => {
      expect(
        elements.getEntryContent("Gaming thought without a linked game.")
      ).toBeDefined();
    });

    it("does not render a broken image element for the missing cover", () => {
      const imgs = screen.queryAllByRole("img");
      for (const img of imgs) {
        expect(img).toHaveAttribute("src");
        expect((img as HTMLImageElement).src).toBeTruthy();
      }
    });
  });

  describe("given entries with the aria-label on the timeline container", () => {
    const entry = makeEntry({ id: "aria-test" });

    beforeEach(() => {
      render(<JournalTimeline entries={[entry]} />);
    });

    it("has aria-label Journal timeline on the container", () => {
      expect(
        screen.getByRole("list", { name: "Journal timeline" })
      ).toBeDefined();
    });
  });
});
