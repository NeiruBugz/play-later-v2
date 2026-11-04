import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { JournalEntryCard } from "./journal-entry-card";
import type { JournalEntryCardEntry } from "./journal-entry-card.type";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: any) => {
    delete rest.params;
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    );
  },
}));

const onSelect = vi.fn();

const entry: JournalEntryCardEntry = {
  id: "entry-1",
  content: "Some content here.",
  playedMinutes: null,
  createdAt: new Date("2024-01-15T12:00:00Z"),
  game: {
    id: "game-1",
    title: "Hollow Knight",
    slug: "hollow-knight",
    coverImage: null,
  },
};

const formattedDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const elements = {
  queryOpener: () =>
    screen.queryByRole("button", {
      name: `Open note from ${formattedDate}`,
    }),
  getOpener: () =>
    screen.getByRole("button", {
      name: `Open note from ${formattedDate}`,
    }),
  getContent: () => screen.getByText("Some content here."),
  queryGameHeading: (title: string) =>
    screen.queryByRole("heading", { name: title }),
  getGameHeading: (title: string) =>
    screen.getByRole("heading", { name: title }),
  queryDate: (text: string) => screen.queryByText(text),
  getDate: (text: string) => screen.getByText(text),
};

describe("JournalEntryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given no onSelect prop", () => {
    beforeEach(() => {
      render(<JournalEntryCard entry={entry} />);
    });

    it("renders the entry content", () => {
      expect(elements.getContent()).toBeDefined();
    });

    it("does not render a click-to-open button", () => {
      expect(elements.queryOpener()).toBeNull();
    });
  });

  describe("given an entry with a game", () => {
    beforeEach(() => {
      render(<JournalEntryCard entry={entry} />);
    });

    it("renders the game title as the card heading", () => {
      expect(elements.getGameHeading("Hollow Knight")).toBeDefined();
    });

    it("renders the formatted date", () => {
      expect(elements.getDate(formattedDate)).toBeDefined();
    });
  });

  describe("given an entry with no game", () => {
    beforeEach(() => {
      render(<JournalEntryCard entry={{ ...entry, game: null }} />);
    });

    it("reads No game as the card heading", () => {
      expect(elements.getGameHeading("No game")).toBeDefined();
    });
  });

  describe("given any entry", () => {
    beforeEach(() => {
      render(<JournalEntryCard entry={entry} />);
    });

    it("shows no Quick note or Reflection label", () => {
      expect(screen.queryByText(/quick note|reflection/i)).toBeNull();
    });
  });

  describe("given a note with 90 minutes and text", () => {
    beforeEach(() => {
      render(<JournalEntryCard entry={{ ...entry, playedMinutes: 90 }} />);
    });

    it("shows the time as 1.5 h next to the text", () => {
      expect(screen.getByText("1.5 h")).toBeDefined();
      expect(elements.getContent()).toBeDefined();
    });
  });

  describe("given a note with time and no text", () => {
    beforeEach(() => {
      render(
        <JournalEntryCard
          entry={{ ...entry, content: "", playedMinutes: 90 }}
        />
      );
    });

    it("reads 1.5 h played instead of an empty card", () => {
      expect(screen.getByText("1.5 h played")).toBeDefined();
    });
  });

  describe("given an entry with no associated game", () => {
    beforeEach(() => {
      render(<JournalEntryCard entry={{ ...entry, game: null }} />);
    });

    it("does not render a game link", () => {
      expect(screen.queryByRole("link")).toBeNull();
    });

    it("renders the formatted date even without a game", () => {
      expect(elements.getDate(formattedDate)).toBeDefined();
    });
  });

  describe("given an onSelect prop and the user clicks the card", () => {
    beforeEach(async () => {
      render(<JournalEntryCard entry={entry} onSelect={onSelect} />);
      await userEvent.click(elements.getOpener());
    });

    it("calls onSelect with the entry id", () => {
      expect(onSelect).toHaveBeenCalledWith("entry-1");
    });
  });

  describe("given an entry with a game and the user clicks the game link", () => {
    beforeEach(async () => {
      render(<JournalEntryCard entry={entry} onSelect={onSelect} />);
      await userEvent.click(screen.getByRole("link"));
    });

    it("does not call onSelect when clicking the game link (stopPropagation)", () => {
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("given a note that answers a prompt", () => {
    it.each([
      ["WHY", "Why do you want to play this?"],
      ["STAYED", "What stayed with you?"],
    ] as const)("heads a %s answer with its question", (prompt, question) => {
      render(<JournalEntryCard entry={{ ...entry, prompt }} />);
      expect(screen.getByRole("heading", { name: question })).toBeDefined();
    });

    it("shows no question heading on a plain note", () => {
      render(<JournalEntryCard entry={{ ...entry, prompt: null }} />);
      expect(screen.queryByText("Why do you want to play this?")).toBeNull();
    });
  });
});
