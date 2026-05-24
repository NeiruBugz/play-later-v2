import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteLibraryItemFn } from "../../../api/delete-library-item-fn";
import { DeleteConfirm } from "./delete-confirm";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const invalidate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate }),
}));

vi.mock("../../../api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
}));

// DeleteConfirm imports `inputClasses` from library-modal.utility, which also
// pulls the update server-fn wrapper (→ server-only auth env). Stub it so the
// jsdom import graph stays client-safe.
vi.mock("../../../api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));

const onCancel = vi.fn();
const onDeleted = vi.fn();

const elements = {
  getConfirmInput: () =>
    screen.getByLabelText("Type the game title to confirm deletion"),
  getDeleteButton: () => screen.getByRole("button", { name: "Delete" }),
  getCancelButton: () => screen.getByRole("button", { name: "Cancel" }),
};

const actions = {
  type: (value: string) => userEvent.type(elements.getConfirmInput(), value),
  clickDelete: () => userEvent.click(elements.getDeleteButton()),
  clickCancel: () => userEvent.click(elements.getCancelButton()),
};

function renderConfirm() {
  render(
    <DeleteConfirm
      itemId={7}
      gameTitle="Hollow Knight"
      onCancel={onCancel}
      onDeleted={onDeleted}
    />
  );
}

describe("DeleteConfirm", () => {
  beforeEach(() => {
    vi.mocked(deleteLibraryItemFn).mockReset();
    invalidate.mockReset();
    invalidate.mockResolvedValue(undefined);
    onCancel.mockReset();
    onDeleted.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  describe("given the title has not been typed", () => {
    beforeEach(() => {
      renderConfirm();
    });

    it("keeps Delete disabled", () => {
      expect(elements.getDeleteButton()).toBeDisabled();
    });
  });

  describe("given the typed title does not match", () => {
    beforeEach(async () => {
      renderConfirm();
      await actions.type("Hollow");
    });

    it("leaves Delete disabled", () => {
      expect(elements.getDeleteButton()).toBeDisabled();
    });
  });

  describe("given the exact title is typed and Delete is clicked", () => {
    beforeEach(async () => {
      vi.mocked(deleteLibraryItemFn).mockResolvedValue(undefined);
      renderConfirm();
      await actions.type("Hollow Knight");
      await actions.clickDelete();
    });

    it("deletes the item and signals completion", async () => {
      await waitFor(() => {
        expect(vi.mocked(deleteLibraryItemFn)).toHaveBeenCalledWith({
          data: { itemId: 7 },
        });
      });
      expect(onDeleted).toHaveBeenCalledOnce();
    });
  });

  describe("given the user cancels", () => {
    beforeEach(async () => {
      renderConfirm();
      await actions.clickCancel();
    });

    it("notifies the parent without deleting", () => {
      expect(onCancel).toHaveBeenCalledOnce();
      expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
    });
  });
});
