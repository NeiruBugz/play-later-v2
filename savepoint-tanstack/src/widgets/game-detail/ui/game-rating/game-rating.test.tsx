import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameRating } from "./game-rating";

const mocks = vi.hoisted(() => ({
  updateLibraryItemFn: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));
vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: mocks.updateLibraryItemFn,
}));
vi.mock("@/shared/lib/user-facing-error", () => ({
  getUserFacingErrorMessage: () => "Couldn't save. Try again.",
}));

describe("GameRating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateLibraryItemFn.mockResolvedValue({});
  });

  it("shows a rating of 7 as three and a half stars", () => {
    render(<GameRating libraryItemId={4} rating={7} />);
    expect(
      screen.getByRole("slider", { name: "Rated 3.5 of 5" })
    ).toHaveAttribute("aria-valuenow", "7");
  });

  it("saves a changed rating, then refreshes the page data", async () => {
    render(<GameRating libraryItemId={4} rating={7} />);

    // jsdom has no layout, so a click lands on the right half of the star: 5th star -> 10.
    await userEvent.click(screen.getByTestId("rating-star-5"));

    expect(mocks.updateLibraryItemFn).toHaveBeenCalledWith({
      data: { itemId: 4, rating: 10 },
    });
    await waitFor(() => expect(mocks.invalidate).toHaveBeenCalled());
  });

  it("rolls back and shows the message when saving fails", async () => {
    mocks.updateLibraryItemFn.mockRejectedValue(new Error("boom"));
    render(
      <>
        <GameRating libraryItemId={4} rating={7} />
        <Toaster />
      </>
    );

    await userEvent.click(screen.getByTestId("rating-star-5"));

    expect(await screen.findByText("Couldn't save. Try again.")).toBeVisible();
    expect(
      screen.getByRole("slider", { name: "Rated 3.5 of 5" })
    ).toBeInTheDocument();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});
