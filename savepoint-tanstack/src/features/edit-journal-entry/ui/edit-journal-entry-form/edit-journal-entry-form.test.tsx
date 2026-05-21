import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateJournalEntryFn } from "@/features/edit-journal-entry/api/update-journal-entry-fn";

import { EditJournalEntryForm } from "./edit-journal-entry-form";
import type { EditJournalEntryFormEntry } from "./edit-journal-entry-form.type";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/features/edit-journal-entry/api/update-journal-entry-fn", () => ({
  updateJournalEntryFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const entry: EditJournalEntryFormEntry = {
  id: "entry-7",
  content: "Original content",
  kind: "QUICK",
  gameId: "game-7",
};

const elements = {
  getContent: () =>
    screen.getByRole("textbox", { name: "Content" }) as HTMLTextAreaElement,
  getSaveButton: () => screen.getByRole("button", { name: "Save" }),
};

const actions = {
  clearAndType: async (text: string) => {
    await userEvent.clear(elements.getContent());
    await userEvent.type(elements.getContent(), text);
  },
  submit: async () => userEvent.click(elements.getSaveButton()),
};

describe("EditJournalEntryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateJournalEntryFn).mockResolvedValue(undefined as never);
  });

  describe("given the form is rendered with an entry", () => {
    beforeEach(() => {
      render(<EditJournalEntryForm entry={entry} />);
    });

    it("pre-fills the content from the entry", () => {
      expect(elements.getContent().value).toBe("Original content");
    });
  });

  describe("given the user edits the content and submits", () => {
    beforeEach(async () => {
      render(<EditJournalEntryForm entry={entry} />);
      await actions.clearAndType("Updated content");
      await actions.submit();
    });

    it("updates the entry with the new content and preserved associations", () => {
      expect(vi.mocked(updateJournalEntryFn)).toHaveBeenCalledWith({
        data: {
          entryId: "entry-7",
          content: "Updated content",
          kind: "QUICK",
          gameId: "game-7",
        },
      });
    });

    it("navigates back to the entry detail page on success", async () => {
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith({
          to: "/journal/$id",
          params: { id: "entry-7" },
        });
      });
    });
  });
});
