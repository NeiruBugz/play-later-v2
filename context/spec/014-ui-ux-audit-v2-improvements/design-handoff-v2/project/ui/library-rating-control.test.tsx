import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { setLibraryRatingAction } from "@/features/manage-library-entry/server-actions";

import { LibraryRatingControl } from "./library-rating-control";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/features/manage-library-entry/server-actions", () => ({
  setLibraryRatingAction: vi.fn(),
}));

const mockSetLibraryRatingAction = vi.mocked(setLibraryRatingAction);
const mockToastError = vi.mocked(toast.error);

const DEFAULT_PROPS = {
  libraryItemId: 42,
  initialRating: null,
};

describe("LibraryRatingControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetLibraryRatingAction.mockResolvedValue({
      success: true,
      data: undefined,
    });
  });

  describe("given the user clicks a star", () => {
    it("calls setLibraryRatingAction with the new rating", async () => {
      render(<LibraryRatingControl {...DEFAULT_PROPS} />);

      const star = screen.getByTestId("rating-star-5");
      await userEvent.click(star);

      await waitFor(() => {
        expect(mockSetLibraryRatingAction).toHaveBeenCalledWith({
          libraryItemId: 42,
          rating: 10,
        });
      });
    });

    it("applies optimistic update immediately before the server responds", async () => {
      let resolveAction!: (
        value: Awaited<ReturnType<typeof setLibraryRatingAction>>
      ) => void;
      mockSetLibraryRatingAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve;
        })
      );

      render(<LibraryRatingControl {...DEFAULT_PROPS} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuenow", "0");

      const star = screen.getByTestId("rating-star-5");
      await userEvent.click(star);

      expect(slider).toHaveAttribute("aria-valuenow", "10");

      resolveAction({ success: true, data: undefined });

      await waitFor(() => {
        expect(mockSetLibraryRatingAction).toHaveBeenCalled();
      });
    });
  });

  describe("given the server action fails", () => {
    it("reverts the optimistic update and shows an error toast", async () => {
      mockSetLibraryRatingAction.mockResolvedValue({
        success: false,
        error: "Library item not found",
      });

      render(<LibraryRatingControl libraryItemId={42} initialRating={4} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuenow", "4");

      const star = screen.getByTestId("rating-star-5");
      await userEvent.click(star);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to update rating", {
          description: "Library item not found",
        });
      });

      expect(slider).toHaveAttribute("aria-valuenow", "4");
    });

    it("reverts the optimistic update when the action throws", async () => {
      mockSetLibraryRatingAction.mockRejectedValue(new Error("Network error"));

      render(<LibraryRatingControl libraryItemId={42} initialRating={6} />);

      const slider = screen.getByRole("slider");
      const star = screen.getByTestId("rating-star-5");
      await userEvent.click(star);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to update rating", {
          description: "Network error",
        });
      });

      expect(slider).toHaveAttribute("aria-valuenow", "6");
    });
  });
});
