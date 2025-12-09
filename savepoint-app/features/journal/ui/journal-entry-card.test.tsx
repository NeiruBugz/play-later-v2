import { renderWithTestProviders } from "@/test/utils/test-provider";
import { render, screen } from "@testing-library/react";

import { JournalMood, type JournalEntryDomain } from "@/shared/types";

import { JournalEntryCard } from "./journal-entry-card";

vi.mock("@/shared/lib/date", () => ({
  formatRelativeDate: vi.fn((date: Date) => {
    const now = new Date("2025-01-27T12:00:00Z");
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "today";
    if (diffInDays === 1) return "yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }),
}));

const createMockEntry = (
  overrides: Partial<JournalEntryDomain> = {}
): JournalEntryDomain => ({
  id: "entry-1",
  userId: "user-1",
  gameId: "game-1",
  libraryItemId: null,
  title: "My First Entry",
  content: "This is my journal entry content.",
  mood: null,
  playSession: null,
  visibility: "PRIVATE",
  createdAt: new Date("2025-01-27T12:00:00Z"),
  updatedAt: new Date("2025-01-27T12:00:00Z"),
  publishedAt: null,
  ...overrides,
});

const createMockGame = (
  overrides: Partial<{
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
  }> = {}
) => ({
  id: "game-1",
  title: "Test Game",
  slug: "test-game",
  coverImage: "cover123",
  ...overrides,
});

const elements = {
  getCardLink: () => screen.getByRole("link"),
  getTitle: () => screen.getByText("My First Entry"),
  getContentPreview: () => screen.getByText(/this is my journal entry/i),
  getGameName: () => screen.getByText("Test Game"),
  getTimestamp: () => screen.getByText(/today|yesterday|\d+ days ago/i),
  getMoodBadge: () =>
    screen.queryByText(
      /excited|relaxed|frustrated|accomplished|curious|nostalgic/i
    ),
  getCoverImage: () => screen.queryByAltText(/test game/i),
};

describe("JournalEntryCard", () => {
  describe("given component rendered with complete entry", () => {
    const entry = createMockEntry();
    const game = createMockGame();

    beforeEach(() => {
      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);
    });

    it("should render as clickable link", () => {
      const link = elements.getCardLink();
      expect(link).toBeVisible();
      expect(link).toHaveAttribute("href", "/journal/entry-1");
    });

    it("should display entry title", () => {
      expect(elements.getTitle()).toBeVisible();
    });

    it("should display content preview", () => {
      expect(elements.getContentPreview()).toBeVisible();
    });

    it("should display game name", () => {
      expect(elements.getGameName()).toBeVisible();
    });

    it("should display formatted timestamp", () => {
      expect(elements.getTimestamp()).toBeVisible();
    });

    it("should display game cover image when available", () => {
      // GameCardCover renders an img with alt text
      const coverImage = screen.queryByRole("img");
      expect(coverImage).toBeVisible();
    });
  });

  describe("given entry with title", () => {
    it("should display the title", () => {
      const entry = createMockEntry({ title: "My Journal Entry" });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);

      expect(screen.getByText("My Journal Entry")).toBeVisible();
    });
  });

  describe("given entry without title", () => {
    it("should display 'Untitled Entry' as fallback", () => {
      const entry = createMockEntry({ title: null });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);

      expect(screen.getByText("Untitled Entry")).toBeVisible();
    });
  });

  describe("given entry with HTML content", () => {
    it("should strip HTML tags from preview", () => {
      const entry = createMockEntry({
        content: "<p>This is <strong>bold</strong> text</p>",
      });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);

      expect(screen.getByText(/this is bold text/i)).toBeVisible();
      expect(screen.queryByText(/<p>/i)).not.toBeInTheDocument();
    });

    it("should handle HTML entities", () => {
      const entry = createMockEntry({
        content: "<p>Text&nbsp;with&nbsp;entities</p>",
      });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);

      expect(screen.getByText(/text with entities/i)).toBeVisible();
    });
  });

  describe("given entry with long content", () => {
    it("should truncate content to 100 characters", () => {
      const longContent = "a".repeat(150);
      const entry = createMockEntry({ content: longContent });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);

      const preview = screen.getByText(/^a{100}\.\.\.$/);
      expect(preview).toBeVisible();
    });
  });

  describe("given entry with mood", () => {
    it.each([
      [JournalMood.EXCITED, "Excited"],
      [JournalMood.RELAXED, "Relaxed"],
      [JournalMood.FRUSTRATED, "Frustrated"],
      [JournalMood.ACCOMPLISHED, "Accomplished"],
      [JournalMood.CURIOUS, "Curious"],
      [JournalMood.NOSTALGIC, "Nostalgic"],
    ])("should display %s mood badge", (mood, label) => {
      const entry = createMockEntry({ mood });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);

      expect(elements.getMoodBadge()).toBeVisible();
      expect(elements.getMoodBadge()).toHaveTextContent(label);
    });
  });

  describe("given entry without mood", () => {
    it("should not display mood badge", () => {
      const entry = createMockEntry({ mood: null });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);

      expect(elements.getMoodBadge()).not.toBeInTheDocument();
    });
  });

  describe("given game without cover image", () => {
    it("should not display cover image", () => {
      const entry = createMockEntry();
      const game = createMockGame({ coverImage: null });

      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);

      // GameCardCover won't render an image if imageId is null
      const images = screen.queryAllByRole("img");
      expect(images.length).toBe(0);
    });
  });

  describe("navigation", () => {
    it("should link to correct journal entry detail page", () => {
      const entry = createMockEntry({ id: "entry-123" });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryCard entry={entry} game={game} />);

      const link = elements.getCardLink();
      expect(link).toHaveAttribute("href", "/journal/entry-123");
    });
  });
});
