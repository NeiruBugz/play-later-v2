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
});
