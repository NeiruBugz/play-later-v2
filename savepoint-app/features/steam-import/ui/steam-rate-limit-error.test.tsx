import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SteamRateLimitError } from "./steam-rate-limit-error";

const elements = {
  getTitle: () => screen.getByText("Too Many Requests"),
  getMessage: (msg: string) => screen.getByText(msg),
  getExplanatoryText: () =>
    screen.getByText(/This limit helps protect Steam's servers/i),
  getRetryButton: () => screen.getByRole("button", { name: /try again/i }),
  queryRetryButton: () => screen.queryByRole("button", { name: /try again/i }),
  getAlert: () => screen.getByRole("alert"),
};

const actions = {
  clickRetry: async () => {
    await userEvent.click(elements.getRetryButton());
  },
};

describe("SteamRateLimitError", () => {
  const mockMessage =
    "Too many requests to Steam. Please wait a moment and try again.";

  it("renders the error title", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    expect(elements.getTitle()).toBeInTheDocument();
  });

  it("renders the provided error message", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    expect(elements.getMessage(mockMessage)).toBeInTheDocument();
  });

  it("renders explanatory text about rate limiting", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    expect(elements.getExplanatoryText()).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<SteamRateLimitError message={mockMessage} onRetry={onRetry} />);

    expect(elements.getRetryButton()).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    expect(elements.queryRetryButton()).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();

    render(<SteamRateLimitError message={mockMessage} onRetry={onRetry} />);

    await actions.clickRetry();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders with warning alert variant", () => {
    render(<SteamRateLimitError message={mockMessage} />);

    expect(elements.getAlert()).toBeInTheDocument();
  });
});
