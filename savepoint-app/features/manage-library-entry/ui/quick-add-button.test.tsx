import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { showUndoToast } from "@/shared/components/ui/undo-toast";

import {
  deleteLibraryItemAction,
  quickAddToLibraryAction,
} from "../server-actions";
import { QuickAddButton } from "./quick-add-button";

vi.mock("../server-actions", () => ({
  quickAddToLibraryAction: vi.fn(),
  deleteLibraryItemAction: vi.fn(),
}));

vi.mock("@/shared/components/ui/undo-toast", () => ({
  showUndoToast: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const successResult = {
  success: true as const,
  data: {
    id: 42,
    userId: "user-1",
    gameId: "game-1",
    status: "UP_NEXT" as const,
    platform: null,
    acquisitionType: "DIGITAL" as const,
    startedAt: null,
    completedAt: null,
    hasBeenPlayed: false,
    statusChangedAt: null,
    rating: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

function renderButton(
  props: Partial<Parameters<typeof QuickAddButton>[0]> = {}
) {
  const defaults = {
    igdbId: 123,
    gameName: "Hades",
  };
  return render(<QuickAddButton {...defaults} {...props} />);
}

describe("QuickAddButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial render", () => {
    it("shows the Plus icon and not the Check icon", () => {
      renderButton();

      expect(screen.getByTestId("quick-add-plus")).toBeInTheDocument();
      expect(screen.queryByTestId("quick-add-check")).not.toBeInTheDocument();
    });

    it("uses the expected aria-label including the game name", () => {
      renderButton({ gameName: "Hades" });

      expect(
        screen.getByRole("button", { name: "Quick-add Hades to library" })
      ).toBeInTheDocument();
    });
  });

  describe("when alreadyInLibrary is true", () => {
    it("renders the Check icon, is disabled, and does not dispatch the action on click", async () => {
      vi.mocked(quickAddToLibraryAction).mockResolvedValue(successResult);

      renderButton({ alreadyInLibrary: true });

      const button = screen.getByRole("button");
      expect(screen.getByTestId("quick-add-check")).toBeInTheDocument();
      expect(screen.queryByTestId("quick-add-plus")).not.toBeInTheDocument();
      expect(button).toBeDisabled();

      await userEvent.click(button);

      expect(quickAddToLibraryAction).not.toHaveBeenCalled();
    });
  });

  describe("when clicked successfully", () => {
    it("flips to the Check icon and disables the button after success", async () => {
      vi.mocked(quickAddToLibraryAction).mockResolvedValue(successResult);

      renderButton();

      const button = screen.getByRole("button");
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId("quick-add-check")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("quick-add-plus")).not.toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it("emits an Undo toast with the game name", async () => {
      vi.mocked(quickAddToLibraryAction).mockResolvedValue(successResult);

      renderButton({ gameName: "Hades" });

      await userEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(showUndoToast).toHaveBeenCalledTimes(1);
      });
      const callArg = vi.mocked(showUndoToast).mock.calls[0][0];
      expect(callArg.message).toContain("Hades");
      expect(typeof callArg.onUndo).toBe("function");
    });

    it("invokes deleteLibraryItemAction when the Undo callback fires", async () => {
      vi.mocked(quickAddToLibraryAction).mockResolvedValue(successResult);
      vi.mocked(deleteLibraryItemAction).mockResolvedValue({
        success: true as const,
        data: { id: 42 },
      } as never);

      renderButton();

      await userEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(showUndoToast).toHaveBeenCalled();
      });

      const onUndo = vi.mocked(showUndoToast).mock.calls[0][0].onUndo;
      onUndo();

      await waitFor(() => {
        expect(deleteLibraryItemAction).toHaveBeenCalledWith({
          libraryItemId: 42,
        });
      });
    });
  });

  describe("event propagation", () => {
    it("stops click propagation so a parent handler is not invoked", async () => {
      vi.mocked(quickAddToLibraryAction).mockResolvedValue(successResult);
      const parentHandler = vi.fn();

      render(
        <div onClick={parentHandler} data-testid="parent">
          <QuickAddButton igdbId={123} gameName="Hades" />
        </div>
      );

      await userEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(quickAddToLibraryAction).toHaveBeenCalled();
      });
      expect(parentHandler).not.toHaveBeenCalled();
    });
  });

  describe("pending state", () => {
    it("sets aria-busy=true and disables the button while the action is pending", async () => {
      let resolveAction: (value: typeof successResult) => void = () => {};
      vi.mocked(quickAddToLibraryAction).mockImplementation(
        () =>
          new Promise<typeof successResult>((resolve) => {
            resolveAction = resolve;
          }) as never
      );

      renderButton();

      const button = screen.getByRole("button");
      await userEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-busy", "true");
      });
      expect(button).toBeDisabled();

      resolveAction(successResult);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-busy", "false");
      });
    });
  });
});
