import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { JournalEntryDetail } from "./journal-entry-detail";
import type { JournalEntryDetailEntry } from "./journal-entry-detail.type";

const onOpenChange = vi.fn();
const onEdit = vi.fn();
const onDelete = vi.fn();

const entry: JournalEntryDetailEntry = {
  id: "entry-xyz",
  kind: "QUICK",
  title: "First session",
  content: "Played through the tutorial.",
  createdAt: new Date("2024-01-15T12:00:00Z"),
  updatedAt: new Date("2024-01-15T12:00:00Z"),
  gameId: "game-1",
  game: { id: "game-1", title: "Hollow Knight", slug: "hollow-knight" },
};

const elements = {
  getEditButton: () => screen.getByRole("button", { name: "Edit" }),
  getDeleteButton: () => screen.getByRole("button", { name: "Delete" }),
  getContent: () => screen.getByText("Played through the tutorial."),
  getTitle: () => screen.getByText("First session"),
};

describe("JournalEntryDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given the dialog is open", () => {
    beforeEach(() => {
      render(
        <JournalEntryDetail
          open={true}
          onOpenChange={onOpenChange}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
    });

    it("renders the entry content", () => {
      expect(elements.getContent()).toBeDefined();
    });

    it("renders the entry title", () => {
      expect(elements.getTitle()).toBeDefined();
    });

    it("renders an Edit button", () => {
      expect(elements.getEditButton()).toBeDefined();
    });

    it("renders a Delete button", () => {
      expect(elements.getDeleteButton()).toBeDefined();
    });
  });

  describe("given the user clicks Edit", () => {
    beforeEach(async () => {
      render(
        <JournalEntryDetail
          open={true}
          onOpenChange={onOpenChange}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
      await userEvent.click(elements.getEditButton());
    });

    it("calls onEdit with the entry id", () => {
      expect(onEdit).toHaveBeenCalledWith("entry-xyz");
    });
  });

  describe("given the user clicks Delete", () => {
    beforeEach(async () => {
      render(
        <JournalEntryDetail
          open={true}
          onOpenChange={onOpenChange}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
      await userEvent.click(elements.getDeleteButton());
    });

    it("calls onDelete with the entry id", () => {
      expect(onDelete).toHaveBeenCalledWith("entry-xyz");
    });
  });
});
