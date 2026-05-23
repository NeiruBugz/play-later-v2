/**
 * Pinned prop contract (RED — component does not exist yet):
 *
 * type Props = {
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   entryId: string;
 * };
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteJournalEntryFn } from "@/features/delete-journal-entry/api/delete-journal-entry-fn";
import { DeleteJournalEntryDialog } from "@/features/delete-journal-entry/ui/delete-journal-entry-dialog";

vi.mock("@/features/delete-journal-entry/api/delete-journal-entry-fn", () => ({
  deleteJournalEntryFn: vi.fn(),
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
const ENTRY_ID = "entry-id-to-delete-001";

const elements = {
  getConfirmCopy: () => screen.getByText("Delete this entry?"),
  getDeleteButton: () => screen.getByRole("button", { name: "Delete" }),
  getCancelButton: () => screen.getByRole("button", { name: "Cancel" }),
};

const actions = {
  confirmDelete: () => userEvent.click(elements.getDeleteButton()),
  cancelDelete: () => userEvent.click(elements.getCancelButton()),
};

describe("DeleteJournalEntryDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteJournalEntryFn).mockResolvedValue(undefined);
  });

  describe("given the dialog is open", () => {
    beforeEach(() => {
      render(
        <DeleteJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          entryId={ENTRY_ID}
        />
      );
    });

    it("shows the confirm copy 'Delete this entry?'", () => {
      expect(elements.getConfirmCopy()).toBeDefined();
    });

    it("shows a Delete button", () => {
      expect(elements.getDeleteButton()).toBeDefined();
    });

    it("shows a Cancel button", () => {
      expect(elements.getCancelButton()).toBeDefined();
    });
  });

  describe("given the user clicks Delete", () => {
    beforeEach(async () => {
      render(
        <DeleteJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          entryId={ENTRY_ID}
        />
      );

      await actions.confirmDelete();
    });

    it("calls deleteJournalEntryFn with the entryId", () => {
      expect(vi.mocked(deleteJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entryId: ENTRY_ID,
          }),
        })
      );
    });
  });

  describe("given the user clicks Cancel", () => {
    beforeEach(async () => {
      render(
        <DeleteJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          entryId={ENTRY_ID}
        />
      );

      await actions.cancelDelete();
    });

    it("does not call deleteJournalEntryFn", () => {
      expect(vi.mocked(deleteJournalEntryFn)).not.toHaveBeenCalled();
    });

    it("calls onOpenChange(false)", () => {
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
        <DeleteJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          entryId={ENTRY_ID}
        />
      );

      await actions.confirmDelete();
    });

    it("calls router.invalidate()", () => {
      expect(invalidate).toHaveBeenCalled();
    });

    it("closes the dialog by calling onOpenChange(false)", () => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("calls toast.success with 'Entry deleted'", () => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Entry deleted");
    });
  });

  describe("given the server fn rejects", () => {
    beforeEach(async () => {
      vi.mocked(deleteJournalEntryFn).mockRejectedValue(new Error("boom"));

      render(
        <DeleteJournalEntryDialog
          open={true}
          onOpenChange={onOpenChange}
          entryId={ENTRY_ID}
        />
      );

      await actions.confirmDelete();
    });

    it("does not close the dialog (onOpenChange is not called with false)", () => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    it("calls toast.error with the rejection message", () => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("boom");
    });
  });
});
