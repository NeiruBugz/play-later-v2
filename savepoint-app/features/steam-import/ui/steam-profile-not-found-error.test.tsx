import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SteamProfileNotFoundError } from "./steam-profile-not-found-error";

const elements = {
  getTitle: () => screen.getByText("Steam Profile Not Found"),
  getMessage: (msg: string) => screen.getByText(msg),
  getValidFormatsLabel: () => screen.getByText("Valid formats:"),
  get17DigitHint: () => screen.getByText(/A 17-digit number/i),
  getProfileNameHint: () =>
    screen.getByText(/Your profile name from steamcommunity.com/i),
  getRetryButton: () => screen.getByRole("button", { name: /try again/i }),
  queryRetryButton: () => screen.queryByRole("button", { name: /try again/i }),
  getAlert: () => screen.getByRole("alert"),
};

const actions = {
  clickRetry: async () => {
    await userEvent.click(elements.getRetryButton());
  },
};

describe("SteamProfileNotFoundError", () => {
  it("renders the error title", () => {
    render(<SteamProfileNotFoundError message="Test error message" />);

    expect(elements.getTitle()).toBeInTheDocument();
  });

  it("displays the provided error message", () => {
    const errorMessage =
      "We couldn't find a Steam profile with that ID. Please check the ID and try again.";
    render(<SteamProfileNotFoundError message={errorMessage} />);

    expect(elements.getMessage(errorMessage)).toBeInTheDocument();
  });

  it("shows valid format guidance", () => {
    render(<SteamProfileNotFoundError message="Invalid Steam ID format" />);

    expect(elements.getValidFormatsLabel()).toBeInTheDocument();
    expect(elements.get17DigitHint()).toBeInTheDocument();
    expect(elements.getProfileNameHint()).toBeInTheDocument();
  });

  it("renders as alert with proper role", () => {
    render(<SteamProfileNotFoundError message="Error" />);

    expect(elements.getAlert()).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();

    render(
      <SteamProfileNotFoundError
        message="Test error message"
        onRetry={onRetry}
      />
    );

    expect(elements.getRetryButton()).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<SteamProfileNotFoundError message="Test error message" />);

    expect(elements.queryRetryButton()).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();

    render(
      <SteamProfileNotFoundError
        message="Test error message"
        onRetry={onRetry}
      />
    );

    await actions.clickRetry();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
