import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen } from "@testing-library/react";
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
};

const actions = {
  openDialog: async () => {
    await userEvent.click(elements.getDialogTriggerButton());
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
  });
});
