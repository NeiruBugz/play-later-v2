import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SteamRateLimitError } from "./steam-rate-limit-error";

describe("SteamRateLimitError", () => {
  const mockMessage =
    "Too many requests to Steam. Please wait a moment and try again.";

  it("renders the error title", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    expect(screen.getByText("Too Many Requests")).toBeInTheDocument();
  });

  it("renders the provided error message", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    expect(screen.getByText(mockMessage)).toBeInTheDocument();
  });

  it("renders explanatory text about rate limiting", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    expect(
      screen.getByText(/This limit helps protect Steam's servers/i)
    ).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<SteamRateLimitError message={mockMessage} onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    const retryButton = screen.queryByRole("button", { name: /try again/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<SteamRateLimitError message={mockMessage} onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders with warning alert variant", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });
});
