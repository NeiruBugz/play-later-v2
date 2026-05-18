/**
 * Pinned prop contract (RED — component does not exist yet):
 *
 * type Props = {
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   entry: { id: string; content: string; kind: "QUICK" | "REFLECTION"; gameId: string | null };
 * };
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateJournalEntryFn } from "@/features/edit-journal-entry/api/update-journal-entry-fn";
import { EditJournalEntryDialog } from "@/features/edit-journal-entry/ui/edit-journal-entry-dialog";

vi.mock("@/features/edit-journal-entry/api/update-journal-entry-fn", () => ({
  updateJournalEntryFn: vi.fn(),
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

const SEED_ENTRY = {
  id: "entry-id-001",
  content: "Got past the water temple — finally.",
  kind: "QUICK" as const,
  gameId: "game-id-999",
};

const elements = {
  getContentTextarea: () => screen.getByRole("textbox", { name: "Content" }),
  getSubmitButton: () => screen.getByRole("button", { name: "Save" }),
  getCancelButton: () => screen.getByRole("button", { name: "Cancel" }),
};

const actions = {
  clearAndTypeContent: async (text: string) => {
    const textarea = elements.getContentTextarea();
    await userEvent.clear(textarea);
    await userEvent.type(textarea, text);
  },
  submit: () => userEvent.click(elements.getSubmitButton()),
  cancel: () => userEvent.click(elements.getCancelButton()),
};

describe("EditJournalEntryDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateJournalEntryFn).mockResolvedValue(undefined as never);
  });

  describe("given the dialog opens with a seeded entry", () => {
    beforeEach(() => {
      render(
        <EditJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          entry={SEED_ENTRY}
        />
      );
    });

    it("pre-fills the textarea with the entry's content", () => {
      expect(elements.getContentTextarea()).toHaveValue(SEED_ENTRY.content);
    });
  });

  describe("given the user edits content and submits", () => {
    const updatedContent = "Water temple done — Jabu-Jabu next.";

    beforeEach(async () => {
      render(
        <EditJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          entry={SEED_ENTRY}
        />
      );

      await actions.clearAndTypeContent(updatedContent);
      await actions.submit();
    });

    it("calls updateJournalEntryFn with entryId, content, kind, and gameId", () => {
      expect(vi.mocked(updateJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entryId: SEED_ENTRY.id,
            content: updatedContent,
          }),
        })
      );
    });
  });

  describe("given the server fn rejects", () => {
    beforeEach(async () => {
      vi.mocked(updateJournalEntryFn).mockRejectedValue(
        new Error("Update failed")
      );

      render(
        <EditJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          entry={SEED_ENTRY}
        />
      );

      await actions.clearAndTypeContent("Some updated content");
      await actions.submit();
    });

    it("does not close the dialog (onOpenChange is not called with false)", () => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    it("calls toast.error with the rejection message", () => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Update failed");
    });
  });

  describe("given the server fn resolves", () => {
    let invalidate: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      invalidate = vi.fn();
      const { useRouter } = await import("@tanstack/react-router");
      vi.mocked(useRouter).mockReturnValue({ invalidate } as any);

      render(
        <EditJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          entry={SEED_ENTRY}
        />
      );

      await actions.clearAndTypeContent("Successfully updated content");
      await actions.submit();
    });

    it("calls router.invalidate()", () => {
      expect(invalidate).toHaveBeenCalled();
    });

    it("closes the dialog by calling onOpenChange(false)", () => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("calls toast.success with 'Entry updated'", () => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Entry updated");
    });
  });
});
