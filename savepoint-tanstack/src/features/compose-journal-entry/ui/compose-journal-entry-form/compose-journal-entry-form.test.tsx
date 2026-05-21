import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";

import { ComposeJournalEntryForm } from "./compose-journal-entry-form";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/features/compose-journal-entry/api/create-journal-entry-fn", () => ({
  createJournalEntryFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const elements = {
  getContent: () => screen.getByRole("textbox", { name: "Content" }),
  getSaveButton: () => screen.getByRole("button", { name: "Save" }),
  queryAlert: () => screen.queryByRole("alert"),
};

const actions = {
  typeContent: async (text: string) =>
    userEvent.type(elements.getContent(), text),
  submit: async () => userEvent.click(elements.getSaveButton()),
};

describe("ComposeJournalEntryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createJournalEntryFn).mockResolvedValue({
      id: "new-entry-9",
    } as never);
  });

  describe("given the user types content and submits", () => {
    beforeEach(async () => {
      render(<ComposeJournalEntryForm defaultGameId="game-42" />);
      await actions.typeContent("Beat the first boss tonight");
      await actions.submit();
    });

    it("creates the entry with the typed content and the default game", () => {
      expect(vi.mocked(createJournalEntryFn)).toHaveBeenCalledWith({
        data: {
          content: "Beat the first boss tonight",
          kind: "QUICK",
          gameId: "game-42",
        },
      });
    });

    it("navigates to the new entry's detail page on success", async () => {
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith({
          to: "/journal/$id",
          params: { id: "new-entry-9" },
        });
      });
    });
  });

  describe("given no default game and the user submits content", () => {
    beforeEach(async () => {
      render(<ComposeJournalEntryForm />);
      await actions.typeContent("A game-less note");
      await actions.submit();
    });

    it("sends a null game association", () => {
      expect(vi.mocked(createJournalEntryFn)).toHaveBeenCalledWith({
        data: {
          content: "A game-less note",
          kind: "QUICK",
          gameId: null,
        },
      });
    });
  });

  describe("given the content is empty", () => {
    beforeEach(() => {
      render(<ComposeJournalEntryForm />);
    });

    it("disables the Save button", () => {
      expect(elements.getSaveButton()).toBeDisabled();
    });
  });

  describe("given the server fn rejects", () => {
    beforeEach(async () => {
      vi.mocked(createJournalEntryFn).mockRejectedValue(
        new Error("Server is on fire")
      );
      render(<ComposeJournalEntryForm />);
      await actions.typeContent("Will fail");
      await actions.submit();
    });

    it("surfaces the error message inline", async () => {
      await waitFor(() => {
        expect(elements.queryAlert()?.textContent).toBe("Server is on fire");
      });
    });

    it("does not navigate away", () => {
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
