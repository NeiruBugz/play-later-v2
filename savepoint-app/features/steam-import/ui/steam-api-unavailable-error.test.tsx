import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SteamApiUnavailableError } from "./steam-api-unavailable-error";

const elements = {
  getTitle: () => screen.getByText("Steam Service Unavailable"),
  getMessage: (msg: string) => screen.getByText(msg),
  getRetryButton: () => screen.getByRole("button", { name: /try again/i }),
  queryRetryButton: () => screen.queryByRole("button", { name: /try again/i }),
  getAlert: () => screen.getByRole("alert"),
};

const actions = {
  clickRetry: async () => {
    await userEvent.click(elements.getRetryButton());
  },
};

describe("SteamApiUnavailableError", () => {
  const mockMessage =
    "Steam is temporarily unavailable. Please try again later.";

  it("renders the error message", () => {
    render(<SteamApiUnavailableError message={mockMessage} />);

    expect(elements.getTitle()).toBeInTheDocument();
    expect(elements.getMessage(mockMessage)).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();

    render(
      <SteamApiUnavailableError message={mockMessage} onRetry={onRetry} />
    );

    expect(elements.getRetryButton()).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<SteamApiUnavailableError message={mockMessage} />);

    expect(elements.queryRetryButton()).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();

    render(
      <SteamApiUnavailableError message={mockMessage} onRetry={onRetry} />
    );

    await actions.clickRetry();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders with warning alert style", () => {
    render(<SteamApiUnavailableError message={mockMessage} />);

    expect(elements.getAlert()).toBeInTheDocument();
  });
});
