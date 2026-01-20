import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SteamApiUnavailableError } from "./steam-api-unavailable-error";

describe("SteamApiUnavailableError", () => {
  it("renders the error message", () => {
    render(
      <SteamApiUnavailableError message="Steam is temporarily unavailable. Please try again later." />
    );

    expect(screen.getByText("Steam Service Unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Steam is temporarily unavailable. Please try again later."
      )
    ).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();

    render(
      <SteamApiUnavailableError
        message="Steam is temporarily unavailable. Please try again later."
        onRetry={onRetry}
      />
    );

    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(
      <SteamApiUnavailableError message="Steam is temporarily unavailable. Please try again later." />
    );

    expect(
      screen.queryByRole("button", { name: /try again/i })
    ).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <SteamApiUnavailableError
        message="Steam is temporarily unavailable. Please try again later."
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders with warning alert style", () => {
    render(
      <SteamApiUnavailableError message="Steam is temporarily unavailable. Please try again later." />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });
});
