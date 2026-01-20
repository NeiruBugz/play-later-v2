import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SteamProfileNotFoundError } from "./steam-profile-not-found-error";

describe("SteamProfileNotFoundError", () => {
  it("renders the error title", () => {
    render(<SteamProfileNotFoundError message="Test error message" />);

    expect(screen.getByText("Steam Profile Not Found")).toBeInTheDocument();
  });

  it("displays the provided error message", () => {
    const errorMessage =
      "We couldn't find a Steam profile with that ID. Please check the ID and try again.";
    render(<SteamProfileNotFoundError message={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("shows valid format guidance", () => {
    render(<SteamProfileNotFoundError message="Invalid Steam ID format" />);

    expect(screen.getByText("Valid formats:")).toBeInTheDocument();
    expect(screen.getByText(/A 17-digit number/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your profile name from steamcommunity.com/i)
    ).toBeInTheDocument();
  });

  it("renders as alert with proper role", () => {
    render(<SteamProfileNotFoundError message="Error" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();

    render(
      <SteamProfileNotFoundError message="Test error message" onRetry={onRetry} />
    );

    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<SteamProfileNotFoundError message="Test error message" />);

    expect(
      screen.queryByRole("button", { name: /try again/i })
    ).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <SteamProfileNotFoundError message="Test error message" onRetry={onRetry} />
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
