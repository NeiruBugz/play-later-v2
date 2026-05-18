import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JournalEntry } from "../../../../../shared/lib/prisma/client";
import { JournalTeaser } from "./journal-teaser";

const onAddEntryClick = vi.fn();

function makeEntry(overrides?: Partial<JournalEntry>): JournalEntry {
  return {
    id: "entry-1",
    userId: "user-1",
    gameId: "game-1",
    kind: "QUICK",
    title: "Session note",
    content: "Played for an hour.",
    playedMinutes: null,
    mood: null,
    tags: [],
    createdAt: new Date("2024-01-15T12:00:00Z"),
    updatedAt: new Date("2024-01-15T12:00:00Z"),
    ...overrides,
  } as JournalEntry;
}

const elements = {
  queryAddButton: () => screen.queryByRole("button", { name: "Add entry" }),
  getAddButton: () => screen.getByRole("button", { name: "Add entry" }),
  queryEmpty: () => screen.queryByText("No journal entries yet."),
};

describe("JournalTeaser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given no onAddEntryClick prop", () => {
    beforeEach(() => {
      render(<JournalTeaser entries={[]} />);
    });

    it("does not render an Add entry button", () => {
      expect(elements.queryAddButton()).toBeNull();
    });

    it("renders the empty-state message", () => {
      expect(elements.queryEmpty()).not.toBeNull();
    });
  });

  describe("given onAddEntryClick is provided and the user clicks it (empty list)", () => {
    beforeEach(async () => {
      render(<JournalTeaser entries={[]} onAddEntryClick={onAddEntryClick} />);
      await userEvent.click(elements.getAddButton());
    });

    it("calls onAddEntryClick", () => {
      expect(onAddEntryClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("given onAddEntryClick is provided and there are entries", () => {
    beforeEach(async () => {
      render(
        <JournalTeaser
          entries={[makeEntry()]}
          onAddEntryClick={onAddEntryClick}
        />
      );
      await userEvent.click(elements.getAddButton());
    });

    it("calls onAddEntryClick", () => {
      expect(onAddEntryClick).toHaveBeenCalledTimes(1);
    });
  });
});
