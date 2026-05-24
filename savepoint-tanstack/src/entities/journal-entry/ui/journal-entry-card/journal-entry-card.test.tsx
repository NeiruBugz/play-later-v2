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
  kind: "QUICK",
  title: null,
  content: "Some content here.",
  createdAt: new Date("2024-01-15T12:00:00Z"),
  updatedAt: new Date("2024-01-15T12:00:00Z"),
  game: {
    id: "game-1",
    title: "Hollow Knight",
    slug: "hollow-knight",
    coverImage: null,
  },
};

const formattedDate = new Date(entry.updatedAt).toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const elements = {
  queryOpener: () =>
    screen.queryByRole("button", {
      name: `Open journal entry from ${formattedDate}`,
    }),
  getOpener: () =>
    screen.getByRole("button", {
      name: `Open journal entry from ${formattedDate}`,
    }),
  getContent: () => screen.getByText("Some content here."),
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

  describe("given an entry with a non-null title", () => {
    beforeEach(() => {
      render(
        <JournalEntryCard entry={{ ...entry, title: "My Reflection Title" }} />
      );
    });

    it("renders the title text as a heading", () => {
      expect(screen.getByText("My Reflection Title")).toBeDefined();
    });
  });

  describe("given an entry with kind REFLECTION", () => {
    beforeEach(() => {
      render(<JournalEntryCard entry={{ ...entry, kind: "REFLECTION" }} />);
    });

    it("renders Reflection as the kind label", () => {
      expect(screen.getByText("Reflection")).toBeDefined();
    });
  });

  describe("given an entry with no associated game", () => {
    beforeEach(() => {
      render(<JournalEntryCard entry={{ ...entry, game: null }} />);
    });

    it("does not render a game link", () => {
      expect(screen.queryByRole("link")).toBeNull();
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
});
