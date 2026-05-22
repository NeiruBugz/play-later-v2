import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  describe("given the content is empty (whitespace only)", () => {
    beforeEach(async () => {
      render(<EditJournalEntryForm entry={entry} />);
      await actions.clearAndType("   ");
    });

    it("disables the Save button when content is blank", () => {
      const save = elements.getSaveButton();
      expect(save).toBeDisabled();
    });

    it("does not call updateJournalEntryFn on submit when content is empty", async () => {
      await actions.submit();
      expect(vi.mocked(updateJournalEntryFn)).not.toHaveBeenCalled();
    });
  });

  describe("given the form is submitted programmatically with whitespace-only content", () => {
    beforeEach(async () => {
      render(<EditJournalEntryForm entry={entry} />);
      await actions.clearAndType("   ");
      // Submit directly on the form to hit `if (isEmpty) return` —
      // the Save button is disabled so userEvent.click won't reach handleSubmit.
      // eslint-disable-next-line testing-library/no-node-access
      const form = elements.getContent().closest("form")!;
      fireEvent.submit(form);
    });

    it("does not call updateJournalEntryFn when the trimmed content is empty", () => {
      expect(vi.mocked(updateJournalEntryFn)).not.toHaveBeenCalled();
    });
  });

  describe("given the server call throws an error", () => {
    beforeEach(async () => {
      vi.mocked(updateJournalEntryFn).mockRejectedValue(
        new Error("Server failure")
      );
      render(<EditJournalEntryForm entry={entry} />);
      await actions.clearAndType("New content");
      await actions.submit();
    });

    it("shows the error message in an alert", async () => {
      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain(
          "Server failure"
        );
      });
    });

    it("does not navigate on error", () => {
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  describe("given the server call rejects with a non-Error value", () => {
    beforeEach(async () => {
      vi.mocked(updateJournalEntryFn).mockRejectedValue("unexpected string");
      render(<EditJournalEntryForm entry={entry} />);
      await actions.clearAndType("Content here");
      await actions.submit();
    });

    it("shows the fallback error message in an alert", async () => {
      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain(
          "Something went wrong"
        );
      });
    });
  });

  describe("given the user clicks Cancel", () => {
    beforeEach(async () => {
      render(<EditJournalEntryForm entry={entry} />);
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });

    it("navigates back to the entry detail page", () => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/journal/$id",
        params: { id: "entry-7" },
      });
    });
  });
});
