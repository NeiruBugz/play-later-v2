import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ReviewForm } from "./review-form";

const elements = {
  getReviewHeading: () =>
    screen.getByRole("heading", { name: "Write a Review" }),
  getAllRatingButtons: () =>
    screen.getAllByRole("button", { name: /Set rating to/ }),
  getReviewTextarea: () =>
    screen.getByPlaceholderText("Share your thoughts about this game..."),
  getSubmitButton: () => screen.getByRole("button", { name: "Submit Review" }),
  getRatingButton: (rating: number) =>
    screen.getByRole("button", { name: `Set rating to ${rating}` }),
  getRatingInput: () => screen.getByLabelText("rating-value"),
  findRatingInput: () => screen.findByLabelText("rating-value"),
};

const actions = {
  setRating: async (rating: number) => {
    await userEvent.click(elements.getRatingButton(rating));
  },
  setReviewText: async (text: string) => {
    await userEvent.type(elements.getReviewTextarea(), text);
  },
  submitReview: async () => {
    await userEvent.click(elements.getSubmitButton());
  },
};

describe("ReviewForm", () => {
  beforeEach(() => {
    renderWithTestProviders(<ReviewForm gameId="1" />);
  });

  it("should display form", () => {
    expect(elements.getReviewHeading()).toBeVisible();
    expect(elements.getAllRatingButtons()).toHaveLength(10);
    expect(elements.getReviewTextarea()).toBeVisible();
    expect(elements.getSubmitButton()).toBeVisible();
    expect(elements.getSubmitButton()).toBeDisabled();
  });

  it("should set rating", async () => {
    await actions.setRating(5);
    expect(elements.getSubmitButton()).toBeEnabled();
  });

  it("should set review text", async () => {
    await actions.setReviewText("This is a test review");
    await waitFor(() => {
      expect(elements.getReviewTextarea()).toHaveValue("This is a test review");
    });
  });

  it("should create and submit review", async () => {
    await actions.setRating(5);
    await actions.setReviewText("This is a test review");
    await actions.submitReview();
    await waitFor(() => {
      expect(elements.getSubmitButton()).toBeDisabled();
    });
  });
});
