import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useIsDesktop } from "@/shared/lib/use-media-query";
import type { JournalTimelineEntry } from "@/widgets/journal-timeline";

import { JournalTimelinePage } from "./journal-timeline-page";

vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: vi.fn(() => false),
}));

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

  describe("given a desktop viewport and multiple entries", () => {
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
      vi.mocked(useIsDesktop).mockReturnValue(true);
      render(<JournalTimelinePage entries={entries} />);
    });

    it("renders the stats rail with an entries count", () => {
      const rail = screen.getByRole("complementary", {
        name: "Journaling stats",
      });
      expect(rail).toBeDefined();
    });

    it("renders a 'log tonight' prompt in the stats rail", () => {
      expect(screen.getByRole("link", { name: /log tonight/i })).toBeDefined();
    });
  });

  describe("given a mobile viewport", () => {
    beforeEach(() => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      render(<JournalTimelinePage entries={[makeEntry()]} />);
    });

    it("does not render the stats rail", () => {
      expect(screen.queryByRole("complementary")).toBeNull();
    });
  });
});
