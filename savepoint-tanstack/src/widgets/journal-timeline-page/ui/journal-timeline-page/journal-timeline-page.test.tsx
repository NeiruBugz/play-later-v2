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

function makeEntry(
  overrides?: Partial<JournalTimelineEntry>
): JournalTimelineEntry {
  const createdAt = overrides?.createdAt ?? new Date("2024-01-15T12:00:00Z");
  return {
    id: "entry-1",
    kind: "QUICK",
    title: null,
    content: "Tonight's session went well.",
    createdAt,
    updatedAt: createdAt,
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

const elements = {
  getComposeLink: () => screen.getByRole("link", { name: "Compose entry" }),
  getEntryOpener: (date: string) =>
    screen.getByRole("button", { name: `Open journal entry from ${date}` }),
  getSubtitle: () => screen.getByText(/Reflect, don't review\./),
  querySubtitle: () => screen.queryByText(/Reflect, don't review\./),
};

const actions = {
  clickEntryCard: async (date: string) =>
    userEvent.click(elements.getEntryOpener(date)),
};

describe("JournalTimelinePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an empty timeline", () => {
    beforeEach(() => {
      render(<JournalTimelinePage entries={[]} />);
    });

    it("renders a Compose entry link to the /journal/new page", () => {
      expect(elements.getComposeLink()).toHaveAttribute("href", "/journal/new");
    });

    it("renders the subtitle with 0 entries", () => {
      expect(
        screen.getByText(
          "Reflect, don't review. 0 entries across your library."
        )
      ).toBeDefined();
    });
  });

  describe("given a timeline with one entry", () => {
    beforeEach(() => {
      render(<JournalTimelinePage entries={[makeEntry()]} />);
    });

    it("renders the subtitle with 1 entry (singular)", () => {
      expect(
        screen.getByText("Reflect, don't review. 1 entry across your library.")
      ).toBeDefined();
    });
  });

  describe("given a timeline with two entries", () => {
    beforeEach(() => {
      render(
        <JournalTimelinePage
          entries={[makeEntry({ id: "e1" }), makeEntry({ id: "e2" })]}
        />
      );
    });

    it("renders the subtitle with the correct count", () => {
      expect(
        screen.getByText(
          "Reflect, don't review. 2 entries across your library."
        )
      ).toBeDefined();
    });
  });

  describe("given a timeline with one entry and the user clicks the card", () => {
    const entry = makeEntry({
      id: "entry-card-click",
      content: "Reached the second area.",
    });

    beforeEach(async () => {
      render(<JournalTimelinePage entries={[entry]} />);
      await actions.clickEntryCard(formatDate(entry.updatedAt));
    });

    it("navigates to the entry detail page", () => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/journal/$id",
        params: { id: "entry-card-click" },
      });
    });
  });

  describe("given multiple entries", () => {
    const entries = [
      makeEntry({ id: "e1", content: "First session." }),
      makeEntry({
        id: "e2",
        content: "Second session.",
        game: {
          id: "game-2",
          title: "Celeste",
          slug: "celeste",
          coverImage: null,
        },
      }),
    ];

    beforeEach(() => {
      render(<JournalTimelinePage entries={entries} />);
    });

    it("renders the stats rail in the DOM", () => {
      const rail = screen.getByRole("complementary", {
        name: "Journaling stats",
      });
      expect(rail).toBeDefined();
    });

    it("renders a 'log a session' CTA link in the stats rail", () => {
      expect(screen.getByRole("link", { name: "Log a session" })).toBeDefined();
    });
  });

  describe("given a single entry", () => {
    beforeEach(() => {
      render(<JournalTimelinePage entries={[makeEntry()]} />);
    });

    it("renders both the timeline column and the stats rail container", () => {
      expect(
        screen.getByRole("complementary", { name: "Journaling stats" })
      ).toBeDefined();
    });
  });
});
