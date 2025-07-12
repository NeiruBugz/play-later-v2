import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { AddReviewDialog } from "./add-review-dialog";

const elements = {
  getDialogTitle: (gameTitle: string) => screen.getByText(gameTitle),
  getDialogDescription: () =>
    screen.getByText(
      "Share your thoughts on a game you've played. Rate it, describe your experience, and select the platform you played on."
    ),
  getDialogTriggerButton: () =>
    screen.getByRole("button", { name: "Write a Review" }),
  getCancelButton: () => screen.getByRole("button", { name: "Close" }),
  getSubmitButton: () => screen.getByRole("button", { name: "Submit" }),
  getAllRatingButtons: () =>
    screen.getAllByRole("button", { name: /Set rating to/ }),
  getRatingButton: (rating: number) =>
    screen.getByRole("button", { name: `Set rating to ${rating}` }),
  getRatingInput: () => screen.getByLabelText("rating-value"),
  findRatingInput: () => screen.findByLabelText("rating-value"),
};

const actions = {
  openDialog: async () => {
    await userEvent.click(elements.getDialogTriggerButton());
  },
  setRating: async (rating: number) => {
    await userEvent.click(elements.getRatingButton(rating));
  },
  submitReview: async () => {
    await userEvent.click(elements.getSubmitButton());
  },
};

describe("AddReviewDialog", () => {
  beforeEach(async () => {
    renderWithTestProviders(
      <AddReviewDialog gameId="1" gameTitle="Test Game" />
    );

    await actions.openDialog();
  });

  it("should display a dialog with the correct title and description", () => {
    expect(elements.getDialogTitle("Test Game")).toBeVisible();
    expect(elements.getDialogDescription()).toBeVisible();
    expect(elements.getCancelButton()).toBeVisible();
    expect(elements.getSubmitButton()).toBeVisible();
    expect(elements.getAllRatingButtons()).toHaveLength(10);
  });

  it("should display disabled submit button when form is invalid", () => {
    expect(elements.getSubmitButton()).toBeDisabled();
  });

  it("should set the rating when a rating button is clicked", async () => {
    await actions.setRating(5);
    await waitFor(async () => {
      const ratingInput = await elements.findRatingInput();
      expect(ratingInput).toHaveAttribute("value", "5");
      expect(elements.getSubmitButton()).toBeEnabled();
    });
  });

  it("should submit review", async () => {
    await actions.setRating(5);

    await waitFor(async () => {
      const ratingInput = await elements.findRatingInput();
      expect(ratingInput).toHaveAttribute("value", "5");
      expect(elements.getSubmitButton()).toBeEnabled();
    });

    await actions.submitReview();

    await waitFor(async () => {
      expect(elements.getSubmitButton()).toBeDisabled();
    });
  });
});
