import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RemoveFromLibraryDialog } from "./remove-from-library-dialog";

const isDesktopMock = vi.hoisted(() => vi.fn());
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: isDesktopMock,
}));

const onConfirm = vi.fn();
const onOpenChange = vi.fn();

const elements = {
  getModal: () =>
    screen.getByRole("dialog", { name: "Remove Hades from your library?" }),
  getRemoveButton: () =>
    within(elements.getModal()).getByRole("button", { name: "Remove" }),
};

const actions = {
  confirmRemoval: async () => userEvent.click(elements.getRemoveButton()),
};

function renderDialog() {
  render(
    <RemoveFromLibraryDialog
      open
      onOpenChange={onOpenChange}
      gameTitle="Hades"
      onConfirm={onConfirm}
    />
  );
}

describe("RemoveFromLibraryDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given a phone viewport", () => {
    beforeEach(() => {
      isDesktopMock.mockReturnValue(false);
      renderDialog();
    });

    it("opens as a bottom sheet", () => {
      expect(elements.getModal()).toHaveAttribute("data-slot", "sheet-content");
      expect(elements.getModal()).toHaveAttribute("data-side", "bottom");
    });

    it("confirms the removal from the sheet", async () => {
      await actions.confirmRemoval();
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });

  describe("given a desktop viewport", () => {
    beforeEach(() => {
      isDesktopMock.mockReturnValue(true);
      renderDialog();
    });

    it("opens as a centered dialog", () => {
      expect(elements.getModal()).toHaveAttribute(
        "data-slot",
        "dialog-content"
      );
      expect(elements.getModal()).not.toHaveAttribute("data-side");
    });

    it("confirms the removal from the dialog", async () => {
      await actions.confirmRemoval();
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });
});
