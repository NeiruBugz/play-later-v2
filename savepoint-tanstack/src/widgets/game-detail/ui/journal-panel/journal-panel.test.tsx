import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JournalEntry } from "../../../../../shared/lib/prisma/client.ts";
import { JournalPanel } from "./journal-panel";

function makeEntry(): JournalEntry {
  return {
    id: "entry-1",
    userId: "user-1",
    gameId: "game-1",
    libraryItemId: null,
    kind: "QUICK",
    title: "Session note",
    content: "Played for an hour.",
    playedMinutes: null,
    playSession: null,
    mood: null,
    tags: [],
    visibility: "PRIVATE",
    createdAt: new Date("2024-01-15T12:00:00Z"),
    updatedAt: new Date("2024-01-15T12:00:00Z"),
    publishedAt: null,
  };
}

const onAddEntryClick = vi.fn();

const elements = {
  queryHeading: () => screen.queryByRole("heading", { name: "Journal" }),
  queryEntryContent: () => screen.queryByText("Played for an hour."),
  queryEmpty: () => screen.queryByText("No journal entries yet."),
  getAddButton: () => screen.getByRole("button", { name: "Add entry" }),
};

describe("JournalPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given existing journal entries", () => {
    beforeEach(() => {
      render(
        <JournalPanel
          entries={[makeEntry()]}
          onAddEntryClick={onAddEntryClick}
        />
      );
    });

    it("renders the Journal heading", () => {
      expect(elements.queryHeading()).not.toBeNull();
    });

    it("renders the entry teaser content", () => {
      expect(elements.queryEntryContent()).not.toBeNull();
    });

    it("invokes onAddEntryClick when the add affordance is clicked", async () => {
      await userEvent.click(elements.getAddButton());
      expect(onAddEntryClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("given no journal entries", () => {
    beforeEach(() => {
      render(<JournalPanel entries={[]} onAddEntryClick={onAddEntryClick} />);
    });

    it("renders the empty-state invitation", () => {
      expect(elements.queryEmpty()).not.toBeNull();
    });
  });
});
