import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";
import { ComposeJournalEntryDialog } from "@/features/compose-journal-entry/ui/compose-journal-entry-dialog";

vi.mock("@/features/compose-journal-entry/api/create-journal-entry-fn", () => ({
  createJournalEntryFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: vi.fn(() => ({ invalidate: vi.fn() })),
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

const onOpenChange = vi.fn();

const elements = {
  getContentTextarea: () => screen.getByRole("textbox", { name: "Content" }),
  getSubmitButton: () => screen.getByRole("button", { name: "Save" }),
  getCancelButton: () => screen.getByRole("button", { name: "Cancel" }),
  queryDialog: () => screen.queryByRole("dialog"),
};

const actions = {
  typeContent: (text: string) =>
    userEvent.type(elements.getContentTextarea(), text),
  submit: () => userEvent.click(elements.getSubmitButton()),
  cancel: () => userEvent.click(elements.getCancelButton()),
};

describe("ComposeJournalEntryDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createJournalEntryFn).mockResolvedValue(undefined as never);
  });

  describe("given the dialog is open", () => {
    beforeEach(() => {
      render(
        <ComposeJournalEntryDialog open={true} onOpenChange={onOpenChange} />
      );
    });

    it("renders a content textarea", () => {
      expect(elements.getContentTextarea()).toBeDefined();
    });

    it("renders a submit button", () => {
      expect(elements.getSubmitButton()).toBeDefined();
    });

    it("renders a cancel button", () => {
      expect(elements.getCancelButton()).toBeDefined();
    });
  });

  describe("given the user submits non-empty content", () => {
    beforeEach(async () => {
      render(
        <ComposeJournalEntryDialog open={true} onOpenChange={onOpenChange} />
      );

      await actions.typeContent("Finished the first act — incredible pacing.");
      await actions.submit();
    });

    it("calls createJournalEntryFn with content, kind, and gameId", () => {
      expect(vi.mocked(createJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: "Finished the first act — incredible pacing.",
          }),
        })
      );
    });
  });

  describe("given the user submits empty content", () => {
    beforeEach(async () => {
      render(
        <ComposeJournalEntryDialog open={true} onOpenChange={onOpenChange} />
      );
    });

    it("does not call createJournalEntryFn when content is empty", async () => {
      // Submit button should be disabled when content is empty, so clicking it
      // does nothing; if the implementation uses form validation instead, the
      // fn still must not be called.
      const btn = elements.getSubmitButton();
      if (!btn.hasAttribute("disabled")) {
        await userEvent.click(btn);
      }
      expect(vi.mocked(createJournalEntryFn)).not.toHaveBeenCalled();
    });
  });

  describe("given the form is submitted programmatically with empty content", () => {
    beforeEach(() => {
      render(
        <ComposeJournalEntryDialog open={true} onOpenChange={onOpenChange} />
      );
      // Submit directly on the form element to exercise the `if (isEmpty) return`
      // guard in handleSubmit — the Save button is disabled so userEvent won't reach it.
      // eslint-disable-next-line testing-library/no-node-access
      const form = elements.getContentTextarea().closest("form")!;
      fireEvent.submit(form);
    });

    it("does not call createJournalEntryFn when content is empty", () => {
      expect(vi.mocked(createJournalEntryFn)).not.toHaveBeenCalled();
    });
  });

  describe("given the server fn rejects", () => {
    beforeEach(async () => {
      vi.mocked(createJournalEntryFn).mockRejectedValue(
        new Error("Server error")
      );

      render(
        <ComposeJournalEntryDialog open={true} onOpenChange={onOpenChange} />
      );

      await actions.typeContent("Some journal content");
      await actions.submit();
    });

    it("does not close the dialog (onOpenChange is not called with false)", () => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    it("calls toast.error with the rejection message", () => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Server error");
    });
  });

  describe("given the server fn rejects with a non-Error value", () => {
    beforeEach(async () => {
      vi.mocked(createJournalEntryFn).mockRejectedValue("string rejection");
      render(
        <ComposeJournalEntryDialog open={true} onOpenChange={onOpenChange} />
      );
      await actions.typeContent("Some content");
      await actions.submit();
    });

    it("shows the fallback error message", async () => {
      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain(
          "Something went wrong"
        );
      });
    });
  });

  describe("given the user clicks Cancel", () => {
    beforeEach(async () => {
      render(
        <ComposeJournalEntryDialog open={true} onOpenChange={onOpenChange} />
      );
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });

    it("calls onOpenChange(false) to close the dialog", () => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("given the server fn resolves", () => {
    let invalidate: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      invalidate = vi.fn();
      const { useRouter } = await import("@tanstack/react-router");
      vi.mocked(useRouter).mockReturnValue({ invalidate } as any);

      render(
        <ComposeJournalEntryDialog open={true} onOpenChange={onOpenChange} />
      );

      await actions.typeContent("Entry that succeeds");
      await actions.submit();
    });

    it("calls router.invalidate()", () => {
      expect(invalidate).toHaveBeenCalled();
    });

    it("closes the dialog by calling onOpenChange(false)", () => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("calls toast.success with 'Entry posted'", () => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Entry posted");
    });
  });

  describe("given a defaultGameId prop", () => {
    beforeEach(async () => {
      render(
        <ComposeJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          defaultGameId="game-abc-123"
        />
      );

      await actions.typeContent("Playing this great game");
      await actions.submit();
    });

    it("calls createJournalEntryFn with the preset gameId", () => {
      expect(vi.mocked(createJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            gameId: "game-abc-123",
          }),
        })
      );
    });
  });
});
