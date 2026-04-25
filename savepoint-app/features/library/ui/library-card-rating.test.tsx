import { renderWithTestProviders as render } from "@/test/utils/test-provider";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LibraryCardRating } from "./library-card-rating";

const mockSetLibraryRatingAction = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/features/manage-library-entry/server-actions", () => ({
  setLibraryRatingAction: (...args: unknown[]) =>
    mockSetLibraryRatingAction(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

describe("LibraryCardRating", () => {
  beforeEach(() => {
    mockSetLibraryRatingAction.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls setLibraryRatingAction with mapped DB value (1-10) when a star is clicked", async () => {
    const user = userEvent.setup();
    render(<LibraryCardRating libraryItemId={42} initialRating={null} />);

    // Click 4th star -> right half = 8 on the 1-10 scale
    await user.click(screen.getByTestId("rating-star-4"));

    await waitFor(() => {
      expect(mockSetLibraryRatingAction).toHaveBeenCalledWith({
        libraryItemId: 42,
        rating: 8,
      });
    });
  });

  it("clears rating to null when clicking the current value", async () => {
    const user = userEvent.setup();
    render(<LibraryCardRating libraryItemId={42} initialRating={8} />);

    // Clicking the 4th star (right half = 8) when current is 8 should clear
    await user.click(screen.getByTestId("rating-star-4"));

    await waitFor(() => {
      expect(mockSetLibraryRatingAction).toHaveBeenCalledWith({
        libraryItemId: 42,
        rating: null,
      });
    });
  });

  it("restores prior value and shows error toast when action returns failure", async () => {
    mockSetLibraryRatingAction.mockResolvedValue({
      success: false,
      error: "boom",
    });

    const user = userEvent.setup();
    render(<LibraryCardRating libraryItemId={42} initialRating={4} />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "4");

    await user.click(screen.getByTestId("rating-star-5"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to update rating",
        expect.objectContaining({ description: "boom" })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "4");
    });
  });

  it("restores prior value when action throws", async () => {
    mockSetLibraryRatingAction.mockRejectedValue(new Error("network"));

    const user = userEvent.setup();
    render(<LibraryCardRating libraryItemId={42} initialRating={6} />);

    await user.click(screen.getByTestId("rating-star-5"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "6");
    });
  });

  it("supports keyboard: ArrowRight increments, Enter commits", async () => {
    const user = userEvent.setup();
    render(<LibraryCardRating libraryItemId={42} initialRating={4} />);

    const slider = screen.getByRole("slider");
    slider.focus();

    await user.keyboard("{ArrowRight}");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(mockSetLibraryRatingAction).toHaveBeenCalledWith({
        libraryItemId: 42,
        rating: 5,
      });
    });
  });

  it("supports keyboard: ArrowLeft decrements", async () => {
    const user = userEvent.setup();
    render(<LibraryCardRating libraryItemId={42} initialRating={4} />);

    const slider = screen.getByRole("slider");
    slider.focus();

    await user.keyboard("{ArrowLeft}");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(mockSetLibraryRatingAction).toHaveBeenCalledWith({
        libraryItemId: 42,
        rating: 3,
      });
    });
  });

  it("supports keyboard: Escape clears the rating", async () => {
    const user = userEvent.setup();
    render(<LibraryCardRating libraryItemId={42} initialRating={4} />);

    const slider = screen.getByRole("slider");
    slider.focus();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(mockSetLibraryRatingAction).toHaveBeenCalledWith({
        libraryItemId: 42,
        rating: null,
      });
    });
  });

  it("stops click propagation so star clicks do not bubble to a parent handler", async () => {
    const user = userEvent.setup();
    const parentHandler = vi.fn();

    render(
      <div onClick={parentHandler} role="presentation">
        <LibraryCardRating libraryItemId={42} initialRating={null} />
      </div>
    );

    await user.click(screen.getByTestId("rating-star-3"));

    expect(parentHandler).not.toHaveBeenCalled();
  });
});
