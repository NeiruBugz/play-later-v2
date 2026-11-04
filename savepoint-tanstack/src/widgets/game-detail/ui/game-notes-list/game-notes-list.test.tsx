import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameNotesList } from "./game-notes-list";
import type { GameNote } from "./game-notes-list.type";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, params, children, ...rest }: any) => (
    <a href={to.replace("$id", params?.id)} {...rest}>
      {children}
    </a>
  ),
}));

const onNewNote = vi.fn();

function makeNote(overrides: Partial<GameNote> & { id: string }): GameNote {
  return {
    content: "A note",
    playedMinutes: null,
    createdAt: new Date("2024-01-10T12:00:00Z"),
    ...overrides,
  };
}

const elements = {
  getItems: () => within(screen.getByRole("list")).getAllByRole("listitem"),
  getLink: (name: RegExp | string) => screen.getByRole("link", { name }),
  getNewNote: () => screen.getByRole("button", { name: "New note" }),
};

describe("GameNotesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given a game with 3 notes", () => {
    beforeEach(() => {
      render(
        <GameNotesList
          onNewNote={onNewNote}
          notes={[
            makeNote({
              id: "old",
              content: "Oldest note",
              createdAt: new Date("2024-01-01T12:00:00Z"),
            }),
            makeNote({
              id: "new",
              content: "Newest note",
              createdAt: new Date("2024-03-01T12:00:00Z"),
            }),
            makeNote({
              id: "mid",
              content: "Middle note",
              createdAt: new Date("2024-02-01T12:00:00Z"),
            }),
          ]}
        />
      );
    });

    it("lists each note once", () => {
      expect(elements.getItems()).toHaveLength(3);
      expect(screen.getAllByText("Newest note")).toHaveLength(1);
    });

    it("lists them newest first", () => {
      expect(elements.getItems().map((item) => item.textContent)).toEqual([
        expect.stringContaining("Newest note"),
        expect.stringContaining("Middle note"),
        expect.stringContaining("Oldest note"),
      ]);
    });

    it("links each note to its note view", () => {
      expect(elements.getLink(/Newest note/)).toHaveAttribute(
        "href",
        "/journal/new"
      );
      expect(elements.getLink(/Oldest note/)).toHaveAttribute(
        "href",
        "/journal/old"
      );
    });

    it("shows no Quick note or Reflection label", () => {
      expect(screen.queryByText(/quick note|reflection/i)).toBeNull();
    });
  });

  describe("given a note with only time", () => {
    beforeEach(() => {
      render(
        <GameNotesList
          onNewNote={onNewNote}
          notes={[makeNote({ id: "t", content: "", playedMinutes: 90 })]}
        />
      );
    });

    it("reads 1.5 h played", () => {
      expect(screen.getByText("1.5 h played")).toBeDefined();
    });
  });

  describe("given a note with text and 90 minutes", () => {
    beforeEach(() => {
      render(
        <GameNotesList
          onNewNote={onNewNote}
          notes={[
            makeNote({ id: "t", content: "Boss down", playedMinutes: 90 }),
          ]}
        />
      );
    });

    it("shows the time as 1.5 h beside the text", () => {
      expect(screen.getByText("1.5 h")).toBeDefined();
      expect(screen.getByText("Boss down")).toBeDefined();
    });
  });

  describe("given no notes", () => {
    beforeEach(async () => {
      render(<GameNotesList onNewNote={onNewNote} notes={[]} />);
      await userEvent.click(elements.getNewNote());
    });

    it("says there are no notes yet", () => {
      expect(screen.getByText("No notes yet.")).toBeDefined();
    });

    it("starts a new note", () => {
      expect(onNewNote).toHaveBeenCalledTimes(1);
    });
  });

  describe("given a note that answers a prompt", () => {
    it.each([
      ["WHY", "Why do you want to play this?"],
      ["STAYED", "What stayed with you?"],
    ] as const)("heads a %s answer with its question", (prompt, question) => {
      render(
        <GameNotesList
          onNewNote={onNewNote}
          notes={[makeNote({ id: "p", content: "My answer", prompt })]}
        />
      );
      expect(screen.getByText(question)).toBeDefined();
      expect(screen.getByText("My answer")).toBeDefined();
    });
  });
});
