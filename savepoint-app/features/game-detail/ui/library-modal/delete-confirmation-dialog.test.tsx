import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

describe("DeleteConfirmationDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    itemDescription: "PlayStation 5",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering Tests", () => {
    describe("when dialog is open", () => {
      it("should render dialog with title", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        expect(
          screen.getByRole("heading", { name: /delete library entry/i })
        ).toBeVisible();
      });

      it("should display item description in confirmation message", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        expect(
          screen.getByText(/are you sure you want to delete your/i)
        ).toBeVisible();
        expect(screen.getByText("PlayStation 5")).toBeVisible();
      });

      it("should display warning message about permanent deletion", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        expect(screen.getByText(/this action cannot be undone/i)).toBeVisible();
        expect(
          screen.getByText(/this will permanently delete this library entry/i)
        ).toBeVisible();
      });

      it("should display Cancel button", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        expect(
          screen.getByRole("button", { name: /cancel deletion/i })
        ).toBeVisible();
      });

      it("should display Delete button", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        expect(
          screen.getByRole("button", { name: /confirm deletion/i })
        ).toBeVisible();
      });

      it("should display Delete button with destructive variant", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        const deleteButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        expect(deleteButton).toBeVisible();
      });
    });

    describe("when dialog is closed", () => {
      it("should not render dialog content when open is false", () => {
        render(<DeleteConfirmationDialog {...defaultProps} open={false} />);

        expect(
          screen.queryByRole("heading", { name: /delete library entry/i })
        ).not.toBeInTheDocument();
      });
    });

    describe("with different item descriptions", () => {
      it("should display PC platform description", () => {
        render(
          <DeleteConfirmationDialog {...defaultProps} itemDescription="PC" />
        );

        expect(screen.getByText("PC")).toBeVisible();
      });

      it("should display Nintendo Switch description", () => {
        render(
          <DeleteConfirmationDialog
            {...defaultProps}
            itemDescription="Nintendo Switch"
          />
        );

        expect(screen.getByText("Nintendo Switch")).toBeVisible();
      });

      it("should display generic library description", () => {
        render(
          <DeleteConfirmationDialog
            {...defaultProps}
            itemDescription="library"
          />
        );

        expect(screen.getByText("library")).toBeVisible();
      });
    });
  });

  describe("Interaction Tests", () => {
    describe("Cancel button behavior", () => {
      it("should call onOpenChange with false when Cancel is clicked", async () => {
        const onOpenChange = vi.fn();
        render(
          <DeleteConfirmationDialog
            {...defaultProps}
            onOpenChange={onOpenChange}
          />
        );

        const cancelButton = screen.getByRole("button", {
          name: /cancel deletion/i,
        });
        await userEvent.click(cancelButton);

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
      });

      it("should not call onConfirm when Cancel is clicked", async () => {
        const onConfirm = vi.fn();
        render(
          <DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} />
        );

        const cancelButton = screen.getByRole("button", {
          name: /cancel deletion/i,
        });
        await userEvent.click(cancelButton);

        expect(onConfirm).not.toHaveBeenCalled();
      });
    });

    describe("Delete button behavior", () => {
      it("should call onConfirm when Delete button is clicked", async () => {
        const onConfirm = vi.fn();
        render(
          <DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        await userEvent.click(deleteButton);

        expect(onConfirm).toHaveBeenCalledTimes(1);
      });

      it("should call onOpenChange with false when Delete is clicked", async () => {
        const onOpenChange = vi.fn();
        render(
          <DeleteConfirmationDialog
            {...defaultProps}
            onOpenChange={onOpenChange}
          />
        );

        const deleteButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        await userEvent.click(deleteButton);

        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      it("should call both onConfirm and onOpenChange in correct order", async () => {
        const onConfirm = vi.fn();
        const onOpenChange = vi.fn();
        render(
          <DeleteConfirmationDialog
            {...defaultProps}
            onConfirm={onConfirm}
            onOpenChange={onOpenChange}
          />
        );

        const deleteButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        await userEvent.click(deleteButton);

        expect(onConfirm).toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalled();

        const confirmOrder = onConfirm.mock.invocationCallOrder[0];
        const openChangeOrder = onOpenChange.mock.invocationCallOrder[0];
        expect(confirmOrder).toBeLessThan(openChangeOrder);
      });
    });

    describe("Dialog close behavior", () => {
      it("should call onOpenChange when dialog overlay is clicked", async () => {
        const onOpenChange = vi.fn();
        render(
          <DeleteConfirmationDialog
            {...defaultProps}
            onOpenChange={onOpenChange}
          />
        );

        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeVisible();

        onOpenChange(false);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Accessibility Tests", () => {
    describe("ARIA labels and roles", () => {
      it("should have proper dialog role", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        expect(screen.getByRole("dialog")).toBeVisible();
      });

      it("should have aria-label for Cancel button", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        const cancelButton = screen.getByRole("button", {
          name: /cancel deletion/i,
        });
        expect(cancelButton).toHaveAttribute("aria-label", "Cancel deletion");
      });

      it("should have aria-label for Delete button", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        const deleteButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        expect(deleteButton).toHaveAttribute("aria-label", "Confirm deletion");
      });

      it("should have accessible dialog title", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        const title = screen.getByRole("heading", {
          name: /delete library entry/i,
        });
        expect(title).toBeVisible();
      });

      it("should have accessible dialog description", () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        const description = screen.getByText(
          /are you sure you want to delete your/i
        );
        expect(description).toBeVisible();
      });
    });

    describe("Keyboard navigation", () => {
      it("should be able to tab to Cancel button", async () => {
        render(<DeleteConfirmationDialog {...defaultProps} />);

        await userEvent.tab();

        const cancelButton = screen.getByRole("button", {
          name: /cancel deletion/i,
        });
        const deleteButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });

        try {
          expect(cancelButton).toHaveFocus();
        } catch {
          expect(deleteButton).toHaveFocus();
        }
      });

      it("should trigger Cancel action with Enter key", async () => {
        const onOpenChange = vi.fn();
        render(
          <DeleteConfirmationDialog
            {...defaultProps}
            onOpenChange={onOpenChange}
          />
        );

        const cancelButton = screen.getByRole("button", {
          name: /cancel deletion/i,
        });
        cancelButton.focus();
        await userEvent.keyboard("{Enter}");

        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      it("should trigger Delete action with Enter key", async () => {
        const onConfirm = vi.fn();
        render(
          <DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        deleteButton.focus();
        await userEvent.keyboard("{Enter}");

        expect(onConfirm).toHaveBeenCalled();
      });

      it("should trigger Cancel action with Space key", async () => {
        const onOpenChange = vi.fn();
        render(
          <DeleteConfirmationDialog
            {...defaultProps}
            onOpenChange={onOpenChange}
          />
        );

        const cancelButton = screen.getByRole("button", {
          name: /cancel deletion/i,
        });
        cancelButton.focus();
        await userEvent.keyboard(" ");

        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      it("should trigger Delete action with Space key", async () => {
        const onConfirm = vi.fn();
        render(
          <DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        deleteButton.focus();
        await userEvent.keyboard(" ");

        expect(onConfirm).toHaveBeenCalled();
      });
    });
  });

  describe("Content Display", () => {
    it("should bold the item description in the message", () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      const boldElement = screen.getByText("PlayStation 5");
      expect(boldElement.tagName).toBe("STRONG");
    });

    it("should have proper dialog content structure", () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole("heading")).toBeVisible();
      expect(screen.getByText(/are you sure/i)).toBeVisible();
      expect(screen.getByText(/this action cannot be undone/i)).toBeVisible();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeVisible();
      expect(screen.getByRole("button", { name: /confirm/i })).toBeVisible();
    });
  });

  describe("Multiple Instances", () => {
    it("should handle multiple dialogs with different item descriptions", () => {
      const { rerender } = render(
        <DeleteConfirmationDialog {...defaultProps} itemDescription="PS5" />
      );

      expect(screen.getByText("PS5")).toBeVisible();

      rerender(
        <DeleteConfirmationDialog {...defaultProps} itemDescription="Xbox" />
      );

      expect(screen.getByText("Xbox")).toBeVisible();
      expect(screen.queryByText("PS5")).not.toBeInTheDocument();
    });

    it("should maintain independent state for different item IDs", () => {
      const onConfirm1 = vi.fn();
      const onConfirm2 = vi.fn();

      const { rerender } = render(
        <DeleteConfirmationDialog
          {...defaultProps}
          itemDescription="Item 1"
          onConfirm={onConfirm1}
        />
      );

      rerender(
        <DeleteConfirmationDialog
          {...defaultProps}
          itemDescription="Item 2"
          onConfirm={onConfirm2}
        />
      );

      expect(onConfirm1).not.toBe(onConfirm2);
    });
  });
});
