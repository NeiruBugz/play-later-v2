import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RatingControls } from "./rating-controls";

const onMinRatingChange = vi.fn();
const onClearMinRating = vi.fn();
const onUnratedOnlyChange = vi.fn();

const elements = {
  // The 4th star, right half → 4.0 stars (storage 8).
  getFourthStar: () => screen.getByTestId("rating-star-4"),
  queryClearButton: () =>
    screen.queryByRole("button", { name: "Clear minimum rating" }),
};

const actions = {
  clickFourthStarRightHalf: async () => {
    const star = elements.getFourthStar();
    // jsdom getBoundingClientRect returns zeros, so clientX (0) lands on the
    // left half → 4*2 - 1 = 7 (storage) → 3.5 stars.
    await userEvent.click(star);
  },
};

function renderControls(minRating: number | undefined) {
  render(
    <RatingControls
      minRating={minRating}
      unratedOnly={undefined}
      onMinRatingChange={onMinRatingChange}
      onClearMinRating={onClearMinRating}
      onUnratedOnlyChange={onUnratedOnlyChange}
    />
  );
}

describe("RatingControls", () => {
  beforeEach(() => {
    onMinRatingChange.mockReset();
    onClearMinRating.mockReset();
    onUnratedOnlyChange.mockReset();
  });

  describe("given the user picks a rating on the star control", () => {
    beforeEach(async () => {
      renderControls(undefined);
      await actions.clickFourthStarRightHalf();
    });

    it("emits the value in stars (≤ 5), never the 1–10 storage int", () => {
      expect(onMinRatingChange).toHaveBeenCalledOnce();
      const emitted = onMinRatingChange.mock.calls[0][0] as number;
      expect(emitted).toBeLessThanOrEqual(5);
      expect(emitted).toBeGreaterThan(0);
    });
  });

  describe("given a minimum rating in stars is active", () => {
    beforeEach(() => {
      renderControls(3.5);
    });

    it("renders the clear-rating affordance", () => {
      expect(elements.queryClearButton()).not.toBeNull();
    });
  });

  describe("given no minimum rating is set", () => {
    beforeEach(() => {
      renderControls(undefined);
    });

    it("hides the clear-rating affordance", () => {
      expect(elements.queryClearButton()).toBeNull();
    });
  });
});
