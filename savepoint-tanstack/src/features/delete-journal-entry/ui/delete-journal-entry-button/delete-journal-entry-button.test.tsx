import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteJournalEntryFn } from "@/features/delete-journal-entry/api/delete-journal-entry-fn";

import { DeleteJournalEntryButton } from "./delete-journal-entry-button";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/features/delete-journal-entry/api/delete-journal-entry-fn", () => ({
  deleteJournalEntryFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const elements = {
  getDeleteButton: () => screen.getByRole("button", { name: "Delete" }),
  getConfirmButton: () =>
    screen.getByRole("button", { name: "Confirm delete" }),
  queryConfirmButton: () =>
    screen.queryByRole("button", { name: "Confirm delete" }),
};

const actions = {
  clickDelete: async () => userEvent.click(elements.getDeleteButton()),
  clickConfirm: async () => userEvent.click(elements.getConfirmButton()),
};

describe("DeleteJournalEntryButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteJournalEntryFn).mockResolvedValue(undefined as never);
  });

  describe("given the button is first rendered", () => {
    beforeEach(() => {
      render(<DeleteJournalEntryButton entryId="entry-3" />);
    });

    it("does not show a confirm affordance until clicked", () => {
      expect(elements.queryConfirmButton()).toBeNull();
    });
  });

  describe("given the user clicks Delete then confirms", () => {
    beforeEach(async () => {
      render(<DeleteJournalEntryButton entryId="entry-3" />);
      await actions.clickDelete();
      await actions.clickConfirm();
    });

    it("calls deleteJournalEntryFn with the entry id", () => {
      expect(vi.mocked(deleteJournalEntryFn)).toHaveBeenCalledWith({
        data: { entryId: "entry-3" },
      });
    });

    it("navigates to the journal timeline on success", async () => {
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith({ to: "/journal" });
      });
    });
  });
});
