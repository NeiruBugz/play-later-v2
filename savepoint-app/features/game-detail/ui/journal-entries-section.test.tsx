import type { JournalEntry } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JournalEntriesSection } from "./journal-entries-section";

// Helper to create mock journal entry
function createMockEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "entry-1",
    userId: "user-1",
    gameId: "game-1",
    libraryItemId: null,
    title: "Test Entry",
    content: "This is a test journal entry content.\nWith multiple lines.",
    mood: null,
    playSession: null,
    visibility: "PRIVATE",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    publishedAt: null,
    ...overrides,
  };
}

describe("JournalEntriesSection", () => {
  describe("Section structure", () => {
    it("should render the section title", () => {
      render(<JournalEntriesSection journalEntries={[]} />);

      expect(screen.getByText("Journal Entries")).toBeInTheDocument();
    });

    it("should render section title when entries exist", () => {
      const entries = [createMockEntry()];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(screen.getByText("Journal Entries")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("should show empty state message when no entries", () => {
      render(<JournalEntriesSection journalEntries={[]} />);

      expect(screen.getByText("No journal entries yet")).toBeInTheDocument();
    });

    it("should show 'Write Your First Entry' button when no entries", () => {
      render(<JournalEntriesSection journalEntries={[]} />);

      const button = screen.getByRole("button", {
        name: /write your first entry/i,
      });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it("should not show 'Write New Entry' button in empty state", () => {
      render(<JournalEntriesSection journalEntries={[]} />);

      expect(
        screen.queryByRole("button", { name: /write new entry/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("With entries", () => {
    it("should render single entry", () => {
      const entry = createMockEntry({
        title: "My First Entry",
        content: "This is my first entry",
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("My First Entry")).toBeInTheDocument();
    });

    it("should render multiple entries", () => {
      const entries = [
        createMockEntry({ id: "1", title: "Entry 1" }),
        createMockEntry({ id: "2", title: "Entry 2" }),
        createMockEntry({ id: "3", title: "Entry 3" }),
      ];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(screen.getByText("Entry 1")).toBeInTheDocument();
      expect(screen.getByText("Entry 2")).toBeInTheDocument();
      expect(screen.getByText("Entry 3")).toBeInTheDocument();
    });

    it("should show 'Write New Entry' button when entries exist", () => {
      const entries = [createMockEntry()];
      render(<JournalEntriesSection journalEntries={entries} />);

      const button = screen.getByRole("button", { name: /write new entry/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it("should not show 'Write Your First Entry' button when entries exist", () => {
      const entries = [createMockEntry()];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(
        screen.queryByRole("button", { name: /write your first entry/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Entry card content", () => {
    it("should display entry title", () => {
      const entry = createMockEntry({ title: "My Amazing Journey" });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("My Amazing Journey")).toBeInTheDocument();
    });

    it("should display 'Untitled Entry' when title is null", () => {
      const entry = createMockEntry({ title: null });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Untitled Entry")).toBeInTheDocument();
    });

    it("should display formatted date", () => {
      const entry = createMockEntry({
        createdAt: new Date("2024-01-15"),
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
    });

    it("should display content preview", () => {
      const entry = createMockEntry({
        content: "First line\nSecond line\nThird line",
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      // Content is rendered with actual newlines and truncation
      expect(screen.getByText(/First line/)).toBeInTheDocument();
      expect(screen.getByText(/Second line/)).toBeInTheDocument();
    });

    it("should truncate long content", () => {
      const entry = createMockEntry({
        content:
          "Line 1 with very long text that goes on and on\nLine 2 with more text\nLine 3 that should be truncated",
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      const contentElement = screen.getByText(/Line 1 with very long text/);
      expect(contentElement).toBeInTheDocument();
      expect(contentElement.textContent).toContain("...");
    });

    it("should not add ellipsis when content is short", () => {
      const entry = createMockEntry({
        content: "Single line content",
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      const contentElement = screen.getByText("Single line content");
      expect(contentElement).toBeInTheDocument();
      expect(contentElement.textContent).not.toContain("...");
    });
  });

  describe("Entry links", () => {
    it("should render entry as link to detail page", () => {
      const entry = createMockEntry({ id: "entry-123" });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/journal/entry-123");
    });

    it("should render multiple entry links correctly", () => {
      const entries = [
        createMockEntry({ id: "entry-1", title: "Entry 1" }),
        createMockEntry({ id: "entry-2", title: "Entry 2" }),
        createMockEntry({ id: "entry-3", title: "Entry 3" }),
      ];
      render(<JournalEntriesSection journalEntries={entries} />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(3);
      expect(links[0]).toHaveAttribute("href", "/journal/entry-1");
      expect(links[1]).toHaveAttribute("href", "/journal/entry-2");
      expect(links[2]).toHaveAttribute("href", "/journal/entry-3");
    });
  });

  describe("Date formatting", () => {
    it("should format dates in 'MMM dd, yyyy' format", () => {
      const entries = [
        createMockEntry({ id: "1", createdAt: new Date("2024-03-10") }),
        createMockEntry({ id: "2", createdAt: new Date("2024-12-25") }),
        createMockEntry({ id: "3", createdAt: new Date("2024-01-01") }),
      ];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(screen.getByText("Mar 10, 2024")).toBeInTheDocument();
      expect(screen.getByText("Dec 25, 2024")).toBeInTheDocument();
      expect(screen.getByText("Jan 01, 2024")).toBeInTheDocument();
    });

    it("should handle different years", () => {
      const entry = createMockEntry({
        createdAt: new Date("2023-06-15"),
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Jun 15, 2023")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle entry with empty content", () => {
      const entry = createMockEntry({ content: "" });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Test Entry")).toBeInTheDocument();
    });

    it("should handle exactly 3 entries", () => {
      const entries = [
        createMockEntry({ id: "1", title: "Entry 1" }),
        createMockEntry({ id: "2", title: "Entry 2" }),
        createMockEntry({ id: "3", title: "Entry 3" }),
      ];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(screen.getAllByRole("link")).toHaveLength(3);
    });

    it("should handle more than 3 entries (though use-case limits to 3)", () => {
      const entries = [
        createMockEntry({ id: "1", title: "Entry 1" }),
        createMockEntry({ id: "2", title: "Entry 2" }),
        createMockEntry({ id: "3", title: "Entry 3" }),
        createMockEntry({ id: "4", title: "Entry 4" }),
        createMockEntry({ id: "5", title: "Entry 5" }),
      ];
      render(<JournalEntriesSection journalEntries={entries} />);

      // All entries should render if passed in
      expect(screen.getAllByRole("link")).toHaveLength(5);
    });

    it("should handle content with only newlines", () => {
      const entry = createMockEntry({ content: "\n\n\n" });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Test Entry")).toBeInTheDocument();
    });
  });
});
