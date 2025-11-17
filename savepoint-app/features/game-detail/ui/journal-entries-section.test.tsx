import { createJournalEntryFixture } from "@fixtures/journal";
import { render, screen } from "@testing-library/react";

import { JournalEntriesSection } from "./journal-entries-section";

describe("JournalEntriesSection", () => {
  describe("Section structure", () => {
    it("should render the section title", () => {
      render(<JournalEntriesSection journalEntries={[]} />);

      expect(screen.getByText("Journal Entries")).toBeVisible();
    });

    it("should render section title when entries exist", () => {
      const entries = [createJournalEntryFixture()];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(screen.getByText("Journal Entries")).toBeVisible();
    });
  });

  describe("Empty state", () => {
    it("should show empty state message when no entries", () => {
      render(<JournalEntriesSection journalEntries={[]} />);

      expect(screen.getByText("No journal entries yet")).toBeVisible();
    });

    it("should show 'Write Your First Entry' button when no entries", () => {
      render(<JournalEntriesSection journalEntries={[]} />);

      const button = screen.getByRole("button", {
        name: /write your first entry/i,
      });
      expect(button).toBeVisible();
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
      const entry = createJournalEntryFixture({
        title: "My First Entry",
        content: "This is my first entry",
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("My First Entry")).toBeVisible();
    });

    it("should render multiple entries", () => {
      const entries = [
        createJournalEntryFixture({ id: "1", title: "Entry 1" }),
        createJournalEntryFixture({ id: "2", title: "Entry 2" }),
        createJournalEntryFixture({ id: "3", title: "Entry 3" }),
      ];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(screen.getByText("Entry 1")).toBeVisible();
      expect(screen.getByText("Entry 2")).toBeVisible();
      expect(screen.getByText("Entry 3")).toBeVisible();
    });

    it("should show 'Write New Entry' button when entries exist", () => {
      const entries = [createJournalEntryFixture()];
      render(<JournalEntriesSection journalEntries={entries} />);

      const button = screen.getByRole("button", { name: /write new entry/i });
      expect(button).toBeVisible();
      expect(button).toBeDisabled();
    });

    it("should not show 'Write Your First Entry' button when entries exist", () => {
      const entries = [createJournalEntryFixture()];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(
        screen.queryByRole("button", { name: /write your first entry/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Entry card content", () => {
    it("should display entry title", () => {
      const entry = createJournalEntryFixture({ title: "My Amazing Journey" });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("My Amazing Journey")).toBeVisible();
    });

    it("should display 'Untitled Entry' when title is null", () => {
      const entry = createJournalEntryFixture({ title: null });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Untitled Entry")).toBeVisible();
    });

    it("should display formatted date", () => {
      const entry = createJournalEntryFixture({
        createdAt: new Date("2024-01-15"),
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Jan 15, 2024")).toBeVisible();
    });

    it("should display content preview", () => {
      const entry = createJournalEntryFixture({
        content: "First line\nSecond line\nThird line",
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText(/First line/)).toBeVisible();
      expect(screen.getByText(/Second line/)).toBeVisible();
    });

    it("should truncate long content", () => {
      const entry = createJournalEntryFixture({
        content:
          "Line 1 with very long text that goes on and on\nLine 2 with more text\nLine 3 that should be truncated",
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      const contentElement = screen.getByText(/Line 1 with very long text/);
      expect(contentElement).toBeVisible();
      expect(contentElement.textContent).toContain("...");
    });

    it("should not add ellipsis when content is short", () => {
      const entry = createJournalEntryFixture({
        content: "Single line content",
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      const contentElement = screen.getByText("Single line content");
      expect(contentElement).toBeVisible();
      expect(contentElement.textContent).not.toContain("...");
    });
  });

  describe("Entry links", () => {
    it("should render entry as link to detail page", () => {
      const entry = createJournalEntryFixture({ id: "entry-123" });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/journal/entry-123");
    });

    it("should render multiple entry links correctly", () => {
      const entries = [
        createJournalEntryFixture({ id: "entry-1", title: "Entry 1" }),
        createJournalEntryFixture({ id: "entry-2", title: "Entry 2" }),
        createJournalEntryFixture({ id: "entry-3", title: "Entry 3" }),
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
        createJournalEntryFixture({
          id: "1",
          createdAt: new Date("2024-03-10"),
        }),
        createJournalEntryFixture({
          id: "2",
          createdAt: new Date("2024-12-25"),
        }),
        createJournalEntryFixture({
          id: "3",
          createdAt: new Date("2024-01-01"),
        }),
      ];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(screen.getByText("Mar 10, 2024")).toBeVisible();
      expect(screen.getByText("Dec 25, 2024")).toBeVisible();
      expect(screen.getByText("Jan 01, 2024")).toBeVisible();
    });

    it("should handle different years", () => {
      const entry = createJournalEntryFixture({
        createdAt: new Date("2023-06-15"),
      });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Jun 15, 2023")).toBeVisible();
    });
  });

  describe("Edge cases", () => {
    it("should handle entry with empty content", () => {
      const entry = createJournalEntryFixture({ content: "" });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Test Entry")).toBeVisible();
    });

    it("should handle exactly 3 entries", () => {
      const entries = [
        createJournalEntryFixture({ id: "1", title: "Entry 1" }),
        createJournalEntryFixture({ id: "2", title: "Entry 2" }),
        createJournalEntryFixture({ id: "3", title: "Entry 3" }),
      ];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(screen.getAllByRole("link")).toHaveLength(3);
    });

    it("should handle more than 3 entries (though use-case limits to 3)", () => {
      const entries = [
        createJournalEntryFixture({ id: "1", title: "Entry 1" }),
        createJournalEntryFixture({ id: "2", title: "Entry 2" }),
        createJournalEntryFixture({ id: "3", title: "Entry 3" }),
        createJournalEntryFixture({ id: "4", title: "Entry 4" }),
        createJournalEntryFixture({ id: "5", title: "Entry 5" }),
      ];
      render(<JournalEntriesSection journalEntries={entries} />);

      expect(screen.getAllByRole("link")).toHaveLength(5);
    });

    it("should handle content with only newlines", () => {
      const entry = createJournalEntryFixture({ content: "\n\n\n" });
      render(<JournalEntriesSection journalEntries={[entry]} />);

      expect(screen.getByText("Test Entry")).toBeVisible();
    });
  });
});
