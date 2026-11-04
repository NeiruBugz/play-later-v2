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
  playedMinutes: 90,
  gameId: "game-7",
};

const elements = {
  getContent: () =>
    screen.getByRole("textbox", { name: "Content" }) as HTMLTextAreaElement,
  getTime: () =>
    screen.getByRole("spinbutton", {
      name: "Time played (hours)",
    }) as HTMLInputElement,
  queryTime: () =>
    screen.queryByRole("spinbutton", { name: "Time played (hours)" }),
  getSaveButton: () => screen.getByRole("button", { name: "Save" }),
};

const actions = {
  clearAndType: async (text: string) => {
    await userEvent.clear(elements.getContent());
    await userEvent.type(elements.getContent(), text);
  },
  clearContent: async () => userEvent.clear(elements.getContent()),
  setTime: async (hours: string) => {
    await userEvent.clear(elements.getTime());
    if (hours) await userEvent.type(elements.getTime(), hours);
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

    it("pre-fills the time in hours", () => {
      expect(elements.getTime().value).toBe("1.5");
    });

    it("lets the time change in half-hour steps", () => {
      expect(elements.getTime()).toHaveAttribute("step", "0.5");
    });
  });

  describe("given the user edits the content and submits", () => {
    beforeEach(async () => {
      render(<EditJournalEntryForm entry={entry} />);
      await actions.clearAndType("Updated content");
      await actions.submit();
    });

    it("updates the note with the new text and the unchanged time, leaving its date alone", () => {
      expect(vi.mocked(updateJournalEntryFn)).toHaveBeenCalledWith({
        data: {
          id: "entry-7",
          content: "Updated content",
          playedMinutes: 90,
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

  describe("given the text is blank and the note has no time", () => {
    beforeEach(async () => {
      render(
        <EditJournalEntryForm entry={{ ...entry, playedMinutes: null }} />
      );
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

  describe("given the form is submitted programmatically with blank text and no time", () => {
    beforeEach(async () => {
      render(
        <EditJournalEntryForm entry={{ ...entry, playedMinutes: null }} />
      );
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

  describe("given the text is cleared but the time is still set", () => {
    beforeEach(async () => {
      render(<EditJournalEntryForm entry={entry} />);
      await actions.clearContent();
    });

    it("keeps Save enabled", () => {
      expect(elements.getSaveButton()).toBeEnabled();
    });

    it("saves the time-only note", async () => {
      await actions.submit();
      expect(vi.mocked(updateJournalEntryFn)).toHaveBeenCalledWith({
        data: { id: "entry-7", content: "", playedMinutes: 90 },
      });
    });
  });

  describe("given the text is cleared and the time is cleared too", () => {
    beforeEach(async () => {
      render(<EditJournalEntryForm entry={entry} />);
      await actions.clearContent();
      await actions.setTime("");
    });

    it("disables Save", () => {
      expect(elements.getSaveButton()).toBeDisabled();
    });
  });

  describe("given the user sets the time to 2 hours", () => {
    beforeEach(async () => {
      render(<EditJournalEntryForm entry={entry} />);
      await actions.setTime("2");
      await actions.submit();
    });

    it("saves 120 minutes", () => {
      expect(vi.mocked(updateJournalEntryFn)).toHaveBeenCalledWith({
        data: {
          id: "entry-7",
          content: "Original content",
          playedMinutes: 120,
        },
      });
    });
  });

  describe("given the user clears the time of a note with text", () => {
    beforeEach(async () => {
      render(<EditJournalEntryForm entry={entry} />);
      await actions.setTime("");
      await actions.submit();
    });

    it("clears the time with null", () => {
      expect(vi.mocked(updateJournalEntryFn)).toHaveBeenCalledWith({
        data: {
          id: "entry-7",
          content: "Original content",
          playedMinutes: null,
        },
      });
    });
  });

  describe("given a note without a game", () => {
    beforeEach(() => {
      render(
        <EditJournalEntryForm
          entry={{ ...entry, gameId: null, playedMinutes: null }}
        />
      );
    });

    it("offers no time field", () => {
      expect(elements.queryTime()).toBeNull();
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
